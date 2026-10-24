package railsync;

import railsync.concurrency.StartGate;
import railsync.exception.*;
import railsync.model.*;
import railsync.service.*;
import java.io.File;

/**
 * Cross-Class Concurrency Test Suite for Gate 2 / Milestone M1.4 (Fixture R-11).
 * Tests concurrent cross-class booking requests by the same passenger on the same journey.
 * Verifies that Invariant INV-05 (at most one CONFIRMED booking per passenger per journey)
 * is upheld deterministically across repeated multi-threaded iterations.
 */
public class CrossClassConcurrencyTest {

    private static int testsRun = 0;
    private static int testsPassed = 0;

    private static void assertTrue(boolean condition, String name) {
        testsRun++;
        if (condition) {
            testsPassed++;
            System.out.println("  [PASS] " + name);
        } else {
            System.err.println("  [FAIL] " + name);
        }
    }

    private static class IsolatedContext {
        final InMemoryBookingService service;
        final File pnrFile;
        final File auditFile;

        IsolatedContext(InMemoryBookingService service, File pnrFile, File auditFile) {
            this.service = service;
            this.pnrFile = pnrFile;
            this.auditFile = auditFile;
        }

        void cleanup() {
            if (pnrFile != null && pnrFile.exists()) {
                pnrFile.delete();
            }
            if (auditFile != null && auditFile.exists()) {
                auditFile.delete();
            }
        }
    }

    private static IsolatedContext createIsolatedServiceContext() throws Exception {
        File pnrFile = File.createTempFile("r11_pnr_", ".dat");
        File auditFile = File.createTempFile("r11_audit_", ".log");
        pnrFile.deleteOnExit();
        auditFile.deleteOnExit();

        PnrGenerator pnrGen = new PnrGenerator(pnrFile.getAbsolutePath());
        AuditLogger auditLogger = new AuditLogger(auditFile.getAbsolutePath());
        InMemoryBookingService svc = new InMemoryBookingService(pnrGen, auditLogger);

        // Seed 1 Train
        Train train = new Train(1L, "12951", "Rajdhani Express");
        svc.addTrain(train);

        // Seed 1 Journey
        Journey journey = new Journey(101L, 1L, "2026-11-01", "16:55:00", 1384.0);
        svc.addJourney(journey);

        // Class 1: Sleeper (5 seats)
        JourneyClass jcSL = new JourneyClass(1L, 101L, "SL", 5, 550.0);
        svc.addJourneyClass(jcSL);
        for (int i = 1; i <= 5; i++) {
            svc.addSeat(new Seat(100L + i, 1L, "S" + i, "LOWER"));
        }

        // Class 2: AC 3-Tier (1 seat)
        JourneyClass jc3A = new JourneyClass(2L, 101L, "3A", 1, 1450.0);
        svc.addJourneyClass(jc3A);
        svc.addSeat(new Seat(201L, 2L, "B1-1", "LOWER"));

        // Seed Passenger 1
        svc.addPassenger(new Passenger(1L, "Soham More", "soham@example.com", "9876543210"));

        return new IsolatedContext(svc, pnrFile, auditFile);
    }

    public static void main(String[] args) throws Exception {
        System.out.println("====================================================");
        System.out.println("Running RailSync M1.4 Cross-Class Concurrency Tests (R-11)");
        System.out.println("====================================================");

        testCrossClassConcurrentBookingRace_FixtureR11(100);

        System.out.println("----------------------------------------------------");
        System.out.println(String.format("Cross-Class Tests Completed: %d/%d passed.", testsPassed, testsRun));
        System.out.println("====================================================");

        if (testsPassed != testsRun) {
            System.exit(1);
        }
    }

