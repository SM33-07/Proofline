-- ============================================================================
-- 06_procedures.sql: Canonical Stored Procedures
-- Implements book_seat, cancel_booking, promote_waitlist, run_invariants
-- Strict Lock Hierarchy: JOURNEY -> JOURNEY_CLASS -> BOOKING (ADR-2, ADR-10)
-- ============================================================================

USE railsync;

DELIMITER $$

-- Procedure 1: book_seat
DROP PROCEDURE IF EXISTS book_seat$$
CREATE PROCEDURE book_seat(
    IN p_journey_class_id BIGINT,
    IN p_passenger_id BIGINT,
    IN p_group_ref VARCHAR(50),
    OUT p_pnr VARCHAR(20),
    OUT p_status VARCHAR(20),
    OUT p_booking_id BIGINT
)
proc_label: BEGIN
    DECLARE v_journey_id BIGINT;
    DECLARE v_total_seats INT;
    DECLARE v_confirmed_count INT;
    DECLARE v_dummy BIGINT;
    DECLARE v_fare DECIMAL(10,2);
    DECLARE v_seat_id BIGINT DEFAULT NULL;
    DECLARE v_next_pos INT DEFAULT 1;
    DECLARE v_pnr_seq BIGINT;

    -- Step 1: Lookup parent journey_id
    SELECT journey_id INTO v_journey_id 
    FROM JOURNEY_CLASS 
    WHERE journey_class_id = p_journey_class_id;

    IF v_journey_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid journey class ID';
    END IF;

    -- Step 2: MANDATORY HIERARCHICAL LOCK ORDERING (ADR-2)
    -- Lock 1: Parent JOURNEY row
    SELECT journey_id INTO v_dummy 
    FROM JOURNEY 
    WHERE journey_id = v_journey_id 
    FOR UPDATE;

    -- Lock 2: Child JOURNEY_CLASS row
    SELECT total_seats, base_fare_inr INTO v_total_seats, v_fare
    FROM JOURNEY_CLASS 
    WHERE journey_class_id = p_journey_class_id 
    FOR UPDATE;

    -- Step 3: Count current confirmed allocations in this class
    SELECT COUNT(*) INTO v_confirmed_count
    FROM SEAT_ALLOCATION sa
    JOIN JOURNEY_SEAT js ON sa.journey_seat_id = js.journey_seat_id
    WHERE js.journey_class_id = p_journey_class_id;

    -- Step 4: Allocate monotonic non-recycling PNR
    INSERT INTO PNR_SEQUENCE () VALUES ();
    SET v_pnr_seq = LAST_INSERT_ID();
    SET p_pnr = CONCAT('PNR-', LPAD(v_pnr_seq, 8, '0'));

    -- Step 5: Check Capacity & Invariants
    IF v_confirmed_count < v_total_seats THEN
        -- Capacity available: Check INV-05 (Single CONFIRMED per passenger per journey)
        IF EXISTS (SELECT 1 FROM SEAT_ALLOCATION WHERE passenger_id = p_passenger_id AND journey_id = v_journey_id) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-05 violation: Passenger already confirmed on this journey';
        END IF;

        -- Find next available seat in class
        SELECT js.journey_seat_id INTO v_seat_id
        FROM JOURNEY_SEAT js
        LEFT JOIN SEAT_ALLOCATION sa ON js.journey_seat_id = sa.journey_seat_id
        WHERE js.journey_class_id = p_journey_class_id AND sa.allocation_id IS NULL
        LIMIT 1;

        -- Create booking as PENDING
        INSERT INTO BOOKING (pnr, journey_class_id, passenger_id, status, fare_inr, group_ref)
        VALUES (p_pnr, p_journey_class_id, p_passenger_id, 'PENDING', v_fare, p_group_ref);
        SET p_booking_id = LAST_INSERT_ID();

        -- Transition PENDING -> CONFIRMED
        UPDATE BOOKING SET status = 'CONFIRMED' WHERE booking_id = p_booking_id;
        SET p_status = 'CONFIRMED';

        -- Create seat allocation
        INSERT INTO SEAT_ALLOCATION (booking_id, journey_seat_id, passenger_id, journey_id)
        VALUES (p_booking_id, v_seat_id, p_passenger_id, v_journey_id);

    ELSE
        -- Class is full or zero-seat: route to WAITLISTED
        INSERT INTO BOOKING (pnr, journey_class_id, passenger_id, status, fare_inr, group_ref)
        VALUES (p_pnr, p_journey_class_id, p_passenger_id, 'PENDING', v_fare, p_group_ref);
        SET p_booking_id = LAST_INSERT_ID();

        -- Determine next waitlist position
        SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO v_next_pos
        FROM WAITLIST_ENTRY
        WHERE journey_class_id = p_journey_class_id;

        INSERT INTO WAITLIST_ENTRY (booking_id, journey_class_id, waitlist_position)
        VALUES (p_booking_id, p_journey_class_id, v_next_pos);

        -- Transition PENDING -> WAITLISTED
        UPDATE BOOKING SET status = 'WAITLISTED' WHERE booking_id = p_booking_id;
        SET p_status = 'WAITLISTED';
    END IF;

