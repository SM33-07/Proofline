# Canonical Disruption Refund Evaluation Contract (Version 1.0.0-FROZEN)

## 1. Overview & Freezing Authority
This document defines the immutable canonical contract for the RailSync Disruption Refund Advisor rule engine across both implementation tiers:
- **Tier 1 (Java):** `railsync.refund.RefundEvaluator` and `CanonicalJsonWriter`
- **Tier 2 (MySQL 8):** Stored procedure `evaluate_case` and associated evaluation tables

Both engines MUST emit evaluation output that adheres to this contract field-for-field, type-for-type, and byte-for-byte.

---

## 2. Canonical JSON Output Schema

```json
{
  "fixtureId": "D-01-late-over-3hr",
  "ruleId": "RULE-LATE-3HR-V1",
  "ruleFamily": "LATE_OVER_3_HOURS_E_TICKET",
  "ruleVersion": 1,
  "outcome": "ELIGIBLE",
  "reasonCodes": [
    "DELAY_OVER_THRESHOLD",
    "FILED_BEFORE_DEPARTURE"
  ],
  "warnings": [
    "PASSENGER_STATUS_SELF_REPORTED"
  ],
  "deadlineAt": "2026-11-03T14:35:00+05:30",
  "actionCode": "MODELLED_TDR_FILED_BEFORE_DEPARTURE",
  "currency": "INR",
  "refundAmount": "1250.00",
  "disclaimer": "Simulated guidance based on the rule version shown. This is not an official refund decision. This system does not file a TDR or guarantee a refund."
}
```

---

## 3. Field Specifications & Nullability

| Field Name | JSON Type | Nullable | Permitted Values / Format | Description |
|---|---|---|---|---|
| `fixtureId` | String | No | Non-empty string (e.g. `"D-01-late-over-3hr"`) | Identifier of the test fixture or case. |
| `ruleId` | String | Yes | E.g. `"RULE-LATE-3HR-V1"`, or `null` if no rule matched | Unique identifier of the rule matched. |
| `ruleFamily` | String | Yes | `"LATE_OVER_3_HOURS_E_TICKET"`, `"TRAIN_CANCELLED_E_TICKET"`, or `null` | Rule family. |
| `ruleVersion` | Integer | Yes | Positive integer $\ge 1$, or `null` | Version number of the rule. |
| `outcome` | String | No | `"ELIGIBLE"`, `"NOT_ELIGIBLE"`, `"DEADLINE_EXPIRED"`, `"UNRESOLVED"` | Primary evaluation determination. |
| `reasonCodes` | Array[String] | No | Array of canonical reason codes (see §4) | Canonical justification codes. |
| `warnings` | Array[String] | No | Array of warning strings (see §5) | Non-fatal observations (e.g. self-reported facts). |
| `deadlineAt` | String | Yes | ISO-8601 timestamp with offset or `null` | Effective filing deadline (actual departure). |
| `actionCode` | String | No | See §6 | Prescribed filing / passenger action. |
| `currency` | String | No | `"INR"` | Currency ISO code. |
| `refundAmount` | String | No | Decimal string with 2 decimals (e.g. `"1250.00"`, `"0.00"`) | Modeled refund amount in INR. |
| `disclaimer` | String | No | Exact text from SRS §5.7 | Mandatory legal disclaimer. |

---

## 4. Reason Codes & Canonical Ordering Rules

### 4.1 Permitted Reason Codes
1. **Rule Selection:** `RULE_NOT_FOUND`, `RULE_SOURCE_UNVERIFIED`, `RULE_INTERVAL_CONFLICT`, `UNSUPPORTED_TICKET_SCOPE`
2. **Delay Facts:** `DELAY_OVER_THRESHOLD`, `DELAY_NOT_OVER_THRESHOLD`, `DELAY_UNKNOWN`, `DELAY_UNVERIFIED`, `ACTUAL_DEPARTURE_UNKNOWN`
3. **Travel & Filing:** `PASSENGER_TRAVELLED`, `TRAVEL_STATUS_UNKNOWN`, `FILING_ATTEMPT_UNKNOWN`, `FILED_BEFORE_DEPARTURE`, `FILED_AFTER_DEPARTURE`
4. **Cancellation:** `TRAIN_CANCELLED_AUTO_REFUND`, `TRAIN_CANCELLATION_UNKNOWN`
5. **Data Consistency:** `EVENT_CONFLICT`, `EVENT_SCOPE_MISMATCH`, `EVALUATION_FAILED`

