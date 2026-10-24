package railsync.refund;

public class RefundRule {
    private final String ruleId;
    private final String ruleFamily;
    private final int versionNumber;
    private final String effectiveFrom;
    private final String effectiveTo;
    private final String sourceUrl;
    private final String sourceSection;
    private final String sourceCheckedOn;
    private final boolean verified;
    private final Integer thresholdMinutes;
    private final double refundBasisPct;
    private final boolean active;

    public RefundRule(String ruleId, String ruleFamily, int versionNumber, String effectiveFrom, String effectiveTo,
                      String sourceUrl, String sourceSection, String sourceCheckedOn, boolean verified,
                      Integer thresholdMinutes, double refundBasisPct, boolean active) {
        this.ruleId = ruleId;
        this.ruleFamily = ruleFamily;
        this.versionNumber = versionNumber;
        this.effectiveFrom = effectiveFrom;
        this.effectiveTo = effectiveTo;
        this.sourceUrl = sourceUrl;
        this.sourceSection = sourceSection;
        this.sourceCheckedOn = sourceCheckedOn;
        this.verified = verified;
        this.thresholdMinutes = thresholdMinutes;
        this.refundBasisPct = refundBasisPct;
        this.active = active;
    }

    public String getRuleId() { return ruleId; }
    public String getRuleFamily() { return ruleFamily; }
    public int getVersionNumber() { return versionNumber; }
    public String getEffectiveFrom() { return effectiveFrom; }
    public String getEffectiveTo() { return effectiveTo; }
    public boolean isVerified() { return verified; }
    public Integer getThresholdMinutes() { return thresholdMinutes; }
    public double getRefundBasisPct() { return refundBasisPct; }
    public boolean isActive() { return active; }

    public boolean isEffectiveAt(String timestamp) {
        if (timestamp == null) return false;
        boolean fromOk = timestamp.compareTo(effectiveFrom) >= 0;
        boolean toOk = (effectiveTo == null || timestamp.compareTo(effectiveTo) < 0);
        return fromOk && toOk;
    }
}
