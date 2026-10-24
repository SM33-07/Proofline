package railsync.refund;

public class CaseEvent {
    private final String type;
    private final String eventTime;
    private final String source;
    private final Double numericValue;
    private final String textValue;

    public CaseEvent(String type, String eventTime, String source, Double numericValue, String textValue) {
        this.type = type;
        this.eventTime = eventTime;
        this.source = source;
        this.numericValue = numericValue;
        this.textValue = textValue;
    }

    public String getType() { return type; }
    public String getEventTime() { return eventTime; }
    public String getSource() { return source; }
    public Double getNumericValue() { return numericValue; }
    public String getTextValue() { return textValue; }
}
