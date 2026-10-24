package railsync;

import railsync.model.*;
import railsync.exception.*;
import railsync.service.*;
import java.io.File;

/**
 * Sequential Acceptance Test Suite for Gate 1.
 * Tests Scenarios S-01 through S-05, all legal/illegal lifecycle transitions,
 * PNR persistence across restarts, and Invariant INV-05 enforcement.
 */
public class SequentialBookingTest {

    private static int testsRun = 0;
    private static int testsPassed = 0;

    private static void assertTrue(boolean condition, String testName) {
        testsRun++;
        if (condition) {
            testsPassed++;
            System.out.println("  [PASS] " + testName);
        } else {
            System.err.println("  [FAIL] " + testName);
        }
    }

    private static InMemoryBookingService createSeededService(String pnrFile, String auditFile) {
        new File(pnrFile).delete();
        new File(auditFile).delete();

        PnrGenerator pnrGen = new PnrGenerator(pnrFile);
        AuditLogger auditLogger = new AuditLogger(auditFile);
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

        // Class 2: AC 3-Tier (1 seat for contention/overflow testing)
        JourneyClass jc3A = new JourneyClass(2L, 101L, "3A", 1, 1450.0);
        svc.addJourneyClass(jc3A);
        svc.addSeat(new Seat(201L, 2L, "B1-1", "LOWER"));

        // Class 3: General (0 seats for zero-capacity testing)
        JourneyClass jcGN = new JourneyClass(3L, 101L, "GN", 0, 180.0);
        svc.addJourneyClass(jcGN);

        // Seed Passengers
        svc.addPassenger(new Passenger(1L, "Soham More", "soham@example.com", "9876543210"));
        svc.addPassenger(new Passenger(2L, "Rahul Sharma", "rahul@example.com", "9876543211"));
        svc.addPassenger(new Passenger(3L, "Ananya Verma", "ananya@example.com", "9876543212"));
        svc.addPassenger(new Passenger(4L, "Priya Singh", "priya@example.com", "9876543213"));

        return svc;
    }

    public static void main(String[] args) {
        System.out.println("====================================================");
        System.out.println("Running RailSync Gate 1 Sequential Acceptance Tests");
        System.out.println("====================================================");

        testS01_HappyPathBooking();
        testS02_OverflowToWaitlist();
        testS03_CrossClassDuplicateRejection();
        testS04_CancellationWithCascadePromotion();
        testS05_ZeroSeatClassBooking();
        testLifecycleStateTransitions();
        testPnrPersistenceAcrossRestarts();
        testIneligibleWaitlistSkip();
        testWaitlistCancellation();

        System.out.println("----------------------------------------------------");
        System.out.println(String.format("Tests Completed: %d/%d passed.", testsPassed, testsRun));
        System.out.println("====================================================");

        if (testsPassed != testsRun) {
            System.exit(1);
        }
    }

    private static void testS01_HappyPathBooking() {
        System.out.println();
        System.out.println("Test S-01: Happy Path Booking into Available Sleeper Class");
        try {
            InMemoryBookingService svc = createSeededService("data/test_s01_pnr.dat", "data/test_s01_audit.log");
            Booking b = svc.bookTicket(1L, 1L, "GRP-001");

            assertTrue(b != null, "Booking object created");
            assertTrue(b.getStatus() == BookingStatus.CONFIRMED, "Booking status is CONFIRMED");
            assertTrue(svc.getConfirmedCount(1L) == 1, "Confirmed count in class is 1");
            assertTrue(svc.getAllocations(1L).length == 1, "Exactly one seat allocation created");
            assertTrue(svc.getAvailableSeats(1L) == 4, "Available seats decremented to 4");
            assertTrue(b.getPnr().startsWith("PNR-"), "Valid PNR issued: " + b.getPnr());
        } catch (Exception e) {
            e.printStackTrace();
            assertTrue(false, "S-01 Exception: " + e.getMessage());
        }
    }

