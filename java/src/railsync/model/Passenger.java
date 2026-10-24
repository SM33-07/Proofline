package railsync.model;

public class Passenger {
    private final long passengerId;
    private final String fullName;
    private final String email;
    private final String phone;

    public Passenger(long passengerId, String fullName, String email, String phone) {
        if (fullName == null || fullName.trim().isEmpty()) {
            throw new IllegalArgumentException("Passenger name cannot be empty");
        }
        this.passengerId = passengerId;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
    }

    public long getPassengerId() { return passengerId; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }

    @Override
    public String toString() {
        return "Passenger[id=" + passengerId + ", name=" + fullName + "]";
    }
}
