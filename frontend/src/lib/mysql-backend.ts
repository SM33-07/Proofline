import mysql from 'mysql2/promise';
import type { Pool, PoolOptions, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

let pool: Pool | null = null;

export function getDbConfig(): PoolOptions {
  const dbUrl = process.env.RAILSYNC_DB_URL;
  const user = process.env.RAILSYNC_DB_USER;
  const password = process.env.RAILSYNC_DB_PASSWORD || process.env.MYSQL_PWD;
  const database = process.env.RAILSYNC_DB_NAME || 'railsync_test';

  if (dbUrl && (dbUrl.startsWith('mysql://') || dbUrl.startsWith('mysql:'))) {
    try {
      const parsed = new URL(dbUrl);
      const parsedUser = parsed.username || user;
      const parsedPassword = parsed.password || password;
      if (!parsedUser || !parsedPassword) {
        throw new Error('CONFIGURATION_ERROR: Database user and password are required. Set RAILSYNC_DB_USER and RAILSYNC_DB_PASSWORD/MYSQL_PWD or encode credentials in RAILSYNC_DB_URL.');
      }
      return {
        host: parsed.hostname || 'localhost',
        port: parsed.port ? parseInt(parsed.port, 10) : 3306,
        user: parsedUser,
        password: parsedPassword,
        database: (parsed.pathname && parsed.pathname.length > 1) ? parsed.pathname.substring(1) : database,
        waitForConnections: true,
        connectionLimit: 10,
        maxIdle: 10,
        idleTimeout: 60000,
        queueLimit: 0,
      };
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('CONFIGURATION_ERROR')) {
        throw err;
      }
      // Fall through to standard config if URL parsing fails
    }
  }

  if (!user || !password) {
    throw new Error('CONFIGURATION_ERROR: Database user and password are required. Set RAILSYNC_DB_USER and RAILSYNC_DB_PASSWORD/MYSQL_PWD.');
  }

  if (user.trim().toLowerCase() === 'root') {
    throw new Error('SAFETY_VIOLATION: The MySQL root account is strictly prohibited for application or test execution. A dedicated account is required.');
  }

  return {
    host: process.env.RAILSYNC_DB_HOST || 'localhost',
    port: process.env.RAILSYNC_DB_PORT ? parseInt(process.env.RAILSYNC_DB_PORT, 10) : 3306,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
  };
}

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool(getDbConfig());
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function pingDatabase(): Promise<{ ok: boolean; database?: string; error?: string }> {
  try {
    const p = getPool();
    const [rows] = await p.query<RowDataPacket[]>('SELECT DATABASE() AS db, 1 AS alive');
    const dbName = rows[0]?.db || 'unknown';
    return { ok: true, database: dbName };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : 'Database ping failed' };
  }
}

interface DomainSqlError {
  sqlState?: string;
  message?: string;
  status?: number;
  error?: string;
  invariant?: string;
}

function getSqlError(err: unknown): DomainSqlError | null {
  if (typeof err === 'object' && err !== null) {
    return err as DomainSqlError;
  }
  return null;
}

// ---------------------------------------------------------------------------
// 1. INVENTORY QUERY
// ---------------------------------------------------------------------------

export interface AllocationSummary {
  allocationId: number;
  bookingId: number;
  journeySeatId: number;
  passengerId: number;
  allocatedAt: string;
}

export interface WaitlistSummary {
  waitlistId: number;
  bookingId: number;
  position: number;
  createdAt: string;
}

export interface ClassInventoryResult {
  journeyClassId: number;
  classCode: string;
  totalSeats: number;
  baseFareInr: number;
  availableSeats: number;
  confirmedCount: number;
  waitlistCount: number;
  allocations: AllocationSummary[];
  waitlist: WaitlistSummary[];
}

