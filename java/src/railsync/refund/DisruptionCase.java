package railsync.refund;

public class DisruptionCase {
    private final String fixtureId;
    private final String ruleFamily;
    private final int ruleVersion;
    private final boolean verifiedRuleFixture;
    private final String ticketScope;
    private final String policyApplicabilityTime;
    private final String evaluationTime;
    private final String fareINR;
    private final CaseEvent[] events;

    public DisruptionCase(String fixtureId, String ruleFamily, int ruleVersion, boolean verifiedRuleFixture,
                          String ticketScope, String policyApplicabilityTime, String evaluationTime,
                          String fareINR, CaseEvent[] events) {
        this.fixtureId = fixtureId;
        this.ruleFamily = ruleFamily;
        this.ruleVersion = ruleVersion;
        this.verifiedRuleFixture = verifiedRuleFixture;
        this.ticketScope = ticketScope;
        this.policyApplicabilityTime = policyApplicabilityTime;
        this.evaluationTime = evaluationTime;
        this.fareINR = fareINR;
        this.events = events != null ? events : new CaseEvent[0];
    }

    public String getFixtureId() { return fixtureId; }
    public String getRuleFamily() { return ruleFamily; }
    public int getRuleVersion() { return ruleVersion; }
    public boolean isVerifiedRuleFixture() { return verifiedRuleFixture; }
    public String getTicketScope() { return ticketScope; }
    public String getPolicyApplicabilityTime() { return policyApplicabilityTime; }
    public String getEvaluationTime() { return evaluationTime; }
    public String getFareINR() { return fareINR; }
    public CaseEvent[] getEvents() { return events; }

    public CaseEvent findEvent(String type) {
        for (CaseEvent e : events) {
            if (e != null && type.equals(e.getType())) {
                return e;
            }
        }
        return null;
    }

    public int countEvents(String type) {
        int count = 0;
        for (CaseEvent e : events) {
            if (e != null && type.equals(e.getType())) {
                count++;
            }
        }
        return count;
    }
}
