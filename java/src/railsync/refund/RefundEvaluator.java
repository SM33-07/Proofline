package railsync.refund;

public class RefundEvaluator {

    private final RefundRule[] rules;
    private final LateRunningPolicy lateRunningPolicy = new LateRunningPolicy();
    private final TrainCancelledPolicy trainCancelledPolicy = new TrainCancelledPolicy();

    public RefundEvaluator(RefundRule[] rules) {
        this.rules = rules != null ? rules : new RefundRule[0];
    }

    public EvaluationResult evaluateCase(DisruptionCase c) {
        String fixtureId = c.getFixtureId();

        // 1. Validate Scope: only CONFIRMED simulated e-tickets are supported in MVP (§5.2)
        if (!"SIMULATED_E_TICKET_CONFIRMED".equals(c.getTicketScope())) {
            return new EvaluationResult(fixtureId, null, c.getRuleFamily(), c.getRuleVersion(),
                    Outcome.UNRESOLVED,
                    new String[]{ReasonCode.UNSUPPORTED_TICKET_SCOPE},
                    new String[0], null, ActionCode.NO_ACTION_UNRESOLVED, "INR", "0.00",
                    RefundPolicy.MANDATORY_DISCLAIMER);
        }

        // 2. Check for fundamental event conflicts across the case
        int travelled = c.countEvents("PASSENGER_TRAVELLED");
        int notTravelled = c.countEvents("PASSENGER_NOT_TRAVELLED");
        if (travelled > 0 && notTravelled > 0) {
            return new EvaluationResult(fixtureId, null, c.getRuleFamily(), c.getRuleVersion(),
                    Outcome.UNRESOLVED,
                    new String[]{ReasonCode.EVENT_CONFLICT},
                    new String[0], null, ActionCode.NO_ACTION_UNRESOLVED, "INR", "0.00",
                    RefundPolicy.MANDATORY_DISCLAIMER);
        }

        // 3. Select applicable rule version based on policyApplicabilityTime (§5.2)
        RefundRule selectedRule = null;
        for (RefundRule r : rules) {
            if (r.getRuleFamily().equals(c.getRuleFamily()) && r.isEffectiveAt(c.getPolicyApplicabilityTime())) {
                selectedRule = r;
                break;
            }
        }

        if (selectedRule == null) {
            return new EvaluationResult(fixtureId, null, c.getRuleFamily(), null,
                    Outcome.UNRESOLVED,
                    new String[]{ReasonCode.RULE_NOT_FOUND},
                    new String[0], null, ActionCode.NO_ACTION_UNRESOLVED, "INR", "0.00",
                    RefundPolicy.MANDATORY_DISCLAIMER);
        }

        // 4. Verify rule verification status (§5.2: Unverified rule cannot produce ELIGIBLE or NOT_ELIGIBLE)
        if (!selectedRule.isVerified()) {
            return new EvaluationResult(fixtureId, selectedRule.getRuleId(), selectedRule.getRuleFamily(), selectedRule.getVersionNumber(),
                    Outcome.UNRESOLVED,
                    new String[]{ReasonCode.RULE_SOURCE_UNVERIFIED},
                    new String[0], null, ActionCode.NO_ACTION_UNRESOLVED, "INR", "0.00",
                    RefundPolicy.MANDATORY_DISCLAIMER);
        }

        // 5. Delegate to policy based on rule family
        if ("LATE_OVER_3_HOURS_E_TICKET".equals(selectedRule.getRuleFamily())) {
            return lateRunningPolicy.evaluate(c, selectedRule);
        } else if ("TRAIN_CANCELLED_E_TICKET".equals(selectedRule.getRuleFamily())) {
            return trainCancelledPolicy.evaluate(c, selectedRule);
        } else {
            return new EvaluationResult(fixtureId, selectedRule.getRuleId(), selectedRule.getRuleFamily(), selectedRule.getVersionNumber(),
                    Outcome.UNRESOLVED,
                    new String[]{ReasonCode.RULE_NOT_FOUND},
                    new String[0], null, ActionCode.NO_ACTION_UNRESOLVED, "INR", "0.00",
                    RefundPolicy.MANDATORY_DISCLAIMER);
        }
    }
}
