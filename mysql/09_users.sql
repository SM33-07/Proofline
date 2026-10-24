-- ============================================================================
-- 09_users.sql: Role Segregation & Least Privilege Access Control (NFR-11)
-- Roles: app_reader, app_writer, app_admin
-- ============================================================================

USE railsync;

-- Drop users if exist
DROP USER IF EXISTS 'railsync_reader'@'localhost';
DROP USER IF EXISTS 'railsync_writer'@'localhost';
DROP USER IF EXISTS 'railsync_admin'@'localhost';

-- Create users
CREATE USER 'railsync_reader'@'localhost' IDENTIFIED BY 'ReaderPass@123';
CREATE USER 'railsync_writer'@'localhost' IDENTIFIED BY 'WriterPass@123';
CREATE USER 'railsync_admin'@'localhost' IDENTIFIED BY 'AdminPass@123';

-- 1. app_reader: Read-only access to views and reporting tables
GRANT SELECT ON railsync.v_journey_occupancy TO 'railsync_reader'@'localhost';
GRANT SELECT ON railsync.v_waitlist_order TO 'railsync_reader'@'localhost';
GRANT SELECT ON railsync.v_latest_case_evaluation TO 'railsync_reader'@'localhost';
GRANT SELECT ON railsync.v_passenger_contacts TO 'railsync_reader'@'localhost';
GRANT SELECT ON railsync.TRAIN TO 'railsync_reader'@'localhost';
GRANT SELECT ON railsync.JOURNEY TO 'railsync_reader'@'localhost';
GRANT SELECT ON railsync.JOURNEY_CLASS TO 'railsync_reader'@'localhost';
GRANT SELECT ON railsync.BOOKING TO 'railsync_reader'@'localhost';

-- 2. app_writer: Procedure execution privileges for booking & cancellation
GRANT EXECUTE ON PROCEDURE railsync.book_seat TO 'railsync_writer'@'localhost';
GRANT EXECUTE ON PROCEDURE railsync.cancel_booking TO 'railsync_writer'@'localhost';
GRANT EXECUTE ON PROCEDURE railsync.book_group TO 'railsync_writer'@'localhost';
GRANT EXECUTE ON FUNCTION railsync.calculate_fare TO 'railsync_writer'@'localhost';
GRANT EXECUTE ON FUNCTION railsync.occupancy_pct TO 'railsync_writer'@'localhost';

-- 3. app_admin: Full administrative privileges on railsync schema
GRANT ALL PRIVILEGES ON railsync.* TO 'railsync_admin'@'localhost';

FLUSH PRIVILEGES;

-- Verify grants
SHOW GRANTS FOR 'railsync_reader'@'localhost';
SHOW GRANTS FOR 'railsync_writer'@'localhost';
SHOW GRANTS FOR 'railsync_admin'@'localhost';