export async function getMysqlInventory(journeyClassId?: number): Promise<ClassInventoryResult | ClassInventoryResult[]> {
  const p = getPool();

  let classRows: RowDataPacket[];
  if (journeyClassId) {
    [classRows] = await p.query<RowDataPacket[]>(
      'SELECT journey_class_id, class_code, total_seats, base_fare_inr FROM JOURNEY_CLASS WHERE journey_class_id = ?',
      [journeyClassId]
    );
    if (!classRows.length) {
      throw { status: 404, error: 'JOURNEY_CLASS_NOT_FOUND', message: `JourneyClass not found for ID: ${journeyClassId}` };
    }
  } else {
    // Return all canonical classes in order
    [classRows] = await p.query<RowDataPacket[]>(
      'SELECT journey_class_id, class_code, total_seats, base_fare_inr FROM JOURNEY_CLASS ORDER BY journey_class_id ASC'
    );
  }

  const results: ClassInventoryResult[] = [];

  for (const row of classRows) {
    const cid = Number(row.journey_class_id);
    const totalSeats = Number(row.total_seats);
    const baseFareInr = parseFloat(row.base_fare_inr);

    // Get allocations
    const [allocRows] = await p.query<RowDataPacket[]>(
      `SELECT sa.allocation_id, sa.booking_id, sa.journey_seat_id, sa.passenger_id, sa.allocated_at
       FROM SEAT_ALLOCATION sa
       WHERE sa.journey_class_id = ?
       ORDER BY sa.allocation_id ASC`,
      [cid]
    );

    const allocations: AllocationSummary[] = allocRows.map((a) => ({
      allocationId: Number(a.allocation_id),
      bookingId: Number(a.booking_id),
      journeySeatId: Number(a.journey_seat_id),
      passengerId: Number(a.passenger_id),
      allocatedAt: a.allocated_at ? new Date(a.allocated_at).toISOString().replace('Z', '') : '',
    }));

    // Get waitlist
    const [wlRows] = await p.query<RowDataPacket[]>(
      `SELECT we.waitlist_id, we.booking_id, we.waitlist_position, we.created_at
       FROM WAITLIST_ENTRY we
       WHERE we.journey_class_id = ?
       ORDER BY we.waitlist_position ASC`,
      [cid]
    );

    const waitlist: WaitlistSummary[] = wlRows.map((w) => ({
      waitlistId: Number(w.waitlist_id),
      bookingId: Number(w.booking_id),
      position: Number(w.waitlist_position),
      createdAt: w.created_at ? new Date(w.created_at).toISOString().replace('Z', '') : '',
    }));

    const confirmedCount = allocations.length;
    const availableSeats = Math.max(0, totalSeats - confirmedCount);

    results.push({
      journeyClassId: cid,
      classCode: String(row.class_code),
      totalSeats,
      baseFareInr,
      availableSeats,
      confirmedCount,
      waitlistCount: waitlist.length,
      allocations,
      waitlist,
    });
  }

  return journeyClassId ? results[0] : results;
}

// ---------------------------------------------------------------------------
// 2. CREATE BOOKING
// ---------------------------------------------------------------------------

export interface BookingResult {
  bookingId: number;
  pnr: string;
  journeyClassId: number;
  passengerId: number;
  status: string;
  bookedAt: string;
  fareInr: number;
  groupRef: string | null;
}

export async function createMysqlBooking(
  journeyClassId: number,
  passengerId: number,
  groupRef?: string | null
): Promise<BookingResult> {
  const p = getPool();
  const conn = await p.getConnection();

  try {
    // 1. Ensure passenger exists or auto-register for simulator accessibility
    const [psgRows] = await conn.query<RowDataPacket[]>(
      'SELECT passenger_id FROM PASSENGER WHERE passenger_id = ?',
      [passengerId]
    );
    if (!psgRows.length) {
      await conn.query<ResultSetHeader>(
        `INSERT IGNORE INTO PASSENGER (passenger_id, full_name, email, phone)
         VALUES (?, ?, ?, ?)`,
        [passengerId, `Passenger ${passengerId}`, `passenger${passengerId}@railsync.local`, '919000000000']
      );
    }

    // 2. Execute book_seat stored procedure inside transaction
    await conn.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await conn.query('START TRANSACTION');
    try {
      await conn.query('CALL book_seat(?, ?, ?, @pnr, @status, @booking_id)', [
        journeyClassId,
        passengerId,
        groupRef || null,
      ]);

      const [outRows] = await conn.query<RowDataPacket[]>(
        'SELECT @pnr AS pnr, @status AS status, @booking_id AS bookingId'
      );

      const bookingId = Number(outRows[0]?.bookingId);
      if (!bookingId) {
        throw { status: 500, error: 'BOOKING_FAILED', message: 'Failed to retrieve booking ID after stored procedure execution.' };
      }

      // 3. Query the created booking record
      const [bkgRows] = await conn.query<RowDataPacket[]>(
        'SELECT booking_id, pnr, journey_class_id, passenger_id, status, booked_at, fare_inr, group_ref FROM BOOKING WHERE booking_id = ?',
        [bookingId]
      );

      if (!bkgRows.length) {
        throw { status: 500, error: 'BOOKING_NOT_FOUND', message: `Booking ${bookingId} created but not found in ledger.` };
      }

      await conn.query('COMMIT');

      const b = bkgRows[0];
      return {
        bookingId: Number(b.booking_id),
        pnr: String(b.pnr),
        journeyClassId: Number(b.journey_class_id),
        passengerId: Number(b.passenger_id),
        status: String(b.status),
        bookedAt: b.booked_at ? new Date(b.booked_at).toISOString().replace('Z', '') : '',
        fareInr: parseFloat(b.fare_inr),
        groupRef: b.group_ref ? String(b.group_ref) : null,
      };
    } catch (txErr) {
      await conn.query('ROLLBACK');
      throw txErr;
    }
  } catch (err: unknown) {
    const sqlErr = getSqlError(err);
    if (sqlErr && sqlErr.sqlState === '45000') {
      const msg = sqlErr.message || '';
      if (msg.includes('INV-05') || msg.toLowerCase().includes('already confirmed')) {
        throw {
          status: 409,
          error: 'DUPLICATE_CONFIRMED_BOOKING',
          message: 'Passenger already has a confirmed seat on this journey.',
          invariant: 'INV-05',
        };
      }
      if (msg.toLowerCase().includes('invalid journey class')) {
        throw {
          status: 400,
          error: 'INVALID_BOOKING',
          message: 'Invalid journey class ID.',
          invariant: 'DOMAIN_VALIDATION',
        };
      }
      throw {
        status: 409,
        error: 'DOMAIN_REJECTION',
        message: msg,
        invariant: 'RAILSYNC_ERROR',
      };
    }
    throw err;
  } finally {
    conn.release();
  }
}

