# Architecture Decisions and Resolutions (ADR) — RailSync

**Candidate Baseline SRS:** Revision 1.0 (24 October 2026, candidate authoritative baseline pending Section 15 sign-off; historical baseline: v0.2 in `docs/srs/v0.2/`)
**Date:** 24 October 2026 (Updated 25 October 2026)
**Status:** Existing architectural decisions documented; reconciliation with candidate SRS v1.0 in progress. Formal SRS v1.0 sign-off remains pending.

---

## 1. PNR Allocation, Sequence Gaps, and Audit Rollback Semantics

- **Context:** SRS §4 (FR-R02) mandates that PNRs must be unique, generated on booking creation (`PENDING`), and never re-used even after cancellation or transaction rollback. Concurrently, SRS transaction requirements mandate that audit logs must be transactional: rolled-back operations must leave zero committed audit rows.
- **Decision:**
  1. PNRs are allocated from a monotonic, non-recycling sequence generator.
  2. If a transaction or savepoint rolls back (such as a failed member in a group booking), the generated PNR is discarded, resulting in an intentional gap in the sequence. This PNR is never re-issued.
  3. All partial mutations performed by the failed transaction—including row insertions in `BOOKING`, `SEAT_ALLOCATION`, `WAITLIST_ENTRY`, and `BOOKING_AUDIT`—roll back atomically.
  4. Committed `BOOKING_AUDIT` rows exist exclusively for committed booking creations and transitions.
- **Traceability:** Addresses Review Item 1, FR-R02, FR-R11, FR-R18, INV-06, Fixtures R-08, R-09.

---

## 2. Mandatory Hierarchical Lock Ordering in MySQL

- **Context:** Invariant `INV-05` mandates that a passenger can hold at most one confirmed booking on a journey across all seat classes. If concurrent transactions only locked the specific `JOURNEY_CLASS` row, two concurrent requests for the same passenger in different classes (e.g. Sleeper and AC) would not serialize against each other, creating a race condition.
- **Decision:**
  1. All reservation routines and transactions MUST acquire row-level locks in strict hierarchical order:
     $$\mathbf{JOURNEY} \longrightarrow \mathbf{JOURNEY\_CLASS} \longrightarrow \mathbf{BOOKING} \longrightarrow \mathbf{SEAT\_ALLOCATION} \longrightarrow \mathbf{WAITLIST\_ENTRY}$$
  2. The first data access statement in `book_seat` MUST lock the parent `JOURNEY` row (`SELECT ... FROM JOURNEY WHERE journey_id = ? FOR UPDATE`).
  3. No availability-count reads are permitted prior to acquiring the `JOURNEY` lock.
  4. The two-session concurrency experiment (`R-03`) demonstrates Session 2 blocking on the parent `JOURNEY` lock.
- **Traceability:** Addresses Review Item 2, §2.3, §6.2, Fixture R-03.

---

## 3. Provisional Course Restrictions vs Implementation Readiness

- **Context:** SRS v0.2 notes that the official CSC2104 course handout must be reviewed before final queue coding. While Java 26.0.2 is installed locally, the course-approved JDK version and library restrictions are external academic dependencies.
- **Decision:**
  1. The implementation plan classifies the zero-collections and monitor-only (`synchronized`, `wait`, `notifyAll`, fixed array `Object[]`) constraints as **provisional anticipated baselines**, rather than finalized verified constraints.
  2. The code will be built to satisfy these strictest expected constraints out of the box, ensuring that once the handout is inspected, zero refactoring will be required if the restrictions hold.
  3. Compilation scripts will support standard JDK targets.
- **Traceability:** Addresses Review Item 3, §2.2, §10, Task T06.

---

## 4. Complete Booking Lifecycle State Transitions

- **Context:** SRS §3.1 defines the complete lifecycle state machine. Previous summaries shorthanded the flow as `PENDING -> CONFIRMED / WAITLISTED -> CANCELLED`, which inadvertently omitted `PENDING -> CANCELLED`.
- **Decision:**
  1. The complete lifecycle table is formally specified and enforced:
     - `PENDING` $\rightarrow$ `CONFIRMED`
     - `PENDING` $\rightarrow$ `WAITLISTED`
     - `PENDING` $\rightarrow$ `CANCELLED`
     - `CONFIRMED` $\rightarrow$ `CANCELLED`
     - `WAITLISTED` $\rightarrow$ `CONFIRMED`
     - `WAITLISTED` $\rightarrow$ `CANCELLED`
  2. Any transition outside this set is rejected with `IllegalTransitionException` in Java and SQL `SIGNAL SQLSTATE '45000'` in MySQL triggers.
