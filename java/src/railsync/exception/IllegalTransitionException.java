package railsync.exception;

import railsync.model.BookingStatus;

public class IllegalTransitionException extends RailSyncException {
    private final BookingStatus fromStatus;
    private final BookingStatus toStatus;

    public IllegalTransitionException(BookingStatus fromStatus, BookingStatus toStatus) {
        super("Illegal booking status transition from " + fromStatus + " to " + toStatus);
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
    }

    public BookingStatus getFromStatus() { return fromStatus; }
    public BookingStatus getToStatus() { return toStatus; }
}
