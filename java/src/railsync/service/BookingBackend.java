package railsync.service;

import railsync.model.*;
import railsync.exception.*;

/**
 * Common abstraction interface for booking backends (SRS §4 FR-R12).
 */
public interface BookingBackend {
    Booking bookTicket(long journeyClassId, long passengerId, String groupRef) throws RailSyncException;
    Booking cancelBooking(String pnr) throws RailSyncException;
    Booking getBookingByPnr(String pnr);
    Booking getBookingById(long bookingId);
    int getAvailableSeats(long journeyClassId);
    SeatAllocation[] getAllocations(long journeyClassId);
    WaitlistEntry[] getWaitlist(long journeyClassId);
    int getConfirmedCount(long journeyClassId);
    boolean hasConfirmedBookingOnJourney(long passengerId, long journeyId);
}
