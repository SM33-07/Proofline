package railsync.refund;

public class LateRunningPolicy extends RefundPolicy {

    @Override
    public EvaluationResult evaluate(DisruptionCase c, RefundRule rule) {
        String fixtureId = c.getFixtureId();
        String ruleId = rule != null ? rule.getRuleId() : null;
        String ruleFamily = rule != null ? rule.getRuleFamily() : c.getRuleFamily();
        Integer ruleVersion = rule != null ? rule.getVersionNumber() : c.getRuleVersion();

        // 1. Check delay observation
        CaseEvent delayEv = c.findEvent("DELAY_AT_BOARDING_MINUTES");
        if (delayEv == null) {
            return new EvaluationResult(fixtureId, ruleId, ruleFamily, ruleVersion,
                    Outcome.UNRESOLVED,
                    new String[]{ReasonCode.DELAY_UNKNOWN},
                    new String[0], null, ActionCode.NO_ACTION_UNRESOLVED, "INR", "0.00", MANDATORY_DISCLAIMER);
        }

        if (!"SIMULATED_OFFICIAL".equals(delayEv.getSource())) {
            return new EvaluationResult(fixtureId, ruleId, ruleFamily, ruleVersion,
                    Outcome.UNRESOLVED,
                    new String[]{ReasonCode.DELAY_UNVERIFIED},
                    new String[0], null, ActionCode.NO_ACTION_UNRESOLVED, "INR", "0.00", MANDATORY_DISCLAIMER);
        }

        double delayMinutes = delayEv.getNumericValue() != null ? delayEv.getNumericValue() : 0.0;
        int threshold = (rule != null && rule.getThresholdMinutes() != null) ? rule.getThresholdMinutes() : 180;

        if (delayMinutes <= threshold) {
            return new EvaluationResult(fixtureId, ruleId, ruleFamily, ruleVersion,
                    Outcome.NOT_ELIGIBLE,
                    new String[]{ReasonCode.DELAY_NOT_OVER_THRESHOLD},
                    new String[0], null, ActionCode.NO_ACTION_INELIGIBLE, "INR", "0.00", MANDATORY_DISCLAIMER);
        }

        // 2. Check travel status
        int travelledCount = c.countEvents("PASSENGER_TRAVELLED");
        int notTravelledCount = c.countEvents("PASSENGER_NOT_TRAVELLED");

        if (travelledCount > 0 && notTravelledCount > 0) {
            return new EvaluationResult(fixtureId, ruleId, ruleFamily, ruleVersion,
                    Outcome.UNRESOLVED,
                    new String[]{ReasonCode.EVENT_CONFLICT},
                    new String[0], null, ActionCode.NO_ACTION_UNRESOLVED, "INR", "0.00", MANDATORY_DISCLAIMER);
        }

        if (travelledCount > 0) {
            return new EvaluationResult(fixtureId, ruleId, ruleFamily, ruleVersion,
                    Outcome.NOT_ELIGIBLE,
                    new String[]{ReasonCode.PASSENGER_TRAVELLED},
                    new String[0], null, ActionCode.NO_ACTION_INELIGIBLE, "INR", "0.00", MANDATORY_DISCLAIMER);
        }

        if (notTravelledCount == 0) {
            return new EvaluationResult(fixtureId, ruleId, ruleFamily, ruleVersion,
                    Outcome.UNRESOLVED,
                    new String[]{ReasonCode.TRAVEL_STATUS_UNKNOWN},
                    new String[0], null, ActionCode.NO_ACTION_UNRESOLVED, "INR", "0.00", MANDATORY_DISCLAIMER);
        }

        CaseEvent notTravelledEv = c.findEvent("PASSENGER_NOT_TRAVELLED");
        String[] warnings = new String[0];
        if (notTravelledEv != null && "PASSENGER_REPORTED".equals(notTravelledEv.getSource())) {
            warnings = new String[]{"PASSENGER_STATUS_SELF_REPORTED"};
        }

        // 3. Check actual departure & filing attempt
        CaseEvent actualDeptEv = c.findEvent("ACTUAL_DEPARTURE");
        if (actualDeptEv == null) {
            return new EvaluationResult(fixtureId, ruleId, ruleFamily, ruleVersion,
                    Outcome.UNRESOLVED,
                    new String[]{ReasonCode.ACTUAL_DEPARTURE_UNKNOWN},
                    warnings, null, ActionCode.NO_ACTION_UNRESOLVED, "INR", "0.00", MANDATORY_DISCLAIMER);
        }
        String actualDeptTime = actualDeptEv.getEventTime();

        CaseEvent filingEv = c.findEvent("FILING_ATTEMPT");
        if (filingEv == null) {
            return new EvaluationResult(fixtureId, ruleId, ruleFamily, ruleVersion,
                    Outcome.UNRESOLVED,
                    new String[]{ReasonCode.FILING_ATTEMPT_UNKNOWN},
                    warnings, null, ActionCode.NO_ACTION_UNRESOLVED, "INR", "0.00", MANDATORY_DISCLAIMER);
        }
        String filingTime = filingEv.getEventTime();

        // Strict boundary: filingTime strictly < actualDeptTime
        if (filingTime.compareTo(actualDeptTime) >= 0) {
            return new EvaluationResult(fixtureId, ruleId, ruleFamily, ruleVersion,
                    Outcome.DEADLINE_EXPIRED,
                    new String[]{ReasonCode.FILED_AFTER_DEPARTURE},
                    warnings, actualDeptTime, ActionCode.NO_ACTION_DEADLINE_EXPIRED, "INR", "0.00", MANDATORY_DISCLAIMER);
        }

        // Eligible! Full refund amount formatted to 2 decimals
        String refundAmt = formatFare(c.getFareINR());
        return new EvaluationResult(fixtureId, ruleId, ruleFamily, ruleVersion,
                Outcome.ELIGIBLE,
                new String[]{ReasonCode.DELAY_OVER_THRESHOLD, ReasonCode.FILED_BEFORE_DEPARTURE},
                warnings, actualDeptTime, ActionCode.MODELLED_TDR_FILED_BEFORE_DEPARTURE, "INR", refundAmt, MANDATORY_DISCLAIMER);
    }

    private String formatFare(String fare) {
        if (fare == null) return "0.00";
        try {
            double d = Double.parseDouble(fare);
            return String.format("%.2f", d);
        } catch (Exception e) {
            return "0.00";
        }
    }
}
