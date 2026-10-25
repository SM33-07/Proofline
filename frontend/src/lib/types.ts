export type BookingStatus = 'CONFIRMED' | 'WAITLIST' | 'RAC' | 'CANCELLED';

export type DisruptionSeverity = 'CRITICAL' | 'MAJOR' | 'MODERATE' | 'MINOR';

export type DisruptionStatus = 'ACTIVE' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED';

export type TravelClass = '1A' | '2A' | '3A' | 'SL' | 'CC';

export type UserRole = 'Operations Controller' | 'Station Master' | 'Audit Inspector';

export interface Station {
  code: string;
  name: string;
  city: string;
  division: string;
}

export interface ClassInventory {
  travelClass: TravelClass;
  totalSeats: number;
  bookedSeats: number;
  waitlistCount: number;
  racCount: number;
  occupancyPct: number;
}

export interface JourneyInventory {
  journeyId: string;
  trainNumber: string;
  trainName: string;
  sourceStation: string;
  destStation: string;
  departureTime: string;
  arrivalTime: string;
  status: 'ON_TIME' | 'DELAYED' | 'BOARDING' | 'DEPARTED' | 'CANCELLED';
  delayMinutes: number;
  classes: ClassInventory[];
  totalCapacity: number;
  totalBooked: number;
  occupancyPct: number;
}

export interface BookingRecord {
  pnr: string;
  passengerName: string;
  passengerAge: number;
  passengerGender: 'M' | 'F' | 'O';
  trainNumber: string;
  trainName: string;
  sourceStation: string;
  destStation: string;
  travelDate: string;
  travelClass: TravelClass;
  status: BookingStatus;
  coach?: string;
  berthNumber?: number;
  berthType?: 'LOWER' | 'MIDDLE' | 'UPPER' | 'SIDE_LOWER' | 'SIDE_UPPER' | 'WINDOW' | 'AISLE';
  waitlistNumber?: number;
  racNumber?: number;
  bookingTimestamp: string;
  fareAmount: number;
}

export interface DisruptionIncident {
  id: string;
  code: string;
  title: string;
  description: string;
  affectedTrainNumber: string;
  affectedTrainName: string;
  locationStation: string;
  severity: DisruptionSeverity;
  status: DisruptionStatus;
  reportedAt: string;
  estimatedDelayMinutes: number;
  mitigationAction: string;
  passengersImpacted: number;
  cascadeStations: string[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  operation: 'SEAT_RESERVATION' | 'WAITLIST_PROMOTION' | 'BOOKING_CANCELLATION' | 'SCHEDULE_RESCHEDULE' | 'INVARIANT_ASSERTION';
  pnr?: string;
  trainNumber?: string;
  userRole: UserRole;
  actor: string;
  invariantRule?: string;
  invariantStatus: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  ipAddress: string;
}

export interface SystemKpiSummary {
  totalJourneys: number;
  activeTrains: number;
  totalBookings: number;
  fleetOccupancyPct: number;
  activeDisruptions: number;
  criticalDisruptions: number;
  totalWaitlisted: number;
  concurrencyViolations: number;
  invariantCompliancePct: number;
  lastHealthCheck: string;
}
