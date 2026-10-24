package railsync.service;

import railsync.model.*;
import railsync.exception.*;

/**
 * Thread-safe In-Memory Booking Backend (Tier 1).
 * Strictly complies with CSC2104 constraints: fixed arrays, monitors, zero JUC/Collections in assessed core.
 */
public class InMemoryBookingService implements BookingBackend {
    private static final int MAX_CAPACITY = 200;

    private final Train[] trains = new Train[MAX_CAPACITY];
    private int trainCount = 0;

    private final Journey[] journeys = new Journey[MAX_CAPACITY];
    private int journeyCount = 0;

    private final JourneyClass[] journeyClasses = new JourneyClass[MAX_CAPACITY];
    private int journeyClassCount = 0;

    private final Seat[] seats = new Seat[MAX_CAPACITY];
    private int seatCount = 0;

    private final Passenger[] passengers = new Passenger[MAX_CAPACITY];
    private int passengerCount = 0;

    private final Booking[] bookings = new Booking[MAX_CAPACITY];
    private int bookingCount = 0;

    private final SeatAllocation[] allocations = new SeatAllocation[MAX_CAPACITY];
    private int allocationCount = 0;

    private final WaitlistEntry[] waitlist = new WaitlistEntry[MAX_CAPACITY];
    private int waitlistCount = 0;

    private long bookingIdSeq = 0;
    private long allocationIdSeq = 0;
    private long waitlistIdSeq = 0;

    private final PnrGenerator pnrGenerator;
    private final AuditLogger auditLogger;
    private final Object globalLock = new Object();

    public InMemoryBookingService(PnrGenerator pnrGenerator, AuditLogger auditLogger) {
        this.pnrGenerator = pnrGenerator;
        this.auditLogger = auditLogger;
    }

    // Reference data setup methods
    public synchronized void addTrain(Train train) { trains[trainCount++] = train; }
    public synchronized void addJourney(Journey journey) { journeys[journeyCount++] = journey; }
    public synchronized void addJourneyClass(JourneyClass jc) { journeyClasses[journeyClassCount++] = jc; }
    public synchronized void addSeat(Seat seat) { seats[seatCount++] = seat; }
    public synchronized void addPassenger(Passenger passenger) { passengers[passengerCount++] = passenger; }

    public synchronized JourneyClass getJourneyClass(long journeyClassId) {
        for (int i = 0; i < journeyClassCount; i++) {
            if (journeyClasses[i].getJourneyClassId() == journeyClassId) return journeyClasses[i];
        }
        return null;
    }

    public synchronized Journey getJourney(long journeyId) {
        for (int i = 0; i < journeyCount; i++) {
            if (journeys[i].getJourneyId() == journeyId) return journeys[i];
        }
        return null;
    }

    public synchronized Passenger getPassenger(long passengerId) {
        for (int i = 0; i < passengerCount; i++) {
            if (passengers[i].getPassengerId() == passengerId) return passengers[i];
        }
        return null;
    }

    @Override
    public boolean hasConfirmedBookingOnJourney(long passengerId, long journeyId) {
        synchronized (globalLock) {
            for (int i = 0; i < allocationCount; i++) {
                if (allocations[i].getPassengerId() == passengerId && allocations[i].getJourneyId() == journeyId) {
                    return true;
                }
            }
            return false;
        }
    }

    @Override
    public int getConfirmedCount(long journeyClassId) {
        synchronized (globalLock) {
            int count = 0;
            for (int i = 0; i < allocationCount; i++) {
                long allocSeatId = allocations[i].getJourneySeatId();
                for (int s = 0; s < seatCount; s++) {
                    if (seats[s].getJourneySeatId() == allocSeatId && seats[s].getJourneyClassId() == journeyClassId) {
                        count++;
                        break;
                    }
                }
            }
            return count;
        }
    }

    @Override
    public int getAvailableSeats(long journeyClassId) {
        JourneyClass jc = getJourneyClass(journeyClassId);
        if (jc == null) return 0;
        int confirmed = getConfirmedCount(journeyClassId);
        return Math.max(0, jc.getTotalSeats() - confirmed);
    }

    @Override
    public SeatAllocation[] getAllocations(long journeyClassId) {
        synchronized (globalLock) {
            int count = 0;
            for (int i = 0; i < allocationCount; i++) {
                long allocSeatId = allocations[i].getJourneySeatId();
                for (int s = 0; s < seatCount; s++) {
                    if (seats[s].getJourneySeatId() == allocSeatId && seats[s].getJourneyClassId() == journeyClassId) {
                        count++;
                        break;
                    }
                }
            }
            SeatAllocation[] result = new SeatAllocation[count];
            int idx = 0;
            for (int i = 0; i < allocationCount; i++) {
                long allocSeatId = allocations[i].getJourneySeatId();
                for (int s = 0; s < seatCount; s++) {
                    if (seats[s].getJourneySeatId() == allocSeatId && seats[s].getJourneyClassId() == journeyClassId) {
                        result[idx++] = allocations[i];
                        break;
                    }
                }
            }
            return result;
        }
    }

