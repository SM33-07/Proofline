package railsync.model;

public class SeatAllocation {
    private final long allocationId;
    private final long bookingId;
    private final long journeySeatId;
    private final long passengerId;
    private final long journeyId;
    private final String allocatedAt;

    public SeatAllocation(long allocationId, long bookingId, long journeySeatId,
                          long passengerId, long journeyId, String allocatedAt) {
        this.allocationId = allocationId;
        this.bookingId = bookingId;
        this.journeySeatId = journeySeatId;
        this.passengerId = passengerId;
        this.journeyId = journeyId;
        this.allocatedAt = allocatedAt;
    }

    public long getAllocationId() { return allocationId; }
    public long getBookingId() { return bookingId; }
    public long getJourneySeatId() { return journeySeatId; }
    public long getPassengerId() { return passengerId; }
    public long getJourneyId() { return journeyId; }
    public String getAllocatedAt() { return allocatedAt; }

    @Override
    public String toString() {
        return "Allocation[id=" + allocationId + ", bkg=" + bookingId + ", seat=" + journeySeatId + "]";
    }
}