// ---------------------------------------------------------------------------
// 3. CANCEL BOOKING
// ---------------------------------------------------------------------------

export async function cancelMysqlBooking(pnr: string): Promise<BookingResult> {
  const p = getPool();
  const conn = await p.getConnection();

  try {
    // 1. Verify existence before calling procedure to provide clean error
    const [existing] = await conn.query<RowDataPacket[]>(
      'SELECT booking_id, status FROM BOOKING WHERE pnr = ?',
      [pnr]
    );

    if (!existing.length) {
      throw {
        status: 404,
        error: 'BOOKING_NOT_FOUND',
        message: `No booking found for PNR: ${pnr}`,
      };
    }

    if (existing[0].status === 'CANCELLED') {
      throw {
        status: 409,
        error: 'ILLEGAL_TRANSITION',
        message: 'Cannot cancel booking in current status',
        invariant: 'STATE_MACHINE',
      };
    }

    // 2. Call cancel_booking stored procedure inside transaction
    await conn.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await conn.query('START TRANSACTION');
    try {
      await conn.query('CALL cancel_booking(?, @old_status)', [pnr]);

      // 3. Query the updated booking record
      const [bkgRows] = await conn.query<RowDataPacket[]>(
        'SELECT booking_id, pnr, journey_class_id, passenger_id, status, booked_at, fare_inr, group_ref FROM BOOKING WHERE pnr = ?',
        [pnr]
      );

      await conn.query('COMMIT');

      const b = bkgRows[0];
      return {
        bookingId: Number(b.booking_id),
        pnr: String(b.pnr),
        journeyClassId: Number(b.journey_class_id),
        passengerId: Number(b.passenger_id),
        status: String(b.status),
        bookedAt: b.booked_at ? new Date(b.booked_at).toISOString().replace('Z', '') : '',
        fareInr: parseFloat(b.fare_inr),
        groupRef: b.group_ref ? String(b.group_ref) : null,
      };
    } catch (txErr) {
      await conn.query('ROLLBACK');
      throw txErr;
    }
  } catch (err: unknown) {
    const sqlErr = getSqlError(err);
    if (sqlErr && sqlErr.sqlState === '45000') {
      const msg = sqlErr.message || '';
      if (msg.toLowerCase().includes('not found')) {
        throw { status: 404, error: 'BOOKING_NOT_FOUND', message: `No booking found for PNR: ${pnr}` };
      }
      if (msg.toLowerCase().includes('cannot cancel')) {
        throw {
          status: 409,
          error: 'ILLEGAL_TRANSITION',
          message: 'Cannot cancel booking in current status',
          invariant: 'STATE_MACHINE',
        };
      }
      throw { status: 400, error: 'DOMAIN_REJECTION', message: msg };
    }
    throw err;
  } finally {
    conn.release();
  }
}

// ---------------------------------------------------------------------------
// 4. GET BOOKINGS
// ---------------------------------------------------------------------------

