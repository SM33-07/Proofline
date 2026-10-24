package railsync.exception;

public class RailSyncException extends Exception {
    public RailSyncException(String message) {
        super(message);
    }
    public RailSyncException(String message, Throwable cause) {
        super(message, cause);
    }
}
