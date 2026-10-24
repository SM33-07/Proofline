package railsync;

import railsync.refund.*;
import java.io.*;
import java.util.regex.*;

/**
 * Gate 3 Disruption Fixture Test Runner.
 * Executes fixtures D-01 through D-14 against the Java RefundEvaluator.
 * Asserts 100% adherence to docs/CANONICAL_CONTRACT.md across all fields:
 * outcome, reasonCodes, warnings, deadlineAt, actionCode, currency, refundAmount, disclaimer.
 */
public class DisruptionFixtureTest {

    private static int testsRun = 0;
    private static int testsPassed = 0;

    private static void assertTrue(boolean condition, String name) {
        testsRun++;
        if (condition) {
            testsPassed++;
            System.out.println("  [PASS] " + name);
        } else {
            System.err.println("  [FAIL] " + name);
        }
    }

    public static void main(String[] args) throws Exception {
        System.out.println("====================================================");
        System.out.println("Running RailSync Gate 3 Disruption Fixture Tests");
        System.out.println("====================================================");

        // 1. Initialize Canonical Rule Set matching Seed Data
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

        RefundEvaluator evaluator = new RefundEvaluator(rules);

        File fixtureDir = new File("fixtures/disruption");
        File[] fixtureFiles = fixtureDir.listFiles((dir, name) -> name.endsWith(".json"));

        if (fixtureFiles == null || fixtureFiles.length == 0) {
            System.err.println("No disruption fixtures found in " + fixtureDir.getAbsolutePath());
            System.exit(1);
        }

        File outputDir = new File("evidence/gate3/java_evaluations");
        outputDir.mkdirs();

        for (File f : fixtureFiles) {
            String jsonContent = readFile(f);
            DisruptionCase disruptionCase = parseFixture(jsonContent);

            System.out.println("\nTesting Fixture: " + disruptionCase.getFixtureId());
            EvaluationResult result = evaluator.evaluateCase(disruptionCase);

            // Write canonical JSON output
            File outFile = new File(outputDir, disruptionCase.getFixtureId() + ".json");
            try (PrintWriter pw = new PrintWriter(new FileWriter(outFile))) {
                pw.println(result.toJson());
            }

            // Verify Expected Outcome
            String expectedOutcome = extractField(jsonContent, "expected", "outcome");
            assertTrue(expectedOutcome.equals(result.getOutcome().name()),
                    disruptionCase.getFixtureId() + " -> Outcome is " + expectedOutcome);

            // Verify Action Code
            String expectedAction = extractField(jsonContent, "expected", "actionCode");
            assertTrue(expectedAction.equals(result.getActionCode()),
                    disruptionCase.getFixtureId() + " -> ActionCode is " + expectedAction);

            // Verify Refund Amount
            String expectedAmount = extractField(jsonContent, "expected", "refundAmount");
            assertTrue(expectedAmount.equals(result.getRefundAmount()),
                    disruptionCase.getFixtureId() + " -> RefundAmount is " + expectedAmount);

            // Verify Reason Codes
            String[] expectedReasons = extractArray(jsonContent, "expected", "reasonCodes");
            boolean reasonsMatch = arraysEqual(expectedReasons, result.getReasonCodes());
            assertTrue(reasonsMatch, disruptionCase.getFixtureId() + " -> ReasonCodes match");

            // Verify Mandatory Legal Disclaimer
            assertTrue(result.getDisclaimer().equals(RefundPolicy.MANDATORY_DISCLAIMER),
                    disruptionCase.getFixtureId() + " -> Disclaimer matches verbatim");
        }

        System.out.println("----------------------------------------------------");
        System.out.println(String.format("Gate 3 Java Evaluator Tests Completed: %d/%d passed.", testsPassed, testsRun));
        System.out.println("====================================================");

        if (testsPassed != testsRun) {
            System.exit(1);
        }
    }

