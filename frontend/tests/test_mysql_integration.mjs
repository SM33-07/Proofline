import mysql from 'mysql2/promise';
import { evaluateMysqlRefund } from '../src/lib/mysql-backend.ts';

// P1: Strict credentials check with zero fallback to hardcoded passwords or root
const dbUser = process.env.RAILSYNC_DB_USER;
const dbPassword = process.env.RAILSYNC_DB_PASSWORD || process.env.MYSQL_PWD;

if (!dbUser || dbUser.trim() === '') {
  console.error('[CONFIGURATION_ERROR] RAILSYNC_DB_USER environment variable is required. (No default fallback permitted)');
  process.exit(1);
}

if (!dbPassword || dbPassword.trim() === '') {
  console.error('[CONFIGURATION_ERROR] Database password is required (RAILSYNC_DB_PASSWORD or MYSQL_PWD). (No default fallback permitted)');
  process.exit(1);
}

if (dbUser.trim().toLowerCase() === 'root') {
  console.error('[SAFETY_VIOLATION] The MySQL root account is strictly prohibited for test execution. A dedicated test account is required.');
  process.exit(1);
}

// P2: multipleStatements removed
const DB_CONFIG = {
  host: process.env.RAILSYNC_DB_HOST || 'localhost',
  port: process.env.RAILSYNC_DB_PORT ? parseInt(process.env.RAILSYNC_DB_PORT, 10) : 3306,
  user: dbUser.trim(),
  password: dbPassword.trim(),
  database: 'railsync_test',
  waitForConnections: true,
  connectionLimit: 10,
};

let passed = 0;
let failed = 0;
let skipped = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

