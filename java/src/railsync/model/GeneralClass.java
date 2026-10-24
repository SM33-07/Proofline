package railsync.model;

/**
 * General Class (GN): 0.5x discounted rate multiplier.
 * Documented design decision implementing FR-R09.
 */
public class GeneralClass extends SeatClass {
    private static final double MULTIPLIER = 0.5;
    private static final double MIN_FARE = 40.0;

    public GeneralClass(double baseRatePerKm) {
        super("GN", "Second Class General", baseRatePerKm);
    }

    @Override
    public double calculateFare(double distanceKm) {
        if (distanceKm <= 0) return 0.0;
        double fare = distanceKm * getBaseRatePerKm() * MULTIPLIER;
        return Math.max(fare, MIN_FARE);
    }
}
