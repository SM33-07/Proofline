package railsync.model;

/**
 * Booking lifecycle statuses per SRS §3.1.
 */
public enum BookingStatus {
    PENDING,
    CONFIRMED,
    WAITLISTED,
    CANCELLED;

    /**
     * Validates whether transition from this status to target status is legal.
     * Legal transitions:
     * - PENDING -> CONFIRMED
     * - PENDING -> WAITLISTED
     * - PENDING -> CANCELLED
     * - CONFIRMED -> CANCELLED
     * - WAITLISTED -> CONFIRMED
     * - WAITLISTED -> CANCELLED
     */
    public boolean canTransitionTo(BookingStatus next) {
        if (next == null) return false;
        switch (this) {
            case PENDING:
                return next == CONFIRMED || next == WAITLISTED || next == CANCELLED;
            case CONFIRMED:
                return next == CANCELLED;
            case WAITLISTED:
                return next == CONFIRMED || next == CANCELLED;
            case CANCELLED:
                return false; // Terminal state
            default:
                return false;
        }
    }
}
