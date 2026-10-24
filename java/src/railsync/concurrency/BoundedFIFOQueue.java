package railsync.concurrency;

/**
 * Bounded FIFO Queue implemented strictly using a fixed-size Object[] array
 * and native Java monitor primitives (synchronized, wait, notifyAll).
 * Strictly complies with CSC2104 lab constraints (FR-R13, NFR-10).
 */
public class BoundedFIFOQueue {
    private final Object[] buffer;
    private final int capacity;
    private int head = 0;
    private int tail = 0;
    private int count = 0;
    private boolean isShutdown = false;

    public BoundedFIFOQueue(int capacity) {
        if (capacity <= 0) {
            throw new IllegalArgumentException("Queue capacity must be positive: " + capacity);
        }
        this.capacity = capacity;
        this.buffer = new Object[capacity];
    }

    /**
     * Inserts item at tail of queue. Blocks if queue is full.
     * Throws IllegalStateException if queue is shut down.
     */
    public synchronized void put(Object item) throws InterruptedException {
        if (item == null) {
            throw new IllegalArgumentException("Cannot put null item into queue");
        }
        while (count == capacity && !isShutdown) {
            wait();
        }
        if (isShutdown) {
            throw new IllegalStateException("Queue is shut down; new submissions rejected");
        }
        buffer[tail] = item;
        tail = (tail + 1) % capacity;
        count++;
        notifyAll();
    }

    /**
     * Removes and returns item from head of queue. Blocks if queue is empty.
     * Returns null if queue is empty and shut down.
     */
    public synchronized Object take() throws InterruptedException {
        while (count == 0 && !isShutdown) {
            wait();
        }
        if (count == 0 && isShutdown) {
            return null; // Drained and shutdown
        }
        Object item = buffer[head];
        buffer[head] = null; // Prevent memory leak
        head = (head + 1) % capacity;
        count--;
        notifyAll();
        return item;
    }

    /**
     * Graceful shutdown: rejects new submissions, wakes all waiting threads,
     * allows existing queued items to be drained.
     */
    public synchronized void shutdown() {
        this.isShutdown = true;
        notifyAll();
    }

    public synchronized int size() {
        return count;
    }

    public synchronized int capacity() {
        return capacity;
    }

    public synchronized boolean isShutdown() {
        return isShutdown;
    }
}
