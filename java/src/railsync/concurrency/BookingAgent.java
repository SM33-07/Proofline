package railsync.concurrency;

import railsync.service.BookingBackend;
import railsync.model.Booking;

/**
 * Concurrent worker agent thread consuming requests from BoundedFIFOQueue (FR-R14).
 */
public class BookingAgent implements Runnable {
    private final int agentId;
    private final BoundedFIFOQueue queue;
    private final BookingBackend backend;
    private int processedCount = 0;
    private volatile boolean running = true;

    public BookingAgent(int agentId, BoundedFIFOQueue queue, BookingBackend backend) {
        this.agentId = agentId;
        this.queue = queue;
        this.backend = backend;
    }

    @Override
    public void run() {
        try {
            while (running) {
                Object item = queue.take();
                if (item == null) {
                    // Queue shutdown and drained
                    break;
                }
                if (item instanceof BookingRequest) {
                    BookingRequest req = (BookingRequest) item;
                    if (backend != null) {
                        backend.bookTicket(req.getJourneyClassId(), req.getPassengerId(), req.getGroupRef());
                    }
                    processedCount++;
                }
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            System.err.println("Agent " + agentId + " encountered error: " + e.getMessage());
        }
    }

    public void stopAgent() {
        this.running = false;
    }

    public int getProcessedCount() {
        return processedCount;
    }

    public int getAgentId() {
        return agentId;
    }
}