    @Override
    public WaitlistEntry[] getWaitlist(long journeyClassId) {
        synchronized (globalLock) {
            int count = 0;
            for (int i = 0; i < waitlistCount; i++) {
                if (waitlist[i].getJourneyClassId() == journeyClassId) count++;
            }
            WaitlistEntry[] result = new WaitlistEntry[count];
            int idx = 0;
            for (int i = 0; i < waitlistCount; i++) {
                if (waitlist[i].getJourneyClassId() == journeyClassId) {
                    result[idx++] = waitlist[i];
                }
            }
            // Sort by position ASC
            for (int i = 0; i < result.length - 1; i++) {
                for (int j = 0; j < result.length - i - 1; j++) {
                    if (result[j].getWaitlistPosition() > result[j + 1].getWaitlistPosition()) {
                        WaitlistEntry tmp = result[j];
                        result[j] = result[j + 1];
                        result[j + 1] = tmp;
                    }
                }
            }
            return result;
        }
    }

    private Seat findAvailableSeat(long journeyClassId) {
        for (int s = 0; s < seatCount; s++) {
            if (seats[s].getJourneyClassId() == journeyClassId) {
                long seatId = seats[s].getJourneySeatId();
                boolean isAllocated = false;
                for (int a = 0; a < allocationCount; a++) {
                    if (allocations[a].getJourneySeatId() == seatId) {
                        isAllocated = true;
                        break;
                    }
                }
                if (!isAllocated) return seats[s];
            }
        }
        return null;
    }

    @Override
    public Booking bookTicket(long journeyClassId, long passengerId, String groupRef) throws RailSyncException {
        synchronized (globalLock) {
            JourneyClass jc = getJourneyClass(journeyClassId);
            if (jc == null) throw new InvalidBookingException("JourneyClass not found: " + journeyClassId);
            Journey journey = getJourney(jc.getJourneyId());
            if (journey == null) throw new InvalidBookingException("Journey not found: " + jc.getJourneyId());
            Passenger psg = getPassenger(passengerId);
            if (psg == null) throw new InvalidBookingException("Passenger not found: " + passengerId);

            // Monotonic PNR allocation (never recycled)
            String pnr = pnrGenerator.nextPnr();
            long bId = ++bookingIdSeq;
            String now = "2026-10-24T20:00:00+05:30";

            Booking booking = new Booking(bId, pnr, journeyClassId, passengerId, BookingStatus.PENDING, now, jc.getBaseFareInr(), groupRef);
            bookings[bookingCount++] = booking;

            // Check capacity under lock
            int confirmed = getConfirmedCount(journeyClassId);
            if (confirmed < jc.getTotalSeats()) {
                // Invariant INV-05: At most one CONFIRMED booking per passenger per journey across ALL classes
                if (hasConfirmedBookingOnJourney(passengerId, journey.getJourneyId())) {
                    throw new DuplicateConfirmedException(passengerId, journey.getJourneyId());
                }
                Seat freeSeat = findAvailableSeat(journeyClassId);
                if (freeSeat == null) {
                    throw new CapacityExceededException(jc.getClassCode(), confirmed, jc.getTotalSeats());
                }
                // Transition PENDING -> CONFIRMED
                booking.transitionTo(BookingStatus.CONFIRMED);

                // Create allocation
                SeatAllocation alloc = new SeatAllocation(++allocationIdSeq, bId, freeSeat.getJourneySeatId(),
                        passengerId, journey.getJourneyId(), now);
                allocations[allocationCount++] = alloc;

                // Staged commit to audit log
                BookingAudit audit = new BookingAudit(auditLogger.nextAuditId(), bId, BookingStatus.PENDING,
                        BookingStatus.CONFIRMED, "Initial confirmation", now, "system");
                auditLogger.commit(audit);

            } else {
                // Class full or totalSeats == 0: transition PENDING -> WAITLISTED
                booking.transitionTo(BookingStatus.WAITLISTED);

                int nextPos = 1;
                for (int w = 0; w < waitlistCount; w++) {
                    if (waitlist[w].getJourneyClassId() == journeyClassId) {
                        if (waitlist[w].getWaitlistPosition() >= nextPos) {
                            nextPos = waitlist[w].getWaitlistPosition() + 1;
                        }
                    }
                }

                WaitlistEntry entry = new WaitlistEntry(++waitlistIdSeq, bId, journeyClassId, nextPos, now);
                waitlist[waitlistCount++] = entry;

                // Staged commit to audit log
                BookingAudit audit = new BookingAudit(auditLogger.nextAuditId(), bId, BookingStatus.PENDING,
                        BookingStatus.WAITLISTED, "Waitlisted: class full", now, "system");
                auditLogger.commit(audit);
            }

            return booking;
        }
    }

