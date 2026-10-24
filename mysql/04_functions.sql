-- ============================================================================
-- 04_functions.sql: Stored Functions for Fare Calculation and Occupancy
-- ============================================================================

USE railsync;

DELIMITER $$

-- Deterministic polymorphic fare calculation function (FR-R09)
DROP FUNCTION IF EXISTS calculate_fare$$
CREATE FUNCTION calculate_fare(
    p_class_code VARCHAR(10),
    p_distance_km DECIMAL(8,2)
) RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE v_base_rate DECIMAL(6,2);
    DECLARE v_multiplier DECIMAL(4,2);
    DECLARE v_surcharge DECIMAL(6,2);
    DECLARE v_min_fare DECIMAL(6,2);
    DECLARE v_fare DECIMAL(10,2);

    IF p_distance_km <= 0 THEN
        RETURN 0.00;
    END IF;

    SET v_base_rate = 0.40; -- Base rate per km

    CASE p_class_code
        WHEN 'SL' THEN
            SET v_multiplier = 1.00;
            SET v_surcharge = 0.00;
            SET v_min_fare = 120.00;
        WHEN '3A' THEN
            SET v_multiplier = 2.50;
            SET v_surcharge = 80.00;
            SET v_min_fare = 450.00;
        WHEN 'GN' THEN
            SET v_multiplier = 0.50;
            SET v_surcharge = 0.00;
            SET v_min_fare = 40.00;
        ELSE
            SET v_multiplier = 1.00;
            SET v_surcharge = 0.00;
            SET v_min_fare = 100.00;
    END CASE;

    SET v_fare = (p_distance_km * v_base_rate * v_multiplier) + v_surcharge;
    IF v_fare < v_min_fare THEN
        SET v_fare = v_min_fare;
    END IF;

    RETURN ROUND(v_fare, 2);
END$$

-- Occupancy Percentage Function
DROP FUNCTION IF EXISTS occupancy_pct$$
CREATE FUNCTION occupancy_pct(
    p_journey_class_id BIGINT
) RETURNS DECIMAL(5,2)
READS SQL DATA
BEGIN
    DECLARE v_total INT DEFAULT 0;
    DECLARE v_confirmed INT DEFAULT 0;

    SELECT total_seats INTO v_total 
    FROM JOURNEY_CLASS 
    WHERE journey_class_id = p_journey_class_id;

    IF v_total = 0 THEN
        RETURN 0.00;
    END IF;

    SELECT COUNT(*) INTO v_confirmed
    FROM SEAT_ALLOCATION sa
    JOIN JOURNEY_SEAT js ON sa.journey_seat_id = js.journey_seat_id
    WHERE js.journey_class_id = p_journey_class_id;

    RETURN ROUND((v_confirmed / v_total) * 100, 2);
END$$

DELIMITER ;