export async function getMysqlBookings(pnr?: string, id?: number): Promise<BookingResult | BookingResult[]> {
  const p = getPool();

  if (pnr) {
    const [rows] = await p.query<RowDataPacket[]>(
      'SELECT booking_id, pnr, journey_class_id, passenger_id, status, booked_at, fare_inr, group_ref FROM BOOKING WHERE pnr = ?',
      [pnr]
    );
    if (!rows.length) {
      throw { status: 404, error: 'BOOKING_NOT_FOUND', message: `No booking found for PNR: ${pnr}` };
    }
    const b = rows[0];
    return {
      bookingId: Number(b.booking_id),
      pnr: String(b.pnr),
      journeyClassId: Number(b.journey_class_id),
      passengerId: Number(b.passenger_id),
      status: String(b.status),
      bookedAt: b.booked_at ? new Date(b.booked_at).toISOString().replace('Z', '') : '',
      fareInr: parseFloat(b.fare_inr),
      groupRef: b.group_ref ? String(b.group_ref) : null,
    };
  }

  if (id) {
    const [rows] = await p.query<RowDataPacket[]>(
      'SELECT booking_id, pnr, journey_class_id, passenger_id, status, booked_at, fare_inr, group_ref FROM BOOKING WHERE booking_id = ?',
      [id]
    );
    if (!rows.length) {
      throw { status: 404, error: 'BOOKING_NOT_FOUND', message: `No booking found for ID: ${id}` };
    }
    const b = rows[0];
    return {
      bookingId: Number(b.booking_id),
      pnr: String(b.pnr),
      journeyClassId: Number(b.journey_class_id),
      passengerId: Number(b.passenger_id),
      status: String(b.status),
      bookedAt: b.booked_at ? new Date(b.booked_at).toISOString().replace('Z', '') : '',
      fareInr: parseFloat(b.fare_inr),
      groupRef: b.group_ref ? String(b.group_ref) : null,
    };
  }

  // List all bookings
  const [rows] = await p.query<RowDataPacket[]>(
    'SELECT booking_id, pnr, journey_class_id, passenger_id, status, booked_at, fare_inr, group_ref FROM BOOKING ORDER BY booking_id ASC'
  );

  return rows.map((b) => ({
    bookingId: Number(b.booking_id),
    pnr: String(b.pnr),
    journeyClassId: Number(b.journey_class_id),
    passengerId: Number(b.passenger_id),
    status: String(b.status),
    bookedAt: b.booked_at ? new Date(b.booked_at).toISOString().replace('Z', '') : '',
    fareInr: parseFloat(b.fare_inr),
    groupRef: b.group_ref ? String(b.group_ref) : null,
  }));
}

// ---------------------------------------------------------------------------
// 5. EVALUATE REFUND (DISRUPTION RULES)
// ---------------------------------------------------------------------------

export interface CaseEvaluationResult {
  ruleId: string | null;
  ruleVersion: number | null;
  outcome: string;
  reasonCodes: string[];
  warnings: string[];
  actionCode: string;
  refundAmount: string;
  disclaimer: string;
}

export interface DisruptionCaseEvent {
  type?: string;
  eventType?: string;
  eventTime?: string;
  source?: string;
  eventSource?: string;
  value?: number | string | null;
}

export interface DisruptionCasePayload {
  fixtureId?: string;
  ruleFamily?: string;
  policyApplicabilityTime?: string;
  evaluationTime?: string;
  ticketScope?: string;
  fareINR?: string;
  events?: DisruptionCaseEvent[];
}

function toSqlTimestamp(ts: string | null | undefined): string | null {
  if (!ts) return null;
  const cleaned = ts.replace('T', ' ').substring(0, 19);
  return cleaned;
}