END$$

-- Procedure 2: cancel_booking (Lookup-and-lock pattern ADR-10)
DROP PROCEDURE IF EXISTS cancel_booking$$
CREATE PROCEDURE cancel_booking(
    IN p_pnr VARCHAR(20),
    OUT p_old_status VARCHAR(20)
)
BEGIN
    DECLARE v_booking_id BIGINT;
    DECLARE v_journey_class_id BIGINT;
    DECLARE v_journey_id BIGINT;
    DECLARE v_dummy BIGINT;

    -- Step 1: Read lookup fields without mutating
    SELECT booking_id, journey_class_id, status INTO v_booking_id, v_journey_class_id, p_old_status
    FROM BOOKING 
    WHERE pnr = p_pnr;

    IF v_booking_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking not found for PNR';
    END IF;

    SELECT journey_id INTO v_journey_id 
    FROM JOURNEY_CLASS 
    WHERE journey_class_id = v_journey_class_id;

    -- Step 2: Strict Lock Hierarchy (JOURNEY -> JOURNEY_CLASS -> BOOKING)
    SELECT journey_id INTO v_dummy FROM JOURNEY WHERE journey_id = v_journey_id FOR UPDATE;
    SELECT journey_class_id INTO v_dummy FROM JOURNEY_CLASS WHERE journey_class_id = v_journey_class_id FOR UPDATE;
    SELECT booking_id INTO v_dummy FROM BOOKING WHERE booking_id = v_booking_id FOR UPDATE;

    -- Step 3: Handle Status
    IF p_old_status = 'CONFIRMED' THEN
        -- Delete allocation first
        DELETE FROM SEAT_ALLOCATION WHERE booking_id = v_booking_id;
        -- Transition CONFIRMED -> CANCELLED
        UPDATE BOOKING SET status = 'CANCELLED' WHERE booking_id = v_booking_id;
        -- Trigger waitlist promotion
        CALL promote_waitlist(v_journey_class_id);

    ELSEIF p_old_status = 'WAITLISTED' THEN
        -- Remove from waitlist, free no seats, no promotion
        DELETE FROM WAITLIST_ENTRY WHERE booking_id = v_booking_id;
        -- Transition WAITLISTED -> CANCELLED
        UPDATE BOOKING SET status = 'CANCELLED' WHERE booking_id = v_booking_id;

    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot cancel booking in current status';
    END IF;

END$$

-- Procedure 3: promote_waitlist (FR-R17, INV-07)
DROP PROCEDURE IF EXISTS promote_waitlist$$
CREATE PROCEDURE promote_waitlist(
    IN p_journey_class_id BIGINT
)
BEGIN
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_wl_id BIGINT;
    DECLARE v_bkg_id BIGINT;
    DECLARE v_psg_id BIGINT;
    DECLARE v_journey_id BIGINT;
    DECLARE v_free_seat_id BIGINT DEFAULT NULL;
    DECLARE v_candidate_found BOOLEAN DEFAULT FALSE;
    DECLARE v_reorder_pos INT DEFAULT 1;

    -- Cursor iterating waitlist in deterministic FIFO order (FR-R06)
    DECLARE cur_wl CURSOR FOR 
        SELECT we.waitlist_id, we.booking_id, b.passenger_id
        FROM WAITLIST_ENTRY we
        JOIN BOOKING b ON we.booking_id = b.booking_id
        WHERE we.journey_class_id = p_journey_class_id
        ORDER BY we.waitlist_position ASC, b.booked_at ASC, b.booking_id ASC;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    SELECT journey_id INTO v_journey_id 
    FROM JOURNEY_CLASS 
    WHERE journey_class_id = p_journey_class_id;

    -- Find 1 available seat
    SELECT js.journey_seat_id INTO v_free_seat_id
    FROM JOURNEY_SEAT js
    LEFT JOIN SEAT_ALLOCATION sa ON js.journey_seat_id = sa.journey_seat_id
    WHERE js.journey_class_id = p_journey_class_id AND sa.allocation_id IS NULL
    LIMIT 1;

    IF v_free_seat_id IS NOT NULL THEN
        OPEN cur_wl;
        read_loop: LOOP
            FETCH cur_wl INTO v_wl_id, v_bkg_id, v_psg_id;
            IF v_done THEN
                LEAVE read_loop;
            END IF;

            -- Check INV-05: Does candidate hold a confirmed seat in another class on this journey?
            IF NOT EXISTS (SELECT 1 FROM SEAT_ALLOCATION WHERE passenger_id = v_psg_id AND journey_id = v_journey_id) THEN
                -- Eligible candidate found!
                -- 1. Transition WAITLISTED -> CONFIRMED
                UPDATE BOOKING SET status = 'CONFIRMED' WHERE booking_id = v_bkg_id;

                -- 2. Create allocation
                INSERT INTO SEAT_ALLOCATION (booking_id, journey_seat_id, passenger_id, journey_id)
                VALUES (v_bkg_id, v_free_seat_id, v_psg_id, v_journey_id);

                -- 3. Delete waitlist entry
                DELETE FROM WAITLIST_ENTRY WHERE waitlist_id = v_wl_id;

                SET v_candidate_found = TRUE;
                LEAVE read_loop; -- At most 1 promotion per cancellation (INV-07)
            END IF;
            -- If ineligible, candidate is skipped without mutation! (FR-R17)
        END LOOP;
        CLOSE cur_wl;
    END IF;

    -- If a candidate was promoted, re-index remaining waitlist positions
    IF v_candidate_found THEN
        UPDATE WAITLIST_ENTRY we
        JOIN (
            SELECT waitlist_id, ROW_NUMBER() OVER (ORDER BY waitlist_position ASC) as new_pos
            FROM WAITLIST_ENTRY
            WHERE journey_class_id = p_journey_class_id
        ) ranked ON we.waitlist_id = ranked.waitlist_id
        SET we.waitlist_position = ranked.new_pos;
    END IF;

