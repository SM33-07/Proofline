package railsync.model;

public class JourneyClass {
    private final long journeyClassId;
    private final long journeyId;
    private final String classCode;
    private final int totalSeats;
    private final double baseFareInr;

    public JourneyClass(long journeyClassId, long journeyId, String classCode, int totalSeats, double baseFareInr) {
        if (totalSeats < 0) throw new IllegalArgumentException("Total seats cannot be negative");
        if (baseFareInr < 0) throw new IllegalArgumentException("Base fare cannot be negative");
        this.journeyClassId = journeyClassId;
        this.journeyId = journeyId;
        this.classCode = classCode;
        this.totalSeats = totalSeats;
        this.baseFareInr = baseFareInr;
    }

    public long getJourneyClassId() { return journeyClassId; }
    public long getJourneyId() { return journeyId; }
    public String getClassCode() { return classCode; }
    public int getTotalSeats() { return totalSeats; }
    public double getBaseFareInr() { return baseFareInr; }

    @Override
    public String toString() {
        return "JourneyClass[" + classCode + ", seats=" + totalSeats + ", fare=" + baseFareInr + "]";
    }
}
