-- ============================================================================
-- 01_tables.sql: 16 InnoDB Tables with Strict Relational Constraints
-- ============================================================================

USE railsync;

-- 1. TRAIN
CREATE TABLE TRAIN (
    train_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    train_number VARCHAR(10) NOT NULL,
    train_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_train_number UNIQUE (train_number)
) ENGINE=InnoDB;

-- 2. JOURNEY
CREATE TABLE JOURNEY (
    journey_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    train_id BIGINT NOT NULL,
    departure_date DATE NOT NULL,
    scheduled_departure_time TIME NOT NULL,
    distance_km DECIMAL(8,2) NOT NULL DEFAULT 1000.00,
    status ENUM('SCHEDULED', 'CANCELLED', 'DELAYED', 'COMPLETED') NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_journey_train FOREIGN KEY (train_id) REFERENCES TRAIN(train_id) ON DELETE RESTRICT,
    CONSTRAINT uq_journey_train_date UNIQUE (train_id, departure_date)
) ENGINE=InnoDB;

-- 3. JOURNEY_CLASS
CREATE TABLE JOURNEY_CLASS (
    journey_class_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    journey_id BIGINT NOT NULL,
    class_code VARCHAR(10) NOT NULL,
    total_seats INT NOT NULL,
    base_fare_inr DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_jc_journey FOREIGN KEY (journey_id) REFERENCES JOURNEY(journey_id) ON DELETE RESTRICT,
    CONSTRAINT uq_jc_class UNIQUE (journey_id, class_code),
    CONSTRAINT chk_jc_seats CHECK (total_seats >= 0),
    CONSTRAINT chk_jc_fare CHECK (base_fare_inr >= 0.00)
) ENGINE=InnoDB;

-- 4. JOURNEY_SEAT
CREATE TABLE JOURNEY_SEAT (
    journey_seat_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    journey_class_id BIGINT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    berth_type VARCHAR(20) NOT NULL DEFAULT 'LOWER',
    CONSTRAINT fk_seat_jc FOREIGN KEY (journey_class_id) REFERENCES JOURNEY_CLASS(journey_class_id) ON DELETE RESTRICT,
    CONSTRAINT uq_seat_num UNIQUE (journey_class_id, seat_number)
) ENGINE=InnoDB;

-- 5. PASSENGER
CREATE TABLE PASSENGER (
    passenger_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_passenger_email UNIQUE (email)
) ENGINE=InnoDB;