- **Traceability:** Addresses Review Item 4, FR-R08, `trg_booking_status_guard`, Fixture R-07.

---

## 5. Canonical Stored Routine Naming and Script Organization

- **Context:** SRS v0.2 references routine names `book_seat`, `cancel_booking`, `promote_waitlist`, `book_group`, and `evaluate_case`. Additionally, SRS §7.1 specifies a numbered execution order.
- **Decision:**
  1. Stored routines adopt the exact canonical names specified in the SRS:
     - `book_seat`
     - `cancel_booking`
     - `promote_waitlist`
     - `book_group`
     - `evaluate_case`
     - `calculate_fare`
     - `occupancy_pct`
     - `run_invariants`
  2. MySQL scripts adopt the strict numbered sequence:
     - `mysql/00_reset.sql`
     - `mysql/01_tables.sql`
     - `mysql/02_seed.sql`
     - `mysql/03_views.sql`
     - `mysql/04_functions.sql`
     - `mysql/05_triggers.sql`
     - `mysql/06_procedures.sql`
     - `mysql/07_experiments.sql`
     - `mysql/08_invariants.sql`
     - `mysql/09_users.sql`
- **Traceability:** Addresses Review Item 5, Section 3 design adjustments.

---

## 6. Target Timeline vs Evidence-Driven Acceptance

- **Context:** The delivery window is targeted at 3 to 4 days across 4 gates.
- **Decision:**
  1. The 3 to 4 day timeline is explicitly a planning target, not a gate acceptance condition.
  2. No gate transition shall occur based merely on calendar time elapsed; each gate advances only when all technical checklists and concrete evidence artifacts are verified.
- **Traceability:** Addresses Review Item 6, Section 4 & 5.

---

## 7. PNR Uniqueness and Persistence Across Application Restarts (Review Item 2.A)

- **Context:** SRS §4 (FR-R02) mandates that PNRs are unique and never recycled across the entire system lifetime. An in-memory sequence in Java would reset upon JVM restart, risking duplicate PNR issuance across restarts.
- **Decision:**
  1. In Tier 1 (Java), `PnrGenerator` will use a persistent durable state mechanism. A sequence file `data/pnr_sequence.dat` tracks the highest issued sequence number. On startup, `PnrGenerator` reads this file; each issued PNR increments the counter and syncs/flushes to disk atomically.
  2. The PNR format will be deterministic and monotonic: `PNR-` followed by an 8-digit zero-padded number (e.g., `PNR-00000001`, `PNR-00000002`).
  3. If a transaction or savepoint aborts/rolls back, the allocated PNR is not rewound; the counter remains advanced, leaving a deliberate gap in the sequence.
  4. In Tier 2 (MySQL), PNR generation is backed by a dedicated sequence table `PNR_SEQUENCE` using `AUTO_INCREMENT` or atomic `LAST_INSERT_ID(id + 1)` updates, which naturally survives MySQL server restarts and guarantees monotonic non-recycled sequence generation.
- **Traceability:** Addresses Review 1.1 Item 2.A, FR-R02, Task T01, T05.

---

## 8. Dual-Barrier Synchronization for Unsafe Race Demonstration (Review Item 2.B)

- **Context:** To reliably prove that `UnsafeInventory` has a check-then-act race condition on the last seat, a single start gate before the booking call only guarantees concurrent thread startup, not that both threads read remaining capacity before either claims the seat.
- **Decision:**
  1. The test harness for `UnsafeInventory` in fixture `R-01` employs a **two-stage coordinated barrier**:
     - **Barrier 1 (`StartGate`):** Releases 2 concurrent worker threads simultaneously into `bookTicket()`.
     - **Inter-Check Staged Barrier (`ReadBarrier`):** In `UnsafeInventory`, immediately after reading `availableSeats = 1`, each thread signals its read and waits on a 2-party barrier before proceeding to the claim and decrement step.
  2. This forces both Thread 1 and Thread 2 to observe `availableSeats == 1` concurrently before either thread is allowed to mutate the inventory.
  3. Both threads then proceed to confirm bookings and decrement the counter, resulting in 2 confirmed bookings for a single physical seat (over-allocation recorded, reproducing the flaw deterministically).
  4. In `SafeInventory`, the entire check-and-claim block is enclosed in a single intrinsic monitor lock (`synchronized (journeyLock)`), preventing any other thread from observing or mutating inventory until the lock is released.
