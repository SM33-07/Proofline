package railsync.model;

/**
 * AC 3-Tier Class (3A): 2.5x multiplier + fixed comfort surcharge.
 * Documented design decision implementing FR-R09.
 */
public class ACClass extends SeatClass {
    private static final double MULTIPLIER = 2.5;
    private static final double SURCHARGE = 80.0;
    private static final double MIN_FARE = 450.0;

    public ACClass(double baseRatePerKm) {
        super("3A", "AC 3-Tier", baseRatePerKm);
    }

    @Override
    public double calculateFare(double distanceKm) {
        if (distanceKm <= 0) return 0.0;
        double fare = (distanceKm * getBaseRatePerKm() * MULTIPLIER) + SURCHARGE;
        return Math.max(fare, MIN_FARE);
    }
}
