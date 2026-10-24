-- ============================================================================
-- 05_triggers.sql: Integrity, Status Lifecycle & Audit Triggers
-- ============================================================================

USE railsync;

DELIMITER $$

-- 1. Lifecycle State Machine Guard Trigger (FR-R08, ADR-4)
DROP TRIGGER IF EXISTS trg_booking_status_guard$$
CREATE TRIGGER trg_booking_status_guard
BEFORE UPDATE ON BOOKING
FOR EACH ROW
BEGIN
    DECLARE v_legal BOOLEAN DEFAULT FALSE;

    -- If status is not changing, allow update
    IF OLD.status = NEW.status THEN
        SET v_legal = TRUE;
    -- Legal transitions per SRS §3.1:
    ELSEIF OLD.status = 'PENDING' AND (NEW.status = 'CONFIRMED' OR NEW.status = 'WAITLISTED' OR NEW.status = 'CANCELLED') THEN
        SET v_legal = TRUE;
    ELSEIF OLD.status = 'CONFIRMED' AND NEW.status = 'CANCELLED' THEN
        SET v_legal = TRUE;
    ELSEIF OLD.status = 'WAITLISTED' AND (NEW.status = 'CONFIRMED' OR NEW.status = 'CANCELLED') THEN
        SET v_legal = TRUE;
    END IF;

    IF NOT v_legal THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Illegal booking status transition';
    END IF;
END$$

-- 2. Audit Trail on Booking Creation (FR-R11, INV-06)
DROP TRIGGER IF EXISTS trg_booking_audit_insert$$
CREATE TRIGGER trg_booking_audit_insert
AFTER INSERT ON BOOKING
FOR EACH ROW
BEGIN
    INSERT INTO BOOKING_AUDIT (booking_id, from_status, to_status, reason, changed_at, changed_by)
    VALUES (NEW.booking_id, NULL, NEW.status, 'Initial booking creation', CURRENT_TIMESTAMP, USER());
END$$

-- 3. Audit Trail on Status Transition (FR-R11, INV-06)
DROP TRIGGER IF EXISTS trg_booking_audit_update$$
CREATE TRIGGER trg_booking_audit_update
AFTER UPDATE ON BOOKING
FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO BOOKING_AUDIT (booking_id, from_status, to_status, reason, changed_at, changed_by)
        VALUES (NEW.booking_id, OLD.status, NEW.status, 'Status transition', CURRENT_TIMESTAMP, USER());
    END IF;
END$$

-- 4. Allocation Status Guard Trigger (ADR-9)
DROP TRIGGER IF EXISTS trg_allocation_guard$$
CREATE TRIGGER trg_allocation_guard
BEFORE INSERT ON SEAT_ALLOCATION
FOR EACH ROW
BEGIN
    DECLARE v_status VARCHAR(20);
    SELECT status INTO v_status FROM BOOKING WHERE booking_id = NEW.booking_id;
    IF v_status = 'CANCELLED' OR v_status = 'WAITLISTED' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot allocate seat to CANCELLED or WAITLISTED booking';
    END IF;
END$$

-- 5. Waitlist Status Guard Trigger (ADR-9)
DROP TRIGGER IF EXISTS trg_waitlist_guard$$
CREATE TRIGGER trg_waitlist_guard
BEFORE INSERT ON WAITLIST_ENTRY
FOR EACH ROW
BEGIN
    DECLARE v_status VARCHAR(20);
    SELECT status INTO v_status FROM BOOKING WHERE booking_id = NEW.booking_id;
    IF v_status = 'CONFIRMED' OR v_status = 'CANCELLED' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot waitlist a CONFIRMED or CANCELLED booking';
    END IF;
END$$

-- 6. Case Evaluation Immutability Trigger (FR-D12)
DROP TRIGGER IF EXISTS trg_evaluation_immutable$$
CREATE TRIGGER trg_evaluation_immutable
BEFORE UPDATE ON CASE_EVALUATION
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'CASE_EVALUATION snapshots are strictly immutable; new evaluations must be inserted';
END$$

DELIMITER ;