    private static void testS02_OverflowToWaitlist() {
        System.out.println();
        System.out.println("Test S-02: Overflow to Waitlist on 1-Seat Class");
        try {
            InMemoryBookingService svc = createSeededService("data/test_s02_pnr.dat", "data/test_s02_audit.log");
            // Class 2 has 1 seat
            Booking b1 = svc.bookTicket(2L, 1L, null);
            assertTrue(b1.getStatus() == BookingStatus.CONFIRMED, "First booking CONFIRMED");

            Booking b2 = svc.bookTicket(2L, 2L, null);
            assertTrue(b2.getStatus() == BookingStatus.WAITLISTED, "Second booking WAITLISTED");
            assertTrue(svc.getConfirmedCount(2L) == 1, "Confirmed count remains 1");

            WaitlistEntry[] wl = svc.getWaitlist(2L);
            assertTrue(wl.length == 1, "Waitlist contains 1 entry");
            assertTrue(wl[0].getWaitlistPosition() == 1, "Waitlist position is 1");
            assertTrue(wl[0].getBookingId() == b2.getBookingId(), "Waitlist links to second booking");
        } catch (Exception e) {
            e.printStackTrace();
            assertTrue(false, "S-02 Exception: " + e.getMessage());
        }
    }

    private static void testS03_CrossClassDuplicateRejection() {
        System.out.println();
        System.out.println("Test S-03: Cross-Class Duplicate Confirmation Rejection (INV-05)");
        try {
            InMemoryBookingService svc = createSeededService("data/test_s03_pnr.dat", "data/test_s03_audit.log");
            // Passenger 1 confirmed in Sleeper (Journey 101)
            Booking b1 = svc.bookTicket(1L, 1L, null);
            assertTrue(b1.getStatus() == BookingStatus.CONFIRMED, "Passenger 1 confirmed in SL");

            // Attempt to book Passenger 1 into AC (Class 2) on the SAME journey 101
            boolean caught = false;
            try {
                svc.bookTicket(2L, 1L, null);
            } catch (DuplicateConfirmedException e) {
                caught = true;
            }
            assertTrue(caught, "DuplicateConfirmedException thrown on cross-class double-booking attempt");
            assertTrue(svc.getConfirmedCount(2L) == 0, "AC class remains empty; 0 side effects");
        } catch (Exception e) {
            e.printStackTrace();
            assertTrue(false, "S-03 Exception: " + e.getMessage());
        }
    }

    private static void testS04_CancellationWithCascadePromotion() {
        System.out.println();
        System.out.println("Test S-04: Cancellation with Cascade Waitlist Promotion");
        try {
            InMemoryBookingService svc = createSeededService("data/test_s04_pnr.dat", "data/test_s04_audit.log");
            // Class 2 has 1 seat
            Booking b1 = svc.bookTicket(2L, 1L, null); // Confirmed
            Booking b2 = svc.bookTicket(2L, 2L, null); // Waitlisted (Pos 1)
            Booking b3 = svc.bookTicket(2L, 3L, null); // Waitlisted (Pos 2)

            assertTrue(b1.getStatus() == BookingStatus.CONFIRMED, "Booking 1 confirmed");
            assertTrue(b2.getStatus() == BookingStatus.WAITLISTED, "Booking 2 waitlisted");
            assertTrue(b3.getStatus() == BookingStatus.WAITLISTED, "Booking 3 waitlisted");

            // Cancel b1
            Booking cancelled = svc.cancelBooking(b1.getPnr());
            assertTrue(cancelled.getStatus() == BookingStatus.CANCELLED, "Booking 1 status transitioned to CANCELLED");

            // Verify Promotion of b2
            Booking promoted = svc.getBookingById(b2.getBookingId());
            assertTrue(promoted.getStatus() == BookingStatus.CONFIRMED, "Booking 2 promoted to CONFIRMED");
            assertTrue(svc.getAllocations(2L).length == 1, "Exactly 1 active allocation in class");
            assertTrue(svc.getAllocations(2L)[0].getBookingId() == b2.getBookingId(), "Seat allocated to Booking 2");

            // Verify b3 remains waitlisted at new position 1
            WaitlistEntry[] wl = svc.getWaitlist(2L);
            assertTrue(wl.length == 1, "Waitlist now has 1 entry");
            assertTrue(wl[0].getBookingId() == b3.getBookingId(), "Remaining entry is Booking 3");
            assertTrue(wl[0].getWaitlistPosition() == 1, "Booking 3 re-indexed to position 1");
        } catch (Exception e) {
            e.printStackTrace();
            assertTrue(false, "S-04 Exception: " + e.getMessage());
        }
    }