END$$

-- Procedure 4: run_invariants (Comprehensive evaluation of INV-01 through INV-07)
DROP PROCEDURE IF EXISTS run_invariants$$
CREATE PROCEDURE run_invariants(OUT p_violations INT)
BEGIN
    DECLARE v_inv1_count INT DEFAULT 0;
    DECLARE v_inv2_count INT DEFAULT 0;
    DECLARE v_inv3_count INT DEFAULT 0;
    DECLARE v_inv4_count INT DEFAULT 0;
    DECLARE v_inv5_count INT DEFAULT 0;
    DECLARE v_inv6_count INT DEFAULT 0;
    DECLARE v_inv7_count INT DEFAULT 0;

    -- INV-01: Confirmed bookings <= seats
    SELECT COUNT(*) INTO v_inv1_count
    FROM (
        SELECT jc.journey_class_id, jc.total_seats, COUNT(sa.allocation_id) as confirmed_cnt
        FROM JOURNEY_CLASS jc
        LEFT JOIN JOURNEY_SEAT js ON jc.journey_class_id = js.journey_class_id
        LEFT JOIN SEAT_ALLOCATION sa ON js.journey_seat_id = sa.journey_seat_id
        GROUP BY jc.journey_class_id, jc.total_seats
        HAVING confirmed_cnt > jc.total_seats
    ) t;

    -- INV-02: Every seat has at most 1 allocation
    SELECT COUNT(*) INTO v_inv2_count
    FROM (
        SELECT journey_seat_id, COUNT(*) as cnt
        FROM SEAT_ALLOCATION
        GROUP BY journey_seat_id
        HAVING cnt > 1
    ) t;

    -- INV-03: CONFIRMED booking has exactly 1 allocation; others have 0
    SELECT COUNT(*) INTO v_inv3_count
    FROM BOOKING b
    LEFT JOIN SEAT_ALLOCATION sa ON b.booking_id = sa.booking_id
    WHERE (b.status = 'CONFIRMED' AND sa.allocation_id IS NULL)
       OR (b.status <> 'CONFIRMED' AND sa.allocation_id IS NOT NULL);

    -- INV-04: WAITLISTED booking has exactly 1 waitlist entry; others have 0
    SELECT COUNT(*) INTO v_inv4_count
    FROM BOOKING b
    LEFT JOIN WAITLIST_ENTRY we ON b.booking_id = we.booking_id
    WHERE (b.status = 'WAITLISTED' AND we.waitlist_id IS NULL)
       OR (b.status <> 'WAITLISTED' AND we.waitlist_id IS NOT NULL);

    -- INV-05: Passenger at most 1 CONFIRMED booking per journey
    SELECT COUNT(*) INTO v_inv5_count
    FROM (
        SELECT passenger_id, journey_id, COUNT(*) as cnt
        FROM SEAT_ALLOCATION
        GROUP BY passenger_id, journey_id
        HAVING cnt > 1
    ) t;

    -- INV-06: Audit Trail Completeness (Every booking must have at least 1 audit entry)
    SELECT COUNT(*) INTO v_inv6_count
    FROM BOOKING b
    LEFT JOIN BOOKING_AUDIT ba ON b.booking_id = ba.booking_id
    WHERE ba.audit_id IS NULL;

    -- INV-07: Deterministic Promotion & Waitlist Ordering (No duplicate positions, no cross-waitlist confirmed on same journey)
    SELECT COUNT(*) INTO v_inv7_count
    FROM (
        SELECT journey_class_id, waitlist_position
        FROM WAITLIST_ENTRY
        GROUP BY journey_class_id, waitlist_position
        HAVING COUNT(*) > 1
        UNION ALL
        SELECT sa.passenger_id, sa.journey_id
        FROM SEAT_ALLOCATION sa
        JOIN BOOKING b_wl ON sa.passenger_id = b_wl.passenger_id AND b_wl.status = 'WAITLISTED'
        JOIN JOURNEY_CLASS jc ON b_wl.journey_class_id = jc.journey_class_id AND jc.journey_id = sa.journey_id
    ) t_inv7;

    SET p_violations = v_inv1_count + v_inv2_count + v_inv3_count + v_inv4_count + v_inv5_count + v_inv6_count + v_inv7_count;

    SELECT 
        v_inv1_count AS inv01_capacity_violations,
        v_inv2_count AS inv02_seat_exclusivity_violations,
        v_inv3_count AS inv03_status_allocation_violations,
        v_inv4_count AS inv04_waitlist_cardinality_violations,
        v_inv5_count AS inv05_passenger_journey_violations,
        v_inv6_count AS inv06_audit_trail_violations,
        v_inv7_count AS inv07_waitlist_ordering_violations,
        p_violations AS total_violations;
