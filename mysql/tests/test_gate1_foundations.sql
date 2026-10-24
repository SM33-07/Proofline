-- ============================================================================
-- test_gate1_foundations.sql: Gate 1 Sequential Acceptance Tests in MySQL
-- Tests Scenarios S-01 through S-05, lifecycle guards, and invariants
-- ============================================================================

USE railsync;

SELECT '===================================================' AS Header;
SELECT 'STARTING GATE 1 FOUNDATIONS ACCEPTANCE TEST SUITE' AS Header;
SELECT '===================================================' AS Header;

-- ============================================================================
-- TEST S-01: Happy Path Booking in Sleeper Class (Class 1, 5 seats)
-- ============================================================================
SELECT '--- TEST S-01: Happy Path Booking in Sleeper ---' AS Test;
CALL book_seat(1, 1, 'GRP-SQL-01', @pnr1, @status1, @bid1);
SELECT @pnr1 AS issued_pnr, @status1 AS booking_status, @bid1 AS booking_id;

-- Verify S-01 Allocation & Audit
SELECT allocation_id, booking_id, journey_seat_id, passenger_id, journey_id, allocated_at 
FROM SEAT_ALLOCATION WHERE booking_id = @bid1;

SELECT audit_id, booking_id, from_status, to_status, reason, changed_at, changed_by 
FROM BOOKING_AUDIT WHERE booking_id = @bid1;

-- ============================================================================
-- TEST S-02: Overflow to Waitlist on 1-Seat AC Class (Class 2, 1 seat)
-- ============================================================================
SELECT '--- TEST S-02: Overflow to Waitlist on 1-Seat Class ---' AS Test;
CALL book_seat(2, 2, NULL, @pnr2a, @status2a, @bid2a);
SELECT @pnr2a AS first_ac_pnr, @status2a AS first_ac_status;

CALL book_seat(2, 3, NULL, @pnr2b, @status2b, @bid2b);
SELECT @pnr2b AS second_ac_pnr, @status2b AS second_ac_status;

SELECT waitlist_id, booking_id, journey_class_id, waitlist_position, created_at 
FROM WAITLIST_ENTRY WHERE booking_id = @bid2b;

-- ============================================================================
-- TEST S-03: Cross-Class Duplicate Confirmation Rejection (INV-05)
-- ============================================================================
SELECT '--- TEST S-03: Cross-Class Duplicate Confirmation Rejection (INV-05) ---' AS Test;
-- Passenger 1 is already CONFIRMED in Sleeper (Journey 101).
-- In Journey 102 (Train 2, Sleeper class 4 has 5 seats free).
-- Attempt to book Passenger 1 on Journey 101 in another class when free seat exists:
-- We can test on Journey 101 Sleeper (which has 4 seats free):
-- Booking Passenger 1 AGAIN on Journey 101 must be rejected by INV-05!
SELECT 'Verifying that Passenger 1 cannot hold 2 confirmed seats on Journey 101:' AS Description;
-- We verify via an inline procedure that catches the expected INV-05 error
DELIMITER $$
DROP PROCEDURE IF EXISTS test_inv05_duplicate$$
CREATE PROCEDURE test_inv05_duplicate(OUT p_caught BOOLEAN)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET p_caught = TRUE;
    SET p_caught = FALSE;
    CALL book_seat(1, 1, NULL, @dummy_pnr, @dummy_status, @dummy_bid);
END$$
DELIMITER ;

CALL test_inv05_duplicate(@inv05_caught);
SELECT CASE WHEN @inv05_caught THEN 'PASS (INV-05 Duplicate Caught & Rejected)' ELSE 'FAIL' END AS inv05_test_result;
DROP PROCEDURE IF EXISTS test_inv05_duplicate;

-- ============================================================================
-- TEST S-04: Cancellation with Cascade Waitlist Promotion
-- ============================================================================
SELECT '--- TEST S-04: Cancellation with Cascade Waitlist Promotion ---' AS Test;
-- In AC Class 2, @pnr2a (Passenger 2) is CONFIRMED, and @pnr2b (Passenger 3) is WAITLISTED.
-- Cancel @pnr2a:
CALL cancel_booking(@pnr2a, @cancelled_status);
SELECT @pnr2a AS cancelled_pnr, @cancelled_status AS old_status;

-- Verify that Booking @bid2b (Passenger 3) was automatically promoted to CONFIRMED!
SELECT booking_id, pnr, passenger_id, status FROM BOOKING WHERE booking_id = @bid2b;
SELECT allocation_id, booking_id, journey_seat_id, passenger_id, journey_id FROM SEAT_ALLOCATION WHERE booking_id = @bid2b;
SELECT COUNT(*) AS remaining_waitlist_count FROM WAITLIST_ENTRY WHERE journey_class_id = 2;

-- ============================================================================
-- TEST S-05: Booking into Zero-Seat General Class (Class 3, 0 seats)
-- ============================================================================
SELECT '--- TEST S-05: Booking into Zero-Seat General Class ---' AS Test;
CALL book_seat(3, 4, NULL, @pnr_gn, @status_gn, @bid_gn);
SELECT @pnr_gn AS gn_pnr, @status_gn AS gn_status;
SELECT waitlist_id, booking_id, journey_class_id, waitlist_position FROM WAITLIST_ENTRY WHERE booking_id = @bid_gn;

-- ============================================================================
-- COMPREHENSIVE INVARIANT VERIFICATION
-- ============================================================================
SELECT '===================================================' AS Header;
SELECT 'EVALUATING INVARIANTS AFTER SEQUENTIAL ACCEPTANCE' AS Header;
SELECT '===================================================' AS Header;
CALL run_invariants(@total_violations);
SELECT @total_violations AS final_violation_count;
