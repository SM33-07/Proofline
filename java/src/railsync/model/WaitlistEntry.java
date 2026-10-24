package railsync.model;

public class WaitlistEntry {
    private final long waitlistId;
    private final long bookingId;
    private final long journeyClassId;
    private int waitlistPosition;
    private final String createdAt;

    public WaitlistEntry(long waitlistId, long bookingId, long journeyClassId, int waitlistPosition, String createdAt) {
        this.waitlistId = waitlistId;
        this.bookingId = bookingId;
        this.journeyClassId = journeyClassId;
        this.waitlistPosition = waitlistPosition;
        this.createdAt = createdAt;
    }

    public long getWaitlistId() { return waitlistId; }
    public long getBookingId() { return bookingId; }
    public long getJourneyClassId() { return journeyClassId; }
    public int getWaitlistPosition() { return waitlistPosition; }
    public void setWaitlistPosition(int pos) { this.waitlistPosition = pos; }
    public String getCreatedAt() { return createdAt; }

    @Override
    public String toString() {
        return "WaitlistEntry[id=" + waitlistId + ", bkg=" + bookingId + ", pos=" + waitlistPosition + "]";
    }
}