    private static void testS05_ZeroSeatClassBooking() {
        System.out.println();
        System.out.println("Test S-05: Booking into Zero-Seat General Class");
        try {
            InMemoryBookingService svc = createSeededService("data/test_s05_pnr.dat", "data/test_s05_audit.log");
            // Class 3 has 0 total seats
            Booking b = svc.bookTicket(3L, 1L, null);

            assertTrue(b.getStatus() == BookingStatus.WAITLISTED, "Zero-seat booking is immediately WAITLISTED");
            assertTrue(svc.getConfirmedCount(3L) == 0, "Confirmed count remains 0");
            assertTrue(svc.getAllocations(3L).length == 0, "Zero seat allocations created");
            assertTrue(svc.getWaitlist(3L).length == 1, "Waitlist contains 1 entry");
        } catch (Exception e) {
            e.printStackTrace();
            assertTrue(false, "S-05 Exception: " + e.getMessage());
        }
    }

    private static void testLifecycleStateTransitions() {
        System.out.println();
        System.out.println("Test Lifecycle: Complete SRS Legal & Illegal State Transitions");
        // Legal Transitions
        assertTrue(BookingStatus.PENDING.canTransitionTo(BookingStatus.CONFIRMED), "Legal: PENDING -> CONFIRMED");
        assertTrue(BookingStatus.PENDING.canTransitionTo(BookingStatus.WAITLISTED), "Legal: PENDING -> WAITLISTED");
        assertTrue(BookingStatus.PENDING.canTransitionTo(BookingStatus.CANCELLED), "Legal: PENDING -> CANCELLED");
        assertTrue(BookingStatus.CONFIRMED.canTransitionTo(BookingStatus.CANCELLED), "Legal: CONFIRMED -> CANCELLED");
        assertTrue(BookingStatus.WAITLISTED.canTransitionTo(BookingStatus.CONFIRMED), "Legal: WAITLISTED -> CONFIRMED");
        assertTrue(BookingStatus.WAITLISTED.canTransitionTo(BookingStatus.CANCELLED), "Legal: WAITLISTED -> CANCELLED");

        // Illegal Transitions
        assertTrue(!BookingStatus.CANCELLED.canTransitionTo(BookingStatus.CONFIRMED), "Illegal: CANCELLED -> CONFIRMED");
        assertTrue(!BookingStatus.CANCELLED.canTransitionTo(BookingStatus.PENDING), "Illegal: CANCELLED -> PENDING");
        assertTrue(!BookingStatus.CONFIRMED.canTransitionTo(BookingStatus.WAITLISTED), "Illegal: CONFIRMED -> WAITLISTED");
        assertTrue(!BookingStatus.CONFIRMED.canTransitionTo(BookingStatus.PENDING), "Illegal: CONFIRMED -> PENDING");

        // Object-level transition test
        Booking b = new Booking(999L, "PNR-TEST", 1L, 1L, BookingStatus.CANCELLED, "2026-10-24T20:00:00+05:30", 500.0, null);
        boolean caught = false;
        try {
            b.transitionTo(BookingStatus.CONFIRMED);
        } catch (IllegalTransitionException e) {
            caught = true;
        }
        assertTrue(caught, "IllegalTransitionException thrown on CANCELLED -> CONFIRMED");
    }

    private static void testPnrPersistenceAcrossRestarts() {
        System.out.println();
        System.out.println("Test PNR Persistence: Monotonic sequence surviving generator restart (ADR-7)");
        String testFile = "data/test_restart_pnr.dat";
        new File(testFile).delete();

        PnrGenerator gen1 = new PnrGenerator(testFile);
        String pnr1 = gen1.nextPnr();
        String pnr2 = gen1.nextPnr();
        assertTrue(pnr1.equals("PNR-00000001"), "First PNR is PNR-00000001");
        assertTrue(pnr2.equals("PNR-00000002"), "Second PNR is PNR-00000002");

        // Simulate application restart by creating a new generator instance pointing to same file
        PnrGenerator gen2 = new PnrGenerator(testFile);
        String pnr3 = gen2.nextPnr();
        assertTrue(pnr3.equals("PNR-00000003"), "Third PNR after restart resumes monotonically: PNR-00000003");
    }