    /**
     * Fixture R-11: Concurrent Cross-Class Booking Race for Same Passenger & Journey.
     * Passenger 1 simultaneously attempts booking in Sleeper (Class 1) and AC 3A (Class 2)
     * on Journey 101 across concurrent worker threads coordinated with StartGate.
     * Verifies that across all repetitions:
     * - Exactly one thread confirms.
     * - The other thread encounters DuplicateConfirmedException.
     * - Zero duplicate allocations are created (INV-05 strictly upheld).
     * - Worker exceptions and unexpected outcomes cause immediate test failure.
     * - Timed-out workers fail the test and are interrupted.
     */
    public static void testCrossClassConcurrentBookingRace_FixtureR11(int repetitions) throws Exception {
        System.out.println();
        System.out.println(String.format("--- Fixture R-11: Cross-Class Concurrent Race (%d Repetitions) ---", repetitions));

        int confirmedSLCount = 0;
        int confirmed3ACount = 0;
        int duplicateExceptionCaught = 0;
        int invariantPassedCount = 0;

        for (int rep = 1; rep <= repetitions; rep++) {
            IsolatedContext ctx = createIsolatedServiceContext();
            try {
                InMemoryBookingService svc = ctx.service;

                final Booking[] results = new Booking[2];
                final Exception[] exceptions = new Exception[2];
                final StartGate startGate = new StartGate();

                // Thread 1: Attempts booking in Sleeper (Class 1)
                Thread t1 = new Thread(() -> {
                    try {
                        startGate.await();
                        results[0] = svc.bookTicket(1L, 1L, null);
                    } catch (Exception e) {
                        exceptions[0] = e;
                    }
                });

                // Thread 2: Attempts booking in AC 3-Tier (Class 2)
                Thread t2 = new Thread(() -> {
                    try {
                        startGate.await();
                        results[1] = svc.bookTicket(2L, 1L, null);
                    } catch (Exception e) {
                        exceptions[1] = e;
                    }
                });

                t1.start();
                t2.start();

                // Release both threads simultaneously into bookTicket()
                startGate.countDown();

                // Bounded join timeout (3000ms)
                t1.join(3000);
                t2.join(3000);

                // Check worker termination
                if (t1.isAlive() || t2.isAlive()) {
                    t1.interrupt();
                    t2.interrupt();
                    t1.join(500);
                    t2.join(500);
                    assertTrue(false, String.format("Repetition %d failed: Worker thread hung/timeout! t1.isAlive=%b, t2.isAlive=%b",
                            rep, t1.isAlive(), t2.isAlive()));
                    return;
                }

                // Propagate and validate worker exceptions
                if (exceptions[0] != null && !(exceptions[0] instanceof DuplicateConfirmedException)) {
                    assertTrue(false, String.format("Repetition %d Thread 1 unexpected exception: %s",
                            rep, exceptions[0]));
                    return;
                }
                if (exceptions[1] != null && !(exceptions[1] instanceof DuplicateConfirmedException)) {
                    assertTrue(false, String.format("Repetition %d Thread 2 unexpected exception: %s",
                            rep, exceptions[1]));
                    return;
                }

                // Verify exact confirmation and duplicate exception count
                boolean t1Confirmed = (results[0] != null && results[0].getStatus() == BookingStatus.CONFIRMED);
                boolean t2Confirmed = (results[1] != null && results[1].getStatus() == BookingStatus.CONFIRMED);

                boolean t1Duplicate = (exceptions[0] instanceof DuplicateConfirmedException);
                boolean t2Duplicate = (exceptions[1] instanceof DuplicateConfirmedException);

                if (t1Confirmed && !t2Confirmed && t2Duplicate) {
                    confirmedSLCount++;
                    duplicateExceptionCaught++;
                } else if (!t1Confirmed && t2Confirmed && t1Duplicate) {
                    confirmed3ACount++;
                    duplicateExceptionCaught++;
                } else {
                    assertTrue(false, String.format("Repetition %d invalid outcome! t1Confirmed=%b, t2Confirmed=%b, ex0=%s, ex1=%s",
                            rep, t1Confirmed, t2Confirmed, exceptions[0], exceptions[1]));
                    return;
                }

                // Verify exact number of confirmed bookings and allocations for passenger 1 on journey 101
                SeatAllocation[] slAlloc = svc.getAllocations(1L);
                SeatAllocation[] acAlloc = svc.getAllocations(2L);
                int totalAllocations = slAlloc.length + acAlloc.length;

                int passengerAllocations = 0;
                for (SeatAllocation sa : slAlloc) {
                    if (sa.getPassengerId() == 1L && sa.getJourneyId() == 101L) {
                        passengerAllocations++;
                    }
                }
                for (SeatAllocation sa : acAlloc) {
                    if (sa.getPassengerId() == 1L && sa.getJourneyId() == 101L) {
                        passengerAllocations++;
                    }
                }

                boolean hasConfirmed = svc.hasConfirmedBookingOnJourney(1L, 101L);

                if (totalAllocations != 1 || passengerAllocations != 1 || !hasConfirmed) {
                    assertTrue(false, String.format("Repetition %d invariant failure! totalAllocations=%d, passengerAllocations=%d, hasConfirmed=%b",
                            rep, totalAllocations, passengerAllocations, hasConfirmed));
                    return;
                }

                invariantPassedCount++;

            } finally {
                ctx.cleanup();
            }
        }

        assertTrue(true, String.format("All %d repetitions executed cleanly without race violations or timeouts", repetitions));
        assertTrue(duplicateExceptionCaught == repetitions, String.format("Exactly 1 DuplicateConfirmedException caught in every repetition (%d/%d)", duplicateExceptionCaught, repetitions));
        assertTrue(invariantPassedCount == repetitions, String.format("Invariant INV-05 verified: exactly 1 allocation and confirmed booking for passenger/journey across all repetitions (%d/%d)", invariantPassedCount, repetitions));
        assertTrue(confirmedSLCount > 0 && confirmed3ACount > 0, String.format("Both classes won race across iterations (SL won: %d, 3A won: %d)", confirmedSLCount, confirmed3ACount));
    }
}
