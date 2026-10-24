@echo off
REM ============================================================================
REM run_two_session_test.bat: Reproducible 2-Session Lock-First Concurrency Test
REM RailSync Gate 2 Acceptance Harness
REM ============================================================================

set MYSQL_BIN="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
echo Running Two-Session Concurrency Experiment...
python c:\Soham\Coding\GitHub\RailSync\scratch\test_two_session.py
type c:\Soham\Coding\GitHub\RailSync\evidence\gate2\mysql_two_session.txt
