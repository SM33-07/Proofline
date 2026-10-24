package railsync.concurrency;

import railsync.model.Booking;
import railsync.model.BookingStatus;

/**
 * Thread-safe inventory correctly synchronizing check-and-claim inside an intrinsic monitor (FR-R16, Fixture R-02).
 * Guarantees Invariant INV-01 under maximum concurrency contention.
 */
public class SafeInventory {
    private int availableSeats = 1;
    private int confirmedBookingsCount = 0;
    private int waitlistedBookingsCount = 0;
    private final Booking[] bookings = new Booking[200];
    private int totalBookings = 0;
    private final Object journeyLock = new Object();

    public SafeInventory(int initialSeats) {
        this.availableSeats = initialSeats;
    }

    /**
     * Thread-safe booking under synchronized journeyLock.
     */
    public Booking bookTicketSafe(long bookingId, String pnr, long passengerId) {
        synchronized (journeyLock) {
            Booking b;
            if (availableSeats > 0) {
                availableSeats--;
                b = new Booking(bookingId, pnr, 1L, passengerId, BookingStatus.CONFIRMED,
                        "2026-10-24T21:00:00+05:30", 500.0, null);
                confirmedBookingsCount++;
            } else {
                b = new Booking(bookingId, pnr, 1L, passengerId, BookingStatus.WAITLISTED,
                        "2026-10-24T21:00:00+05:30", 500.0, null);
                waitlistedBookingsCount++;
            }
            bookings[totalBookings++] = b;
            return b;
        }
    }

    public int getConfirmedBookingsCount() {
        synchronized (journeyLock) {
            return confirmedBookingsCount;
        }
    }

    public int getWaitlistedBookingsCount() {
        synchronized (journeyLock) {
            return waitlistedBookingsCount;
        }
    }

    public int getAvailableSeats() {
        synchronized (journeyLock) {
            return availableSeats;
        }
    }
}
