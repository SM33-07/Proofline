package railsync.model;

public class Train {
    private final long trainId;
    private final String trainNumber;
    private final String trainName;

    public Train(long trainId, String trainNumber, String trainName) {
        this.trainId = trainId;
        this.trainNumber = trainNumber;
        this.trainName = trainName;
    }

    public long getTrainId() { return trainId; }
    public String getTrainNumber() { return trainNumber; }
    public String getTrainName() { return trainName; }

    @Override
    public String toString() {
        return "Train[" + trainNumber + " - " + trainName + "]";
    }
}
