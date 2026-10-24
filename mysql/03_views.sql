-- ============================================================================
-- 03_views.sql: Reporting and Updatable Views
-- ============================================================================

USE railsync;

-- View 1: Journey Occupancy View
CREATE OR REPLACE VIEW v_journey_occupancy AS
SELECT 
    j.journey_id,
    t.train_number,
    t.train_name,
    j.departure_date,
    jc.journey_class_id,
    jc.class_code,
    jc.total_seats,
    COUNT(sa.allocation_id) AS confirmed_seats,
    (jc.total_seats - COUNT(sa.allocation_id)) AS available_seats,
    ROUND((COUNT(sa.allocation_id) / NULLIF(jc.total_seats, 0)) * 100, 2) AS occupancy_pct
FROM JOURNEY j
JOIN TRAIN t ON j.train_id = t.train_id
JOIN JOURNEY_CLASS jc ON j.journey_id = jc.journey_id
LEFT JOIN JOURNEY_SEAT js ON jc.journey_class_id = js.journey_class_id
LEFT JOIN SEAT_ALLOCATION sa ON js.journey_seat_id = sa.journey_seat_id
GROUP BY j.journey_id, t.train_number, t.train_name, j.departure_date, jc.journey_class_id, jc.class_code, jc.total_seats;

-- View 2: Deterministic FIFO Waitlist Order View (FR-R06)
CREATE OR REPLACE VIEW v_waitlist_order AS
SELECT 
    we.waitlist_id,
    we.journey_class_id,
    we.waitlist_position,
    b.booking_id,
    b.pnr,
    p.passenger_id,
    p.full_name AS passenger_name,
    b.booked_at
FROM WAITLIST_ENTRY we
JOIN BOOKING b ON we.booking_id = b.booking_id
JOIN PASSENGER p ON b.passenger_id = p.passenger_id
ORDER BY we.journey_class_id ASC, we.waitlist_position ASC, b.booked_at ASC, b.booking_id ASC;

-- View 3: Latest Disruption Case Evaluation View
CREATE OR REPLACE VIEW v_latest_case_evaluation AS
SELECT 
    ce.evaluation_id,
    ce.case_id,
    ce.rule_version_id,
    ce.evaluation_time,
    ce.outcome,
    ce.deadline_action,
    ce.refund_amount_inr,
    ce.disclaimer,
    ce.created_at
FROM CASE_EVALUATION ce
INNER JOIN (
    SELECT case_id, MAX(evaluation_time) AS max_time
    FROM CASE_EVALUATION
    GROUP BY case_id
) latest ON ce.case_id = latest.case_id AND ce.evaluation_time = latest.max_time;

-- View 4: Appropriately Updatable View for Passenger Contact Updates
CREATE OR REPLACE VIEW v_passenger_contacts AS
SELECT 
    passenger_id,
    full_name,
    email,
    phone
FROM PASSENGER;