- **Traceability:** Addresses Review 1.1 Item 2.B, FR-R15, Fixture R-01, Task T08.

---

## 9. Transactional Boundary for Cross-Table Invariant Enforcement (Review Item 2.C)

- **Context:** Enforcing mutually-referencing constraints via immediate row-level triggers (e.g. "every confirmed booking must have an allocation" AND "every allocation must belong to a confirmed booking") causes circular dependency deadlocks during intermediate transaction steps: updating `BOOKING` first leaves it without an allocation, while inserting `SEAT_ALLOCATION` first fails because the booking is not yet `CONFIRMED`.
- **Decision:**
  1. Relational structural constraints are enforced via foreign keys and composite unique keys at the schema level:
     - `SEAT_ALLOCATION.booking_id` is a UNIQUE foreign key referencing `BOOKING(booking_id)`.
     - `SEAT_ALLOCATION.journey_seat_id` is a UNIQUE foreign key referencing `JOURNEY_SEAT(journey_seat_id)`.
     - `SEAT_ALLOCATION(passenger_id, journey_id)` is a composite UNIQUE key enforcing Invariant `INV-05`.
  2. Mutually-dependent transitions are orchestrated procedurally within atomic stored procedures (`book_seat`, `cancel_booking`, `promote_waitlist`):
     - In `book_seat`: the procedure creates the booking in state `PENDING`, verifies inventory under lock, inserts `SEAT_ALLOCATION`, and then updates status to `CONFIRMED` in the exact same transaction before `COMMIT`.
  3. Triggers enforce uni-directional guards:
     - `trg_allocation_guard`: An allocation row cannot be inserted if the referenced booking is in status `CANCELLED` or `WAITLISTED`.
     - `trg_waitlist_guard`: A waitlist row cannot be inserted if the referenced booking has status `CONFIRMED` or `CANCELLED`.
     - `trg_booking_status_guard`: Validates lifecycle state machine transitions.
  4. Post-transaction invariant suite (`08_invariants.sql` and procedure `run_invariants`) performs complete cross-table cardinality assertions (`INV-01` through `INV-07`) after every committed operation.
- **Traceability:** Addresses Review 1.1 Item 2.C, FR-R08, INV-01..INV-06, Task T16, T18, T20.

---

## 10. Lookup-and-Lock Pattern for Cancellation and Promotion (Review Item 2.D)

- **Context:** The global lock hierarchy is `JOURNEY` $\rightarrow$ `JOURNEY_CLASS` $\rightarrow$ `BOOKING` $\rightarrow$ `SEAT_ALLOCATION` $\rightarrow$ `WAITLIST_ENTRY`. However, `cancel_booking` starts with a PNR or `booking_id`, and `promote_waitlist` may be called internally or after cancellation. If `cancel_booking` locked `BOOKING` first and then attempted to acquire `JOURNEY`, it would violate lock hierarchy and risk deadlocks against concurrent bookings.
- **Decision:**
  1. In `cancel_booking(p_pnr)`:
     - **Step 1 (Lookup without mutation):** Read `booking_id`, `journey_id`, `journey_class_id`, and current `status` via read-only lookup (`LOCK IN SHARE MODE` or simple read).
     - **Step 2 (Hierarchical Lock Acquisition):** Acquire exclusive row locks in strict order:
       ```sql
       -- Lock parent JOURNEY
       SELECT journey_id FROM JOURNEY WHERE journey_id = v_journey_id FOR UPDATE;
       -- Lock child JOURNEY_CLASS
       SELECT journey_class_id FROM JOURNEY_CLASS WHERE journey_class_id = v_journey_class_id FOR UPDATE;
       -- Lock target BOOKING
       SELECT booking_id, status FROM BOOKING WHERE booking_id = v_booking_id FOR UPDATE;
       ```
     - **Step 3 (Mutation):** Release `SEAT_ALLOCATION`, update status to `CANCELLED`, insert `BOOKING_AUDIT`.
     - **Step 4 (Promotion):** Call `promote_waitlist(v_journey_class_id)` while still holding the parent journey and class locks.
  2. For multiple rows at the same level (e.g. scanning waitlist candidates in `promote_waitlist`), rows are ordered deterministically by `(booked_at ASC, booking_id ASC)`.
