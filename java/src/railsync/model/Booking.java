package railsync.model;

import railsync.exception.IllegalTransitionException;

public class Booking {
    private final long bookingId;
    private final String pnr;
    private final long journeyClassId;
    private final long passengerId;
    private BookingStatus status;
    private final String bookedAt;
    private final double fareInr;
    private final String groupRef;

    public Booking(long bookingId, String pnr, long journeyClassId, long passengerId,
                   BookingStatus initialStatus, String bookedAt, double fareInr, String groupRef) {
        if (pnr == null || pnr.trim().isEmpty()) {
            throw new IllegalArgumentException("PNR cannot be empty");
        }
        this.bookingId = bookingId;
        this.pnr = pnr;
        this.journeyClassId = journeyClassId;
        this.passengerId = passengerId;
        this.status = initialStatus != null ? initialStatus : BookingStatus.PENDING;
        this.bookedAt = bookedAt;
        this.fareInr = fareInr;
        this.groupRef = groupRef;
    }

    public long getBookingId() { return bookingId; }
    public String getPnr() { return pnr; }
    public long getJourneyClassId() { return journeyClassId; }
    public long getPassengerId() { return passengerId; }
    public BookingStatus getStatus() { return status; }
    public String getBookedAt() { return bookedAt; }
    public double getFareInr() { return fareInr; }
    public String getGroupRef() { return groupRef; }

    /**
     * Transition status according to legal state machine (FR-R08).
     */
    public synchronized void transitionTo(BookingStatus target) throws IllegalTransitionException {
        if (!this.status.canTransitionTo(target)) {
            throw new IllegalTransitionException(this.status, target);
        }
        this.status = target;
    }

    @Override
    public String toString() {
        return "Booking[id=" + bookingId + ", pnr=" + pnr + ", psg=" + passengerId + ", status=" + status + "]";
    }
}