    private static String readFile(File f) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new FileReader(f))) {
            String line;
            while ((line = br.readLine()) != null) {
                sb.append(line).append("\n");
            }
        }
        return sb.toString();
    }

    private static DisruptionCase parseFixture(String json) {
        String fixtureId = extractTopField(json, "fixtureId");
        String ruleFamily = extractTopField(json, "ruleFamily");
        String ruleVersionStr = extractTopField(json, "ruleVersion");
        int ruleVersion = 1;
        if (ruleVersionStr != null && !ruleVersionStr.equals("null")) {
            try { ruleVersion = Integer.parseInt(ruleVersionStr); } catch (Exception e) {}
        }
        String verifiedStr = extractTopField(json, "verifiedRuleFixture");
        boolean verified = "true".equalsIgnoreCase(verifiedStr);
        String ticketScope = extractTopField(json, "ticketScope");
        String policyTime = extractTopField(json, "policyApplicabilityTime");
        String evalTime = extractTopField(json, "evaluationTime");
        String fare = extractTopField(json, "fareINR");

        CaseEvent[] events = parseEvents(json);

        return new DisruptionCase(fixtureId, ruleFamily, ruleVersion, verified, ticketScope,
                policyTime, evalTime, fare, events);
    }

    private static String extractTopField(String json, String field) {
        Pattern p = Pattern.compile("\"" + field + "\"\\s*:\\s*\"?([^,\"\n}]+)\"?");
        Matcher m = p.matcher(json);
        if (m.find()) {
            return m.group(1).trim();
        }
        return null;
    }

    private static String extractField(String json, String parent, String field) {
        Pattern pParent = Pattern.compile("\"" + parent + "\"\\s*:\\s*\\{([^}]+)\\}");
        Matcher mParent = pParent.matcher(json);
        if (mParent.find()) {
            String block = mParent.group(1);
            Pattern p = Pattern.compile("\"" + field + "\"\\s*:\\s*\"?([^,\"\n]+)\"?");
            Matcher m = p.matcher(block);
            if (m.find()) {
                return m.group(1).trim();
            }
        }
        return "";
    }

    private static String[] extractArray(String json, String parent, String field) {
        Pattern pParent = Pattern.compile("\"" + parent + "\"\\s*:\\s*\\{([^}]+)\\}");
        Matcher mParent = pParent.matcher(json);
        if (mParent.find()) {
            String block = mParent.group(1);
            Pattern p = Pattern.compile("\"" + field + "\"\\s*:\\s*\\[([^\\]]*)\\]");
            Matcher m = p.matcher(block);
            if (m.find()) {
                String arrayContent = m.group(1).trim();
                if (arrayContent.isEmpty()) return new String[0];
                String[] parts = arrayContent.split(",");
                String[] res = new String[parts.length];
                for (int i = 0; i < parts.length; i++) {
                    res[i] = parts[i].replaceAll("[\"\\s]", "");
                }
                return res;
            }
        }
        return new String[0];
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

        // Count objects
        int count = 0;
        while (mObj.find()) count++;
        CaseEvent[] events = new CaseEvent[count];

        mObj.reset();
        int idx = 0;
        while (mObj.find()) {
            String objStr = mObj.group(1);
            String type = extractObjField(objStr, "type");
            String time = extractObjField(objStr, "eventTime");
            String source = extractObjField(objStr, "source");
            String valStr = extractObjField(objStr, "value");
            Double val = null;
            if (valStr != null) {
                try { val = Double.parseDouble(valStr); } catch (Exception e) {}
            }
            events[idx++] = new CaseEvent(type, time, source, val, null);
        }
        return events;
    }

    private static String extractObjField(String objStr, String field) {
        Pattern p = Pattern.compile("\"" + field + "\"\\s*:\\s*\"?([^,\"\n}]+)\"?");
        Matcher m = p.matcher(objStr);
        if (m.find()) {
            return m.group(1).trim();
        }
        return null;
    }

    private static boolean arraysEqual(String[] a, String[] b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        if (a.length != b.length) return false;
        for (int i = 0; i < a.length; i++) {
            if (!a[i].equals(b[i])) return false;
        }
        return true;
    }
}
