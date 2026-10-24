package railsync.refund;

public class ReasonCode {
    public static final String RULE_NOT_FOUND = "RULE_NOT_FOUND";
    public static final String RULE_SOURCE_UNVERIFIED = "RULE_SOURCE_UNVERIFIED";
    public static final String RULE_INTERVAL_CONFLICT = "RULE_INTERVAL_CONFLICT";
    public static final String UNSUPPORTED_TICKET_SCOPE = "UNSUPPORTED_TICKET_SCOPE";

    public static final String DELAY_OVER_THRESHOLD = "DELAY_OVER_THRESHOLD";
    public static final String DELAY_NOT_OVER_THRESHOLD = "DELAY_NOT_OVER_THRESHOLD";
    public static final String DELAY_UNKNOWN = "DELAY_UNKNOWN";
    public static final String DELAY_UNVERIFIED = "DELAY_UNVERIFIED";
    public static final String ACTUAL_DEPARTURE_UNKNOWN = "ACTUAL_DEPARTURE_UNKNOWN";

    public static final String PASSENGER_TRAVELLED = "PASSENGER_TRAVELLED";
    public static final String TRAVEL_STATUS_UNKNOWN = "TRAVEL_STATUS_UNKNOWN";
    public static final String FILING_ATTEMPT_UNKNOWN = "FILING_ATTEMPT_UNKNOWN";
    public static final String FILED_BEFORE_DEPARTURE = "FILED_BEFORE_DEPARTURE";
    public static final String FILED_AFTER_DEPARTURE = "FILED_AFTER_DEPARTURE";

    public static final String TRAIN_CANCELLED_AUTO_REFUND = "TRAIN_CANCELLED_AUTO_REFUND";
    public static final String TRAIN_CANCELLATION_UNKNOWN = "TRAIN_CANCELLATION_UNKNOWN";

    public static final String EVENT_CONFLICT = "EVENT_CONFLICT";
    public static final String EVENT_SCOPE_MISMATCH = "EVENT_SCOPE_MISMATCH";
    public static final String EVALUATION_FAILED = "EVALUATION_FAILED";
}
