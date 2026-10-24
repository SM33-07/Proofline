package railsync.refund;

public class TrainCancelledPolicy extends RefundPolicy {

    @Override
    public EvaluationResult evaluate(DisruptionCase c, RefundRule rule) {
        String fixtureId = c.getFixtureId();
        String ruleId = rule != null ? rule.getRuleId() : null;
        String ruleFamily = rule != null ? rule.getRuleFamily() : c.getRuleFamily();
        Integer ruleVersion = rule != null ? rule.getVersionNumber() : c.getRuleVersion();

        CaseEvent cancelEv = c.findEvent("TRAIN_CANCELLED");
        if (cancelEv == null || !"SIMULATED_OFFICIAL".equals(cancelEv.getSource())) {
            return new EvaluationResult(fixtureId, ruleId, ruleFamily, ruleVersion,
                    Outcome.UNRESOLVED,
                    new String[]{ReasonCode.TRAIN_CANCELLATION_UNKNOWN},
                    new String[0], null, ActionCode.NO_ACTION_UNRESOLVED, "INR", "0.00", MANDATORY_DISCLAIMER);
        }

        String refundAmt = formatFare(c.getFareINR());
        return new EvaluationResult(fixtureId, ruleId, ruleFamily, ruleVersion,
                Outcome.ELIGIBLE,
                new String[]{ReasonCode.TRAIN_CANCELLED_AUTO_REFUND},
                new String[0], null, ActionCode.NO_TDR_REQUIRED, "INR", refundAmt, MANDATORY_DISCLAIMER);
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