    @Override
    public Booking cancelBooking(String pnr) throws RailSyncException {
        synchronized (globalLock) {
            Booking booking = getBookingByPnr(pnr);
            if (booking == null) throw new InvalidBookingException("Booking not found for PNR: " + pnr);

            BookingStatus current = booking.getStatus();
            String now = "2026-10-24T20:05:00+05:30";

            if (current == BookingStatus.CONFIRMED) {
                // 1. Remove seat allocation
                Seat freedSeat = null;
                for (int a = 0; a < allocationCount; a++) {
                    if (allocations[a].getBookingId() == booking.getBookingId()) {
                        long seatId = allocations[a].getJourneySeatId();
                        for (int s = 0; s < seatCount; s++) {
                            if (seats[s].getJourneySeatId() == seatId) {
                                freedSeat = seats[s];
                                break;
                            }
                        }
                        // Shift allocations array
                        for (int k = a; k < allocationCount - 1; k++) {
                            allocations[k] = allocations[k + 1];
                        }
                        allocations[--allocationCount] = null;
                        break;
                    }
                }

                // 2. Transition CONFIRMED -> CANCELLED
                booking.transitionTo(BookingStatus.CANCELLED);
                BookingAudit cancelAudit = new BookingAudit(auditLogger.nextAuditId(), booking.getBookingId(),
                        BookingStatus.CONFIRMED, BookingStatus.CANCELLED, "Passenger cancellation", now, "system");
                auditLogger.commit(cancelAudit);

                // 3. Attempt waitlist promotion for earliest eligible candidate (FR-R07, FR-R17, INV-07)
                JourneyClass jc = getJourneyClass(booking.getJourneyClassId());
                long journeyId = (jc != null) ? jc.getJourneyId() : 0;

                WaitlistEntry candidate = null;
                int candidateIdx = -1;

                for (int w = 0; w < waitlistCount; w++) {
                    if (waitlist[w].getJourneyClassId() == booking.getJourneyClassId()) {
                        Booking waitBkg = getBookingById(waitlist[w].getBookingId());
                        if (waitBkg != null && waitBkg.getStatus() == BookingStatus.WAITLISTED) {
                            // Check eligibility: passenger must NOT hold another confirmed seat on this journey
                            if (!hasConfirmedBookingOnJourney(waitBkg.getPassengerId(), journeyId)) {
                                candidate = waitlist[w];
                                candidateIdx = w;
                                break; // Earliest eligible candidate found
                            }
                            // Ineligible: skip without mutation (ADR-10, FR-R17)
                        }
                    }
                }

                if (candidate != null && freedSeat != null) {
                    Booking waitBkg = getBookingById(candidate.getBookingId());
                    // Promote WAITLISTED -> CONFIRMED
                    waitBkg.transitionTo(BookingStatus.CONFIRMED);

                    // Allocate freed seat
                    SeatAllocation newAlloc = new SeatAllocation(++allocationIdSeq, waitBkg.getBookingId(),
                            freedSeat.getJourneySeatId(), waitBkg.getPassengerId(), journeyId, now);
                    allocations[allocationCount++] = newAlloc;

                    // Remove from waitlist and compact array
                    for (int k = candidateIdx; k < waitlistCount - 1; k++) {
                        waitlist[k] = waitlist[k + 1];
                    }
                    waitlist[--waitlistCount] = null;

                    // Reorder remaining waitlist positions
                    int pos = 1;
                    for (int w = 0; w < waitlistCount; w++) {
                        if (waitlist[w].getJourneyClassId() == booking.getJourneyClassId()) {
                            waitlist[w].setWaitlistPosition(pos++);
                        }
                    }

                    BookingAudit promoAudit = new BookingAudit(auditLogger.nextAuditId(), waitBkg.getBookingId(),
                            BookingStatus.WAITLISTED, BookingStatus.CONFIRMED, "Waitlist promotion", now, "system");
                    auditLogger.commit(promoAudit);
                }

                return booking;

            } else if (current == BookingStatus.WAITLISTED) {
                // Cancel waitlisted booking: remove from waitlist, free NO seats, NO promotion
                for (int w = 0; w < waitlistCount; w++) {
                    if (waitlist[w].getBookingId() == booking.getBookingId()) {
                        for (int k = w; k < waitlistCount - 1; k++) {
                            waitlist[k] = waitlist[k + 1];
                        }
                        waitlist[--waitlistCount] = null;
                        break;
                    }
                }

                booking.transitionTo(BookingStatus.CANCELLED);
                BookingAudit cancelAudit = new BookingAudit(auditLogger.nextAuditId(), booking.getBookingId(),
                        BookingStatus.WAITLISTED, BookingStatus.CANCELLED, "Waitlisted cancellation", now, "system");
                auditLogger.commit(cancelAudit);
                return booking;

            } else {
                throw new IllegalTransitionException(current, BookingStatus.CANCELLED);
            }
        }
    }

    @Override
    public Booking getBookingByPnr(String pnr) {
        synchronized (globalLock) {
            for (int i = 0; i < bookingCount; i++) {
                if (bookings[i].getPnr().equals(pnr)) return bookings[i];
            }
            return null;
        }
    }

    @Override
    public Booking getBookingById(long bookingId) {
        synchronized (globalLock) {
            for (int i = 0; i < bookingCount; i++) {
                if (bookings[i].getBookingId() == bookingId) return bookings[i];
            }
            return null;
        }
    }
}
