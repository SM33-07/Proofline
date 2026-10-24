package railsync.refund;

public abstract class RefundPolicy {
    public static final String MANDATORY_DISCLAIMER =
        "Simulated guidance based on the rule version shown. This is not an official refund decision. This system does not file a TDR or guarantee a refund.";

    public abstract EvaluationResult evaluate(DisruptionCase disruptionCase, RefundRule rule);
}
