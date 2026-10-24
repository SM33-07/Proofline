package railsync.concurrency;

import railsync.model.Booking;
import railsync.model.BookingStatus;

/**
 * Deliberately flawed inventory demonstrating check-then-act race condition (FR-R15, Fixture R-01).
 * Uses a staged ReadBarrier to force both workers to read availableSeats == 1 simultaneously.
 */
public class UnsafeInventory {
    private int availableSeats = 1;
    private int confirmedBookingsCount = 0;
    private final Booking[] confirmedBookings = new Booking[10];
    private final ReadBarrier readBarrier;

    public UnsafeInventory(ReadBarrier readBarrier) {
        this.readBarrier = readBarrier;
    }

    /**
     * Unsafe check-then-claim method lacking synchronization.
     */
    public Booking bookTicketUnsafe(long bookingId, String pnr, long passengerId) throws InterruptedException {
        // Step 1: Read remaining capacity WITHOUT lock
        int observed = availableSeats;

        // Step 2: Coordinated barrier forces both threads to observe availableSeats == 1 concurrently!
        if (readBarrier != null) {
            readBarrier.await();
        }

        // Step 3: Check condition and claim seat (check-then-act flaw)
        if (observed > 0) {
            // Artificial tiny delay mimicking database/network latency
            Thread.sleep(5);

            // Both threads claim the seat!
            availableSeats--;
            Booking b = new Booking(bookingId, pnr, 1L, passengerId, BookingStatus.CONFIRMED,
                    "2026-10-24T21:00:00+05:30", 500.0, null);

            synchronized (this) {
                confirmedBookings[confirmedBookingsCount++] = b;
            }
            return b;
        } else {
            return new Booking(bookingId, pnr, 1L, passengerId, BookingStatus.WAITLISTED,
                    "2026-10-24T21:00:00+05:30", 500.0, null);
        }
    }

    public synchronized int getConfirmedBookingsCount() {
        return confirmedBookingsCount;
    }

    public synchronized int getAvailableSeats() {
        return availableSeats;
    }
}