- **Traceability:** Addresses Review 1.1 Item 2.D, FR-R07, FR-R17, Task T19, T21, T22.

---

## 11. Staged In-Memory Commit Boundary for Java Audit Logging (Review Item 2.E)

- **Context:** In Tier 2, MySQL triggers write audit rows that automatically roll back if the transaction aborts. In Tier 1, direct file appends cannot be rolled back. Writing audit rows to disk before an operation successfully completes would create orphan audit records on failure.
- **Decision:**
  1. In Tier 1, an in-memory transactional commit boundary pattern is implemented:
     - `InMemoryBookingService` stages audit records in an in-memory thread-local or operation-scoped buffer during the operation.
     - Only when the entire booking or cancellation operation succeeds and all state mutations are validated against invariants, `AuditLogger.commit(auditEntry)` is called to append to the log file.
     - If any exception or invariant check fails during the operation, the staged audit entry is discarded without being written to disk.
  2. Tests will explicitly simulate failure after mutation to verify zero audit rows are committed on error.
- **Traceability:** Addresses Review 1.1 Item 2.E, FR-R11, INV-06, Task T04, T05.

---

## 12. Group Booking Savepoint Failure Injection Mechanics (Review Item 2.F)

- **Context:** Fixture `R-08` verifies that when Member 2 of a 3-member group booking fails, its PNR is consumed with a gap and all its mutations roll back to `SAVEPOINT member_2`, while Members 1 and 3 commit. If Member 2 fails before PNR allocation, no PNR gap is created to verify.
- **Decision:**
  1. The group booking procedure `book_group` executes in the following sequence for each member $i$:
     - Generate unique PNR for Member $i$ (PNR sequence increments).
     - Establish `SAVEPOINT sp_member_i`.
     - Insert `BOOKING` row with `pnr`, `passenger_id`, status `PENDING`, and shared `group_ref`.
     - For Member 2 in test fixture `R-08`, an intentional constraint violation is triggered *after* PNR allocation and booking insertion (e.g. attempting to allocate an already allocated seat or violating Invariant `INV-05`).
     - The exception handler catches the error and executes `ROLLBACK TO SAVEPOINT sp_member_2`.
  2. This cleanly unwinds Member 2's booking row and any partial side-effects, while Member 2's PNR remains permanently consumed and abandoned.
  3. Member 3 then generates the next PNR (e.g. Member 1 = `PNR-00000001`, Member 2 = `PNR-00000002` [rolled back], Member 3 = `PNR-00000003`), providing clear verifiable proof of the sequence gap.
- **Traceability:** Addresses Review 1.1 Item 2.F, FR-R02, FR-R18, Fixture R-08, Task T23.

---

## 13. Schema Inventory Reconciliation: 17 Tables (Review Gate 1 Reconcile)

- **Context:** The initial conceptual plan listed 16 tables. During Gate 1 implementation of ADR-7 (PNR persistence across restarts), a dedicated sequence table `PNR_SEQUENCE` was introduced.
- **Decision:**
  - The authoritative schema inventory comprises **17 InnoDB tables**:
    1. `TRAIN`
    2. `JOURNEY`
    3. `JOURNEY_CLASS`
    4. `JOURNEY_SEAT`
    5. `PASSENGER`
    6. `PNR_SEQUENCE` (Durable monotonic sequence table for ADR-7)
    7. `BOOKING`
    8. `SEAT_ALLOCATION`
    9. `WAITLIST_ENTRY`
    10. `BOOKING_AUDIT`
    11. `REFUND_RULE`
    12. `RULE_VERSION`
    13. `DISRUPTION_CASE`
    14. `CASE_EVENT`
    15. `CASE_EVALUATION`
    16. `CASE_EVALUATION_CODE`
    17. `CASE_EVALUATION_EVENT`
- **Traceability:** Aligns `01_tables.sql`, `IMPLEMENTATION_PLAN.md`, and Gate 1 schema deployment.

---

## 14. Routine and Script Delivery Schedule by Gate (Review Gate 1 Reconcile)

