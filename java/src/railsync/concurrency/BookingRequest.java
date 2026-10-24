package railsync.concurrency;

/**
 * Value object representing a concurrent booking request.
 */
public class BookingRequest {
    private final long requestId;
    private final long journeyClassId;
    private final long passengerId;
    private final String groupRef;

    public BookingRequest(long requestId, long journeyClassId, long passengerId, String groupRef) {
        this.requestId = requestId;
        this.journeyClassId = journeyClassId;
        this.passengerId = passengerId;
        this.groupRef = groupRef;
    }

    public long getRequestId() { return requestId; }
    public long getJourneyClassId() { return journeyClassId; }
    public long getPassengerId() { return passengerId; }
    public String getGroupRef() { return groupRef; }

    @Override
    public String toString() {
        return "BookingRequest[id=" + requestId + ", class=" + journeyClassId + ", psg=" + passengerId + "]";
    }
}