// Step 1 & P5: Narrowly scoped fixture cleanup targeting ONLY test-specific markers
// Preserves pre-existing bookings, seed data, and unrelated test evidence.
async function resetTestDatabaseFixture(pool) {
  const conn = await pool.getConnection();
  try {
    const [dbInfo] = await conn.query('SELECT DATABASE() AS db');
    if (dbInfo[0]?.db !== 'railsync_test') {
      throw new Error(`SAFETY_ABORT: Target database is '${dbInfo[0]?.db}', expected exactly 'railsync_test'. Refusing cleanup.`);
    }

    // Resolve booking IDs belonging strictly to this test suite's unique group_ref markers
    const testGroupRefs = ['GRP-TEST-01', 'GRP-WL', 'GRP-P8', 'CONCUR-TEST'];
    const [matchedBookings] = await conn.query(
      'SELECT booking_id FROM BOOKING WHERE group_ref IN (?)',
      [testGroupRefs]
    );
    const targetBookingIds = matchedBookings.map((r) => r.booking_id);

    if (targetBookingIds.length > 0) {
      // Find associated disruption cases
      const [matchedCases] = await conn.query(
        'SELECT case_id FROM DISRUPTION_CASE WHERE booking_id IN (?)',
        [targetBookingIds]
      );
      const targetCaseIds = matchedCases.map((r) => r.case_id);

      if (targetCaseIds.length > 0) {
        const [matchedEvals] = await conn.query(
          'SELECT evaluation_id FROM CASE_EVALUATION WHERE case_id IN (?)',
          [targetCaseIds]
        );
        const targetEvalIds = matchedEvals.map((r) => r.evaluation_id);

        if (targetEvalIds.length > 0) {
          // 1. CASE_EVALUATION_CODE references CASE_EVALUATION
          await conn.query('DELETE FROM CASE_EVALUATION_CODE WHERE evaluation_id IN (?)', [targetEvalIds]);
        }
        // 2. CASE_EVALUATION references DISRUPTION_CASE
        await conn.query('DELETE FROM CASE_EVALUATION WHERE case_id IN (?)', [targetCaseIds]);
        // 3. CASE_EVENT references DISRUPTION_CASE
        await conn.query('DELETE FROM CASE_EVENT WHERE case_id IN (?)', [targetCaseIds]);
        // 4. DISRUPTION_CASE references BOOKING
        await conn.query('DELETE FROM DISRUPTION_CASE WHERE case_id IN (?)', [targetCaseIds]);
      }

      // 5. BOOKING_AUDIT references BOOKING
      await conn.query('DELETE FROM BOOKING_AUDIT WHERE booking_id IN (?)', [targetBookingIds]);
      // 6. WAITLIST_ENTRY references BOOKING
      await conn.query('DELETE FROM WAITLIST_ENTRY WHERE booking_id IN (?)', [targetBookingIds]);
      // 7. SEAT_ALLOCATION references BOOKING
      await conn.query('DELETE FROM SEAT_ALLOCATION WHERE booking_id IN (?)', [targetBookingIds]);
      // 8. BOOKING
      await conn.query('DELETE FROM BOOKING WHERE booking_id IN (?)', [targetBookingIds]);
    }
  } finally {
    conn.release();
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('RailSync Phase 2: Comprehensive MySQL 8 Integration Test Suite');
  console.log('Target Database: railsync_test (Isolated)');
  console.log('================================================================\n');

  const pool = mysql.createPool(DB_CONFIG);

  try {
    // Ensure clean baseline before running
    await resetTestDatabaseFixture(pool);

    // -------------------------------------------------------------------------
    // TEST 1: Schema & Connection Verification
    // -------------------------------------------------------------------------
    console.log('--- Test 1: Connection & Readiness Verification ---');
    const [dbInfo] = await pool.query('SELECT DATABASE() AS db, @@version AS ver, CURRENT_USER() AS cur_user');
    if (dbInfo[0]?.cur_user?.startsWith('root@')) {
      console.error('[SAFETY_VIOLATION] Session authenticated as root. A dedicated non-root test user is required.');
      process.exit(1);
    }
    assert(dbInfo[0].db === 'railsync_test', `Connected strictly to isolated database '${dbInfo[0].db}'`);
    assert(dbInfo[0].ver.startsWith('8.'), `Verified MySQL 8 engine: ${dbInfo[0].ver}`);

    // Verify invariant baseline
    const connInv0 = await pool.getConnection();
    await connInv0.query('CALL run_invariants(@v)');
    const [invRows] = await connInv0.query('SELECT @v AS violations');
    connInv0.release();
    const initialViolations = Number(invRows[0].violations);
    assert(initialViolations === 0, 'Seed fixture starts with 0 invariant violations');

    // -------------------------------------------------------------------------
    // TEST 2: Successful Booking & Persisted State
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2: Successful Booking into Available Class ---');
    // JourneyClass 1 (Journey 101 Sleeper, 5 total seats, initially 0 booked)
    const conn1 = await pool.getConnection();
    await conn1.query('CALL book_seat(?, ?, ?, @pnr, @status, @booking_id)', [1, 1, 'GRP-TEST-01']);
    const [b1Out] = await conn1.query('SELECT @pnr AS pnr, @status AS status, @booking_id AS bid');
    conn1.release();

    const pnr1 = b1Out[0].pnr;
    const status1 = b1Out[0].status;
    const bid1 = Number(b1Out[0].bid);

    assert(status1 === 'CONFIRMED', `First booking status is CONFIRMED (actual: ${status1})`);
    assert(pnr1 && pnr1.startsWith('PNR-'), `Valid PNR generated: ${pnr1}`);
    assert(bid1 > 0, `Valid bookingId generated: ${bid1}`);

    // Verify DB persisted rows
    const [alloc1] = await pool.query('SELECT * FROM SEAT_ALLOCATION WHERE booking_id = ?', [bid1]);
    assert(alloc1.length === 1, `Seat allocation record created for booking ${bid1}`);
    assert(Number(alloc1[0].passenger_id) === 1, `Allocation passenger_id matches: 1`);
    assert(Number(alloc1[0].journey_id) === 101, `Allocation journey_id matches parent journey: 101`);

    // Verify occupancy view
    const [occ1] = await pool.query('SELECT * FROM v_journey_occupancy WHERE journey_class_id = 1');
    assert(Number(occ1[0].confirmed_seats) === 1, `Occupancy view shows confirmed_seats = 1`);
    assert(Number(occ1[0].available_seats) === 4, `Occupancy view shows available_seats = 4`);

    // -------------------------------------------------------------------------
    // TEST 3: Duplicate Passenger Cross-Class Rejection (INV-05)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3: Duplicate Passenger Rejection Across Classes (INV-05) ---');
    let dupCaught = false;
    let dupMsg = '';
    const connDup = await pool.getConnection();
    try {
      await connDup.query('CALL book_seat(?, ?, ?, @pnr, @status, @bid)', [2, 1, 'GRP-DUP']);
    } catch (err) {
      dupCaught = true;
      dupMsg = err.message;
    } finally {
      connDup.release();
    }

    assert(dupCaught, `Duplicate cross-class booking on same journey was rejected with exception`);
    assert(dupMsg.includes('INV-05'), `Error message explicitly cites INV-05: "${dupMsg}"`);

    const [allocClass2] = await pool.query('SELECT * FROM SEAT_ALLOCATION WHERE journey_class_id = 2');
    assert(allocClass2.length === 0, `AC 3-Tier class (JourneyClass 2) has 0 side-effect allocations`);

    // -------------------------------------------------------------------------
    // TEST 4: Capacity Exhaustion & Waitlist FIFO Ordering
    // -------------------------------------------------------------------------
    console.log('\n--- Test 4: Capacity Exhaustion & Waitlist Ordering ---');
    const connCap = await pool.getConnection();
    await connCap.query('CALL book_seat(?, ?, ?, @pnr, @status, @bid)', [2, 2, 'GRP-WL']);
    const [capP2] = await connCap.query('SELECT @pnr AS pnr, @status AS status, @bid AS bid');
    assert(capP2[0].status === 'CONFIRMED', `Passenger 2 took the single physical seat in Class 2`);

    await connCap.query('CALL book_seat(?, ?, ?, @pnr, @status, @bid)', [2, 3, 'GRP-WL']);
    const [capP3] = await connCap.query('SELECT @pnr AS pnr, @status AS status, @bid AS bid');
    assert(capP3[0].status === 'WAITLISTED', `Passenger 3 overflowed to WAITLISTED`);

    await connCap.query('CALL book_seat(?, ?, ?, @pnr, @status, @bid)', [2, 4, 'GRP-WL']);
    const [capP4] = await connCap.query('SELECT @pnr AS pnr, @status AS status, @bid AS bid');
    assert(capP4[0].status === 'WAITLISTED', `Passenger 4 overflowed to WAITLISTED`);
    connCap.release();

    const pnrP2 = capP2[0].pnr;
    const bidP3 = Number(capP3[0].bid);
    const bidP4 = Number(capP4[0].bid);
    const pnrP4 = capP4[0].pnr;

    const [wlEntries] = await pool.query(
      'SELECT booking_id, waitlist_position FROM WAITLIST_ENTRY WHERE journey_class_id = 2 ORDER BY waitlist_position ASC'
    );
    assert(wlEntries.length === 2, `Exactly 2 waitlist entries exist for Class 2`);
    assert(Number(wlEntries[0].booking_id) === bidP3 && Number(wlEntries[0].waitlist_position) === 1,
      `P3 holds waitlist position 1`);
    assert(Number(wlEntries[1].booking_id) === bidP4 && Number(wlEntries[1].waitlist_position) === 2,
      `P4 holds waitlist position 2`);

    // -------------------------------------------------------------------------
    // TEST 5: Confirmed Cancellation with Cascade Waitlist Promotion
    // -------------------------------------------------------------------------
    console.log('\n--- Test 5: Confirmed Cancellation with Cascade Promotion ---');
    const connCancel = await pool.getConnection();
    await connCancel.query('CALL cancel_booking(?, @old_status)', [pnrP2]);
    const [cancelRes] = await connCancel.query('SELECT @old_status AS old_status');
    connCancel.release();

    assert(cancelRes[0].old_status === 'CONFIRMED', `Old status recorded as CONFIRMED`);

    const [p2Rows] = await pool.query('SELECT status FROM BOOKING WHERE pnr = ?', [pnrP2]);
    assert(p2Rows[0].status === 'CANCELLED', `P2 booking transitioned to CANCELLED`);
    const [p2Allocs] = await pool.query('SELECT * FROM SEAT_ALLOCATION WHERE booking_id = ?', [capP2[0].bid]);
    assert(p2Allocs.length === 0, `P2 seat allocation released`);

    const [p3Rows] = await pool.query('SELECT status FROM BOOKING WHERE booking_id = ?', [bidP3]);
    assert(p3Rows[0].status === 'CONFIRMED', `P3 automatically promoted from WAITLISTED to CONFIRMED`);

    const [p3Allocs] = await pool.query('SELECT * FROM SEAT_ALLOCATION WHERE booking_id = ?', [bidP3]);
    assert(p3Allocs.length === 1, `P3 allocated the freed physical seat`);

    const [wlAfter] = await pool.query(
      'SELECT booking_id, waitlist_position FROM WAITLIST_ENTRY WHERE journey_class_id = 2 ORDER BY waitlist_position ASC'
    );
    assert(wlAfter.length === 1, `Waitlist now has exactly 1 entry`);
    assert(Number(wlAfter[0].booking_id) === bidP4 && Number(wlAfter[0].waitlist_position) === 1,
      `P4 re-indexed to waitlist position 1`);

    const [class2Occ] = await pool.query('SELECT COUNT(*) AS cnt FROM SEAT_ALLOCATION WHERE journey_class_id = 2');
    assert(Number(class2Occ[0].cnt) === 1, `Class 2 maintains exact capacity constraint (1 seat confirmed)`);

    // -------------------------------------------------------------------------
    // TEST 6: Waitlisted Cancellation (No Seat Released, No Promotion)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 6: Waitlisted Cancellation Without Releasing Seat ---');
    const connWlCancel = await pool.getConnection();
    await connWlCancel.query('CALL cancel_booking(?, @old_status)', [pnrP4]);
    const [wlCancelRes] = await connWlCancel.query('SELECT @old_status AS old_status');
    connWlCancel.release();

    assert(wlCancelRes[0].old_status === 'WAITLISTED', `Old status was WAITLISTED`);

    const [p4Rows] = await pool.query('SELECT status FROM BOOKING WHERE pnr = ?', [pnrP4]);
    assert(p4Rows[0].status === 'CANCELLED', `P4 booking transitioned to CANCELLED`);

    const [wlEmpty] = await pool.query('SELECT * FROM WAITLIST_ENTRY WHERE journey_class_id = 2');
    assert(wlEmpty.length === 0, `Waitlist for Class 2 is now empty`);

    const [p3StillConfirmed] = await pool.query('SELECT status FROM BOOKING WHERE booking_id = ?', [bidP3]);
    assert(p3StillConfirmed[0].status === 'CONFIRMED', `P3 remains CONFIRMED`);
    const [allocsStill1] = await pool.query('SELECT COUNT(*) AS cnt FROM SEAT_ALLOCATION WHERE journey_class_id = 2');
    assert(Number(allocsStill1[0].cnt) === 1, `Total confirmed allocations unchanged (1 seat)`);

    // -------------------------------------------------------------------------
    // TEST 7: Invalid State Transitions Rejected
    // -------------------------------------------------------------------------
    console.log('\n--- Test 7: Invalid Booking State Transitions Rejected ---');
    let doubleCancelCaught = false;
    let doubleCancelMsg = '';
    const connState = await pool.getConnection();
    try {
      await connState.query('CALL cancel_booking(?, @old_status)', [pnrP2]);
    } catch (err) {
      doubleCancelCaught = true;
      doubleCancelMsg = err.message;
    } finally {
      connState.release();
    }

    assert(doubleCancelCaught, `Attempt to cancel CANCELLED booking rejected`);
    assert(doubleCancelMsg.toLowerCase().includes('cannot cancel'), `Exception indicates invalid status: "${doubleCancelMsg}"`);

    let triggerCaught = false;
    const connTrg = await pool.getConnection();
    try {
      await connTrg.query("UPDATE BOOKING SET status = 'CONFIRMED' WHERE pnr = ?", [pnrP2]);
    } catch {
      triggerCaught = true;
    } finally {
      connTrg.release();
    }
    assert(triggerCaught, `Trigger trg_booking_status_guard blocked illegal CANCELLED -> CONFIRMED transition`);

    // -------------------------------------------------------------------------
    // TEST 8: Group Booking Savepoint Rollback Semantics (book_group)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 8: Group Booking Savepoint Rollback Semantics ---');
    const connGrp = await pool.getConnection();
    await connGrp.query('START TRANSACTION');
    await connGrp.query(
      'CALL book_group(4, 1, 2, 3, TRUE, "GRP-SP-TEST", @p1, @p2, @p3, @rb);'
    );
    const [grpOut] = await connGrp.query(
      'SELECT @p1 AS p1, @p2 AS p2, @p3 AS p3, @rb AS rb'
    );
    await connGrp.query('COMMIT');
    connGrp.release();

    const p1Pnr = grpOut[0].p1;
    const p2Pnr = grpOut[0].p2;
    const p3Pnr = grpOut[0].p3;
    const member2RolledBack = Boolean(grpOut[0].rb);

    assert(p1Pnr && p1Pnr.startsWith('PNR-'), `Member 1 succeeded with PNR: ${p1Pnr}`);
    assert(member2RolledBack, `Member 2 failed and triggered SAVEPOINT rollback (@rb = TRUE)`);
    assert(p3Pnr && p3Pnr.startsWith('PNR-'), `Member 3 succeeded with PNR: ${p3Pnr}`);

    if (p2Pnr) {
      const [orphanBkg] = await pool.query('SELECT * FROM BOOKING WHERE pnr = ?', [p2Pnr]);
      assert(orphanBkg.length === 0, `Zero orphan rows in BOOKING for rolled-back member 2`);
    } else {
      assert(true, `No PNR issued for rolled-back member 2`);
    }

    const p1Num = parseInt(p1Pnr.replace('PNR-', ''), 10);
    const p3Num = parseInt(p3Pnr.replace('PNR-', ''), 10);
    assert(p3Num >= p1Num + 2, `PNR sequence contains deliberate non-recycled gap (P1: ${p1Num}, P3: ${p3Num})`);

    // -------------------------------------------------------------------------
    // TEST 9: Concurrency on Competing Last Seat
    // -------------------------------------------------------------------------
    console.log('\n--- Test 9: Concurrency Contention on Competing Last Seat ---');
    const connPrep = await pool.getConnection();
    await connPrep.query('CALL book_seat(4, 4, "GRP-FILL", @p, @s, @b)');
    await connPrep.query('CALL book_seat(4, 5, "GRP-FILL", @p, @s, @b)');
    connPrep.release();

    await pool.query(
      `INSERT IGNORE INTO PASSENGER (passenger_id, full_name, email, phone)
       VALUES (6, 'Passenger 6', 'p6@test.local', '919000000006'),
              (7, 'Passenger 7', 'p7@test.local', '919000000007')`
    );

    const bookWorker = async (psgId) => {
      const c = await pool.getConnection();
      try {
        await c.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        await c.query('START TRANSACTION');
        await c.query('CALL book_seat(4, ?, "GRP-RACE", @pnr, @status, @bid)', [psgId]);
        const [res] = await c.query('SELECT @pnr AS pnr, @status AS status, @bid AS bid');
        await c.query('COMMIT');
        return res[0];
      } catch (err) {
        await c.query('ROLLBACK');
        throw err;
      } finally {
        c.release();
      }
    };

    const [workerA, workerB] = await Promise.all([
      bookWorker(6),
      bookWorker(7),
    ]);

    const statuses = [workerA.status, workerB.status];
    const confirmedCount = statuses.filter((s) => s === 'CONFIRMED').length;
    const waitlistedCount = statuses.filter((s) => s === 'WAITLISTED').length;

    assert(confirmedCount === 1, `Exactly one concurrent worker was CONFIRMED (actual: ${confirmedCount})`);
    assert(waitlistedCount === 1, `Exactly one concurrent worker was WAITLISTED (actual: ${waitlistedCount})`);

    const [finalAlloc4] = await pool.query('SELECT COUNT(*) AS cnt FROM SEAT_ALLOCATION WHERE journey_class_id = 4');
    assert(Number(finalAlloc4[0].cnt) === 5, `Total confirmed allocations in Class 4 is exactly physical capacity 5 (Zero Oversell)`);

    // -------------------------------------------------------------------------
    // TEST 10: Invariant Checks INV-01 Through INV-06
    // -------------------------------------------------------------------------
    console.log('\n--- Test 10: Invariant Suite Execution (INV-01 through INV-06) ---');
    const connInvFinal = await pool.getConnection();
    await connInvFinal.query('CALL run_invariants(@violations)');
    const [invPostRows] = await connInvFinal.query('SELECT @violations AS violations');
    connInvFinal.release();
    const finalViolations = Number(invPostRows[0].violations);
    assert(finalViolations === 0, `All database invariants INV-01 through INV-06 passed with 0 violations!`);

    // -------------------------------------------------------------------------
    // TEST 11: Stored Procedure Error Handling & Validation
    // -------------------------------------------------------------------------
    console.log('\n--- Test 11: Stored Procedure Error Handling & Edge Cases ---');
    let badClassCaught = false;
    const connErr = await pool.getConnection();
    try {
      await connErr.query('CALL book_seat(99999, 1, NULL, @p, @s, @b)');
    } catch {
      badClassCaught = true;
    } finally {
      connErr.release();
    }
    assert(badClassCaught, `Invalid journeyClassId rejected with SQL exception`);

    let badPnrCaught = false;
    const connPnr = await pool.getConnection();
    try {
      await connPnr.query('CALL cancel_booking("PNR-NONEXISTENT", @s)');
    } catch {
      badPnrCaught = true;
    } finally {
      connPnr.release();
    }
    assert(badPnrCaught, `Non-existent PNR cancellation rejected with SQL exception`);

    // -------------------------------------------------------------------------
    // TEST 12: Disruption Case Evaluation Parity (D-01, D-02, D-08, D-14)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 12: Disruption Refund Policy Evaluation Fixtures ---');

    const runCase = async (caseId, bookingId, ruleFam, appTime, evalTime, scope, fare, events) => {
      const c = await pool.getConnection();
      try {
        await c.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        await c.query('START TRANSACTION');
        try {
          await c.query(
            'INSERT INTO BOOKING (booking_id, pnr, journey_class_id, passenger_id, status, fare_inr) VALUES (?, ?, 1, 1, "CONFIRMED", ?) ON DUPLICATE KEY UPDATE fare_inr = ?',
            [bookingId, `PNR-CASE-${caseId}`, fare, fare]
          );
          await c.query(
            'INSERT INTO DISRUPTION_CASE (case_id, booking_id, journey_id, case_status) VALUES (?, ?, 101, "OPEN") ON DUPLICATE KEY UPDATE booking_id = ?',
            [caseId, bookingId, bookingId]
          );
          await c.query('DELETE FROM CASE_EVENT WHERE case_id = ?', [caseId]);
          for (const ev of events) {
            await c.query(
              'INSERT INTO CASE_EVENT (case_id, event_type, event_time, event_source, numeric_value) VALUES (?, ?, ?, ?, ?)',
              [caseId, ev.type, ev.time, ev.source, ev.val || null]
            );
          }
          await c.query(
            'CALL evaluate_case(?, ?, ?, ?, ?, @out, @rid, @rver, @act, @amt, @eid)',
            [caseId, ruleFam, appTime, evalTime, scope]
          );

          const [res] = await c.query('SELECT @out AS outcome, @rid AS rule_id, @act AS action_code, @amt AS refund_amount, @eid AS eval_id');
          const [reasons] = await c.query('SELECT reason_code FROM CASE_EVALUATION_CODE WHERE evaluation_id = ? ORDER BY code_order', [res[0].eval_id]);
          return {
            outcome: res[0].outcome,
            actionCode: res[0].action_code,
            refundAmount: parseFloat(res[0].refund_amount).toFixed(2),
            reasonCodes: reasons.map((r) => r.reason_code),
          };
        } finally {
          await c.query('ROLLBACK');
        }
      } finally {
        c.release();
      }
    };

    const d01 = await runCase(
      101, 2001, 'LATE_OVER_3_HOURS_E_TICKET',
      '2026-11-03 08:00:00', '2026-11-03 14:25:00', 'SIMULATED_E_TICKET_CONFIRMED', 1250.00,
      [
        { type: 'DELAY_AT_BOARDING_MINUTES', time: '2026-11-03 13:45:00', source: 'SIMULATED_OFFICIAL', val: 210 },
        { type: 'PASSENGER_NOT_TRAVELLED', time: '2026-11-03 14:00:00', source: 'SIMULATED_OFFICIAL' },
        { type: 'FILING_ATTEMPT', time: '2026-11-03 14:15:00', source: 'SIMULATED_INPUT' },
        { type: 'ACTUAL_DEPARTURE', time: '2026-11-03 14:30:00', source: 'SIMULATED_OFFICIAL' },
      ]
    );
    assert(d01.outcome === 'ELIGIBLE', `D-01 outcome is ELIGIBLE`);
    assert(d01.actionCode === 'MODELLED_TDR_FILED_BEFORE_DEPARTURE', `D-01 actionCode matches canonical`);
    assert(d01.refundAmount === '1250.00', `D-01 refundAmount is 1250.00`);
    assert(d01.reasonCodes.includes('DELAY_OVER_THRESHOLD'), `D-01 includes DELAY_OVER_THRESHOLD`);

    const d02 = await runCase(
      102, 2002, 'LATE_OVER_3_HOURS_E_TICKET',
      '2026-11-03 08:00:00', '2026-11-03 14:25:00', 'SIMULATED_E_TICKET_CONFIRMED', 1250.00,
      [
        { type: 'DELAY_AT_BOARDING_MINUTES', time: '2026-11-03 13:45:00', source: 'SIMULATED_OFFICIAL', val: 180 },
        { type: 'PASSENGER_NOT_TRAVELLED', time: '2026-11-03 14:00:00', source: 'SIMULATED_OFFICIAL' },
        { type: 'FILING_ATTEMPT', time: '2026-11-03 14:15:00', source: 'SIMULATED_INPUT' },
        { type: 'ACTUAL_DEPARTURE', time: '2026-11-03 14:30:00', source: 'SIMULATED_OFFICIAL' },
      ]
    );
    assert(d02.outcome === 'NOT_ELIGIBLE', `D-02 outcome is NOT_ELIGIBLE (delay not > 180m)`);
    assert(d02.actionCode === 'NO_ACTION_INELIGIBLE', `D-02 actionCode is NO_ACTION_INELIGIBLE`);
    assert(d02.refundAmount === '0.00', `D-02 refundAmount is 0.00`);

    const d08 = await runCase(
      108, 2008, 'TRAIN_CANCELLED_E_TICKET',
      '2026-11-03 08:00:00', '2026-11-03 10:00:00', 'SIMULATED_E_TICKET_CONFIRMED', 1250.00,
      [
        { type: 'TRAIN_CANCELLED', time: '2026-11-03 09:00:00', source: 'SIMULATED_OFFICIAL' },
      ]
    );
    assert(d08.outcome === 'ELIGIBLE', `D-08 outcome is ELIGIBLE`);
    assert(d08.actionCode === 'NO_TDR_REQUIRED', `D-08 actionCode is NO_TDR_REQUIRED`);
    assert(d08.refundAmount === '1250.00', `D-08 refundAmount is 1250.00`);

    const d14 = await runCase(
      114, 2014, 'LATE_OVER_3_HOURS_E_TICKET',
      '2026-11-03 08:00:00', '2026-11-03 15:00:00', 'SIMULATED_E_TICKET_CONFIRMED', 1250.00,
      [
        { type: 'PASSENGER_TRAVELLED', time: '2026-11-03 12:00:00', source: 'SIMULATED_OFFICIAL' },
        { type: 'PASSENGER_NOT_TRAVELLED', time: '2026-11-03 13:00:00', source: 'PASSENGER_REPORTED' },
      ]
    );
    assert(d14.outcome === 'UNRESOLVED', `D-14 outcome is UNRESOLVED due to conflicting events`);
    assert(d14.reasonCodes.includes('EVENT_CONFLICT'), `D-14 includes reason code EVENT_CONFLICT`);

    // -------------------------------------------------------------------------
    // TEST 13: P3 Regression - Zero Persistent Operational Record Pollution
    // -------------------------------------------------------------------------
    console.log('\n--- Test 13: P3 Regression - Atomic Zero-Pollution Refund Evaluation ---');

    // Baseline record counts across all operational tables
    const [bkgCount0] = await pool.query('SELECT COUNT(*) AS cnt FROM BOOKING');
    const [caseCount0] = await pool.query('SELECT COUNT(*) AS cnt FROM DISRUPTION_CASE');
    const [eventCount0] = await pool.query('SELECT COUNT(*) AS cnt FROM CASE_EVENT');
    const [evalCount0] = await pool.query('SELECT COUNT(*) AS cnt FROM CASE_EVALUATION');
    const [codeCount0] = await pool.query('SELECT COUNT(*) AS cnt FROM CASE_EVALUATION_CODE');
    const [auditCount0] = await pool.query('SELECT COUNT(*) AS cnt FROM BOOKING_AUDIT');

    const initialCounts = {
      booking: Number(bkgCount0[0].cnt),
      case: Number(caseCount0[0].cnt),
      event: Number(eventCount0[0].cnt),
      eval: Number(evalCount0[0].cnt),
      code: Number(codeCount0[0].cnt),
      audit: Number(auditCount0[0].cnt),
    };

    // Run 5 successive refund evaluations via evaluateMysqlRefund
    for (let i = 1; i <= 5; i++) {
      const evalRes = await evaluateMysqlRefund({
        fixtureId: `P3-TEST-RUN-${i}`,
        ruleFamily: 'LATE_OVER_3_HOURS_E_TICKET',
        policyApplicabilityTime: '2026-11-03T08:00:00+05:30',
        evaluationTime: '2026-11-03T14:25:00+05:30',
        ticketScope: 'SIMULATED_E_TICKET_CONFIRMED',
        fareINR: '1250.00',
        events: [
          { type: 'DELAY_AT_BOARDING_MINUTES', eventTime: '2026-11-03T13:45:00+05:30', source: 'SIMULATED_OFFICIAL', value: 210 },
          { type: 'PASSENGER_NOT_TRAVELLED', eventTime: '2026-11-03T14:00:00+05:30', source: 'PASSENGER_REPORTED' },
          { type: 'FILING_ATTEMPT', eventTime: '2026-11-03T14:15:00+05:30', source: 'SIMULATED_INPUT' },
          { type: 'ACTUAL_DEPARTURE', eventTime: '2026-11-03T14:30:00+05:30', source: 'SIMULATED_OFFICIAL' },
        ],
      });
      assert(evalRes.outcome === 'ELIGIBLE', `Evaluation run ${i} returned valid canonical outcome ELIGIBLE`);
      assert(evalRes.refundAmount === '1250.00', `Evaluation run ${i} returned valid refundAmount 1250.00`);
    }

    // Induce a failure scenario (invalid rule family)
    try {
      await evaluateMysqlRefund({
        ruleFamily: 'NON_EXISTENT_RULE_FAMILY_TEST',
        events: [],
      });
    } catch {}

    // Verify row counts after repeated evaluations and failure
    const [bkgCountFinal] = await pool.query('SELECT COUNT(*) AS cnt FROM BOOKING');
    const [caseCountFinal] = await pool.query('SELECT COUNT(*) AS cnt FROM DISRUPTION_CASE');
    const [eventCountFinal] = await pool.query('SELECT COUNT(*) AS cnt FROM CASE_EVENT');
    const [evalCountFinal] = await pool.query('SELECT COUNT(*) AS cnt FROM CASE_EVALUATION');
    const [codeCountFinal] = await pool.query('SELECT COUNT(*) AS cnt FROM CASE_EVALUATION_CODE');
    const [auditCountFinal] = await pool.query('SELECT COUNT(*) AS cnt FROM BOOKING_AUDIT');

    assert(Number(bkgCountFinal[0].cnt) === initialCounts.booking,
      `BOOKING count unchanged after 5 evaluations (Initial: ${initialCounts.booking}, Final: ${bkgCountFinal[0].cnt})`);
    assert(Number(caseCountFinal[0].cnt) === initialCounts.case,
      `DISRUPTION_CASE count unchanged after 5 evaluations (Initial: ${initialCounts.case}, Final: ${caseCountFinal[0].cnt})`);
    assert(Number(eventCountFinal[0].cnt) === initialCounts.event,
      `CASE_EVENT count unchanged after 5 evaluations (Initial: ${initialCounts.event}, Final: ${eventCountFinal[0].cnt})`);
    assert(Number(evalCountFinal[0].cnt) === initialCounts.eval,
      `CASE_EVALUATION count unchanged after 5 evaluations (Initial: ${initialCounts.eval}, Final: ${evalCountFinal[0].cnt})`);
    assert(Number(codeCountFinal[0].cnt) === initialCounts.code,
      `CASE_EVALUATION_CODE count unchanged after 5 evaluations (Initial: ${initialCounts.code}, Final: ${codeCountFinal[0].cnt})`);
    assert(Number(auditCountFinal[0].cnt) === initialCounts.audit,
      `BOOKING_AUDIT count unchanged after 5 evaluations (Initial: ${initialCounts.audit}, Final: ${auditCountFinal[0].cnt})`);

  } finally {
    // Teardown: ensure clean baseline when suite finishes
    await resetTestDatabaseFixture(pool);
    await pool.end();
  }

  console.log('\n================================================================');
  console.log(`MySQL Integration Tests Finished:`);
  console.log(`Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during integration tests:', err);
  process.exit(1);
});