- **Context:** Clarify which stored routines and SQL scripts belong to which acceptance gate.
- **Decision:**
  - **Gate 1 (Foundations):**
    - Routines: `book_seat`, `cancel_booking`, `promote_waitlist`, `run_invariants`, `calculate_fare`, `occupancy_pct`.
    - Scripts: `00_reset.sql`, `01_tables.sql`, `02_seed.sql`, `03_views.sql`, `04_functions.sql`, `05_triggers.sql`, `06_procedures.sql`, `08_invariants.sql`, `tests/test_gate1_foundations.sql`.
  - **Gate 2 (Concurrency & Transactions):**
    - Routines: `book_group` (Savepoint multi-member booking with partial failure).
    - Scripts: `07_experiments.sql` (two-session lock test harness, group savepoint test), `09_users.sql` (least-privilege grant matrix), automated batch runners.
  - **Gate 3 (Disruption Refund Advisor & Parity):**
    - Routines: `evaluate_case` (policy evaluation engine), rule version interval matching, event filtering.
    - Scripts: `test_gate3_refund_parity.sql`, canonical JSON export queries.
- **Traceability:** Reconciles planned vs deployed artifacts across Gates 1, 2, and 3.

---

## 15. Invariant Verification Mapping (INV-01 through INV-07)

| Invariant | Formal Definition | Gate 1 Test Verification | Gate 2 Test Verification |
|---|---|---|---|
| **INV-01** | Confirmed $\le$ Total Seats per class | S-01, S-02, S-05, `08_invariants.sql` | Fixture R-02 (100 reps, 10 workers), `run_invariants` |
| **INV-02** | Seat Exclusivity (at most 1 alloc per seat) | S-01, S-04, `08_invariants.sql` | Fixture R-01 (shows failure in unsafe), R-02 (shows pass in safe) |
| **INV-03** | Status-Allocation Cardinality (CONFIRMED $\leftrightarrow$ 1 alloc) | S-01, S-02, S-04, S-05, `08_invariants.sql` | Fixture R-04, R-06, R-08, R-09 |
| **INV-04** | Waitlist Cardinality (WAITLISTED $\leftrightarrow$ 1 waitlist row) | S-02, S-04, S-05, `08_invariants.sql` | Fixture R-02, R-04, R-06 |
| **INV-05** | Passenger Single Confirmation per Journey | S-03 (duplicate rejected), `08_invariants.sql` | Fixture R-05 (ineligible waiter skipped), R-08 |
| **INV-06** | Audit Trail Completeness (committed bkg $\leftrightarrow$ audit rows) | S-01, S-02, S-04, `08_invariants.sql` | Fixture R-08, R-09 (zero uncommitted audit rows) |
| **INV-07** | Deterministic Waitlist Promotion Selection | S-04 (sequential promotion), FR-R17 test | Fixture R-04, R-05 (promotion under contention) |

## 16. ADR-16: Canonical Disruption Refund Evaluation Contract (Frozen)

### Context
Gate 3 requires implementing independent rule evaluators in Java OOP (Tier 1) and MySQL 8 Stored Procedures (Tier 2) and verifying byte-for-byte differential parity across standardized disruption fixtures (D-01 to D-14). Discrepancies in field names (e.g. `amount` vs `refundAmount`), timestamp formats, array ordering, or null handling would cause artificial parity failures.

### Decision
1. **Frozen Schema:** All evaluation engines emit JSON strictly matching `docs/CANONICAL_CONTRACT.md`.
2. **Canonical Field Names:** Use `refundAmount` (not `amount`), `fixtureId`, `ruleId`, `ruleFamily`, `ruleVersion`, `outcome`, `reasonCodes`, `warnings`, `deadlineAt`, `actionCode`, `currency`, and `disclaimer`.
3. **Deterministic Array Ordering:**
   - `reasonCodes`: Primary determination code at index 0, followed by secondary codes sorted alphabetically.
   - `warnings`: Sorted alphabetically.
4. **Monetary Precision:** Strings with exactly 2 decimal places and Half-Up rounding. Non-eligible outcomes always emit `"0.00"`.
5. **Clock Isolation:** Rule matching and event validity depend strictly on explicit fixture timestamps (`policyApplicabilityTime`, `evaluationTime`). `NOW()` and `currentTimeMillis()` are strictly prohibited in evaluation logic.

---

## 18. ADR-18: Adoption of Candidate SRS Revision 1.0 as Requirements Baseline

