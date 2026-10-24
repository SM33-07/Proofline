package railsync.concurrency;

/**
 * Two-party coordination barrier placed between capacity read and seat claim.
 * Forces both concurrent threads to observe the same available seat count
 * before either is allowed to proceed to claim (ADR-8).
 */
public class ReadBarrier {
    private final int parties;
    private int count;

    public ReadBarrier(int parties) {
        this.parties = parties;
        this.count = 0;
    }

    public synchronized void await() throws InterruptedException {
        count++;
        if (count >= parties) {
            notifyAll();
        } else {
            while (count < parties) {
                wait();
            }
        }
    }

    public synchronized void reset() {
        this.count = 0;
    }
}
