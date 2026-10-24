package railsync.exception;

public class DuplicateConfirmedException extends RailSyncException {
    public DuplicateConfirmedException(long passengerId, long journeyId) {
        super("Passenger " + passengerId + " already holds a CONFIRMED booking on journey " + journeyId + " (INV-05 violation)");
    }
}