    private static void testIneligibleWaitlistSkip() {
        System.out.println();
        System.out.println("Test FR-R17: Ineligible Waitlist Candidate Skipped Without Mutation");
        try {
            InMemoryBookingService svc = createSeededService("data/test_ineligible_pnr.dat", "data/test_ineligible_audit.log");
            // Passenger 1 confirmed in AC (Class 2, 1 seat)
            Booking bAc = svc.bookTicket(2L, 1L, null);
            assertTrue(bAc.getStatus() == BookingStatus.CONFIRMED, "P1 confirmed in AC");

            // In Sleeper (Class 1), fill all 5 seats
            for (int s = 0; s < 5; s++) {
                svc.addPassenger(new Passenger(100L + s, "Dummy" + s, "d@ex.com", "900000000" + s));
                svc.bookTicket(1L, 100L + s, null);
            }
            assertTrue(svc.getAvailableSeats(1L) == 0, "Sleeper is completely full");

            // Waitlist Candidate 1: Passenger 1 (who already holds confirmed seat in AC on Journey 101!)
            Booking wl1 = svc.bookTicket(1L, 1L, null);
            assertTrue(wl1.getStatus() == BookingStatus.WAITLISTED, "P1 waitlisted in Sleeper (Waitlist #1)");

            // Waitlist Candidate 2: Passenger 3 (clean, holds no other seats)
            Booking wl2 = svc.bookTicket(1L, 3L, null);
            assertTrue(wl2.getStatus() == BookingStatus.WAITLISTED, "P3 waitlisted in Sleeper (Waitlist #2)");

            // Cancel the first confirmed seat in Sleeper (booked by Dummy 0)
            Booking dummy0 = svc.getBookingById(2L); // ID 2 is first Sleeper bkg
            svc.cancelBooking(dummy0.getPnr());

            // Check Promotion Result:
            // P1 was ineligible (holds confirmed AC seat) -> MUST BE SKIPPED without mutation
            // P3 was eligible -> MUST BE PROMOTED!
            Booking p1After = svc.getBookingById(wl1.getBookingId());
            Booking p3After = svc.getBookingById(wl2.getBookingId());

            assertTrue(p1After.getStatus() == BookingStatus.WAITLISTED, "Ineligible P1 remains WAITLISTED (skipped)");
            assertTrue(p3After.getStatus() == BookingStatus.CONFIRMED, "Eligible P3 promoted to CONFIRMED");
            assertTrue(svc.getConfirmedCount(1L) == 5, "Sleeper confirmed count remains exactly 5 (INV-01 satisfied)");
        } catch (Exception e) {
            e.printStackTrace();
            assertTrue(false, "Ineligible skip Exception: " + e.getMessage());
        }
    }

    private static void testWaitlistCancellation() {
        System.out.println();
        System.out.println("Test Waitlist Cancellation (FR-R07): No seat released, no promotion");
        try {
            InMemoryBookingService svc = createSeededService("data/test_wl_cancel_pnr.dat", "data/test_wl_cancel_audit.log");
            Booking b1 = svc.bookTicket(2L, 1L, null); // Confirmed in 1-seat AC
            Booking b2 = svc.bookTicket(2L, 2L, null); // Waitlisted

            Booking cancelled = svc.cancelBooking(b2.getPnr());
            assertTrue(cancelled.getStatus() == BookingStatus.CANCELLED, "Waitlisted booking transitioned to CANCELLED");
            assertTrue(svc.getWaitlist(2L).length == 0, "Waitlist is now empty");
            assertTrue(svc.getConfirmedCount(2L) == 1, "Confirmed count unchanged (1 seat)");
        } catch (Exception e) {
            e.printStackTrace();
            assertTrue(false, "Waitlist cancellation Exception: " + e.getMessage());
        }
    }
}