-- 6. PNR_SEQUENCE (Persistent Monotonic Generator per ADR-7)
CREATE TABLE PNR_SEQUENCE (
    seq_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 7. BOOKING
CREATE TABLE BOOKING (
    booking_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pnr VARCHAR(20) NOT NULL,
    journey_class_id BIGINT NOT NULL,
    passenger_id BIGINT NOT NULL,
    status ENUM('PENDING', 'CONFIRMED', 'WAITLISTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fare_inr DECIMAL(10,2) NOT NULL,
    group_ref VARCHAR(50) NULL,
    CONSTRAINT uq_booking_pnr UNIQUE (pnr),
    CONSTRAINT fk_booking_jc FOREIGN KEY (journey_class_id) REFERENCES JOURNEY_CLASS(journey_class_id) ON DELETE RESTRICT,
    CONSTRAINT fk_booking_passenger FOREIGN KEY (passenger_id) REFERENCES PASSENGER(passenger_id) ON DELETE RESTRICT,
    CONSTRAINT chk_booking_fare CHECK (fare_inr >= 0.00)
) ENGINE=InnoDB;

-- 8. SEAT_ALLOCATION (Unique composite passenger+journey enforces INV-05)
CREATE TABLE SEAT_ALLOCATION (
    allocation_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    journey_seat_id BIGINT NOT NULL,
    passenger_id BIGINT NOT NULL,
    journey_id BIGINT NOT NULL,
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_alloc_booking UNIQUE (booking_id),
    CONSTRAINT uq_alloc_seat UNIQUE (journey_seat_id),
    CONSTRAINT uq_alloc_psg_journey UNIQUE (passenger_id, journey_id),
    CONSTRAINT fk_alloc_booking FOREIGN KEY (booking_id) REFERENCES BOOKING(booking_id) ON DELETE CASCADE,
    CONSTRAINT fk_alloc_seat FOREIGN KEY (journey_seat_id) REFERENCES JOURNEY_SEAT(journey_seat_id) ON DELETE RESTRICT,
    CONSTRAINT fk_alloc_psg FOREIGN KEY (passenger_id) REFERENCES PASSENGER(passenger_id) ON DELETE RESTRICT,
    CONSTRAINT fk_alloc_journey FOREIGN KEY (journey_id) REFERENCES JOURNEY(journey_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 9. WAITLIST_ENTRY
CREATE TABLE WAITLIST_ENTRY (
    waitlist_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    journey_class_id BIGINT NOT NULL,
    waitlist_position INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_wl_booking UNIQUE (booking_id),
    CONSTRAINT uq_wl_pos UNIQUE (journey_class_id, waitlist_position),
    CONSTRAINT fk_wl_booking FOREIGN KEY (booking_id) REFERENCES BOOKING(booking_id) ON DELETE CASCADE,
    CONSTRAINT fk_wl_jc FOREIGN KEY (journey_class_id) REFERENCES JOURNEY_CLASS(journey_class_id) ON DELETE RESTRICT,
    CONSTRAINT chk_wl_pos CHECK (waitlist_position > 0)
) ENGINE=InnoDB;

-- 10. BOOKING_AUDIT
CREATE TABLE BOOKING_AUDIT (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    from_status ENUM('PENDING', 'CONFIRMED', 'WAITLISTED', 'CANCELLED') NULL,
    to_status ENUM('PENDING', 'CONFIRMED', 'WAITLISTED', 'CANCELLED') NOT NULL,
    reason VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(50) NOT NULL DEFAULT 'system',
    CONSTRAINT fk_audit_booking FOREIGN KEY (booking_id) REFERENCES BOOKING(booking_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. REFUND_RULE
CREATE TABLE REFUND_RULE (
    rule_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rule_code VARCHAR(50) NOT NULL,
    rule_family VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    CONSTRAINT uq_rule_code UNIQUE (rule_code)
) ENGINE=InnoDB;

-- 12. RULE_VERSION
CREATE TABLE RULE_VERSION (
    rule_version_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rule_id BIGINT NOT NULL,
    version_number INT NOT NULL,
    effective_from TIMESTAMP NOT NULL,
    effective_to TIMESTAMP NULL,
    source_url VARCHAR(255) NOT NULL,
    source_section VARCHAR(100) NOT NULL,
    source_checked_on DATE NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    threshold_minutes INT NULL,
    refund_basis_pct DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_rv_rule FOREIGN KEY (rule_id) REFERENCES REFUND_RULE(rule_id) ON DELETE RESTRICT,
    CONSTRAINT uq_rule_ver UNIQUE (rule_id, version_number)
) ENGINE=InnoDB;

-- 13. DISRUPTION_CASE
CREATE TABLE DISRUPTION_CASE (
    case_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    journey_id BIGINT NOT NULL,
    case_status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_case_booking FOREIGN KEY (booking_id) REFERENCES BOOKING(booking_id) ON DELETE RESTRICT,
    CONSTRAINT fk_case_journey FOREIGN KEY (journey_id) REFERENCES JOURNEY(journey_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 14. CASE_EVENT
CREATE TABLE CASE_EVENT (
    event_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_time TIMESTAMP NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_source ENUM('SIMULATED_OFFICIAL', 'PASSENGER_REPORTED', 'SIMULATED_INPUT') NOT NULL,
    numeric_value DECIMAL(10,2) NULL,
    text_value VARCHAR(255) NULL,
    CONSTRAINT fk_event_case FOREIGN KEY (case_id) REFERENCES DISRUPTION_CASE(case_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 15. CASE_EVALUATION
CREATE TABLE CASE_EVALUATION (
    evaluation_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id BIGINT NOT NULL,
    rule_version_id BIGINT NULL,
    evaluation_time TIMESTAMP NOT NULL,
    outcome ENUM('ELIGIBLE', 'NOT_ELIGIBLE', 'DEADLINE_EXPIRED', 'UNRESOLVED') NOT NULL,
    deadline_action VARCHAR(100) NULL,
    refund_amount_inr DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    disclaimer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_eval_case FOREIGN KEY (case_id) REFERENCES DISRUPTION_CASE(case_id) ON DELETE RESTRICT,
    CONSTRAINT fk_eval_rv FOREIGN KEY (rule_version_id) REFERENCES RULE_VERSION(rule_version_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 16. CASE_EVALUATION_CODE
CREATE TABLE CASE_EVALUATION_CODE (
    code_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    evaluation_id BIGINT NOT NULL,
    reason_code VARCHAR(100) NOT NULL,
    code_order INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_code_eval FOREIGN KEY (evaluation_id) REFERENCES CASE_EVALUATION(evaluation_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 17. CASE_EVALUATION_EVENT
CREATE TABLE CASE_EVALUATION_EVENT (
    eval_event_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    evaluation_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,
    CONSTRAINT fk_ee_eval FOREIGN KEY (evaluation_id) REFERENCES CASE_EVALUATION(evaluation_id) ON DELETE CASCADE,
    CONSTRAINT fk_ee_event FOREIGN KEY (event_id) REFERENCES CASE_EVENT(event_id) ON DELETE RESTRICT
) ENGINE=InnoDB;
