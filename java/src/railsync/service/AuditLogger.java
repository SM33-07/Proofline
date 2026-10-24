package railsync.service;

import railsync.model.BookingAudit;
import java.io.*;

/**
 * Thread-safe audit logger with staged commit boundary (FR-R11, ADR-11).
 * Audit records are committed to persistent disk log only when state mutation commits.
 */
public class AuditLogger {
    private final File logFile;
    private long auditIdSequence = 0;

    public AuditLogger(String filePath) {
        this.logFile = new File(filePath);
        File parent = logFile.getParentFile();
        if (parent != null && !parent.exists()) {
            parent.mkdirs();
        }
    }

    public synchronized long nextAuditId() {
        return ++auditIdSequence;
    }

    /**
     * Commits audit entries to persistent append-only log file.
     */
    public synchronized void commit(BookingAudit[] entries) {
        if (entries == null || entries.length == 0) return;
        try (FileWriter fw = new FileWriter(logFile, true);
             BufferedWriter bw = new BufferedWriter(fw);
             PrintWriter out = new PrintWriter(bw)) {
            for (BookingAudit entry : entries) {
                if (entry != null) {
                    out.println(String.format("%d|%d|%s|%s|%s|%s|%s",
                            entry.getAuditId(),
                            entry.getBookingId(),
                            entry.getFromStatus(),
                            entry.getToStatus(),
                            entry.getReason(),
                            entry.getChangedAt(),
                            entry.getChangedBy()));
                }
            }
            out.flush();
        } catch (IOException e) {
            System.err.println("Error writing audit log: " + e.getMessage());
        }
    }

    public synchronized void commit(BookingAudit entry) {
        if (entry != null) {
            commit(new BookingAudit[]{entry});
        }
    }
}
