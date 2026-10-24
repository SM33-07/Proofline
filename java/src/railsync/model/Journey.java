package railsync.model;

public class Journey {
    private final long journeyId;
    private final long trainId;
    private final String departureDate; // YYYY-MM-DD
    private final String departureTime; // HH:MM:SS
    private final double distanceKm;
    private String status; // SCHEDULED, CANCELLED, DELAYED

    public Journey(long journeyId, long trainId, String departureDate, String departureTime, double distanceKm) {
        this.journeyId = journeyId;
        this.trainId = trainId;
        this.departureDate = departureDate;
        this.departureTime = departureTime;
        this.distanceKm = distanceKm;
        this.status = "SCHEDULED";
    }

    public long getJourneyId() { return journeyId; }
    public long getTrainId() { return trainId; }
    public String getDepartureDate() { return departureDate; }
    public String getDepartureTime() { return departureTime; }
    public double getDistanceKm() { return distanceKm; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    @Override
    public String toString() {
        return "Journey[id=" + journeyId + ", date=" + departureDate + " " + departureTime + ", status=" + status + "]";
    }
}
