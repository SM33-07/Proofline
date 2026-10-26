package railsync.server;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import railsync.exception.*;
import railsync.model.*;
import railsync.refund.*;
import railsync.service.AuditLogger;
import railsync.service.InMemoryBookingService;
import railsync.service.PnrGenerator;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * RailSync Phase 1 Java HTTP Adapter.
 * Exposes the in-memory reservation simulator and disruption refund rule engine
 * via lightweight HTTP endpoints using the JDK built-in HttpServer.
 *
 * Adheres strictly to Tier 1 constraints:
 * - Zero external framework dependencies.
 * - Intrinsic monitor synchronization preserved.
 * - Adherence to docs/CANONICAL_CONTRACT.md.
 */
public class RailSyncServer {

    private static final int DEFAULT_PORT = 8080;

    private final HttpServer server;
    private final int port;
    private final InMemoryBookingService bookingService;
    private final PnrGenerator pnrGenerator;
    private final AuditLogger auditLogger;
    private final RefundEvaluator refundEvaluator;
    private final long startTimeMs;

    public RailSyncServer(int port) throws IOException {
        this(port, "data/pnr_sequence.dat", "data/audit_log.txt");
    }

    public RailSyncServer(int port, String pnrFilePath, String auditFilePath) throws IOException {
        this.port = port;
        this.startTimeMs = System.currentTimeMillis();

        // 1. Initialize core domain services
        this.pnrGenerator = new PnrGenerator(pnrFilePath);
        this.auditLogger = new AuditLogger(auditFilePath);
        this.bookingService = new InMemoryBookingService(this.pnrGenerator, this.auditLogger);

        // 2. Seed canonical reference data (Train, Journey, Classes, Seats, Passengers)
        seedReferenceData(this.bookingService);

        // 3. Initialize canonical RefundEvaluator rules
        this.refundEvaluator = createCanonicalRefundEvaluator();

        // Validate gateway secret fail-closed configuration at boot
        getExpectedBackendSecret();

        // 4. Configure HTTP Server bound strictly to loopback (127.0.0.1)
        this.server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
        this.server.setExecutor(Executors.newFixedThreadPool(10));

        // 5. Register HTTP Route Handlers
        this.server.createContext("/api/health", new HealthHandler());
        this.server.createContext("/api/bookings", new BookingsHandler());
        this.server.createContext("/api/bookings/cancel", new CancelHandler());
        this.server.createContext("/api/inventory", new InventoryHandler());
        this.server.createContext("/api/refund/evaluate", new RefundEvaluationHandler());
    }

    public void start() {
        server.start();
        System.out.println(String.format("RailSyncServer started on http://localhost:%d (Tier 1 In-Memory Java)", port));
    }

    public void stop(int delaySeconds) {
        server.stop(delaySeconds);
        System.out.println("RailSyncServer stopped.");
    }

    public int getPort() {
        return port;
    }

    public InMemoryBookingService getBookingService() {
        return bookingService;
    }

    public PnrGenerator getPnrGenerator() {
        return pnrGenerator;
    }

    public RefundEvaluator getRefundEvaluator() {
        return refundEvaluator;
    }

    // =========================================================================
    // CANONICAL SEEDING
    // =========================================================================

