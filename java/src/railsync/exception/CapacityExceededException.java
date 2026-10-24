package railsync.exception;

public class CapacityExceededException extends RailSyncException {
    public CapacityExceededException(String classCode, int current, int capacity) {
        super("Capacity exceeded for class " + classCode + ": current=" + current + ", capacity=" + capacity + " (INV-01 violation)");
    }
}
