-- ============================================================================
-- 02_seed.sql: Canonical Seed Data for Reservation & Disruption Advisor
-- ============================================================================

USE railsync;

-- Trains
INSERT INTO TRAIN (train_id, train_number, train_name) VALUES
(1, '12951', 'Rajdhani Express'),
(2, '12953', 'August Kranti Tejas');

-- Journeys
INSERT INTO JOURNEY (journey_id, train_id, departure_date, scheduled_departure_time, distance_km, status) VALUES
(101, 1, '2026-11-01', '16:55:00', 1384.00, 'SCHEDULED'),
(102, 2, '2026-11-01', '17:15:00', 1378.00, 'SCHEDULED');

-- Journey Classes for Journey 101
-- Class 1: Sleeper (5 seats)
-- Class 2: AC 3-Tier (1 seat for contention/overflow)
-- Class 3: General (0 seats for zero-capacity test)
INSERT INTO JOURNEY_CLASS (journey_class_id, journey_id, class_code, total_seats, base_fare_inr) VALUES
(1, 101, 'SL', 5, 550.00),
(2, 101, '3A', 1, 1450.00),
(3, 101, 'GN', 0, 180.00),
(4, 102, 'SL', 5, 540.00);

-- Seats for Journey 101 Class 1 (SL - 5 seats)
INSERT INTO JOURNEY_SEAT (journey_seat_id, journey_class_id, seat_number, berth_type) VALUES
(101, 1, 'S1', 'LOWER'),
(102, 1, 'S2', 'MIDDLE'),
(103, 1, 'S3', 'UPPER'),
(104, 1, 'S4', 'SIDE_LOWER'),
(105, 1, 'S5', 'SIDE_UPPER');

-- Seat for Journey 101 Class 2 (3A - 1 seat)
INSERT INTO JOURNEY_SEAT (journey_seat_id, journey_class_id, seat_number, berth_type) VALUES
(201, 2, 'B1-1', 'LOWER');


-- Seats for Journey 102 Class 4 (SL - 5 seats)
INSERT INTO JOURNEY_SEAT (journey_seat_id, journey_class_id, seat_number, berth_type) VALUES
(401, 4, 'S1', 'LOWER'),
(402, 4, 'S2', 'MIDDLE'),
(403, 4, 'S3', 'UPPER'),
(404, 4, 'S4', 'SIDE_LOWER'),
(405, 4, 'S5', 'SIDE_UPPER');

-- Passengers
INSERT INTO PASSENGER (passenger_id, full_name, email, phone) VALUES
(1, 'Soham More', 'soham@example.com', '9876543210'),
(2, 'Rahul Sharma', 'rahul@example.com', '9876543211'),
(3, 'Ananya Verma', 'ananya@example.com', '9876543212'),
(4, 'Priya Singh', 'priya@example.com', '9876543213'),
(5, 'Vikram Malhotra', 'vikram@example.com', '9876543214');

-- Refund Rules
INSERT INTO REFUND_RULE (rule_id, rule_code, rule_family, description) VALUES
(1, 'IRCTC_RULE_6_LATE_3H', 'LATE_OVER_3_HOURS_E_TICKET', 'Refund on train late over 3 hours at boarding station'),
(2, 'IRCTC_RULE_5A_CANCEL', 'TRAIN_CANCELLED_E_TICKET', 'Automatic refund on train officially cancelled'),
(3, 'UNVERIFIED_TEST_RULE', 'UNVERIFIED_FAMILY', 'Synthetic rule lacking official verification');

-- Rule Versions
INSERT INTO RULE_VERSION (rule_version_id, rule_id, version_number, effective_from, effective_to, source_url, source_section, source_checked_on, verified, threshold_minutes, refund_basis_pct, is_active) VALUES
(1, 1, 1, '2026-01-01 00:00:00', '2026-06-30 23:59:59', 'https://www.irctc.co.in/eticketing/refundrules.jsf', 'Clause 6', '2026-10-24', TRUE, 180, 100.00, TRUE),
(2, 1, 2, '2026-07-01 00:00:00', NULL, 'https://www.irctc.co.in/eticketing/refundrules.jsf', 'Clause 6 (v2)', '2026-10-24', TRUE, 180, 100.00, TRUE),
(3, 2, 1, '2026-01-01 00:00:00', NULL, 'https://www.irctc.co.in/eticketing/refundrules.jsf', 'Clause 5(a)', '2026-10-24', TRUE, 0, 100.00, TRUE),
(4, 3, 1, '2026-01-01 00:00:00', NULL, 'https://example.com/unverified', 'Section 9', '2026-10-24', FALSE, 180, 100.00, TRUE);