    private void seedReferenceData(InMemoryBookingService svc) {
        // Train 1: 12951 Rajdhani Express
        Train train = new Train(1L, "12951", "Rajdhani Express");
        svc.addTrain(train);

        // Journey 101: 2026-11-01 16:55:00
        Journey journey = new Journey(101L, 1L, "2026-11-01", "16:55:00", 1384.0);
        svc.addJourney(journey);

        // Class 1: Sleeper (5 seats)
        JourneyClass jcSL = new JourneyClass(1L, 101L, "SL", 5, 550.0);
        svc.addJourneyClass(jcSL);
        for (int i = 1; i <= 5; i++) {
            svc.addSeat(new Seat(100L + i, 1L, "S" + i, "LOWER"));
        }

        // Class 2: AC 3-Tier (1 seat for contention/overflow testing)
        JourneyClass jc3A = new JourneyClass(2L, 101L, "3A", 1, 1450.0);
        svc.addJourneyClass(jc3A);
        svc.addSeat(new Seat(201L, 2L, "B1-1", "LOWER"));

        // Class 3: General (0 seats for zero-capacity waitlist testing)
        JourneyClass jcGN = new JourneyClass(3L, 101L, "GN", 0, 180.0);
        svc.addJourneyClass(jcGN);

        // Seed 10 Default Passengers
        svc.addPassenger(new Passenger(1001L, "Soham More", "soham@railsync.local", "919876543210"));
        svc.addPassenger(new Passenger(1002L, "Stuti Pandey", "stuti@railsync.local", "919876543211"));
        svc.addPassenger(new Passenger(1003L, "Shikha Sharma", "shikha@railsync.local", "919876543212"));
        svc.addPassenger(new Passenger(1004L, "Rahul Verma", "rahul@railsync.local", "919876543213"));
        svc.addPassenger(new Passenger(1005L, "Priya Nair", "priya@railsync.local", "919876543214"));
        svc.addPassenger(new Passenger(1006L, "Amit Kumar", "amit@railsync.local", "919876543215"));
        svc.addPassenger(new Passenger(1007L, "Sneha Rao", "sneha@railsync.local", "919876543216"));
        svc.addPassenger(new Passenger(1008L, "Vikram Singh", "vikram@railsync.local", "919876543217"));
        svc.addPassenger(new Passenger(1009L, "Ananya Sen", "ananya@railsync.local", "919876543218"));
        svc.addPassenger(new Passenger(1010L, "Rohan Mehta", "rohan@railsync.local", "919876543219"));
    }

    private RefundEvaluator createCanonicalRefundEvaluator() {
        RefundRule[] rules = new RefundRule[]{
                new RefundRule("IRCTC_RULE_6_LATE_3H", "LATE_OVER_3_HOURS_E_TICKET", 1,
                        "2026-01-01T00:00:00+05:30", "2026-06-30T23:59:59+05:30",
                        "https://www.irctc.co.in/refundrules.jsf", "Clause 6 (v1)", "2026-10-24",
                        true, 180, 100.0, true),
                new RefundRule("IRCTC_RULE_6_LATE_3H", "LATE_OVER_3_HOURS_E_TICKET", 2,
                        "2026-07-01T00:00:00+05:30", null,
                        "https://www.irctc.co.in/refundrules.jsf", "Clause 6 (v2)", "2026-10-24",
                        true, 180, 100.0, true),
                new RefundRule("IRCTC_RULE_5A_CANCEL", "TRAIN_CANCELLED_E_TICKET", 1,
                        "2026-01-01T00:00:00+05:30", null,
                        "https://www.irctc.co.in/refundrules.jsf", "Clause 5(a)", "2026-10-24",
                        true, 0, 100.0, true),
                new RefundRule("UNVERIFIED_TEST_RULE", "UNVERIFIED_FAMILY", 1,
                        "2026-01-01T00:00:00+05:30", null,
                        "https://example.com/unverified", "Section 9", "2026-10-24",
                        false, 180, 100.0, true)
        };
        return new RefundEvaluator(rules);
    }

    private String getExpectedBackendSecret() {
        String secret = System.getenv("RAILSYNC_BACKEND_SECRET");
        if (secret == null || secret.trim().isEmpty()) {
            secret = System.getProperty("railsync.backend.secret");
        }
        if (secret == null || secret.trim().length() < 32) {
            throw new IllegalStateException("CONFIGURATION_ERROR: RAILSYNC_BACKEND_SECRET is missing, empty, or below 32 characters. Java server fails closed.");
        }
        return secret.trim();
    }