END$$


-- Procedure 5: book_group (Atomic Savepoint Rollback per ADR-5, ADR-12, FR-R18, Fixture R-08)
DROP PROCEDURE IF EXISTS book_group$$
CREATE PROCEDURE book_group(
    IN p_journey_class_id BIGINT,
    IN p_passenger1_id BIGINT,
    IN p_passenger2_id BIGINT,
    IN p_passenger3_id BIGINT,
    IN p_inject_member2_failure BOOLEAN,
    IN p_group_ref VARCHAR(50),
    OUT p_pnr1 VARCHAR(20),
    OUT p_pnr2 VARCHAR(20),
    OUT p_pnr3 VARCHAR(20),
    OUT p_member2_rolled_back BOOLEAN
)
BEGIN
    DECLARE v_journey_id BIGINT;
    DECLARE v_dummy BIGINT;
    DECLARE v_fare DECIMAL(10,2);
    DECLARE v_seq1 BIGINT;
    DECLARE v_seq2 BIGINT;
    DECLARE v_seq3 BIGINT;
    DECLARE v_bkg1 BIGINT;
    DECLARE v_bkg2 BIGINT;
    DECLARE v_bkg3 BIGINT;
    DECLARE v_seat1 BIGINT;
    DECLARE v_seat3 BIGINT;

    -- Lookup journey_id and fare
    SELECT journey_id, base_fare_inr INTO v_journey_id, v_fare
    FROM JOURNEY_CLASS 
    WHERE journey_class_id = p_journey_class_id;

    -- Strict Hierarchical Lock on Parent Journey
    SELECT journey_id INTO v_dummy FROM JOURNEY WHERE journey_id = v_journey_id FOR UPDATE;
    SELECT journey_class_id INTO v_dummy FROM JOURNEY_CLASS WHERE journey_class_id = p_journey_class_id FOR UPDATE;

    SET p_member2_rolled_back = FALSE;

    -- -------------------------------------------------------------
    -- MEMBER 1
    -- -------------------------------------------------------------
    INSERT INTO PNR_SEQUENCE () VALUES ();
    SET v_seq1 = LAST_INSERT_ID();
    SET p_pnr1 = CONCAT('PNR-', LPAD(v_seq1, 8, '0'));

    SAVEPOINT sp_member_1;

    INSERT INTO BOOKING (pnr, journey_class_id, passenger_id, status, fare_inr, group_ref)
    VALUES (p_pnr1, p_journey_class_id, p_passenger1_id, 'PENDING', v_fare, p_group_ref);
    SET v_bkg1 = LAST_INSERT_ID();

    UPDATE BOOKING SET status = 'CONFIRMED' WHERE booking_id = v_bkg1;

    SELECT js.journey_seat_id INTO v_seat1
    FROM JOURNEY_SEAT js
    LEFT JOIN SEAT_ALLOCATION sa ON js.journey_seat_id = sa.journey_seat_id
    WHERE js.journey_class_id = p_journey_class_id AND sa.allocation_id IS NULL
    LIMIT 1;

    INSERT INTO SEAT_ALLOCATION (booking_id, journey_seat_id, passenger_id, journey_id)
    VALUES (v_bkg1, v_seat1, p_passenger1_id, v_journey_id);

    -- -------------------------------------------------------------
    -- MEMBER 2
    -- -------------------------------------------------------------
    INSERT INTO PNR_SEQUENCE () VALUES ();
    SET v_seq2 = LAST_INSERT_ID();
    SET p_pnr2 = CONCAT('PNR-', LPAD(v_seq2, 8, '0'));

    SAVEPOINT sp_member_2;

    -- Member 2 booking row inserted in state PENDING (PNR consumed)
    INSERT INTO BOOKING (pnr, journey_class_id, passenger_id, status, fare_inr, group_ref)
    VALUES (p_pnr2, p_journey_class_id, p_passenger2_id, 'PENDING', v_fare, p_group_ref);
    SET v_bkg2 = LAST_INSERT_ID();

    IF p_inject_member2_failure THEN
        -- Intentional failure triggered after PNR allocation and booking creation (ADR-12)
        -- Rollback to Member 2 savepoint: unwinds booking and audit rows
        ROLLBACK TO SAVEPOINT sp_member_2;
        SET p_member2_rolled_back = TRUE;
    ELSE
        UPDATE BOOKING SET status = 'CONFIRMED' WHERE booking_id = v_bkg2;
    END IF;

    -- -------------------------------------------------------------
    -- MEMBER 3
    -- -------------------------------------------------------------
    INSERT INTO PNR_SEQUENCE () VALUES ();
    SET v_seq3 = LAST_INSERT_ID();
    SET p_pnr3 = CONCAT('PNR-', LPAD(v_seq3, 8, '0'));

    SAVEPOINT sp_member_3;

    INSERT INTO BOOKING (pnr, journey_class_id, passenger_id, status, fare_inr, group_ref)
    VALUES (p_pnr3, p_journey_class_id, p_passenger3_id, 'PENDING', v_fare, p_group_ref);
    SET v_bkg3 = LAST_INSERT_ID();

    UPDATE BOOKING SET status = 'CONFIRMED' WHERE booking_id = v_bkg3;

    SELECT js.journey_seat_id INTO v_seat3
    FROM JOURNEY_SEAT js
    LEFT JOIN SEAT_ALLOCATION sa ON js.journey_seat_id = sa.journey_seat_id
    WHERE js.journey_class_id = p_journey_class_id AND sa.allocation_id IS NULL
    LIMIT 1;

    INSERT INTO SEAT_ALLOCATION (booking_id, journey_seat_id, passenger_id, journey_id)
    VALUES (v_bkg3, v_seat3, p_passenger3_id, v_journey_id);

