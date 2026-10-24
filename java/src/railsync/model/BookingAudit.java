package railsync.model;

public class BookingAudit {
    private final long auditId;
    private final long bookingId;
    private final BookingStatus fromStatus;
    private final BookingStatus toStatus;
    private final String reason;
    private final String changedAt;
    private final String changedBy;

    public BookingAudit(long auditId, long bookingId, BookingStatus fromStatus,
                        BookingStatus toStatus, String reason, String changedAt, String changedBy) {
        this.auditId = auditId;
        this.bookingId = bookingId;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.reason = reason;
        this.changedAt = changedAt;
        this.changedBy = changedBy;
    }

    public long getAuditId() { return auditId; }
    public long getBookingId() { return bookingId; }
    public BookingStatus getFromStatus() { return fromStatus; }
    public BookingStatus getToStatus() { return toStatus; }
    public String getReason() { return reason; }
    public String getChangedAt() { return changedAt; }
    public String getChangedBy() { return changedBy; }

    @Override
    public String toString() {
        return "Audit[bkg=" + bookingId + ": " + fromStatus + " -> " + toStatus + " (" + reason + ")]";
    }
}
