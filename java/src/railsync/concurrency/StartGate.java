package railsync.concurrency;

/**
 * Monitor-based barrier used to release worker threads simultaneously (FR-R15).
 */
public class StartGate {
    private boolean open = false;

    public synchronized void await() throws InterruptedException {
        while (!open) {
            wait();
        }
    }

    public synchronized void countDown() {
        this.open = true;
        notifyAll();
    }

    public synchronized boolean isOpen() {
        return open;
    }
}