### Context
RailSync development throughout Gates 1–3 was planned and executed against SRS Revision 0.2 (24 October 2026). On 25 October 2026, the project received a candidate specification, `RailSync_SRS_Final.pdf` (Revision 1.0, 24 October 2026, 35 pages), authored by Soham More for CSC2104 (OOP in Java) and CSC2131 (RDBMS Lab) at Manipal University Jaipur.

A requirements-reconciliation audit of Revision 1.0 identified significant specification evolution from Revision 0.2:
1. **Relational Schema Consolidation:** Mandates exactly 15 InnoDB tables (merging rule versions, applicability intervals, and criteria directly into `REFUND_RULE`, guarded by a `BEFORE INSERT` overlap trigger `FR-D03`). This supersedes the 17-table model in active code (`PNR_SEQUENCE`, separate `REFUND_RULE_FAMILY` and `RULE_VERSION`).
2. **Invariant `INV-08` Added:** Introduces strict cross-table integrity between `SEAT_ALLOCATION`, `BOOKING`, and `JOURNEY_CLASS` (`journey_id` and `passenger_id` alignment).
3. **Refund Evaluation Decision Ordering:** Mandates that decisive negative criteria (delay $\le 180$ minutes, passenger travelled) must be evaluated strictly prior to filing-window deadlines.
4. **Prospective Refund Mode:** Introduces prospective evaluation for trains $>180$ minutes late that have not yet departed (`ACTUAL_DEPARTURE_PENDING`, action `FILE_TDR_BEFORE_ACTUAL_DEPARTURE`).
5. **Fixture Expansion:** Reservation fixtures expand from 10 to 15 (`R-01` through `R-15`); disruption refund fixtures expand from 14 to 17 (`D-01` through `D-17`).
6. **Tier 3 Web Extension Status:** Sections 2.1 and 16.1 explicitly designate the Next.js web application and Java HTTP API as **Future Scope (Deferred)**.

Crucially, Section 15 of Revision 1.0 contains eight unchecked prerequisite checkboxes (official CSC2104 course handout, faculty acceptance of MySQL for CSC2131, concurrency test harness sign-off, live IRCTC refund policy source review, etc.). The document itself does not contain instructor sign-off or external institutional verification.

### Decision
1. **Candidate Baseline Adoption:** Adopt SRS Revision 1.0 (`docs/srs/v1.0/RailSync_SRS_Final.pdf`, SHA-256 `B7C14EB4EFF4B20A6FBC291094BA533FFB8635B99E8A77E762244E4B2624DEE9`) as the **candidate authoritative requirements baseline** for RailSync requirements reconciliation and implementation planning.
2. **Document Status Classification:** Formally classify Revision 1.0 as a *candidate authoritative baseline for reconciliation*, not as a formally signed-off academic specification. The eight open prerequisites in Section 15 remain unresolved external dependencies.
3. **Historical Documentation Preservation:** Preserve the complete set of historical Revision 0.2 artifacts (`SRS_Source_v0.2.pdf`, `SRS.md`, `SRS_extracted.txt`) under `docs/srs/v0.2/` to maintain the audit trail for earlier Gate 1–3 development.
4. **Tier 3 Sequencing and Deferral:** In strict adherence to Revision 1.0 §2.1 and §16.1, Tier 3 (Next.js web UI and Java HTTP API) remains deferred. No web scaffolding or HTTP API coding is permitted until all Tier 1 (Java OOP) and Tier 2 (MySQL RDBMS) implementation, concurrency, transaction, and parity acceptance criteria have been verified against Revision 1.0.
5. **No Premature Compliance Claims:** Prior Gate 1–3 test runs and evidence logs demonstrate progress under SRS v0.2, but they do not constitute verified compliance with Revision 1.0. Full compliance may only be claimed after the code and schemas are updated to Revision 1.0 and tests are rerun against the expanded fixtures.
6. **Change Traceability Rule:** All future implementation changes, schema migrations, and test expansions must be traceable to a specific Revision 1.0 requirement ID (`INV-01`..`INV-08`, `BR-01`..`BR-10`, `FR-R01`..`FR-R20`, `FR-D01`..`FR-D11`, `NFR-01`..`NFR-11`, `R-01`..`R-15`, `D-01`..`D-17`) or an approved architectural decision.

### Traceability
- Supersedes the working status of SRS v0.1, v0.2, and v0.3 drafts.
- Governs requirements reconciliation and implementation planning for Milestones M1 through M4.