export async function evaluateMysqlRefund(caseData: DisruptionCasePayload): Promise<CaseEvaluationResult> {
  const p = getPool();
  const conn = await p.getConnection();

  try {
    const ruleFamily = caseData.ruleFamily || 'LATE_OVER_3_HOURS_E_TICKET';
    const appTime = toSqlTimestamp(caseData.policyApplicabilityTime || '2026-11-03T08:00:00+05:30');
    const evalTime = toSqlTimestamp(caseData.evaluationTime || '2026-11-03T14:25:00+05:30');
    const ticketScope = caseData.ticketScope || 'SIMULATED_E_TICKET_CONFIRMED';
    const fareInr = parseFloat(caseData.fareINR || '1250.00');
    const events: DisruptionCaseEvent[] = Array.isArray(caseData.events) ? caseData.events : [];

    // Execute evaluation within an isolated transaction that is GUARANTEED to ROLLBACK in finally.
    // This allows evaluate_case to insert its evaluation rows and read them, while ensuring
    // ZERO synthetic BOOKING, DISRUPTION_CASE, CASE_EVENT, or CASE_EVALUATION rows persist in operational tables.
    await conn.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await conn.query('START TRANSACTION');

    try {
      // 1. Create transient booking record (rolled back in finally)
      const transientPnr = `PNR-EVAL-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6)}`;
      const [bookingResult] = await conn.query<ResultSetHeader>(
        `INSERT INTO BOOKING (pnr, journey_class_id, passenger_id, status, fare_inr, group_ref)
         VALUES (?, 1, 1, 'CONFIRMED', ?, 'TRANSIENT-EVAL')`,
        [transientPnr, fareInr]
      );
      const bookingId = bookingResult.insertId;

      const [caseResult] = await conn.query<ResultSetHeader>(
        `INSERT INTO DISRUPTION_CASE (booking_id, journey_id, case_status)
         VALUES (?, 101, 'OPEN')`,
        [bookingId]
      );
      const caseId = caseResult.insertId;

      // 2. Insert case events
      for (const ev of events) {
        const evType = ev.type || ev.eventType;
        const rawTime = ev.eventTime || (ev as Record<string, unknown>).eventTimestamp as string;
        const evTime = toSqlTimestamp(rawTime) || toSqlTimestamp(new Date().toISOString());
        const evSource = ev.source || ev.eventSource || 'SIMULATED_OFFICIAL';
        const evVal = ev.value !== undefined && ev.value !== null ? parseFloat(String(ev.value)) : null;

        await conn.query(
          `INSERT INTO CASE_EVENT (case_id, event_type, event_time, event_source, numeric_value)
           VALUES (?, ?, ?, ?, ?)`,
          [caseId, evType, evTime, evSource, evVal]
        );
      }

      // 3. Call evaluate_case procedure
      await conn.query(
        `CALL evaluate_case(?, ?, ?, ?, ?, @outcome, @rule_id, @rule_ver, @action_code, @refund_amt, @eval_id)`,
        [caseId, ruleFamily, appTime, evalTime, ticketScope]
      );

      const [outRows] = await conn.query<RowDataPacket[]>(
        `SELECT @outcome AS outcome, @rule_id AS rule_id, @rule_ver AS rule_version,
                @action_code AS action_code, @refund_amt AS refund_amount, @eval_id AS eval_id`
      );

      const out = outRows[0];
      const evalId = Number(out?.eval_id);

      // 4. Retrieve reason codes in code_order from uncommitted evaluation rows
      let reasonCodes: string[] = [];
      if (evalId) {
        const [codeRows] = await conn.query<RowDataPacket[]>(
          `SELECT reason_code FROM CASE_EVALUATION_CODE WHERE evaluation_id = ? ORDER BY code_order ASC`,
          [evalId]
        );
        reasonCodes = codeRows.map((r) => String(r.reason_code));
      }

      // 5. Evaluate canonical warnings
      const warnings: string[] = [];
      const hasSelfReportedNotTravelled = events.some(
        (e) => (e.type === 'PASSENGER_NOT_TRAVELLED' || e.eventType === 'PASSENGER_NOT_TRAVELLED') &&
               (e.source === 'PASSENGER_REPORTED' || e.eventSource === 'PASSENGER_REPORTED')
      );
      const outcome = String(out?.outcome || 'UNRESOLVED');
      if (
        hasSelfReportedNotTravelled &&
        ['ELIGIBLE', 'DEADLINE_EXPIRED', 'UNRESOLVED'].includes(outcome) &&
        !reasonCodes.includes('EVENT_CONFLICT') &&
        !reasonCodes.includes('TRAVEL_STATUS_UNKNOWN') &&
        !reasonCodes.includes('DELAY_UNVERIFIED')
      ) {
        warnings.push('PASSENGER_STATUS_SELF_REPORTED');
      }

      const refundAmountVal = out?.refund_amount !== null && out?.refund_amount !== undefined
        ? parseFloat(out.refund_amount).toFixed(2)
        : '0.00';

      return {
        ruleId: out?.rule_id ? String(out.rule_id) : null,
        ruleVersion: out?.rule_version !== null && out?.rule_version !== undefined ? Number(out.rule_version) : null,
        outcome,
        reasonCodes,
        warnings,
        actionCode: String(out?.action_code || 'NO_ACTION_UNRESOLVED'),
        refundAmount: refundAmountVal,
        disclaimer: 'Simulated guidance based on the rule version shown. This is not an official refund decision. This system does not file a TDR or guarantee a refund.',
      };
    } finally {
      // ATOMIC CLEANUP: Guaranteed rollback of all transient booking, case, event, and evaluation records
      try {
        await conn.query('ROLLBACK');
      } catch {
        // Rollback completed
      }
    }
  } finally {
    conn.release();
  }
}

