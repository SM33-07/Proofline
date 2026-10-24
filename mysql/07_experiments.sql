-- ============================================================================
-- 07_experiments.sql: Concurrency Lock-First & Savepoint Rollback Experiments
-- RailSync Gate 2 Delivery (FR-R18, Fixtures R-03, R-08, R-09)
-- ============================================================================

USE railsync;

SELECT '===================================================' AS Header;
SELECT 'STARTING GATE 2 MYSQL EXPERIMENTS' AS Header;
SELECT '===================================================' AS Header;

-- ============================================================================
-- EXPERIMENT 1: Group Booking with Savepoint Rollback (Fixture R-08)
-- 3 members; member 2 fails after PNR allocation and booking insert.
-- Rollback to savepoint: Member 1 & 3 committed; Member 2 removed; PNR gap verified.
-- ============================================================================
SELECT '--- EXPERIMENT 1: Group Booking Savepoint Rollback (Fixture R-08) ---' AS Experiment;

START TRANSACTION;

CALL book_group(
    4,                  -- journey_class_id 4 (Journey 102 Sleeper, 5 seats available)
    1,                  -- Member 1: Passenger 1
    2,                  -- Member 2: Passenger 2 (will fail)
    3,                  -- Member 3: Passenger 3
    TRUE,               -- Inject member 2 failure
    'GRP-SAVEPOINT-TEST',
    @pnr1, @pnr2, @pnr3, @rolled_back
);

COMMIT;

SELECT @pnr1 AS member1_pnr, @pnr2 AS member2_pnr_failed, @pnr3 AS member3_pnr, @rolled_back AS member2_rolled_back_flag;

-- Verify Committed State for Group Members
SELECT 'Committed Bookings for Group GRP-SAVEPOINT-TEST:' AS CheckDescription;
SELECT booking_id, pnr, passenger_id, status, group_ref FROM BOOKING WHERE group_ref = 'GRP-SAVEPOINT-TEST';

-- Verify Seat Allocations (Should only exist for Members 1 and 3)
SELECT 'Committed Seat Allocations for Group:' AS CheckDescription;
SELECT sa.allocation_id, b.pnr, sa.passenger_id, sa.journey_seat_id 
FROM SEAT_ALLOCATION sa
JOIN BOOKING b ON sa.booking_id = b.booking_id
WHERE b.group_ref = 'GRP-SAVEPOINT-TEST';

-- Verify Booking Audit Rows (Zero audit rows for failed Member 2)
SELECT 'Committed Audit Rows for Group:' AS CheckDescription;
SELECT ba.audit_id, b.pnr, ba.from_status, ba.to_status, ba.reason 
FROM BOOKING_AUDIT ba
JOIN BOOKING b ON ba.booking_id = b.booking_id
WHERE b.group_ref = 'GRP-SAVEPOINT-TEST';

-- Verify PNR Sequence Gap: Member 2 PNR must NOT exist in BOOKING table
SELECT 'Verifying PNR sequence gap for discarded Member 2 PNR:' AS CheckDescription;
SELECT CASE 
    WHEN NOT EXISTS (SELECT 1 FROM BOOKING WHERE pnr = @pnr2) THEN 'PASS: Member 2 PNR is absent from BOOKING table (Sequence Gap Preserved)'
    ELSE 'FAIL: Member 2 PNR exists'
END AS pnr_gap_verification;

-- ============================================================================
-- EXPERIMENT 2: SQL Error Atomicity & Total Rollback (Fixture R-09)
-- Any unhandled failure causes full rollback: zero rows, zero audit, PNR consumed
-- ============================================================================
SELECT '--- EXPERIMENT 2: SQL Error Atomicity & Total Rollback (Fixture R-09) ---' AS Experiment;

START TRANSACTION;
INSERT INTO PNR_SEQUENCE () VALUES ();
SET @r09_seq = LAST_INSERT_ID();
SET @r09_pnr = CONCAT('PNR-', LPAD(@r09_seq, 8, '0'));

-- Insert booking
INSERT INTO BOOKING (pnr, journey_class_id, passenger_id, status, fare_inr, group_ref)
VALUES (@r09_pnr, 1, 4, 'PENDING', 550.00, 'GRP-FAIL-TEST');

-- Simulate fatal error: trigger explicit rollback
ROLLBACK;

SELECT 'Verifying total rollback leaves zero traces in BOOKING and BOOKING_AUDIT:' AS CheckDescription;
SELECT COUNT(*) AS booking_count_after_rollback FROM BOOKING WHERE pnr = @r09_pnr;
SELECT COUNT(*) AS audit_count_after_rollback FROM BOOKING_AUDIT WHERE booking_id NOT IN (SELECT booking_id FROM BOOKING);

-- Next PNR allocation to verify PNR gap:
INSERT INTO PNR_SEQUENCE () VALUES ();
SET @r09_next_seq = LAST_INSERT_ID();
SET @r09_next_pnr = CONCAT('PNR-', LPAD(@r09_next_seq, 8, '0'));

SELECT @r09_pnr AS rolled_back_pnr, @r09_next_pnr AS subsequent_pnr;
