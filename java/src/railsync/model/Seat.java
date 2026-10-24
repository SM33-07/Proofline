package railsync.model;

public class Seat {
    private final long journeySeatId;
    private final long journeyClassId;
    private final String seatNumber;
    private final String berthType; // LOWER, MIDDLE, UPPER, SIDE_LOWER, SIDE_UPPER

    public Seat(long journeySeatId, long journeyClassId, String seatNumber, String berthType) {
        this.journeySeatId = journeySeatId;
        this.journeyClassId = journeyClassId;
        this.seatNumber = seatNumber;
        this.berthType = berthType;
    }

    public long getJourneySeatId() { return journeySeatId; }
    public long getJourneyClassId() { return journeyClassId; }
    public String getSeatNumber() { return seatNumber; }
    public String getBerthType() { return berthType; }

    @Override
    public String toString() {
        return "Seat[" + seatNumber + " (" + berthType + ")]";
    }
}