### 4.2 Ordering Rule for `reasonCodes`
1. The **Primary Determination Code** must always appear at index 0. Examples:
   - When `outcome = ELIGIBLE` for late train: `DELAY_OVER_THRESHOLD`
   - When `outcome = ELIGIBLE` for cancelled train: `TRAIN_CANCELLED_AUTO_REFUND`
   - When `outcome = NOT_ELIGIBLE` due to delay $\le$ 180 min: `DELAY_NOT_OVER_THRESHOLD`
   - When `outcome = NOT_ELIGIBLE` due to passenger travel: `PASSENGER_TRAVELLED`
   - When `outcome = DEADLINE_EXPIRED`: `FILED_AFTER_DEPARTURE`
   - When `outcome = UNRESOLVED`: `RULE_NOT_FOUND`, `RULE_SOURCE_UNVERIFIED`, `UNSUPPORTED_TICKET_SCOPE`, `DELAY_UNVERIFIED`, `TRAVEL_STATUS_UNKNOWN`, `FILING_ATTEMPT_UNKNOWN`, or `EVENT_CONFLICT`
2. Any **Supporting / Secondary Codes** follow index 0 in **lexicographical (alphabetical) order**.

---

## 5. Warnings & Ordering Rules
- Permitted warnings: `PASSENGER_STATUS_SELF_REPORTED`, `UNVERIFIED_DELAY_CLAIM`, `HISTORICAL_RULE_APPLIED`.
- **Ordering Rule:** Warnings array is always sorted **lexicographically (alphabetically)**. If no warnings exist, `[]` is emitted.

---

## 6. Action Codes
The `actionCode` must be exactly one of:
- `"MODELLED_TDR_FILED_BEFORE_DEPARTURE"`: For eligible late-running claims.
- `"NO_TDR_REQUIRED"`: For eligible train cancellation claims (automatic refund).
- `"NO_ACTION_INELIGIBLE"`: For not eligible outcomes.
- `"NO_ACTION_DEADLINE_EXPIRED"`: For deadline expired outcomes.
- `"NO_ACTION_UNRESOLVED"`: For unresolved outcomes.

---

## 7. Monetary Calculations & Rounding Rules
- All currency values are represented in Indian Rupees (`"INR"`).
- The `refundAmount` field is a string representation of a decimal number with **strictly two fractional digits** (e.g. `"1250.00"`, `"0.00"`).
- Calculations use standard Half-Up rounding (`BigDecimal.ROUND_HALF_UP` in Java, `ROUND(fare, 2)` in MySQL).
- If `outcome` is not `ELIGIBLE`, `refundAmount` MUST be `"0.00"`.
- If `outcome` is `ELIGIBLE`, `refundAmount` is calculated as:
  $$	ext{refundAmount} = 	ext{round\_half\_up}(	ext{fareINR} 	imes rac{	ext{refund\_basis\_pct}}{100.0})$$
  (For MVP 100% refund basis, $	ext{refundAmount} = 	ext{fareINR}$).

---

## 8. Exact Mandatory Disclaimer
The `disclaimer` field MUST contain the exact text:
```
Simulated guidance based on the rule version shown. This is not an official refund decision. This system does not file a TDR or guarantee a refund.
```

---

## 9. Clock Isolation & Temporal Intervals
- **Zero Wall-Clock Dependency:** Neither Java nor MySQL evaluators may call `System.currentTimeMillis()`, `LocalDateTime.now()`, or MySQL `NOW()`.
- Temporal rule version matching uses half-open interval:
  $$	ext{effective\_from} \le 	ext{policyApplicabilityTime} < 	ext{effective\_to}$$
  (Where `effective_to IS NULL` represents an open upper bound).
- Historical evaluation: The evaluation is idempotent for any fixed tuple of $(	ext{CaseEvents}, 	ext{policyApplicabilityTime}, 	ext{evaluationTime})$.
