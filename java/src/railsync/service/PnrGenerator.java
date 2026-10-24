package railsync.service;

import java.io.*;

/**
 * Thread-safe monotonic non-recycling PNR sequence generator (FR-R02, ADR-7).
 * State survives application restarts via persistent sequence file.
 */
public class PnrGenerator {
    private static final String DEFAULT_FILE = "data/pnr_sequence.dat";
    private final File sequenceFile;
    private long currentSequence;

    public PnrGenerator() {
        this(DEFAULT_FILE);
    }

    public PnrGenerator(String filePath) {
        this.sequenceFile = new File(filePath);
        File parent = sequenceFile.getParentFile();
        if (parent != null && !parent.exists()) {
            parent.mkdirs();
        }
        this.currentSequence = loadSequence();
    }

    private synchronized long loadSequence() {
        if (!sequenceFile.exists()) {
            saveSequence(0);
            return 0;
        }
        try (DataInputStream in = new DataInputStream(new FileInputStream(sequenceFile))) {
            return in.readLong();
        } catch (IOException e) {
            return 0;
        }
    }

    private synchronized void saveSequence(long seq) {
        try (DataOutputStream out = new DataOutputStream(new FileOutputStream(sequenceFile))) {
            out.writeLong(seq);
            out.flush();
        } catch (IOException e) {
            System.err.println("Warning: Failed to persist PNR sequence: " + e.getMessage());
        }
    }

    /**
     * Generates next PNR in sequence: PNR-00000001, PNR-00000002...
     * If transaction aborts, the sequence is never rolled back (intentional gap).
     */
    public synchronized String nextPnr() {
        currentSequence++;
        saveSequence(currentSequence);
        return String.format("PNR-%08d", currentSequence);
    }

    public synchronized long getCurrentSequence() {
        return currentSequence;
    }
}
