package railsync.model;

/**
 * Abstract base class for polymorphic fare calculation (SRS §4 FR-R09).
 */
public abstract class SeatClass {
    private final String classCode;
    private final String className;
    private final double baseRatePerKm;

    public SeatClass(String classCode, String className, double baseRatePerKm) {
        if (baseRatePerKm < 0) {
            throw new IllegalArgumentException("Base rate cannot be negative");
        }
        this.classCode = classCode;
        this.className = className;
        this.baseRatePerKm = baseRatePerKm;
    }

    public String getClassCode() { return classCode; }
    public String getClassName() { return className; }
    public double getBaseRatePerKm() { return baseRatePerKm; }

    /**
     * Polymorphic method to calculate non-negative fare.
     */
    public abstract double calculateFare(double distanceKm);
}