    private boolean verifyGatewayAccess(HttpExchange exchange) throws IOException {
        String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
        String expected = "Bearer " + getExpectedBackendSecret();
        if (authHeader == null || !timingSafeEqual(authHeader.trim(), expected)) {
            sendError(exchange, 401, "UNAUTHORIZED_GATEWAY_ACCESS",
                    "Direct untrusted calls to Java simulator without valid gateway token are rejected. All operational requests must pass through the authenticated RailSync proxy.");
            return false;
        }
        return true;
    }

    private static boolean timingSafeEqual(String a, String b) {
        if (a == null || b == null) return false;
        if (a.length() != b.length()) return false;
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }

    // =========================================================================
    // HTTP HANDLERS
    // =========================================================================

    /**
     * GET /api/health
     */
    private class HealthHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleOptions(exchange)) return;
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendError(exchange, 405, "METHOD_NOT_ALLOWED", "Only GET method is supported.");
                return;
            }

            long uptimeMs = System.currentTimeMillis() - startTimeMs;
            long pnrSeq = pnrGenerator.getCurrentSequence();

            String response = "{\n" +
                    "  \"status\": \"UP\",\n" +
                    "  \"service\": \"RailSync In-Memory Reservation Tier\",\n" +
                    "  \"tier\": \"Tier 1 (Java In-Memory)\",\n" +
                    "  \"version\": \"1.0.0-PROTOTYPE\",\n" +
                    "  \"uptimeMs\": " + uptimeMs + ",\n" +
                    "  \"pnrSequence\": " + pnrSeq + ",\n" +
                    "  \"invariants\": {\n" +
                    "    \"INV-01\": \"ENFORCED\",\n" +
                    "    \"INV-05\": \"ENFORCED\",\n" +
                    "    \"INV-07\": \"ENFORCED\"\n" +
                    "  }\n" +
                    "}";

            sendJson(exchange, 200, response);
        }
    }

    /**
     * GET /api/bookings (lookup by ?pnr=... or ?id=... or list all active bookings)
     * POST /api/bookings (book ticket)
     */
    private class BookingsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleOptions(exchange)) return;

            String method = exchange.getRequestMethod().toUpperCase();
            if ("GET".equals(method)) {
                handleGetBookings(exchange);
            } else if ("POST".equals(method)) {
                handleCreateBooking(exchange);
            } else {
                sendError(exchange, 405, "METHOD_NOT_ALLOWED", "Supported methods: GET, POST");
            }
        }

        private void handleGetBookings(HttpExchange exchange) throws IOException {
            if (!verifyGatewayAccess(exchange)) return;
            String query = exchange.getRequestURI().getQuery();
            String pnr = extractQueryParam(query, "pnr");
            String idStr = extractQueryParam(query, "id");

            if (pnr != null && !pnr.isEmpty()) {
                Booking b = bookingService.getBookingByPnr(pnr);
                if (b == null) {
                    sendError(exchange, 404, "BOOKING_NOT_FOUND", "No booking found for PNR: " + pnr);
                    return;
                }
                sendJson(exchange, 200, bookingToJson(b));
                return;
            }

            if (idStr != null && !idStr.isEmpty()) {
                try {
                    long id = Long.parseLong(idStr);
                    Booking b = bookingService.getBookingById(id);
                    if (b == null) {
                        sendError(exchange, 404, "BOOKING_NOT_FOUND", "No booking found for ID: " + id);
                        return;
                    }
                    sendJson(exchange, 200, bookingToJson(b));
                    return;
                } catch (NumberFormatException e) {
                    sendError(exchange, 400, "INVALID_QUERY_PARAMETER", "Parameter 'id' must be an integer.");
                    return;
                }
            }

            // Return all active/historical bookings by scanning generated sequence
            long maxSeq = pnrGenerator.getCurrentSequence();
            List<Booking> list = new ArrayList<>();
            for (long seq = 1; seq <= maxSeq; seq++) {
                String candidatePnr = String.format("PNR-%08d", seq);
                Booking b = bookingService.getBookingByPnr(candidatePnr);
                if (b != null) {
                    list.add(b);
                }
            }

            StringBuilder sb = new StringBuilder("[\n");
            for (int i = 0; i < list.size(); i++) {
                sb.append("  ").append(bookingToJson(list.get(i)).replace("\n", "\n  "));
                if (i < list.size() - 1) sb.append(",");
                sb.append("\n");
            }
            sb.append("]");
            sendJson(exchange, 200, sb.toString());
        }

        private void handleCreateBooking(HttpExchange exchange) throws IOException {
            if (!verifyGatewayAccess(exchange)) return;
            String roleHeader = exchange.getRequestHeaders().getFirst("X-RailSync-Role");
            if (roleHeader == null || roleHeader.trim().isEmpty()) {
                sendError(exchange, 403, "FORBIDDEN_MISSING_ROLE", "Operational request must specify an authenticated X-RailSync-Role header.");
                return;
            }
            if ("Audit Inspector".equalsIgnoreCase(roleHeader.trim())) {
                sendError(exchange, 403, "FORBIDDEN_AUDIT_ROLE", "Audit Inspector accounts possess read-only verification privileges and cannot create bookings.");
                return;
            }
            if (!"Operations Controller".equalsIgnoreCase(roleHeader.trim()) && !"Station Master".equalsIgnoreCase(roleHeader.trim())) {
                sendError(exchange, 403, "FORBIDDEN_ROLE", "Role '" + escapeJson(roleHeader) + "' is not authorized to create bookings.");
                return;
            }

            String body = readBody(exchange);
            if (body == null || body.trim().isEmpty()) {
                sendError(exchange, 400, "EMPTY_REQUEST_BODY", "Request body cannot be empty.");
                return;
            }

            Long journeyClassId = parseLongField(body, "journeyClassId");
            Long passengerId = parseLongField(body, "passengerId");
            String groupRef = parseStringField(body, "groupRef");

            if (journeyClassId == null || journeyClassId <= 0) {
                sendError(exchange, 400, "VALIDATION_FAILED", "Field 'journeyClassId' is required and must be positive.");
                return;
            }
            if (passengerId == null || passengerId <= 0) {
                sendError(exchange, 400, "VALIDATION_FAILED", "Field 'passengerId' is required and must be positive.");
                return;
            }

            // Ensure passenger exists or auto-register for simulator accessibility
            if (bookingService.getPassenger(passengerId) == null) {
                bookingService.addPassenger(new Passenger(passengerId, "Passenger " + passengerId,
                        "passenger" + passengerId + "@railsync.local", "919000000000"));
            }

            try {
                Booking booking = bookingService.bookTicket(journeyClassId, passengerId, groupRef);
                sendJson(exchange, 201, bookingToJson(booking));
            } catch (DuplicateConfirmedException e) {
                sendDomainError(exchange, 409, "DUPLICATE_CONFIRMED_BOOKING", e.getMessage(), "INV-05");
            } catch (CapacityExceededException e) {
                sendDomainError(exchange, 409, "CAPACITY_EXCEEDED", e.getMessage(), "INV-01");
            } catch (InvalidBookingException e) {
                sendDomainError(exchange, 400, "INVALID_BOOKING", e.getMessage(), "DOMAIN_VALIDATION");
            } catch (IllegalTransitionException e) {
                sendDomainError(exchange, 409, "ILLEGAL_TRANSITION", e.getMessage(), "STATE_MACHINE");
            } catch (RailSyncException e) {
                sendDomainError(exchange, 400, "DOMAIN_REJECTION", e.getMessage(), "RAILSYNC_ERROR");
            } catch (Exception e) {
                sendError(exchange, 500, "INTERNAL_ERROR", "An unexpected domain error occurred.");
            }
        }
    }

    /**
     * POST /api/bookings/cancel
     */
    private class CancelHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleOptions(exchange)) return;

            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendError(exchange, 405, "METHOD_NOT_ALLOWED", "Only POST method is supported.");
                return;
            }

            if (!verifyGatewayAccess(exchange)) return;
            String roleHeader = exchange.getRequestHeaders().getFirst("X-RailSync-Role");
            if (roleHeader == null || roleHeader.trim().isEmpty()) {
                sendError(exchange, 403, "FORBIDDEN_MISSING_ROLE", "Operational request must specify an authenticated X-RailSync-Role header.");
                return;
            }
            if ("Audit Inspector".equalsIgnoreCase(roleHeader.trim())) {
                sendError(exchange, 403, "FORBIDDEN_AUDIT_ROLE", "Audit Inspector accounts possess read-only verification privileges and cannot cancel bookings.");
                return;
            }
            if (!"Operations Controller".equalsIgnoreCase(roleHeader.trim()) && !"Station Master".equalsIgnoreCase(roleHeader.trim())) {
                sendError(exchange, 403, "FORBIDDEN_ROLE", "Role '" + escapeJson(roleHeader) + "' is not authorized to cancel bookings.");
                return;
            }

            String body = readBody(exchange);
            if (body == null || body.trim().isEmpty()) {
                sendError(exchange, 400, "EMPTY_REQUEST_BODY", "Request body cannot be empty.");
                return;
            }

            String pnr = parseStringField(body, "pnr");
            if (pnr == null || pnr.trim().isEmpty()) {
                sendError(exchange, 400, "VALIDATION_FAILED", "Field 'pnr' is required.");
                return;
            }

            try {
                Booking cancelled = bookingService.cancelBooking(pnr.trim());
                sendJson(exchange, 200, bookingToJson(cancelled));
            } catch (InvalidBookingException e) {
                sendDomainError(exchange, 404, "BOOKING_NOT_FOUND", e.getMessage(), "NOT_FOUND");
            } catch (IllegalTransitionException e) {
                sendDomainError(exchange, 409, "ILLEGAL_TRANSITION", e.getMessage(), "STATE_MACHINE");
            } catch (RailSyncException e) {
                sendDomainError(exchange, 400, "DOMAIN_REJECTION", e.getMessage(), "RAILSYNC_ERROR");
            } catch (Exception e) {
                sendError(exchange, 500, "INTERNAL_ERROR", "An unexpected cancellation error occurred.");
            }
        }
    }

    /**
     * GET /api/inventory (query by ?journeyClassId=... or all classes)
     */
    private class InventoryHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleOptions(exchange)) return;

            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendError(exchange, 405, "METHOD_NOT_ALLOWED", "Only GET method is supported.");
                return;
            }

            if (!verifyGatewayAccess(exchange)) return;
            String query = exchange.getRequestURI().getQuery();
            String classIdStr = extractQueryParam(query, "journeyClassId");

            if (classIdStr != null && !classIdStr.isEmpty()) {
                try {
                    long classId = Long.parseLong(classIdStr);
                    JourneyClass jc = bookingService.getJourneyClass(classId);
                    if (jc == null) {
                        sendError(exchange, 404, "JOURNEY_CLASS_NOT_FOUND", "JourneyClass not found for ID: " + classId);
                        return;
                    }
                    sendJson(exchange, 200, classInventoryToJson(jc));
                    return;
                } catch (NumberFormatException e) {
                    sendError(exchange, 400, "INVALID_QUERY_PARAMETER", "Parameter 'journeyClassId' must be an integer.");
                    return;
                }
            }

            // Return inventory across all canonical classes (1: SL, 2: 3A, 3: GN)
            long[] canonicalClassIds = new long[]{1L, 2L, 3L};
            StringBuilder sb = new StringBuilder("[\n");
            for (int i = 0; i < canonicalClassIds.length; i++) {
                JourneyClass jc = bookingService.getJourneyClass(canonicalClassIds[i]);
                if (jc != null) {
                    sb.append("  ").append(classInventoryToJson(jc).replace("\n", "\n  "));
                    if (i < canonicalClassIds.length - 1) sb.append(",");
                    sb.append("\n");
                }
            }
            sb.append("]");
            sendJson(exchange, 200, sb.toString());
        }

        private String classInventoryToJson(JourneyClass jc) {
            long classId = jc.getJourneyClassId();
            int available = bookingService.getAvailableSeats(classId);
            int confirmed = bookingService.getConfirmedCount(classId);
            SeatAllocation[] allocs = bookingService.getAllocations(classId);
            WaitlistEntry[] waitlist = bookingService.getWaitlist(classId);

            StringBuilder sb = new StringBuilder();
            sb.append("{\n");
            sb.append("  \"journeyClassId\": ").append(classId).append(",\n");
            sb.append("  \"classCode\": \"").append(jc.getClassCode()).append("\",\n");
            sb.append("  \"totalSeats\": ").append(jc.getTotalSeats()).append(",\n");
            sb.append("  \"baseFareInr\": ").append(jc.getBaseFareInr()).append(",\n");
            sb.append("  \"availableSeats\": ").append(available).append(",\n");
            sb.append("  \"confirmedCount\": ").append(confirmed).append(",\n");
            sb.append("  \"waitlistCount\": ").append(waitlist.length).append(",\n");

            // Allocations summary
            sb.append("  \"allocations\": [");
            for (int i = 0; i < allocs.length; i++) {
                sb.append("{\"allocationId\":").append(allocs[i].getAllocationId())
                        .append(",\"bookingId\":").append(allocs[i].getBookingId())
                        .append(",\"journeySeatId\":").append(allocs[i].getJourneySeatId())
                        .append(",\"passengerId\":").append(allocs[i].getPassengerId())
                        .append(",\"allocatedAt\":\"").append(allocs[i].getAllocatedAt()).append("\"}");
                if (i < allocs.length - 1) sb.append(", ");
            }
            sb.append("],\n");

            // Waitlist summary
            sb.append("  \"waitlist\": [");
            for (int i = 0; i < waitlist.length; i++) {
                sb.append("{\"waitlistId\":").append(waitlist[i].getWaitlistId())
                        .append(",\"bookingId\":").append(waitlist[i].getBookingId())
                        .append(",\"position\":").append(waitlist[i].getWaitlistPosition())
                        .append(",\"createdAt\":\"").append(waitlist[i].getCreatedAt()).append("\"}");
                if (i < waitlist.length - 1) sb.append(", ");
            }
            sb.append("]\n");

            sb.append("}");
            return sb.toString();
        }
    }

    /**
     * POST /api/refund/evaluate
     * Evaluates disruption refund cases against the canonical rule engine.
     */
    private class RefundEvaluationHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleOptions(exchange)) return;

            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendError(exchange, 405, "METHOD_NOT_ALLOWED", "Only POST method is supported.");
                return;
            }

            if (!verifyGatewayAccess(exchange)) return;
            String roleHeader = exchange.getRequestHeaders().getFirst("X-RailSync-Role");
            if (roleHeader == null || roleHeader.trim().isEmpty()) {
                sendError(exchange, 403, "FORBIDDEN_MISSING_ROLE", "Operational request must specify an authenticated X-RailSync-Role header.");
                return;
            }
            if ("Station Master".equalsIgnoreCase(roleHeader.trim())) {
                sendError(exchange, 403, "FORBIDDEN_STATION_ROLE", "Station Master accounts do not have permission to evaluate network refund rules.");
                return;
            }
            if (!"Operations Controller".equalsIgnoreCase(roleHeader.trim()) && !"Audit Inspector".equalsIgnoreCase(roleHeader.trim())) {
                sendError(exchange, 403, "FORBIDDEN_ROLE", "Role '" + escapeJson(roleHeader) + "' is not authorized to evaluate refund rules.");
                return;
            }

            String body = readBody(exchange);
            if (body == null || body.trim().isEmpty()) {
                sendError(exchange, 400, "EMPTY_REQUEST_BODY", "Request body cannot be empty.");
                return;
            }

            try {
                DisruptionCase disruptionCase = parseDisruptionCase(body);
                EvaluationResult result = refundEvaluator.evaluateCase(disruptionCase);
                sendJson(exchange, 200, result.toJson());
            } catch (IllegalArgumentException e) {
                sendError(exchange, 400, "VALIDATION_FAILED", e.getMessage());
            } catch (Exception e) {
                sendError(exchange, 500, "EVALUATION_FAILED", "Failed to evaluate disruption case.");
            }
        }
    }

    // =========================================================================
    // JSON HELPERS & PROTOCOL SERIALIZATION
    // =========================================================================

    private static String bookingToJson(Booking b) {
        return "{\n" +
                "  \"bookingId\": " + b.getBookingId() + ",\n" +
                "  \"pnr\": \"" + b.getPnr() + "\",\n" +
                "  \"journeyClassId\": " + b.getJourneyClassId() + ",\n" +
                "  \"passengerId\": " + b.getPassengerId() + ",\n" +
                "  \"status\": \"" + b.getStatus().name() + "\",\n" +
                "  \"bookedAt\": \"" + b.getBookedAt() + "\",\n" +
                "  \"fareInr\": " + b.getFareInr() + ",\n" +
                "  \"groupRef\": " + (b.getGroupRef() != null ? "\"" + b.getGroupRef() + "\"" : "null") + "\n" +
                "}";
    }

    private static DisruptionCase parseDisruptionCase(String json) {
        String fixtureId = extractField(json, "fixtureId");
        if (fixtureId == null || fixtureId.isEmpty()) {
            fixtureId = "AD_HOC_CASE_" + System.currentTimeMillis();
        }
        String ruleFamily = extractField(json, "ruleFamily");
        if (ruleFamily == null) {
            ruleFamily = "LATE_OVER_3_HOURS_E_TICKET";
        }
        String ruleVerStr = extractField(json, "ruleVersion");
        int ruleVersion = 1;
        if (ruleVerStr != null && !ruleVerStr.equals("null")) {
            try { ruleVersion = Integer.parseInt(ruleVerStr); } catch (Exception ignored) {}
        }
        String verifiedStr = extractField(json, "verifiedRuleFixture");
        boolean verified = !"false".equalsIgnoreCase(verifiedStr);
        String ticketScope = extractField(json, "ticketScope");
        if (ticketScope == null) ticketScope = "SIMULATED_E_TICKET_CONFIRMED";
        String policyTime = extractField(json, "policyApplicabilityTime");
        String evalTime = extractField(json, "evaluationTime");
        String fare = extractField(json, "fareINR");
        if (fare == null) fare = "1000.00";

        CaseEvent[] events = parseEvents(json);

        return new DisruptionCase(fixtureId, ruleFamily, ruleVersion, verified, ticketScope,
                policyTime, evalTime, fare, events);
    }

    private static CaseEvent[] parseEvents(String json) {
        Pattern pEvents = Pattern.compile("\"events\"\\s*:\\s*\\[([^\\]]*)\\]", Pattern.DOTALL);
        Matcher mEvents = pEvents.matcher(json);
        if (!mEvents.find()) {
            return new CaseEvent[0];
        }
        String eventsBlock = mEvents.group(1);
        Pattern pObj = Pattern.compile("\\{([^}]+)\\}");
        Matcher mObj = pObj.matcher(eventsBlock);

        List<CaseEvent> list = new ArrayList<>();
        while (mObj.find()) {
            String objStr = mObj.group(1);
            String type = extractField(objStr, "type");
            String time = extractField(objStr, "eventTime");
            String source = extractField(objStr, "source");
            String valStr = extractField(objStr, "value");
            Double val = null;
            if (valStr != null) {
                try { val = Double.parseDouble(valStr); } catch (Exception ignored) {}
            }
            if (type != null) {
                list.add(new CaseEvent(type, time, source, val, null));
            }
        }
        return list.toArray(new CaseEvent[0]);
    }

    private static String extractField(String json, String field) {
        Pattern p = Pattern.compile("\"" + field + "\"\\s*:\\s*\"?([^,\"\n}]+)\"?");
        Matcher m = p.matcher(json);
        if (m.find()) {
            return m.group(1).trim();
        }
        return null;
    }

    private static String parseStringField(String json, String field) {
        Pattern p = Pattern.compile("\"" + field + "\"\\s*:\\s*\"([^\"]*)\"");
        Matcher m = p.matcher(json);
        if (m.find()) {
            return m.group(1).trim();
        }
        return null;
    }

    private static Long parseLongField(String json, String field) {
        Pattern p = Pattern.compile("\"" + field + "\"\\s*:\\s*([0-9]+)");
        Matcher m = p.matcher(json);
        if (m.find()) {
            try {
                return Long.parseLong(m.group(1).trim());
            } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    private static String extractQueryParam(String query, String param) {
        if (query == null || query.isEmpty()) return null;
        for (String pair : query.split("&")) {
            String[] kv = pair.split("=");
            if (kv.length == 2 && kv[0].equalsIgnoreCase(param)) {
                return kv[1].trim();
            }
        }
        return null;
    }

    private static String readBody(HttpExchange exchange) throws IOException {
        InputStream is = exchange.getRequestBody();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buffer = new byte[1024];
        int read;
        while ((read = is.read(buffer)) != -1) {
            baos.write(buffer, 0, read);
        }
        return baos.toString(StandardCharsets.UTF_8);
    }

    private static boolean handleOptions(HttpExchange exchange) throws IOException {
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
            exchange.getResponseHeaders().set("Access-Control-Max-Age", "86400");
            exchange.sendResponseHeaders(204, -1);
            exchange.close();
            return true;
        }
        return false;
    }

    private static void sendJson(HttpExchange exchange, int statusCode, String jsonResponse) throws IOException {
        byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
            os.flush();
        }
    }

    private static void sendError(HttpExchange exchange, int statusCode, String errorCode, String message) throws IOException {
        String json = "{\n" +
                "  \"error\": \"" + errorCode + "\",\n" +
                "  \"message\": \"" + escapeJson(message) + "\"\n" +
                "}";
        sendJson(exchange, statusCode, json);
    }

    private static void sendDomainError(HttpExchange exchange, int statusCode, String errorCode, String message, String ruleCode) throws IOException {
        String json = "{\n" +
                "  \"error\": \"" + errorCode + "\",\n" +
                "  \"message\": \"" + escapeJson(message) + "\",\n" +
                "  \"ruleCode\": \"" + ruleCode + "\"\n" +
                "}";
        sendJson(exchange, statusCode, json);
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }

    // =========================================================================
    // MAIN ENTRY POINT
    // =========================================================================

    public static void main(String[] args) {
        int port = DEFAULT_PORT;
        if (args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
            } catch (NumberFormatException ignored) {}
        } else if (System.getProperty("server.port") != null) {
            try {
                port = Integer.parseInt(System.getProperty("server.port"));
            } catch (NumberFormatException ignored) {}
        } else if (System.getenv("PORT") != null) {
            try {
                port = Integer.parseInt(System.getenv("PORT"));
            } catch (NumberFormatException ignored) {}
        }

        try {
            RailSyncServer server = new RailSyncServer(port);
            server.start();

            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                System.out.println("Shutting down RailSyncServer...");
                server.stop(1);
            }));

            // Keep main thread alive
            Thread.currentThread().join();
        } catch (Exception e) {
            System.err.println("Failed to start RailSyncServer: " + e.getMessage());
            System.exit(1);
        }
    }
}