---

## 19. ADR-19: Schema Consolidation, PNR Column Width (VARCHAR(24)), and Relational Integrity (INV-08)

### Context
Milestone M1.3 implements the candidate SRS Revision 1.0 §6.1 relational model, consolidating the database into exactly 15 application tables:
`PASSENGER`, `TRAIN`, `JOURNEY`, `JOURNEY_CLASS`, `JOURNEY_SEAT`, `BOOKING`, `SEAT_ALLOCATION`, `WAITLIST_ENTRY`, `BOOKING_AUDIT`, `REFUND_RULE`, `DISRUPTION_CASE`, `CASE_EVENT`, `CASE_EVALUATION`, `CASE_EVALUATION_CODE`, and `CASE_EVALUATION_EVENT`.

During the design review, implementation, and closure audit for M1.3, the following technical and specification items were established:

1. **PNR Column Width Limitation (`VARCHAR(20)` vs `VARCHAR(24)`):**
   - Candidate SRS Revision 1.0 §6.1 specifies `pnr VARCHAR(20) UNIQUE`.
   - In accordance with Candidate SRS §6.1 and FR-R02, PNRs are derived directly from the `BOOKING` auto-increment `booking_id` using the format `PNR-%08d` (e.g. `PNR-00000001`).
   - The underlying `booking_id` is typed as `BIGINT`, supporting values up to $9,223,372,036,854,775,807$ (19 decimal digits).
   - When formatted, `PNR-` (4 characters) concatenated with up to 19 digits yields a string of up to 23 characters (e.g. `PNR-9223372036854775807`).
   - Inserting a 23-character string into `VARCHAR(20)` triggers MySQL error `1406 (22001)` (`Data too long for column 'pnr' at row 1`).
   - Truncating the generated string to 20 characters violates monotonicity and produces fatal key collisions (e.g. `PNR-10000000000000001` and `PNR-10000000000000002` both truncating to `PNR-1000000000000000`).
   - In InnoDB, `VARCHAR(20)` and `VARCHAR(24)` under utf8mb4 both utilize a single-byte length prefix (for column lengths $< 256$ bytes). Allocating `VARCHAR(24)` incurs zero physical storage or memory overhead for smaller strings while guaranteeing safety across the entire signed `BIGINT` range.

2. **Foreign-Key Structure and Relational Integrity (`INV-08`):**
   - Candidate SRS §6.1 declares `BOOKING` with `PRIMARY KEY (booking_id)` and `UNIQUE KEY (pnr)`. It does not declare a unique key over `(booking_id, journey_class_id, passenger_id)`.
   - Consequently, `SEAT_ALLOCATION` declares a single-column foreign key `fk_alloc_booking (booking_id) REFERENCES BOOKING(booking_id)`.
   - Composite foreign keys are declared where supported by unique keys in the physical model:
     - `fk_alloc_seat_composite`: `(journey_seat_id, journey_class_id) REFERENCES JOURNEY_SEAT(journey_seat_id, journey_class_id)`
     - `fk_alloc_jc_composite`: `(journey_class_id, journey_id) REFERENCES JOURNEY_CLASS(journey_class_id, journey_id)`
   - Because `fk_alloc_booking` references only `booking_id`, the DDL constraints alone do not prevent an allocation row from having a passenger or journey class that differs from its booking.
   - Candidate SRS §3.3 introduces Invariant `INV-08` to enforce this cross-table topological consistency. A robust verification query must traverse both paths simultaneously:
     - Path 1: `SEAT_ALLOCATION` -> `BOOKING` -> `JOURNEY_CLASS` (`b_jc`)
     - Path 2: `SEAT_ALLOCATION` -> `JOURNEY_SEAT` -> `JOURNEY_CLASS` (`s_jc`)
   - The join predicate verifies that `sa.passenger_id = b.passenger_id`, `sa.journey_id = b_jc.journey_id`, `sa.journey_id = s_jc.journey_id`, `b.journey_class_id = js.journey_class_id`, `b.status = 'CONFIRMED'`, and that no orphan allocation references exist.

