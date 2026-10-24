-- ============================================================================
-- 08_invariants.sql: Standalone Invariant Verification Queries
-- Evaluates INV-01 through INV-08 against current database state
-- ============================================================================

USE railsync;

SELECT '--- Evaluating Invariant INV-01: Confirmed <= Total Seats ---' AS InvariantCheck;
SELECT jc.journey_class_id, jc.class_code, jc.total_seats, COUNT(sa.allocation_id) AS confirmed_seats,
       CASE WHEN COUNT(sa.allocation_id) <= jc.total_seats THEN 'PASS' ELSE 'FAIL (INV-01 VIOLATION)' END AS result
FROM JOURNEY_CLASS jc
LEFT JOIN JOURNEY_SEAT js ON jc.journey_class_id = js.journey_class_id
LEFT JOIN SEAT_ALLOCATION sa ON js.journey_seat_id = sa.journey_seat_id
GROUP BY jc.journey_class_id, jc.class_code, jc.total_seats;

SELECT '--- Evaluating Invariant INV-02: Seat Exclusivity ---' AS InvariantCheck;
SELECT journey_seat_id, COUNT(*) AS allocation_count,
       CASE WHEN COUNT(*) <= 1 THEN 'PASS' ELSE 'FAIL (INV-02 VIOLATION)' END AS result
FROM SEAT_ALLOCATION
GROUP BY journey_seat_id
HAVING allocation_count > 1;

SELECT '--- Evaluating Invariant INV-03: Status-Allocation Cardinality ---' AS InvariantCheck;
SELECT b.booking_id, b.pnr, b.status, COUNT(sa.allocation_id) AS alloc_count,
       CASE
         WHEN b.status = 'CONFIRMED' AND COUNT(sa.allocation_id) = 1 THEN 'PASS'
         WHEN b.status <> 'CONFIRMED' AND COUNT(sa.allocation_id) = 0 THEN 'PASS'
         ELSE 'FAIL (INV-03 VIOLATION)'
       END AS result
FROM BOOKING b
LEFT JOIN SEAT_ALLOCATION sa ON b.booking_id = sa.booking_id
GROUP BY b.booking_id, b.pnr, b.status
HAVING result LIKE 'FAIL%';

SELECT '--- Evaluating Invariant INV-04: Waitlist Cardinality ---' AS InvariantCheck;
SELECT b.booking_id, b.pnr, b.status, COUNT(we.waitlist_id) AS wl_count,
       CASE
         WHEN b.status = 'WAITLISTED' AND COUNT(we.waitlist_id) = 1 THEN 'PASS'
         WHEN b.status <> 'WAITLISTED' AND COUNT(we.waitlist_id) = 0 THEN 'PASS'
         ELSE 'FAIL (INV-04 VIOLATION)'
       END AS result
FROM BOOKING b
LEFT JOIN WAITLIST_ENTRY we ON b.booking_id = we.booking_id
GROUP BY b.booking_id, b.pnr, b.status
HAVING result LIKE 'FAIL%';

SELECT '--- Evaluating Invariant INV-05: Passenger Single Confirmation per Journey ---' AS InvariantCheck;
SELECT passenger_id, journey_id, COUNT(*) AS confirmed_count,
       CASE WHEN COUNT(*) <= 1 THEN 'PASS' ELSE 'FAIL (INV-05 VIOLATION)' END AS result
FROM SEAT_ALLOCATION
GROUP BY passenger_id, journey_id
HAVING confirmed_count > 1;

SELECT '--- Evaluating Invariant INV-06: Audit Trail Completeness ---' AS InvariantCheck;
SELECT b.booking_id, b.pnr, b.status, COUNT(ba.audit_id) AS audit_entries,
       CASE WHEN COUNT(ba.audit_id) >= 1 THEN 'PASS' ELSE 'FAIL (INV-06 VIOLATION)' END AS result
FROM BOOKING b
LEFT JOIN BOOKING_AUDIT ba ON b.booking_id = ba.booking_id
GROUP BY b.booking_id, b.pnr, b.status
HAVING result LIKE 'FAIL%';

SELECT '--- Evaluating Invariant INV-07: Waitlist Ordering & Cross-State Invariant ---' AS InvariantCheck;
SELECT journey_class_id, waitlist_position, COUNT(*) AS dup_pos_count,
       'FAIL (INV-07 DUPLICATE POSITION)' AS result
FROM WAITLIST_ENTRY
GROUP BY journey_class_id, waitlist_position
HAVING dup_pos_count > 1;

SELECT sa.passenger_id, sa.journey_id, 'FAIL (INV-07 CONFIRMED AND WAITLISTED ON SAME JOURNEY)' AS result
FROM SEAT_ALLOCATION sa
JOIN BOOKING b_wl ON sa.passenger_id = b_wl.passenger_id AND b_wl.status = 'WAITLISTED'
JOIN JOURNEY_CLASS jc ON b_wl.journey_class_id = jc.journey_class_id AND jc.journey_id = sa.journey_id;

SELECT '--- Evaluating Invariant INV-08: Cross-Table Allocation & Journey Consistency ---' AS InvariantCheck;
SELECT sa.allocation_id, sa.booking_id, sa.journey_seat_id, sa.passenger_id, sa.journey_id,
       CASE
         WHEN b.booking_id IS NULL THEN 'FAIL (INV-08 ORPHAN BOOKING)'
         WHEN js.journey_seat_id IS NULL THEN 'FAIL (INV-08 ORPHAN SEAT)'
         WHEN b_jc.journey_class_id IS NULL THEN 'FAIL (INV-08 ORPHAN BOOKING CLASS)'
         WHEN s_jc.journey_class_id IS NULL THEN 'FAIL (INV-08 ORPHAN SEAT CLASS)'
         WHEN sa.passenger_id <> b.passenger_id THEN 'FAIL (INV-08 PASSENGER MISMATCH)'
         WHEN sa.journey_id <> b_jc.journey_id THEN 'FAIL (INV-08 BOOKING JOURNEY MISMATCH)'
         WHEN sa.journey_id <> s_jc.journey_id THEN 'FAIL (INV-08 SEAT JOURNEY MISMATCH)'
         WHEN b.journey_class_id <> js.journey_class_id THEN 'FAIL (INV-08 CLASS MISMATCH)'
         WHEN b.status <> 'CONFIRMED' THEN 'FAIL (INV-08 STATUS NOT CONFIRMED)'
         ELSE 'PASS'
       END AS result
FROM SEAT_ALLOCATION sa
LEFT JOIN BOOKING b ON sa.booking_id = b.booking_id
LEFT JOIN JOURNEY_CLASS b_jc ON b.journey_class_id = b_jc.journey_class_id
LEFT JOIN JOURNEY_SEAT js ON sa.journey_seat_id = js.journey_seat_id
LEFT JOIN JOURNEY_CLASS s_jc ON js.journey_class_id = s_jc.journey_class_id
HAVING result LIKE 'FAIL%';
