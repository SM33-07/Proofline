-- ============================================================================
-- 00_reset.sql: Schema Reset and Database Initialization
-- RailSync — CSC2104 / CSC2131 Lab Baseline
-- ============================================================================

DROP DATABASE IF EXISTS railsync;
CREATE DATABASE railsync 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE railsync;