END$$


-- Procedure 6: evaluate_case (Disruption Refund Advisor Canonical Engine)
DROP PROCEDURE IF EXISTS evaluate_case$$
CREATE PROCEDURE evaluate_case(
    IN p_case_id BIGINT,
    IN p_rule_family VARCHAR(50),
    IN p_policy_applicability_time TIMESTAMP,
    IN p_evaluation_time TIMESTAMP,
    IN p_ticket_scope VARCHAR(50),
    OUT p_outcome VARCHAR(20),
    OUT p_rule_id VARCHAR(50),
    OUT p_rule_version INT,
    OUT p_action_code VARCHAR(100),
    OUT p_refund_amount DECIMAL(10,2),
    OUT p_evaluation_id BIGINT
)
proc_label: BEGIN
    DECLARE v_rv_id BIGINT DEFAULT NULL;
    DECLARE v_rule_id BIGINT DEFAULT NULL;
    DECLARE v_rule_code VARCHAR(50) DEFAULT NULL;
    DECLARE v_rule_family VARCHAR(50) DEFAULT NULL;
    DECLARE v_version_num INT DEFAULT NULL;
    DECLARE v_verified BOOLEAN DEFAULT FALSE;
    DECLARE v_threshold INT DEFAULT 180;
    DECLARE v_refund_basis DECIMAL(5,2) DEFAULT 100.00;
    DECLARE v_fare DECIMAL(10,2) DEFAULT 1250.00;
    DECLARE v_booking_status VARCHAR(20);
    DECLARE v_delay_val DECIMAL(10,2) DEFAULT NULL;
    DECLARE v_delay_src VARCHAR(50) DEFAULT NULL;
    DECLARE v_actual_dept_time TIMESTAMP DEFAULT NULL;
    DECLARE v_filing_time TIMESTAMP DEFAULT NULL;
    DECLARE v_travelled_cnt INT DEFAULT 0;
    DECLARE v_not_travelled_cnt INT DEFAULT 0;
    DECLARE v_cancel_cnt INT DEFAULT 0;
    DECLARE v_disclaimer TEXT;

    SET v_disclaimer = 'Simulated guidance based on the rule version shown. This is not an official refund decision. This system does not file a TDR or guarantee a refund.';
    SET p_outcome = 'UNRESOLVED';
    SET p_action_code = 'NO_ACTION_UNRESOLVED';
    SET p_refund_amount = 0.00;
    SET p_rule_id = NULL;
    SET p_rule_version = NULL;

    -- Lookup fare from booking if exists
    SELECT b.fare_inr, b.status INTO v_fare, v_booking_status
    FROM DISRUPTION_CASE dc
    JOIN BOOKING b ON dc.booking_id = b.booking_id
    WHERE dc.case_id = p_case_id;

    IF v_fare IS NULL THEN
        SET v_fare = 1250.00;
    END IF;

    -- 1. Validate Ticket Scope
    IF p_ticket_scope IS NULL OR p_ticket_scope <> 'SIMULATED_E_TICKET_CONFIRMED' THEN
        SET p_outcome = 'UNRESOLVED';
        SET p_action_code = 'NO_ACTION_UNRESOLVED';
        INSERT INTO CASE_EVALUATION (case_id, rule_version_id, evaluation_time, outcome, deadline_action, refund_amount_inr, disclaimer)
        VALUES (p_case_id, NULL, p_evaluation_time, p_outcome, p_action_code, 0.00, v_disclaimer);
        SET p_evaluation_id = LAST_INSERT_ID();
        INSERT INTO CASE_EVALUATION_CODE (evaluation_id, reason_code, code_order) VALUES (p_evaluation_id, 'UNSUPPORTED_TICKET_SCOPE', 1);
        LEAVE proc_label;
    END IF;

    -- 2. Check for Event Conflicts (Both travelled and not travelled present)
    SELECT COUNT(*) INTO v_travelled_cnt FROM CASE_EVENT WHERE case_id = p_case_id AND event_type = 'PASSENGER_TRAVELLED';
    SELECT COUNT(*) INTO v_not_travelled_cnt FROM CASE_EVENT WHERE case_id = p_case_id AND event_type = 'PASSENGER_NOT_TRAVELLED';
    IF v_travelled_cnt > 0 AND v_not_travelled_cnt > 0 THEN
        SET p_outcome = 'UNRESOLVED';
        SET p_action_code = 'NO_ACTION_UNRESOLVED';
        INSERT INTO CASE_EVALUATION (case_id, rule_version_id, evaluation_time, outcome, deadline_action, refund_amount_inr, disclaimer)
        VALUES (p_case_id, NULL, p_evaluation_time, p_outcome, p_action_code, 0.00, v_disclaimer);
        SET p_evaluation_id = LAST_INSERT_ID();
        INSERT INTO CASE_EVALUATION_CODE (evaluation_id, reason_code, code_order) VALUES (p_evaluation_id, 'EVENT_CONFLICT', 1);
        LEAVE proc_label;
    END IF;

    -- 3. Match Rule Version by policyApplicabilityTime
    SELECT rv.rule_version_id, rr.rule_id, rr.rule_code, rr.rule_family, rv.version_number, rv.verified, rv.threshold_minutes, rv.refund_basis_pct
    INTO v_rv_id, v_rule_id, v_rule_code, v_rule_family, v_version_num, v_verified, v_threshold, v_refund_basis
    FROM RULE_VERSION rv
    JOIN REFUND_RULE rr ON rv.rule_id = rr.rule_id
    WHERE rv.is_active = TRUE
      AND (rv.effective_from <= p_policy_applicability_time AND (rv.effective_to IS NULL OR p_policy_applicability_time < rv.effective_to))
      AND (rr.rule_family = p_rule_family OR (p_rule_family = 'LATE_OVER_3_HOURS' AND rr.rule_family = 'LATE_OVER_3_HOURS_E_TICKET') OR (p_rule_family = 'TRAIN_CANCELLED' AND rr.rule_family = 'TRAIN_CANCELLED_E_TICKET'))
    ORDER BY rv.version_number DESC
    LIMIT 1;

    IF v_rv_id IS NULL THEN
        SET p_outcome = 'UNRESOLVED';
        SET p_action_code = 'NO_ACTION_UNRESOLVED';
        INSERT INTO CASE_EVALUATION (case_id, rule_version_id, evaluation_time, outcome, deadline_action, refund_amount_inr, disclaimer)
        VALUES (p_case_id, NULL, p_evaluation_time, p_outcome, p_action_code, 0.00, v_disclaimer);
        SET p_evaluation_id = LAST_INSERT_ID();
        INSERT INTO CASE_EVALUATION_CODE (evaluation_id, reason_code, code_order) VALUES (p_evaluation_id, 'RULE_NOT_FOUND', 1);
        LEAVE proc_label;
    END IF;

    SET p_rule_id = v_rule_code;
    SET p_rule_version = v_version_num;

    -- 4. Check Rule Verification
    IF NOT v_verified THEN
        SET p_outcome = 'UNRESOLVED';
        SET p_action_code = 'NO_ACTION_UNRESOLVED';
        INSERT INTO CASE_EVALUATION (case_id, rule_version_id, evaluation_time, outcome, deadline_action, refund_amount_inr, disclaimer)
        VALUES (p_case_id, v_rv_id, p_evaluation_time, p_outcome, p_action_code, 0.00, v_disclaimer);
        SET p_evaluation_id = LAST_INSERT_ID();
        INSERT INTO CASE_EVALUATION_CODE (evaluation_id, reason_code, code_order) VALUES (p_evaluation_id, 'RULE_SOURCE_UNVERIFIED', 1);
        LEAVE proc_label;
    END IF;

    -- 5. Evaluate based on Rule Family
    IF v_rule_family = 'LATE_OVER_3_HOURS_E_TICKET' OR v_rule_family = 'LATE_OVER_3_HOURS' THEN
        -- Check delay event
        SELECT numeric_value, event_source INTO v_delay_val, v_delay_src
        FROM CASE_EVENT WHERE case_id = p_case_id AND event_type = 'DELAY_AT_BOARDING_MINUTES' LIMIT 1;

        IF v_delay_val IS NULL THEN
            SET p_outcome = 'UNRESOLVED';
            SET p_action_code = 'NO_ACTION_UNRESOLVED';
            INSERT INTO CASE_EVALUATION (case_id, rule_version_id, evaluation_time, outcome, deadline_action, refund_amount_inr, disclaimer)
            VALUES (p_case_id, v_rv_id, p_evaluation_time, p_outcome, p_action_code, 0.00, v_disclaimer);
            SET p_evaluation_id = LAST_INSERT_ID();
            INSERT INTO CASE_EVALUATION_CODE (evaluation_id, reason_code, code_order) VALUES (p_evaluation_id, 'DELAY_UNKNOWN', 1);
            LEAVE proc_label;
        END IF;

        IF v_delay_src <> 'SIMULATED_OFFICIAL' THEN
            SET p_outcome = 'UNRESOLVED';
            SET p_action_code = 'NO_ACTION_UNRESOLVED';
            INSERT INTO CASE_EVALUATION (case_id, rule_version_id, evaluation_time, outcome, deadline_action, refund_amount_inr, disclaimer)
            VALUES (p_case_id, v_rv_id, p_evaluation_time, p_outcome, p_action_code, 0.00, v_disclaimer);
            SET p_evaluation_id = LAST_INSERT_ID();
            INSERT INTO CASE_EVALUATION_CODE (evaluation_id, reason_code, code_order) VALUES (p_evaluation_id, 'DELAY_UNVERIFIED', 1);
            LEAVE proc_label;
        END IF;

        IF v_delay_val <= v_threshold THEN
            SET p_outcome = 'NOT_ELIGIBLE';
            SET p_action_code = 'NO_ACTION_INELIGIBLE';
            INSERT INTO CASE_EVALUATION (case_id, rule_version_id, evaluation_time, outcome, deadline_action, refund_amount_inr, disclaimer)
            VALUES (p_case_id, v_rv_id, p_evaluation_time, p_outcome, p_action_code, 0.00, v_disclaimer);
            SET p_evaluation_id = LAST_INSERT_ID();
            INSERT INTO CASE_EVALUATION_CODE (evaluation_id, reason_code, code_order) VALUES (p_evaluation_id, 'DELAY_NOT_OVER_THRESHOLD', 1);
            LEAVE proc_label;
        END IF;

        -- Check travel status
        IF v_travelled_cnt > 0 THEN
            SET p_outcome = 'NOT_ELIGIBLE';
            SET p_action_code = 'NO_ACTION_INELIGIBLE';
            INSERT INTO CASE_EVALUATION (case_id, rule_version_id, evaluation_time, outcome, deadline_action, refund_amount_inr, disclaimer)
            VALUES (p_case_id, v_rv_id, p_evaluation_time, p_outcome, p_action_code, 0.00, v_disclaimer);
            SET p_evaluation_id = LAST_INSERT_ID();
            INSERT INTO CASE_EVALUATION_CODE (evaluation_id, reason_code, code_order) VALUES (p_evaluation_id, 'PASSENGER_TRAVELLED', 1);
            LEAVE proc_label;
        END IF;

        IF v_not_travelled_cnt = 0 THEN
            SET p_outcome = 'UNRESOLVED';
            SET p_action_code = 'NO_ACTION_UNRESOLVED';
            INSERT INTO CASE_EVALUATION (case_id, rule_version_id, evaluation_time, outcome, deadline_action, refund_amount_inr, disclaimer)
            VALUES (p_case_id, v_rv_id, p_evaluation_time, p_outcome, p_action_code, 0.00, v_disclaimer);
            SET p_evaluation_id = LAST_INSERT_ID();
            INSERT INTO CASE_EVALUATION_CODE (evaluation_id, reason_code, code_order) VALUES (p_evaluation_id, 'TRAVEL_STATUS_UNKNOWN', 1);
            LEAVE proc_label;
        END IF;

        -- Check actual departure & filing attempt
        SELECT event_time INTO v_actual_dept_time FROM CASE_EVENT WHERE case_id = p_case_id AND event_type = 'ACTUAL_DEPARTURE' LIMIT 1;
        IF v_actual_dept_time IS NULL THEN
            SET p_outcome = 'UNRESOLVED';
            SET p_action_code = 'NO_ACTION_UNRESOLVED';
            INSERT INTO CASE_EVALUATION (case_id, rule_version_id, evaluation_time, outcome, deadline_action, refund_amount_inr, disclaimer)
            VALUES (p_case_id, v_rv_id, p_evaluation_time, p_outcome, p_action_code, 0.00, v_disclaimer);
            SET p_evaluation_id = LAST_INSERT_ID();
            INSERT INTO CASE_EVALUATION_CODE (evaluation_id, reason_code, code_order) VALUES (p_evaluation_id, 'ACTUAL_DEPARTURE_UNKNOWN', 1);
            LEAVE proc_label;
        END IF;

        SELECT event_time INTO v_filing_time FROM CASE_EVENT WHERE case_id = p_case_id AND event_type = 'FILING_ATTEMPT' LIMIT 1;
        IF v_filing_time IS NULL THEN
            SET p_outcome = 'UNRESOLVED';
            SET p_action_code = 'NO_ACTION_UNRESOLVED';
            INSERT INTO CASE_EVALUATION (case_id, rule_version_id, evaluation_time, outcome, deadline_action, refund_amount_inr, disclaimer)
            VALUES (p_case_id, v_rv_id, p_evaluation_time, p_outcome, p_action_code, 0.00, v_disclaimer);
            SET p_evaluation_id = LAST_INSERT_ID();
            INSERT INTO CASE_EVALUATION_CODE (evaluation_id, reason_code, code_order) VALUES (p_evaluation_id, 'FILING_ATTEMPT_UNKNOWN', 1);
            LEAVE proc_label;
        END IF;

        IF v_filing_time >= v_actual_dept_time THEN
            SET p_outcome = 'DEADLINE_EXPIRED';
            SET p_action_code = 'NO_ACTION_DEADLINE_EXPIRED';
            INSERT INTO CASE_EVALUATION (case_id, rule_version_id, evaluation_time, outcome, deadline_action, refund_amount_inr, disclaimer)
            VALUES (p_case_id, v_rv_id, p_evaluation_time, p_outcome, p_action_code, 0.00, v_disclaimer);
            SET p_evaluation_id = LAST_INSERT_ID();
            INSERT INTO CASE_EVALUATION_CODE (evaluation_id, reason_code, code_order) VALUES (p_evaluation_id, 'FILED_AFTER_DEPARTURE', 1);
            LEAVE proc_label;
        END IF;

        -- Eligible for Late Running
        SET p_outcome = 'ELIGIBLE';
        SET p_action_code = 'MODELLED_TDR_FILED_BEFORE_DEPARTURE';
        SET p_refund_amount = v_fare;
        INSERT INTO CASE_EVALUATION (case_id, rule_version_id, evaluation_time, outcome, deadline_action, refund_amount_inr, disclaimer)
        VALUES (p_case_id, v_rv_id, p_evaluation_time, p_outcome, p_action_code, p_refund_amount, v_disclaimer);
        SET p_evaluation_id = LAST_INSERT_ID();
        INSERT INTO CASE_EVALUATION_CODE (evaluation_id, reason_code, code_order) VALUES (p_evaluation_id, 'DELAY_OVER_THRESHOLD', 1);
        INSERT INTO CASE_EVALUATION_CODE (evaluation_id, reason_code, code_order) VALUES (p_evaluation_id, 'FILED_BEFORE_DEPARTURE', 2);
        LEAVE proc_label;

    ELSEIF v_rule_family = 'TRAIN_CANCELLED_E_TICKET' OR v_rule_family = 'TRAIN_CANCELLED' THEN
        SELECT COUNT(*) INTO v_cancel_cnt FROM CASE_EVENT WHERE case_id = p_case_id AND event_type = 'TRAIN_CANCELLED' AND event_source = 'SIMULATED_OFFICIAL';
        IF v_cancel_cnt > 0 THEN
            SET p_outcome = 'ELIGIBLE';
            SET p_action_code = 'NO_TDR_REQUIRED';
            SET p_refund_amount = v_fare;
            INSERT INTO CASE_EVALUATION (case_id, rule_version_id, evaluation_time, outcome, deadline_action, refund_amount_inr, disclaimer)
            VALUES (p_case_id, v_rv_id, p_evaluation_time, p_outcome, p_action_code, p_refund_amount, v_disclaimer);
            SET p_evaluation_id = LAST_INSERT_ID();
            INSERT INTO CASE_EVALUATION_CODE (evaluation_id, reason_code, code_order) VALUES (p_evaluation_id, 'TRAIN_CANCELLED_AUTO_REFUND', 1);
            LEAVE proc_label;
        ELSE
            SET p_outcome = 'UNRESOLVED';
            SET p_action_code = 'NO_ACTION_UNRESOLVED';
            INSERT INTO CASE_EVALUATION (case_id, rule_version_id, evaluation_time, outcome, deadline_action, refund_amount_inr, disclaimer)
            VALUES (p_case_id, v_rv_id, p_evaluation_time, p_outcome, p_action_code, 0.00, v_disclaimer);
            SET p_evaluation_id = LAST_INSERT_ID();
            INSERT INTO CASE_EVALUATION_CODE (evaluation_id, reason_code, code_order) VALUES (p_evaluation_id, 'TRAIN_CANCELLATION_UNKNOWN', 1);
            LEAVE proc_label;
        END IF;
    END IF;

END$$

DELIMITER ;

