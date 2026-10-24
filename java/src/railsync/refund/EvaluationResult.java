package railsync.refund;

public class EvaluationResult {
    private final String fixtureId;
    private final String ruleId;
    private final String ruleFamily;
    private final Integer ruleVersion;
    private final Outcome outcome;
    private final String[] reasonCodes;
    private final String[] warnings;
    private final String deadlineAt;
    private final String actionCode;
    private final String currency;
    private final String refundAmount;
    private final String disclaimer;

    public EvaluationResult(String fixtureId, String ruleId, String ruleFamily, Integer ruleVersion,
                            Outcome outcome, String[] reasonCodes, String[] warnings,
                            String deadlineAt, String actionCode, String currency,
                            String refundAmount, String disclaimer) {
        this.fixtureId = fixtureId;
        this.ruleId = ruleId;
        this.ruleFamily = ruleFamily;
        this.ruleVersion = ruleVersion;
        this.outcome = outcome;
        this.reasonCodes = reasonCodes != null ? reasonCodes : new String[0];
        this.warnings = warnings != null ? warnings : new String[0];
        this.deadlineAt = deadlineAt;
        this.actionCode = actionCode;
        this.currency = currency != null ? currency : "INR";
        this.refundAmount = refundAmount;
        this.disclaimer = disclaimer;
    }

    public String getFixtureId() { return fixtureId; }
    public String getRuleId() { return ruleId; }
    public String getRuleFamily() { return ruleFamily; }
    public Integer getRuleVersion() { return ruleVersion; }
    public Outcome getOutcome() { return outcome; }
    public String[] getReasonCodes() { return reasonCodes; }
    public String[] getWarnings() { return warnings; }
    public String getDeadlineAt() { return deadlineAt; }
    public String getActionCode() { return actionCode; }
    public String getCurrency() { return currency; }
    public String getRefundAmount() { return refundAmount; }
    public String getDisclaimer() { return disclaimer; }

    public String toJson() {
        StringBuilder sb = new StringBuilder();
        sb.append("{\n");
        sb.append("  \"fixtureId\": \"").append(fixtureId).append("\",\n");
        if (ruleId != null) {
            sb.append("  \"ruleId\": \"").append(ruleId).append("\",\n");
        } else {
            sb.append("  \"ruleId\": null,\n");
        }
        if (ruleFamily != null) {
            sb.append("  \"ruleFamily\": \"").append(ruleFamily).append("\",\n");
        } else {
            sb.append("  \"ruleFamily\": null,\n");
        }
        if (ruleVersion != null) {
            sb.append("  \"ruleVersion\": ").append(ruleVersion).append(",\n");
        } else {
            sb.append("  \"ruleVersion\": null,\n");
        }
        sb.append("  \"outcome\": \"").append(outcome.name()).append("\",\n");

        sb.append("  \"reasonCodes\": [");
        for (int i = 0; i < reasonCodes.length; i++) {
            sb.append("\"").append(reasonCodes[i]).append("\"");
            if (i < reasonCodes.length - 1) sb.append(", ");
        }
        sb.append("],\n");

        sb.append("  \"warnings\": [");
        for (int i = 0; i < warnings.length; i++) {
            sb.append("\"").append(warnings[i]).append("\"");
            if (i < warnings.length - 1) sb.append(", ");
        }
        sb.append("],\n");

        if (deadlineAt != null) {
            sb.append("  \"deadlineAt\": \"").append(deadlineAt).append("\",\n");
        } else {
            sb.append("  \"deadlineAt\": null,\n");
        }
        sb.append("  \"actionCode\": \"").append(actionCode).append("\",\n");
        sb.append("  \"currency\": \"").append(currency).append("\",\n");
        sb.append("  \"refundAmount\": \"").append(refundAmount).append("\",\n");
        sb.append("  \"disclaimer\": \"").append(disclaimer).append("\"\n");
        sb.append("}");
        return sb.toString();
    }
}