3. **PNR Assignment Timing and Audit Purity:**
   - Candidate SRS FR-R02 mandates that a `PENDING` booking possesses a generated unique PNR.
   - Inserting `BOOKING` with `pnr = NULL` in status `PENDING`, capturing `LAST_INSERT_ID()`, deriving `PNR-%08d`, and immediately updating `pnr` before allocation or waitlist processing satisfies FR-R02.
   - Because the status remains `PENDING` during this update (`OLD.status = 'PENDING'` and `NEW.status = 'PENDING'`), the `trg_booking_audit_update` trigger does not fire, preserving audit trail purity (zero spurious audit entries).

4. **Refund-Rule Effective Interval Overlap Guard (FR-D03):**
   - Candidate SRS FR-D03 mandates: *"Enforce through a BEFORE INSERT trigger that no two active refund rules in the same family have overlapping effective intervals `[effective_from, effective_to)`. Adjacent intervals are permitted."*
   - The trigger `trg_refund_rule_overlap_guard` is implemented as a `BEFORE INSERT` trigger on `REFUND_RULE`. It evaluates half-open intervals `[effective_from, effective_to)` for active rules (`NEW.is_active = TRUE`), treating `effective_to IS NULL` as an open-ended interval.
   - Candidate SRS FR-D03 specifies only a `BEFORE INSERT` trigger; it does not specify a `BEFORE UPDATE` trigger.

### Decision
1. **15-Table Physical Schema:** Consolidate into exactly 15 application tables. Drop `PNR_SEQUENCE` and `RULE_VERSION`. Fold rule versioning directly into `REFUND_RULE` (`version`, `is_active`, `verified`, `threshold_minutes`, `refund_basis_pct`, `effective_from`, `effective_to`).
2. **PNR Column Definition (`VARCHAR(24)`):** Amend `BOOKING.pnr` from `VARCHAR(20)` to `VARCHAR(24) UNIQUE NOT NULL`. This is formally documented as a physical schema deviation from Candidate SRS §6.1. The frozen canonical contract `docs/CANONICAL_CONTRACT.md` remains untouched.
3. **Monotonic Formatting Implementation:** In all MySQL stored procedures (`book_seat`, `book_group`) and test scripts, generate PNRs via:
   `CONCAT('PNR-', LPAD(booking_id, GREATEST(8, LENGTH(booking_id)), '0'))`
   This preserves exact byte parity with Java's `String.format("PNR-%08d", id)` across all integer sizes from 1 to 2^63-1.
4. **Foreign-Key and Invariant Structure:**
   - `SEAT_ALLOCATION` maintains a single-column foreign key to `BOOKING(booking_id)` (matching Candidate SRS §6.1 declared keys), alongside composite foreign keys to `JOURNEY_SEAT(journey_seat_id, journey_class_id)` and `JOURNEY_CLASS(journey_class_id, journey_id)`.
   - Invariant `INV-08` is enforced across both `08_invariants.sql` and the `run_invariants` procedure using the dual-path join traversing both booking-class and physical seat-class relationships.
5. **Half-Open Effective Interval Trigger:** Enforce `trg_refund_rule_overlap_guard` as a `BEFORE INSERT` trigger on `REFUND_RULE` evaluating half-open intervals `[effective_from, effective_to)` among active rules in the same family. Treat `effective_to IS NULL` as open-ended, allow adjacent intervals (`r1.effective_to = r2.effective_from`), and reject active overlaps with SQLSTATE `45000`.
6. **Transaction Isolation & Savepoint Rollback Semantics:**
   - In group booking (`book_group`), recoverable member failures execute `ROLLBACK TO SAVEPOINT sp_member_2; SET p_member2_rolled_back = TRUE;` allowing subsequent members to proceed.
   - Auto-increment IDs consumed by rolled-back members are burned, creating intentional sequence gaps.
   - Unexpected SQL/infrastructure errors are caught by `DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;`, rolling back the outer transaction and re-signalling the exception.

### Evidence & Database Integrity Note
- **Disposable Database (`railsync_m1_isolated_test`):** During M1.3 validation script testing, a cleanup operation executed `TRUNCATE TABLE BOOKING_AUDIT` in `railsync_m1_isolated_test`. Pre-existing rows in that table were removed; consequently, historical audit records prior to that test step in this disposable database cannot be treated as intact evidence. All subsequent tests independently verified fresh audit insertion, status transition logging, and rollback omission against newly created bookings.

### Traceability
- Candidate SRS Revision 1.0 §6.1, FR-R02, FR-D03, INV-08.
- Amends ADR-7 and ADR-14 with respect to MySQL sequence table removal and PNR column width.
