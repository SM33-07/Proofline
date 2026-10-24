package railsync.model;

/**
 * Sleeper Class (SL): Standard 1.0x rate multiplier.
 * Documented design decision implementing FR-R09.
 */
public class SleeperClass extends SeatClass {
    private static final double MULTIPLIER = 1.0;
    private static final double MIN_FARE = 120.0;

    public SleeperClass(double baseRatePerKm) {
        super("SL", "Sleeper Class", baseRatePerKm);
    }

    @Override
    public double calculateFare(double distanceKm) {
        if (distanceKm <= 0) return 0.0;
        double fare = distanceKm * getBaseRatePerKm() * MULTIPLIER;
        return Math.max(fare, MIN_FARE);
    }
}
