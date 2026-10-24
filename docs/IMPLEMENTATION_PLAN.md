# Implementation Plan — Railway Reservation Simulator with Disruption Refund Advisor

**Project:** RailSync — CSC2104 Java OOP + CSC2131 RDBMS Lab
**Institution:** Manipal University Jaipur — Department of Computer Science & Engineering
**Candidate SRS Baseline:** Revision 1.0 (24 October 2026, `docs/srs/v1.0/RailSync_SRS_Final.pdf`; pending Section 15 sign-off; historical baseline: v0.2 in `docs/srs/v0.2/`)
**Plan Date:** 24 October 2026
**Revision:** 1.1 (Revised following Lead Architecture Review)
**Author:** Lead Engineer & Build Agent
**Status:** Conditional Approval Pending Pre-Implementation Checklist Sign-Off

---

## Executive Summary

RailSync is a dual-tier educational simulator designed for two concurrent laboratory assessments:
1. **CSC2104 (Object-Oriented Programming in Java):** Evaluates OOP modeling, polymorphism, custom bounded queue monitors using `synchronized`/`wait()`/`notifyAll()`, concurrent worker threads, race condition reproduction, and safe synchronization without using `java.util.concurrent` or the Java Collections Framework in assessed core code.
2. **CSC2131 (Relational Database Management Systems Lab - MySQL 8):** Evaluates relational schema normalization (3NF/BCNF), strict CHECK constraints, transactional concurrency control using InnoDB row/table lock hierarchies, stored procedures with SAVEPOINT handling, triggers enforcing status lifecycles and immutable audit trails, and deterministic reporting views.

Both tiers independently implement the same core railway reservation engine and a deterministic Disruption Refund Advisor rule engine based on IRCTC refund regulations (Clause 5a train cancellation and Clause 6 delay > 180 minutes). Both tiers produce byte-for-byte or semantically identical canonical JSON evaluation results across all standardized test fixtures.

This implementation plan incorporates all corrections from the Lead Architecture Review (Revision 1.1):
- **Transactional Audit Integrity & PNR Sequence Gaps:** PNRs are allocated from a monotonic non-recycling source; rollbacks leave PNR sequence gaps (never re-used); rolled-back operations atomically remove all corresponding booking, allocation, waitlist, and `BOOKING_AUDIT` rows.
- **Strict Two-Tier Locking Hierarchy:** Every reservation transaction acquires exclusive locks in strict hierarchical order: `JOURNEY` $\rightarrow$ `JOURNEY_CLASS` $\rightarrow$ `BOOKING` $\rightarrow$ `SEAT_ALLOCATION` / `WAITLIST_ENTRY`. Locking `JOURNEY` first prevents cross-class double-booking races for the same passenger.
- **Complete Booking Lifecycle State Machine:** Explicitly includes the valid `PENDING` $\rightarrow$ `CANCELLED` transition alongside all legal SRS lifecycle transitions.
- **Canonical SRS Routine Naming & Script Order:** Routines match SRS specification (`book_seat`, `cancel_booking`, `promote_waitlist`, `book_group`, `evaluate_case`); SQL scripts follow the numbered sequence `00_reset.sql` through `09_users.sql`.
- **Provisional Course Prerequisites:** Explicitly documents Java monitor/fixed-array restrictions and MySQL dialect as provisional pending formal handout/faculty verification, while designing for the strictest anticipated constraints.
- **Technical Target Scheduling:** The 3 to 4 day timeline is treated as a target schedule; gate transitions are strictly evidence-driven, not calendar-driven.

---

## Table of Contents

1. [Requirement Inventory](#1-requirement-inventory)
   - 1.1 [Functional Requirements — Reservation Core (FR-R)](#11-functional-requirements--reservation-core-fr-r)
   - 1.2 [Functional Requirements — Disruption Refund Advisor (FR-D)](#12-functional-requirements--disruption-refund-advisor-fr-d)
   - 1.3 [System Invariants (INV)](#13-system-invariants-inv)
   - 1.4 [Non-Functional Requirements (NFR)](#14-non-functional-requirements-nfr)
   - 1.5 [Reservation Fixtures (R)](#15-reservation-fixtures-r)
   - 1.6 [Disruption Advisor Fixtures (D)](#16-disruption-advisor-fixtures-d)
   - 1.7 [Sequential Scenario Fixtures (S)](#17-sequential-scenario-fixtures-s)
2. [Architecture and File-Level Design](#2-architecture-and-file-level-design)
   - 2.1 [Repository Structure](#21-repository-structure)
   - 2.2 [Tier 1: Java OOP and Concurrency Architecture](#22-tier-1-java-oop-and-concurrency-architecture)
   - 2.3 [Tier 2: MySQL 8 RDBMS Architecture](#23-tier-2-mysql-8-rdbms-architecture)
   - 2.4 [Cross-Tier Parity and Canonical Contract](#24-cross-tier-parity-and-canonical-contract)
3. [Fixture Inventory](#3-fixture-inventory)
   - 3.1 [Reservation Test Fixtures](#31-reservation-test-fixtures)
   - 3.2 [Disruption Advisor Test Fixtures](#32-disruption-advisor-test-fixtures)
   - 3.3 [Fixture Data Models and Schemas](#33-fixture-data-models-and-schemas)
4. [Task Graph](#4-task-graph)
   - 4.1 [Track Structure and Parallelism](#41-track-structure-and-parallelism)
   - 4.2 [Gate 1 Tasks (Foundations)](#42-gate-1-tasks-foundations)
   - 4.3 [Gate 2 Tasks (Concurrency & Transactional Integrity)](#43-gate-2-tasks-concurrency--transactional-integrity)
   - 4.4 [Gate 3 Tasks (Disruption Refund Advisor & Parity)](#44-gate-3-tasks-disruption-refund-advisor--parity)
   - 4.5 [Gate 4 Tasks (Verification, Console UI & Submission Polish)](#45-gate-4-tasks-verification-console-ui--submission-polish)
5. [Gate Checklists and Acceptance Criteria](#5-gate-checklists-and-acceptance-criteria)
6. [Evidence Plan](#6-evidence-plan)
   - 6.1 [Unsafe vs Safe Java Race Methodology](#61-unsafe-vs-safe-java-race-methodology)
   - 6.2 [MySQL Two-Session Concurrency Experiment (Lock-First)](#62-mysql-two-session-concurrency-experiment-lock-first)
   - 6.3 [Group Booking Partial Failure & Savepoint Verification](#63-group-booking-partial-failure--savepoint-verification)
   - 6.4 [Invariant Verification Harness](#64-invariant-verification-harness)
   - 6.5 [Canonical JSON Parity Harness](#65-canonical-json-parity-harness)
7. [Teaching Plan & Viva Guide](#7-teaching-plan--viva-guide)
   - 7.1 [Course Alignment](#71-course-alignment)
   - 7.2 [Module Ownership Breakdown](#72-module-ownership-breakdown)
   - 7.3 [Sample Viva Questions and Model Answers](#73-sample-viva-questions-and-model-answers)
8. [SRS Issues, Ambiguities and Decisions](#8-srs-issues-ambiguities-and-decisions)
9. [Risk Register and Mitigation Strategies](#9-risk-register-and-mitigation-strategies)
10. [Critical Self-Review Notes](#10-critical-self-review-notes)

---

## 1. Requirement Inventory

### 1.1 Functional Requirements — Reservation Core (FR-R)

All requirements from SRS v0.2 §4 are inventoried below with assigned priority, delivery track, and gate.

| Req ID | Requirement Summary | Priority | Track | Target Gate | Primary Artifact / Verification |
|---|---|---|---|---|---|
| **FR-R01** | Model `TRAIN`, `JOURNEY`, `JOURNEY_CLASS`, `JOURNEY_SEAT`. Support $\ge$2 trains, 3 classes (Sleeper `SL`, AC 3-Tier `3A`, General `GN`). Include zero-seat and one-seat classes in seed fixtures. | Must | A + B | Gate 1 | `model/*.java`, `01_tables.sql`, `02_seed.sql` |
| **FR-R02** | Allocate unique alphanumeric PNR on booking creation (state `PENDING`) from a monotonic non-recycling sequence. Never reuse or recycle PNRs. If a transaction or savepoint rolls back, the allocated PNR is consumed and abandoned, leaving an intentional gap in the sequence. | Must | A + B | Gate 1 | `PnrGenerator.java`, MySQL BOOKING auto-increment ID (ADR-19), Fixture `R-09` |
| **FR-R03** | Enforce 1 booking = 1 seat. Model group reservations as separate individual bookings sharing a common `group_ref` UUID/string. | Must | A + B | Gate 1, 2 | `Booking.java`, `book_group`, Fixture `R-08` |
| **FR-R04** | Check inventory atomically under parent locks: confirm if available seats exist; otherwise set status to `WAITLISTED` with deterministic position. `WAITLISTED` is a normal domain outcome, not an exception. | Must | A + B | Gate 1 | `InMemoryBookingService.java`, `book_seat` |
| **FR-R05** | Enforce invariant: at most one `CONFIRMED` booking per passenger per journey across all classes. Waitlisted bookings in other classes are permitted. | Must | A + B | Gate 1, 2 | `INV-05`, `SEAT_ALLOCATION` unique key `(passenger_id, journey_id)`, Java monitor validation |
| **FR-R06** | Maintain waitlist in strict FIFO order keyed by `(booked_at ASC, booking_id ASC)`. Support deterministic listing. | Must | A + B | Gate 1 | `v_waitlist_order`, `WaitlistEntry.java`, deterministic query order |
| **FR-R07** | Cancellation workflow: cancelling `CONFIRMED` frees 1 allocation, sets status `CANCELLED`, and triggers at most 1 promotion of earliest eligible waiter. Cancelling `WAITLISTED` removes waitlist entry, sets `CANCELLED`, frees no seat, triggers no promotion. | Must | A + B | Gate 1, 2 | `cancel_booking`, `InMemoryBookingService.cancel()`, Fixtures `R-04`, `R-06` |
| **FR-R08** | Enforce exact lifecycle state machine: legal transitions are `PENDING` $\rightarrow$ `CONFIRMED`, `PENDING` $\rightarrow$ `WAITLISTED`, `PENDING` $\rightarrow$ `CANCELLED`, `CONFIRMED` $\rightarrow$ `CANCELLED`, `WAITLISTED` $\rightarrow$ `CONFIRMED`, `WAITLISTED` $\rightarrow$ `CANCELLED`. Reject all other transitions with domain exception / SQL `SIGNAL`. | Must | A + B | Gate 1 | `trg_booking_status_guard`, `IllegalTransitionException.java`, Fixture `R-07` |
| **FR-R09** | Dynamic fare calculation using polymorphism: base train distance rate scaled by seat class multiplier (`GeneralClass`, `SleeperClass`, `ACClass`). Non-negative result guaranteed. (Specific multipliers documented as design choice). | Must | A | Gate 1 | `SeatClass.java`, `calculate_fare` |
| **FR-R10** | Interactive console interface with 8 standard operations: show inventory, create/list passenger, book ticket, cancel by PNR, lookup PNR, view waitlist, trigger race demo, evaluate disruption refund case. Graceful recovery on invalid input. | Must | A | Gate 4 | `ConsoleApp.java` |
| **FR-R11** | Audit log for every booking creation and status transition. Tier 1 uses synchronized append-only file logger; Tier 2 uses triggers inserting into transactional `BOOKING_AUDIT` table. Rolled-back operations roll back their audit rows atomically; committed `BOOKING_AUDIT` exists only for committed bookings. | Must | A + B | Gate 1 | `AuditLogger.java`, `trg_booking_audit_insert`, `trg_booking_audit_update` |
| **FR-R12** | Decouple reservation logic behind a clean `BookingBackend` interface so console UI, test fixtures, and concurrency workers remain backend-agnostic. | Must | A | Gate 1 | `BookingBackend.java` |
| **FR-R13** | Custom Bounded FIFO Request Queue implemented strictly using a fixed-size `Object[]` array and Java monitor primitives (`synchronized`, `wait()`, `notifyAll()`). Zero collections/JUC usage (provisional, pending handout). Support graceful shutdown draining. | Must | A | Gate 2 | `BoundedFIFOQueue.java`, shutdown unit test |
| **FR-R14** | Multi-threaded booking simulation running $\ge$3 concurrent worker agents consuming from the bounded queue. Correctness must not rely on thread priorities or favorable sleep timing. | Must | A | Gate 2 | `BookingAgent.java`, multi-worker stress run |
| **FR-R15** | Reproducible race condition demonstration: build an `UnsafeInventory` using a deliberate check-then-act flaw gated by a monitor-based `StartGate`. Prove over-allocation on a single remaining seat. | Must | A | Gate 2 | `UnsafeInventory.java`, Fixture `R-01`, `race_evidence.log` |
| **FR-R16** | Corrected safe concurrency verification: run `SafeInventory` with 10 concurrent worker threads over $\ge$100 repetitions against the identical contention workload. Prove 0 capacity violations. | Must | A | Gate 2 | `SafeInventory.java`, Fixture `R-02`, 100-run test harness |
| **FR-R17** | Waitlist promotion eligibility check under common lock hierarchy: if the first waitlisted passenger already holds a `CONFIRMED` booking in another class on the journey, skip them without mutation and evaluate the next waiter. | Must | A + B | Gate 2 | Fixture `R-05`, `promote_waitlist` |
| **FR-R18** | Multi-member group reservation with atomic savepoints: reserve seats for $\ge$3 passengers in a single transaction. If member 2 deliberately fails, rollback to member 2's savepoint; valid members commit once. Failed member's booking, allocation, and audit rows are rolled back; PNR is discarded with gap. | Must | B | Gate 2 | `book_group`, Fixture `R-08`, savepoint verification script |
| **FR-R19** | Structured test checklist mapping every fixture ID to setup preconditions, inputs, expected outputs, observed outputs, and evidence file references. | Must | C | Gate 4 | `docs/TEST_CHECKLIST.md` |

---

### 1.2 Functional Requirements — Disruption Refund Advisor (FR-D)

| Req ID | Requirement Summary | Priority | Track | Target Gate | Primary Artifact / Verification |
|---|---|---|---|---|---|
| **FR-D01** | Rule Family `LATE_OVER_3_HOURS`: evaluate eligibility based on official simulated delay strictly > 180 minutes at boarding station, passenger not travelled, and filing attempt prior to actual departure. | Must | A + B | Gate 3 | `LateRunningPolicy.java`, `evaluate_case`, Fixtures `D-01`, `D-02`, `D-03` |
| **FR-D02** | Rule Family `TRAIN_CANCELLED`: evaluate confirmed simulated e-ticket on officially cancelled train. Output automatic full refund eligibility; no passenger cancellation or TDR filing required. | Must | A + B | Gate 3 | `TrainCancelledPolicy.java`, `evaluate_case`, Fixture `D-08` |
| **FR-D03** | Scope restriction: accept only tickets in status `CONFIRMED` with scope `SIMULATED_E_TICKET`. Reject waitlisted or counter tickets with `UNRESOLVED` and code `UNSUPPORTED_TICKET_SCOPE`. | Must | A + B | Gate 3 | Scope validation guard, Fixture `D-12` |
| **FR-D04** | Rule catalog repository storing source URL, official publication title/section, verification status (`verified` boolean), retrieval timestamp, delay threshold, and refund calculation basis. | Must | A + B | Gate 3 | `REFUND_RULE`, `RULE_VERSION`, `02_seed.sql`, `RefundRule.java` |
| **FR-D05** | Epistemic honesty: unverified rules (`verified = false`) must evaluate to `UNRESOLVED` with code `RULE_SOURCE_UNVERIFIED`. Must never produce `ELIGIBLE` or `NOT_ELIGIBLE`. | Must | A + B | Gate 3 | Policy rule validator, Fixture `D-11` |
| **FR-D06** | Temporal interval rule matching: select rule version matching `policy_applicability_time` within half-open interval `[effective_from, effective_to)`. Reject overlapping intervals via database trigger and Java invariant. | Must | A + B | Gate 3 | `trg_rule_interval_guard`, Fixtures `D-09`, `D-10` |
| **FR-D07** | Clock isolation: strictly separate `policy_applicability_time` from `evaluation_time`. Both timestamps must be supplied explicitly by the fixture. System clock calls (`System.currentTimeMillis()`, `NOW()`) are forbidden in evaluation logic. | Must | A + B | Gate 3 | Evaluation engine signature, clock linter check |
| **FR-D08** | Canonical evaluation output contract: produce structured output containing `evaluation_id`, `rule_id`, `rule_version`, `outcome`, ordered `reason_codes`, `warnings`, `deadline_action`, `refund_amount_inr`, and `disclaimer`. | Must | A + B | Gate 3 | `CaseEvaluation.java`, `evaluate_case`, canonical JSON serializer |
| **FR-D09** | Deterministic evaluation workflow: (1) validate booking scope, (2) lookup interval rule, (3) verify rule source, (4) filter and audit events up to `evaluation_time`, (5) execute family policy, (6) persist immutable snapshot. | Must | A + B | Gate 3 | `RefundEvaluator.java`, `evaluate_case` |
| **FR-D10** | Standardized reason code enumeration per SRS §5.6. Codes must be ordered deterministically: primary outcome code first, followed by supporting codes in canonical alphabetical order. | Must | A + B | Gate 3 | `ReasonCode.java`, `CASE_EVALUATION_CODE` |
| **FR-D11** | Mandatory statutory disclaimer appended to all evaluations: *"This evaluation is simulated guidance based on simplified IRCTC educational rules. It is not an official railway refund advice, ticket cancellation, or TDR filing."* | Must | A + B | Gate 3 | Canonical output constant |
| **FR-D12** | Immutable audit snapshot: record evaluation results across `CASE_EVALUATION`, `CASE_EVALUATION_CODE`, and `CASE_EVALUATION_EVENT` within a single transaction. New events create a new evaluation record; existing evaluations are strictly immutable (enforced by trigger). | Must | A + B | Gate 3 | `trg_evaluation_immutable`, transaction wrapper |
| **FR-D13** | Event temporal boundary check: events with `event_time > evaluation_time` are omitted from evaluation and trigger warning `EVENTS_AFTER_EVALUATION_IGNORED`. Contradictory event facts trigger `EVENT_CONFLICT`. | Must | A + B | Gate 3 | Event pre-filter, Fixtures `D-13`, `D-14` |

---

### 1.3 System Invariants (INV)

| Invariant ID | Definition and Formal Condition | Enforcement Mechanism | Verification Gate |
|---|---|---|---|
| **INV-01** | **Capacity Bound:** The count of `CONFIRMED` bookings for any journey class must never exceed the total seat count of that class. $\sum [status = \text{CONFIRMED}] \le \text{total\_seats}$. | Java Monitor lock; MySQL `book_seat` row lock + check; assertion query. | Gate 1, 2 |
| **INV-02** | **Seat Allocation Exclusivity:** Every seat in a journey class can have at most one active allocation. A booking can have at most one active seat allocation. | MySQL `UNIQUE KEY (journey_seat_id)`, `UNIQUE KEY (booking_id)` on `SEAT_ALLOCATION`. | Gate 1 |
| **INV-03** | **Status-Allocation Cardinality:** Every booking with status `CONFIRMED` must have exactly one corresponding row in `SEAT_ALLOCATION`. Bookings in `PENDING`, `WAITLISTED`, or `CANCELLED` must have zero allocation rows. | MySQL trigger `trg_allocation_guard`; automated verification query. | Gate 1 |
| **INV-04** | **Waitlist Cardinality:** Every booking with status `WAITLISTED` must have exactly one row in `WAITLIST_ENTRY`. Bookings in `CONFIRMED` or `CANCELLED` must have zero waitlist rows. | MySQL trigger `trg_waitlist_guard`; automated verification query. | Gate 1 |
| **INV-05** | **Cross-Class Single-Confirmation:** A passenger can hold at most one `CONFIRMED` booking on any single journey across all classes. | MySQL `UNIQUE KEY (passenger_id, journey_id)` on `SEAT_ALLOCATION`; Java `JourneyMonitor` atomic validation. | Gate 1, 2 |
| **INV-06** | **Audit Trail Completeness:** Every committed booking creation or status transition has exactly one matching audit row. Rolled-back operations leave zero committed audit rows. PNR gaps resulting from rollbacks are permitted and never recycled. | MySQL transactional triggers `trg_booking_audit_insert`, `trg_booking_audit_update`; Java atomic file logger. | Gate 1, 2 |
| **INV-07** | **Deterministic Promotion Selection:** Upon cancellation of a confirmed booking, the earliest eligible waiter (by `booked_at`, `booking_id`) without an existing confirmed seat on the journey must be promoted. At most one promotion per cancellation. | MySQL `cancel_booking` cursor/skip loop; Java `InMemoryBookingService` atomic scan. | Gate 2 |

---

### 1.4 Non-Functional Requirements (NFR)

| Req ID | Requirement | Success Criteria & Verification Method | Gate |
|---|---|---|---|
| **NFR-01** | **Determinism** | Given the same test fixture JSON, rule definition, and `evaluation_time`, both Java and MySQL produce the exact same outcome, reason codes, and refund amount. | Gate 3 |
| **NFR-02** | **Architectural Independence** | Tier 1 (Java) compiles and runs complete test suites with zero database connectivity or network access. Tier 2 (MySQL) executes all schema, procedures, triggers, and tests independently via MySQL CLI. | Gate 1 |
| **NFR-03** | **Correctness & Consistency** | All invariants `INV-01` through `INV-07` evaluate to 0 violations after every test suite run and batch transaction. | Gate 1, 2 |
| **NFR-04** | **Concurrency Safety** | `SafeInventory` maintains invariant `INV-01` over 100 repetitions with 10 concurrent threads under maximum contention. | Gate 2 |
| **NFR-05** | **Transactional Atomicity** | Deliberately injected runtime errors or savepoint rollbacks leave zero orphan allocations, waitlist rows, or audit rows. | Gate 2 |
| **NFR-06** | **Explainability** | Every refund evaluation output details the matched rule, specific reason codes, deadline action, and exact policy clause. | Gate 3 |
| **NFR-07** | **Epistemic Honesty** | Incomplete data, unverified rules, or conflicting events evaluate to `UNRESOLVED` with explicit diagnostic codes. System never guesses. | Gate 3 |
| **NFR-08** | **Data Privacy & Synthetic Data** | 100% synthetic data: strictly no real passenger names, live PNRs, or actual payment data in repository. | Gate 1 |
| **NFR-09** | **Reproducibility** | Complete repository build, seed, test, and verification executable on any clean machine using standard documented commands in `README.md`. | Gate 4 |
| **NFR-10** | **Academic Integrity & Constraint Adherence** | Zero banned collections/libraries in core assessed Java packages (`java/src/railsync/model`, `concurrency`). Pure arrays, `synchronized`, and `wait/notifyAll`. (Pending handout confirmation). | Gate 1, 2 |
| **NFR-11** | **RDBMS Least Privilege** | MySQL privileges segregated into `app_reader`, `app_writer`, and `app_admin`. Enforced via SQL GRANT scripts. | Gate 2 |

---

### 1.5 Reservation Fixtures (R)

| Fixture ID | Description | Preconditions | Input / Action | Expected Result | Gate |
|---|---|---|---|---|---|
| **R-01** | Unsafe Concurrency Race Demo | Journey with 1 remaining seat. | 2 threads compete via `UnsafeInventory` synchronized via `StartGate`. | Both threads observe seat available and claim it; inventory count becomes 2 (Over-allocation observed; proves race). | Gate 2 |
| **R-02** | Safe Java Inventory Stress Test | Journey with 1 remaining seat. | 10 worker threads attempt booking across 100 repetitions via `SafeInventory`. | Exactly 1 booking confirmed, 9 waitlisted; 0 runs exceed capacity. | Gate 2 |
| **R-03** | MySQL Two-Session Lock-First Concurrency | MySQL 8 table with 1 seat remaining. | Session 1 begins transaction, locks `JOURNEY`, then `JOURNEY_CLASS`, claims seat. Session 2 attempts claim concurrently. | Session 2 blocks on `JOURNEY` lock until Session 1 commits; Session 2 then reads updated count and creates `WAITLISTED` booking. 0 over-allocation. | Gate 2 |
| **R-04** | Confirmed Cancellation & Promotion | 1 confirmed booking, 2 waitlisted bookings in class. | Cancel the confirmed booking. | Allocation freed; Waiter 1 promoted to `CONFIRMED`; Waiter 2 remains waitlisted. | Gate 2 |
| **R-05** | Waitlist Promotion with Ineligible Candidate | Confirmed booking cancelled. Waiter 1 already confirmed in AC class on same journey. Waiter 2 has no other bookings. | Trigger promotion procedure. | Waiter 1 is skipped without mutation; Waiter 2 is promoted to `CONFIRMED`. | Gate 2 |
| **R-06** | Waitlist Cancellation & Empty Queue | 1 waitlist entry cancelled; subsequent cancellation on empty waitlist. | Cancel waitlisted PNR; trigger promotion on empty queue. | Waitlist entry removed; status `CANCELLED`; 0 seat allocations modified; no promotion attempted. | Gate 1, 2 |
| **R-07** | Illegal State Machine Transitions | Booking in status `CANCELLED`. | Attempt transition to `CONFIRMED` or `WAITLISTED`. | Operation rejected with `ILLEGAL_TRANSITION`; transaction aborted; audit record unchanged. | Gate 1 |
| **R-08** | Group Reservation with Savepoint Rollback | 3-member group booking transaction. Member 1 valid, Member 2 injects duplicate/invalid data, Member 3 valid. | Execute `book_group`. | Member 2 encounters error; rollback to `SAVEPOINT member_2`; Member 2's booking and audit rows removed; PNR discarded with gap; Members 1 and 3 committed. | Gate 2 |
| **R-09** | Transactional Atomicity on SQL Error | Booking insertion succeeds, followed by synthetic constraint failure before commit. | Execute failed booking transaction. | Entire transaction rolled back; PNR consumed with gap; status record, allocation, and audit row completely absent from committed tables. | Gate 2 |
| **R-10** | Comprehensive Invariant Suite Check | Run full test suite on clean seed vs corrupted seed. | Execute all verification queries for `INV-01` through `INV-07`. | Clean seed: 0 violations reported. Corrupted seed: exact intended violation caught. | Gate 1, 2 |

---

### 1.6 Disruption Advisor Fixtures (D)

| Fixture ID | Policy Family & Scenario Description | Input Facts & Event Timestamps | Expected Outcome | Canonical Reason Codes | Gate |
|---|---|---|---|---|---|
| **D-01** | Late > 3 Hours: Standard Eligible Claim | Official delay 210 min; Passenger not travelled; Filed 15 min prior to departure. | `ELIGIBLE` | `DELAY_OVER_THRESHOLD`, `FILED_BEFORE_DEPARTURE` | Gate 3 |
| **D-02** | Late > 3 Hours: Delay Exactly 180 Minutes | Official delay 180 min; Passenger not travelled; Filed before departure. | `NOT_ELIGIBLE` | `DELAY_NOT_OVER_THRESHOLD` | Gate 3 |
| **D-03** | Late > 3 Hours: Delay 179 Minutes (Boundary) | Official delay 179 min; Passenger not travelled; Filed before departure. | `NOT_ELIGIBLE` | `DELAY_NOT_OVER_THRESHOLD` | Gate 3 |
| **D-04** | Delay Unverified: Passenger-Only Report | Delay 210 min reported by passenger; zero `SIMULATED_OFFICIAL` delay events. | `UNRESOLVED` | `DELAY_UNVERIFIED` | Gate 3 |
| **D-05** | Incomplete Facts: Missing Travel State | Official delay 240 min; zero travel status events recorded. | `UNRESOLVED` | `TRAVEL_STATUS_UNKNOWN` | Gate 3 |
| **D-06a** | Deadline Boundary: Filed 1 Second Before Departure | Filing timestamp = `actual_departure - 1s`. All criteria met. | `ELIGIBLE` | `DELAY_OVER_THRESHOLD`, `FILED_BEFORE_DEPARTURE` | Gate 3 |
| **D-06b** | Deadline Boundary: Filed Exactly at Departure | Filing timestamp = `actual_departure`. | `DEADLINE_EXPIRED` | `FILED_AFTER_DEPARTURE` | Gate 3 |
| **D-06c** | Deadline Boundary: Filed 1 Second After Departure | Filing timestamp = `actual_departure + 1s`. | `DEADLINE_EXPIRED` | `FILED_AFTER_DEPARTURE` | Gate 3 |
| **D-06d** | Missing Filing Event: No TDR Attempt | Delay 220 min; passenger did not travel; no filing event recorded. | `UNRESOLVED` | `FILING_ATTEMPT_UNKNOWN` | Gate 3 |
| **D-07** | Late > 3 Hours: Passenger Travelled | Official delay 240 min; event confirms passenger boarded and travelled. | `NOT_ELIGIBLE` | `PASSENGER_TRAVELLED` | Gate 3 |
| **D-08** | Train Cancelled: Automatic Full Refund | Official train cancellation event; confirmed simulated e-ticket. | `ELIGIBLE` | `TRAIN_CANCELLED_AUTO_REFUND`, `NO_TDR_REQUIRED` | Gate 3 |
| **D-09** | Temporal Versioning: Older Interval Match | `policy_applicability_time` falls in Version 1 validity range; Version 2 active at evaluation. | Correct version evaluated | Version 1 rule parameters and threshold applied | Gate 3 |
| **D-10** | Missing Rule: No Active Interval | `policy_applicability_time` outside any defined `[effective_from, effective_to)` window. | `UNRESOLVED` | `RULE_NOT_FOUND` | Gate 3 |
| **D-11** | Unverified Rule Source | Matched rule record has `verified = false`. | `UNRESOLVED` | `RULE_SOURCE_UNVERIFIED` | Gate 3 |
| **D-12** | Unsupported Scope: Waitlisted Ticket | Booking presented has status `WAITLISTED`. | Rejected | `UNSUPPORTED_TICKET_SCOPE` | Gate 3 |
| **D-13** | Event Filtering: Events After Evaluation Time | Event recorded at `14:30`, evaluation requested at `14:00`. | Event excluded | Warning `EVENTS_AFTER_EVALUATION_IGNORED` | Gate 3 |
| **D-14** | Conflicting Facts: Official Contradiction | Two official events report conflicting departure times or delays. | `UNRESOLVED` | `EVENT_CONFLICT` | Gate 3 |

---

### 1.7 Sequential Scenario Fixtures (S)

| Fixture ID | Scenario | Preconditions & Actions | Expected Result | Gate |
|---|---|---|---|---|
| **S-01** | Happy Path Booking | Sleeper class with 5 available seats. Book 1 seat for Passenger P1. | Status `CONFIRMED`; Seat allocated; Audit entry created. | Gate 1 |
| **S-02** | Overflow to Waitlist | Class capacity is 1 seat, already allocated. Book 1 seat for Passenger P2. | Status `WAITLISTED`; Position 1 assigned; 0 allocations created. | Gate 1 |
| **S-03** | Cross-Class Duplicate Rejection | Passenger P1 holds `CONFIRMED` in Sleeper. Attempt booking P1 in AC class on same journey. | Booking rejected; Invariant `INV-05` upheld; 0 state changes. | Gate 1 |
| **S-04** | Cancellation with Cascade Promotion | Passenger P1 cancels booking. Waiter P2 is at head of waitlist. | P1 `CANCELLED`, allocation released; P2 promoted to `CONFIRMED`, allocation assigned. | Gate 1, 2 |
| **S-05** | Zero-Seat Class Booking | General class configured with total capacity = 0. Book passenger. | Immediate `WAITLISTED` status; no allocation attempted. | Gate 1 |

---

## 2. Architecture and File-Level Design

### 2.1 Repository Structure

```
RailSync/
├── docs/
│   ├── srs/
│   │   ├── v0.2/
│   │   │   ├── SRS_Source_v0.2.pdf         # Historical v0.2 PDF specification
│   │   │   ├── SRS.md                      # Historical extracted v0.2 Markdown
│   │   │   └── SRS_extracted.txt           # Historical extracted v0.2 plain text
│   │   └── v1.0/
│   │       └── RailSync_SRS_Final.pdf      # Candidate authoritative SRS Rev 1.0
│   ├── IMPLEMENTATION_PLAN.md              # Master engineering & execution plan (Rev 1.1)
│   ├── DECISIONS.md                        # Architectural decisions & resolutions
│   ├── TRACEABILITY.md                     # Traceability matrix: Req -> File -> Test -> Evidence
│   ├── FIXTURES.md                         # Detailed specification of all test fixtures
│   ├── ENVIRONMENT.md                      # Audit of tools, versions, and paths
│   ├── VIVA_NOTES.md                       # Comprehensive lab viva guide and answers
│   └── TEST_CHECKLIST.md                   # Systematic acceptance verification checklist
├── fixtures/
│   ├── reservation/
│   │   ├── R-01_unsafe_race.json
│   │   ├── R-02_safe_race.json
│   │   ├── R-03_mysql_lock_race.json
│   │   ├── R-04_cancel_promote.json
│   │   ├── R-05_ineligible_skip.json
│   │   ├── R-06_cancel_waitlist.json
│   │   ├── R-07_illegal_transition.json
│   │   ├── R-08_group_savepoint.json
│   │   ├── R-09_sql_error_atomicity.json
│   │   └── R-10_invariants_seed.json
│   └── disruption/
│       ├── D-01_late_3hr_eligible.json
│       ├── D-02_late_exact_180min.json
│       ├── D-03_late_179min.json
│       ├── D-04_delay_unverified.json
│       ├── D-05_missing_facts.json
│       ├── D-06a_filed_before_deadline.json
│       ├── D-06b_filed_at_deadline.json
│       ├── D-06c_filed_after_deadline.json
│       ├── D-06d_no_filing_event.json
│       ├── D-07_passenger_travelled.json
│       ├── D-08_train_cancelled.json
│       ├── D-09_rule_versioning.json
│       ├── D-10_no_active_rule.json
│       ├── D-11_unverified_rule.json
│       ├── D-12_waitlist_ticket_rejected.json
│       ├── D-13_events_after_eval_time.json
│       └── D-14_event_conflict.json
├── java/
│   ├── src/
│   │   └── railsync/
│   │       ├── model/                      # Assessed Core Domain (Strictly Zero Collections/JUC)
│   │       │   ├── Passenger.java          # Entity: passenger_id, name, email, phone
│   │       │   ├── Train.java              # Entity: train_id, train_number, train_name
│   │       │   ├── Journey.java            # Entity: journey_id, train_id, departure_time
│   │       │   ├── JourneyClass.java       # Entity: class_code, total_seats, base_fare
│   │       │   ├── Seat.java               # Entity: seat_number, berth_type
│   │       │   ├── SeatClass.java          # Abstract base: fare calculation template
│   │       │   ├── SleeperClass.java       # Concrete SeatClass: multiplier 1.0x (design choice)
│   │       │   ├── ACClass.java            # Concrete SeatClass: multiplier 2.5x + surcharge (design choice)
│   │       │   ├── GeneralClass.java       # Concrete SeatClass: multiplier 0.5x (design choice)
│   │       │   ├── Booking.java            # Aggregate: pnr, passenger, status, timestamps
│   │       │   ├── BookingStatus.java      # Enum: PENDING, CONFIRMED, WAITLISTED, CANCELLED
│   │       │   ├── SeatAllocation.java     # Entity: allocation_id, booking, seat
│   │       │   ├── WaitlistEntry.java      # Entity: waitlist_id, booking, position
│   │       │   └── BookingAudit.java       # Entity: audit_id, booking_id, from_status, to_status
│   │       ├── concurrency/                # Assessed Concurrency (Pure Monitor Primitives)
│   │       │   ├── BoundedFIFOQueue.java   # Fixed-array Object[] circular queue with wait/notifyAll
│   │       │   ├── BookingRequest.java     # Value object for submitted booking intent
│   │       │   ├── BookingAgent.java       # Runnable consumer thread processing queue requests
│   │       │   ├── StartGate.java          # Monitor-based barrier for race synchronization
│   │       │   ├── UnsafeInventory.java    # Deliberate check-then-claim race condition
│   │       │   ├── SafeInventory.java      # Thread-safe inventory with synchronized locking
│   │       │   └── JourneyMonitor.java     # Per-journey synchronization object
│   │       ├── service/                    # Business Service Tier
│   │       │   ├── BookingBackend.java     # Core abstraction interface for backends
│   │       │   ├── InMemoryBookingService.java # Thread-safe in-memory booking backend
│   │       │   ├── AuditLogger.java        # Thread-safe synchronized file audit logger
│   │       │   └── PnrGenerator.java       # Monotonic non-repeating PNR sequence generator (gaps on rollback)
│   │       ├── refund/                     # Disruption Refund Advisor Rule Engine
│   │       │   ├── RefundRule.java         # Value object: rule metadata, intervals, verified flag
│   │       │   ├── RefundPolicy.java       # Abstract strategy: policy evaluation template
│   │       │   ├── LateRunningPolicy.java  # Concrete policy: >180 min delay rule
│   │       │   ├── TrainCancelledPolicy.java # Concrete policy: automatic cancellation refund
│   │       │   ├── DisruptionCase.java     # Aggregate case containing ticket and events
│   │       │   ├── CaseEvent.java          # Immutable event fact with timestamp and source
│   │       │   ├── CaseEvaluation.java     # Complete evaluation result snapshot
│   │       │   ├── EvaluationCode.java     # Reason code value object
│   │       │   ├── RefundOutcome.java      # Enum: ELIGIBLE, NOT_ELIGIBLE, DEADLINE_EXPIRED, UNRESOLVED
│   │       │   ├── ReasonCode.java         # Enum of standardized reason codes
│   │       │   └── RefundEvaluator.java    # Rule matching and policy orchestration engine
│   │       ├── util/                       # Utilities and Serializers
│   │       │   ├── CanonicalJsonWriter.java # Pure Java canonical JSON serializer
│   │       │   ├── FixedList.java          # Custom fixed-capacity array list (no java.util)
│   │       │   └── DateTimeUtils.java      # ISO-8601 parser/formatter (no system clock)
│   │       ├── exception/                  # Domain Exceptions
│   │       │   ├── RailSyncException.java  # Base checked domain exception
│   │       │   ├── IllegalTransitionException.java # Lifecycle violation
│   │       │   ├── DuplicateConfirmedException.java # Invariant 5 violation
│   │       │   ├── CapacityExceededException.java   # Invariant 1 violation
│   │       │   └── UnsupportedTicketScopeException.java
│   │       └── ui/
│   │           └── ConsoleApp.java         # 8-option interactive CLI application
│   └── test/
│       └── railsync/
│           ├── ReservationFixtureTest.java # Runs R-01 through R-10
│           ├── DisruptionFixtureTest.java  # Runs D-01 through D-14
│           ├── InvariantVerifierTest.java  # Full automated check of INV-01..INV-07
│           └── ConcurrencyStressTest.java  # 100-repetition 10-thread race test
├── mysql/
│   ├── 00_reset.sql                        # Clean schema teardown / recreate database
│   ├── 01_tables.sql                       # 15 InnoDB tables with CHECK constraints (Candidate SRS §6.1)
│   ├── 02_seed.sql                         # Canonical seed data (trains, classes, rules)
│   ├── 03_views.sql                        # 4 reporting & updatable views
│   ├── 04_functions.sql                    # calculate_fare, occupancy_pct
│   ├── 05_triggers.sql                     # 8 integrity, audit & lifecycle triggers
│   ├── 06_procedures.sql                   # Canonical routines: book_seat, cancel_booking, etc.
│   ├── 07_experiments.sql                 # Concurrency lock-first demo & savepoint script
│   ├── 08_invariants.sql                  # Automated SQL verification queries for INV-01..INV-07
│   ├── 09_users.sql                        # Privilege separation (app_reader, app_writer, app_admin)
│   └── scripts/
│       ├── run_two_session_test.bat        # Automated 2-session lock demonstration
│       └── run_all_mysql_tests.bat         # Single-command execution of all SQL tests
├── tools/
│   ├── check_parity.py                     # Evaluates canonical JSON equivalence
│   ├── run_gates.py                        # Unified gate runner across Java & MySQL
│   └── generate_fixtures.py                # Deterministic test fixture generator
└── evidence/
    ├── gate1/                              # Compilation, DDL, Invariant evidence
    ├── gate2/                              # Thread race logs, MySQL session logs
    ├── gate3/                              # Parity diffs, JSON evaluation snapshots
    └── gate4/                              # Full regression run, coverage, viva checklist
```

---

### 2.2 Tier 1: Java OOP and Concurrency Architecture

#### Status: Provisional Course Restrictions (Pending Official Handout Confirmation)
- The SRS explicitly notes that the official CSC2104 course handout must be reviewed before the queue implementation is finalized.
- **Provisional Anticipated Baseline:**
  - Assessed packages (`railsync.model`, `railsync.concurrency`) avoid importing `java.util.concurrent.*` or classes from the Java Collections Framework (`ArrayList`, `HashMap`, `Queue`, `Vector`).
  - Internal structures use fixed primitive/object arrays (`Object[]`, `Seat[]`, `Booking[]`).
  - Synchronization uses native Java monitor primitives: `synchronized` methods/blocks, `wait()`, and `notifyAll()`.
  - Threading uses explicit `Thread` and `Runnable` classes.
- **Architecture Readiness:** Domain classes and service interfaces are architected so that whether the course restricts collections entirely or permits specific standard types, the implementation contracts and verification test harnesses remain stable.

#### Complete Booking Lifecycle State Machine
Per SRS §3.1, the exact permitted transitions are:
```
                +--------------+
                |   PENDING    |
                +--------------+
                 /      |     \
                /       |      \
               v        |       v
      +-----------+     |    +-----------+
      | CONFIRMED |     |    | CANCELLED | <----+
      +-----------+     |    +-----------+      |
            |           |         ^             |
            |           v         |             |
            |     +------------+  |             |
            +---> | WAITLISTED |--+             |
                  +------------+                |
                        |                       |
                        +-----------------------+ (promote to CONFIRMED)
```
- **Legal Transitions:**
  1. `PENDING` $\rightarrow$ `CONFIRMED` (Inventory available, seat allocated)
  2. `PENDING` $\rightarrow$ `WAITLISTED` (Inventory full, added to FIFO queue)
  3. `PENDING` $\rightarrow$ `CANCELLED` (Pre-confirmation abort, timeout, or validation abort)
  4. `CONFIRMED` $\rightarrow$ `CANCELLED` (Passenger cancellation, allocation released, promotion triggered)
  5. `WAITLISTED` $\rightarrow$ `CONFIRMED` (Waitlist candidate promoted into cancelled seat)
  6. `WAITLISTED` $\rightarrow$ `CANCELLED` (Waitlist entry removed, no seat allocation freed)
- **Illegal Transitions:** Any other transition (such as `CANCELLED` $\rightarrow$ `CONFIRMED`, `CONFIRMED` $\rightarrow$ `WAITLISTED`, `CANCELLED` $\rightarrow$ `PENDING`) must immediately throw `IllegalTransitionException` in Java and trigger SQL `SIGNAL SQLSTATE '45000'` in MySQL.

#### Bounded FIFO Queue Monitor (`BoundedFIFOQueue.java`)
```java
public class BoundedFIFOQueue {
    private final Object[] buffer;
    private int head = 0;
    private int tail = 0;
    private int count = 0;
    private final int capacity;
    private boolean isShutdown = false;

    public BoundedFIFOQueue(int capacity) {
        this.capacity = capacity;
        this.buffer = new Object[capacity];
    }

    public synchronized void put(Object item) throws InterruptedException {
        while (count == capacity && !isShutdown) {
            wait();
        }
        if (isShutdown) throw new IllegalStateException("Queue is shutdown");
        buffer[tail] = item;
        tail = (tail + 1) % capacity;
        count++;
        notifyAll();
    }

    public synchronized Object take() throws InterruptedException {
        while (count == 0 && !isShutdown) {
            wait();
        }
        if (count == 0 && isShutdown) return null;
        Object item = buffer[head];
        buffer[head] = null;
        head = (head + 1) % capacity;
        count--;
        notifyAll();
        return item;
    }

    public synchronized void shutdown() {
        this.isShutdown = true;
        notifyAll();
    }
}
```

---

### 2.3 Tier 2: MySQL 8 RDBMS Architecture

#### Canonical Routine Naming (Aligned with SRS Baseline)
To ensure 1:1 traceability with SRS v0.2, all SQL stored routines adopt the exact names specified in the SRS:
- `book_seat(...)`: Atomically reserves a seat or waitlists a booking under lock hierarchy.
- `cancel_booking(...)`: Cancels a confirmed or waitlisted booking, frees allocation, triggers promotion.
- `promote_waitlist(...)`: Scans waitlist, validates eligibility under `INV-05`, promotes earliest waiter.
- `book_group(...)`: Coordinates multi-passenger booking with per-member `SAVEPOINT`s and atomic rollback.
- `evaluate_case(...)`: Executes refund policy rules against case facts and records immutable evaluation.
- `calculate_fare(...)`: Deterministic stored function calculating fare by class and distance.
- `occupancy_pct(...)`: Stored function returning current occupancy percentage for journey class.
- `run_invariants(...)`: Comprehensive diagnostic procedure evaluating all invariants `INV-01`..`INV-07`.

#### Standardized Numbered Script Sequence
1. `mysql/00_reset.sql`: Drops existing database objects; establishes clean state.
2. `mysql/01_tables.sql`: 16 InnoDB tables, primary keys, foreign keys, CHECK constraints, composite unique keys.
3. `mysql/02_seed.sql`: Deterministic reference data (trains, journeys, classes, seats, synthetic passengers, refund rules).
4. `mysql/03_views.sql`: Reporting views (`v_journey_occupancy`, `v_waitlist_order`, `v_latest_case_evaluation`, updatable view).
5. `mysql/04_functions.sql`: `calculate_fare`, `occupancy_pct`.
6. `mysql/05_triggers.sql`: Lifecycle state guards, transactional booking audit triggers, interval overlap guards, evaluation immutability.
7. `mysql/06_procedures.sql`: Core stored procedures (`book_seat`, `cancel_booking`, `promote_waitlist`, `book_group`, `evaluate_case`).
8. `mysql/07_experiments.sql`: Two-session concurrency test harness and group savepoint failure scenario.
9. `mysql/08_invariants.sql`: Automated SQL test queries validating invariants `INV-01` through `INV-07`.
10. `mysql/09_users.sql`: Role segregation (`app_reader`, `app_writer`, `app_admin`), privilege grants, `SHOW GRANTS`.

#### Strict Locking Order Hierarchy (Mandatory to Prevent Deadlocks & Invariant Races)
All stored procedures and transactions MUST acquire exclusive row locks in the identical hierarchical order:
$$\mathbf{JOURNEY} \longrightarrow \mathbf{JOURNEY\_CLASS} \longrightarrow \mathbf{BOOKING} \longrightarrow \mathbf{SEAT\_ALLOCATION} \longrightarrow \mathbf{WAITLIST\_ENTRY}$$

**Mandatory Rule:** The very first data-access statement inside `book_seat` MUST acquire an exclusive row lock on the parent `JOURNEY` row:
```sql
-- Step 1: Mandatory parent lock
SELECT journey_id INTO v_dummy
FROM JOURNEY
WHERE journey_id = p_journey_id
FOR UPDATE;

-- Step 2: Journey Class lock
SELECT journey_class_id, total_seats INTO v_class_id, v_total_seats
FROM JOURNEY_CLASS
WHERE journey_class_id = p_journey_class_id
FOR UPDATE;
```
*Rationale:* Locking `JOURNEY` first serializes all booking attempts on that journey across all classes. This is strictly required to prevent a race condition against Invariant `INV-05`, where two concurrent transactions could otherwise confirm the same passenger in two different classes (e.g., Sleeper and AC) simultaneously if only class-level locks were taken.

---

### 2.4 Cross-Tier Parity and Canonical Contract

Both Java and MySQL engines must emit canonical JSON matching the following schema:
```json
{
  "evaluationId": "EVAL-20261024-001",
  "fixtureId": "D-01-late-over-3hr",
  "ruleFamily": "LATE_OVER_3_HOURS_E_TICKET",
  "ruleVersion": 1,
  "outcome": "ELIGIBLE",
  "reasonCodes": [
    "DELAY_OVER_THRESHOLD",
    "FILED_BEFORE_DEPARTURE"
  ],
  "warnings": [],
  "deadlineAction": "FILE_TDR_BEFORE_DEPARTURE",
  "refundAmountINR": "1250.00",
  "disclaimer": "This evaluation is simulated guidance based on simplified IRCTC educational rules. It is not an official railway refund advice, ticket cancellation, or TDR filing."
}
```

---

## 3. Fixture Inventory

### 3.1 Reservation Test Fixtures

- `fixtures/reservation/R-01_unsafe_race.json`: 2 concurrent booking requests competing for 1 remaining seat in `UnsafeInventory`. Demonstrates reproducible over-claim.
- `fixtures/reservation/R-02_safe_race.json`: 10 concurrent booking requests across 100 repetitions on 1 seat in `SafeInventory`. 0 over-allocations.
- `fixtures/reservation/R-03_mysql_lock_race.json`: Two parallel MySQL transactions attempting to claim the final seat using `book_seat`. Proves session blocking on `JOURNEY` lock and 0 overbooking.
- `fixtures/reservation/R-04_cancel_promote.json`: Cancelling a confirmed booking with 2 waitlist entries. Verifies allocation release and promotion of waiter 1.
- `fixtures/reservation/R-05_ineligible_skip.json`: Waitlist promotion where waiter 1 holds confirmed booking in another class. Verifies skipping waiter 1 without mutation and promoting waiter 2.
- `fixtures/reservation/R-06_cancel_waitlist.json`: Cancelling waitlist entry. Verifies no allocation change and empty-queue stability.
- `fixtures/reservation/R-07_illegal_transition.json`: Attempting `CANCELLED` -> `CONFIRMED`. Verifies `IllegalTransitionException` and SQL trigger block.
- `fixtures/reservation/R-08_group_savepoint.json`: 3-member group booking where member 2 fails. Verifies partial rollback to savepoint; member 2's booking and audit rows removed; PNR discarded with gap; members 1 and 3 committed.
- `fixtures/reservation/R-09_sql_error_atomicity.json`: Booking transaction encountering error before commit. Verifies 0 orphan records; PNR gap recorded.
- `fixtures/reservation/R-10_invariants_seed.json`: Baseline seed data for validating all 7 invariants.

### 3.2 Disruption Advisor Test Fixtures

- `fixtures/disruption/D-01_late_3hr_eligible.json`: Delay 210 min, not travelled, filed 15m before departure -> `ELIGIBLE`.
- `fixtures/disruption/D-02_late_exact_180min.json`: Delay exactly 180 min -> `NOT_ELIGIBLE` (`DELAY_NOT_OVER_THRESHOLD`).
- `fixtures/disruption/D-03_late_179min.json`: Delay 179 min -> `NOT_ELIGIBLE` (`DELAY_NOT_OVER_THRESHOLD`).
- `fixtures/disruption/D-04_delay_unverified.json`: Delay reported only by passenger -> `UNRESOLVED` (`DELAY_UNVERIFIED`).
- `fixtures/disruption/D-05_missing_facts.json`: Missing travel state fact -> `UNRESOLVED` (`TRAVEL_STATUS_UNKNOWN`).
- `fixtures/disruption/D-06a_filed_before_deadline.json`: Filing at `departure - 1s` -> `ELIGIBLE`.
- `fixtures/disruption/D-06b_filed_at_deadline.json`: Filing at `departure` -> `DEADLINE_EXPIRED` (`FILED_AFTER_DEPARTURE`).
- `fixtures/disruption/D-06c_filed_after_deadline.json`: Filing at `departure + 1s` -> `DEADLINE_EXPIRED` (`FILED_AFTER_DEPARTURE`).
- `fixtures/disruption/D-06d_no_filing_event.json`: No filing attempt event -> `UNRESOLVED` (`FILING_ATTEMPT_UNKNOWN`).
- `fixtures/disruption/D-07_passenger_travelled.json`: Passenger travelled -> `NOT_ELIGIBLE` (`PASSENGER_TRAVELLED`).
- `fixtures/disruption/D-08_train_cancelled.json`: Official cancellation -> `ELIGIBLE` (`TRAIN_CANCELLED_AUTO_REFUND`, `NO_TDR_REQUIRED`).
- `fixtures/disruption/D-09_rule_versioning.json`: Older applicability time selects Version 1 rule.
- `fixtures/disruption/D-10_no_active_rule.json`: Applicability time with no rule active -> `UNRESOLVED` (`RULE_NOT_FOUND`).
- `fixtures/disruption/D-11_unverified_rule.json`: Rule marked `verified = false` -> `UNRESOLVED` (`RULE_SOURCE_UNVERIFIED`).
- `fixtures/disruption/D-12_waitlist_ticket_rejected.json`: Ticket in status `WAITLISTED` -> rejected (`UNSUPPORTED_TICKET_SCOPE`).
- `fixtures/disruption/D-13_events_after_eval_time.json`: Events occurring after evaluation time ignored with warning.
- `fixtures/disruption/D-14_event_conflict.json`: Contradictory official events -> `UNRESOLVED` (`EVENT_CONFLICT`).

---

## 4. Task Graph

The 45 implementation tasks are distributed across 3 parallel tracks:
- **Track A (Java OOP & Concurrency):** Tasks T01..T15
- **Track B (MySQL RDBMS & Procedures):** Tasks T16..T30
- **Track C (Fixtures, Parity, Tooling & Docs):** Tasks T31..T45

```
Gate 1: Foundations (T01-T05, T16-T20, T31-T33)
   │
   ▼
Gate 2: Concurrency & Transactions (T06-T10, T21-T25, T34-T36)
   │
   ▼
Gate 3: Disruption Advisor & Parity (T11-T13, T26-T28, T37-T40)
   │
   ▼
Gate 4: Verification, Console & Polish (T14-T15, T29-T30, T41-T45)
```

### 4.1 Gate 1 Tasks (Foundations)
- **T01 [Track A]:** Setup Java project directory, compile scripts, and domain base interfaces.
- **T02 [Track A]:** Implement core entity classes (`Passenger`, `Train`, `Journey`, `Seat`, `Booking`).
- **T03 [Track A]:** Implement `SeatClass` abstract hierarchy (`SleeperClass`, `ACClass`, `GeneralClass`).
- **T04 [Track A]:** Implement `InMemoryBookingService` for sequential bookings, cancellations, and waitlisting with exact SRS lifecycle transitions.
- **T05 [Track A]:** Implement `AuditLogger` and domain exceptions (`IllegalTransitionException`).
- **T16 [Track B]:** Author `01_tables.sql` (16 tables, primary/foreign keys, CHECK constraints, composite unique keys).
- **T17 [Track B]:** Author `02_seed.sql` with canonical trains, classes, seats, and synthetic passengers.
- **T18 [Track B]:** Author `05_triggers.sql` for booking audit logging and status transition enforcement.
- **T19 [Track B]:** Implement basic booking and cancellation stored procedures (`book_seat`, `cancel_booking`).
- **T20 [Track B]:** Author `test_gate1_foundations.sql` validating seed integrity and invariants `INV-01`..`INV-06`.
- **T31 [Track C]:** Create `fixtures/reservation/` directory and populate fixtures `S-01` through `S-05`.
- **T32 [Track C]:** Author `ENVIRONMENT.md` recording Java 26, MySQL 8.0.40, Python 3.14 paths and tools.
- **T33 [Track C]:** Gate 1 review and verification run; output evidence to `evidence/gate1/`.

### 4.2 Gate 2 Tasks (Concurrency & Transactional Integrity)
- **T06 [Track A]:** Implement `BoundedFIFOQueue` using fixed array and monitor primitives (`wait`/`notifyAll`).
- **T07 [Track A]:** Implement `BookingAgent` runnable threads consuming from `BoundedFIFOQueue`.
- **T08 [Track A]:** Implement `StartGate` barrier and `UnsafeInventory` demonstrating race condition (Fixture `R-01`).
- **T09 [Track A]:** Implement `SafeInventory` with synchronized locking; verify 100 repetitions with 10 threads (Fixture `R-02`).
- **T10 [Track A]:** Implement cross-class promotion logic in `InMemoryBookingService` with ineligible waiter skipping (Fixture `R-05`).
- **T21 [Track B]:** Implement MySQL lock-first concurrency in `book_seat` (`JOURNEY` lock first, `JOURNEY_CLASS` lock second).
- **T22 [Track B]:** Implement `promote_waitlist` with cursor and eligibility checks under `INV-05`.
- **T23 [Track B]:** Implement `book_group` with per-member `SAVEPOINT`, partial rollback handling, and audit cleanup (Fixture `R-08`).
- **T24 [Track B]:** Author `09_users.sql` defining `app_reader`, `app_writer`, `app_admin` roles and grant matrices.
- **T25 [Track B]:** Implement automated two-session lock test script `run_two_session_test.bat`.
- **T34 [Track C]:** Author test fixtures `R-01` through `R-10` in standard JSON format.
- **T35 [Track C]:** Build automated Java test runner executing `ReservationFixtureTest`.
- **T36 [Track C]:** Gate 2 review and verification run; output evidence to `evidence/gate2/`.

### 4.3 Gate 3 Tasks (Disruption Refund Advisor & Parity)
- **T11 [Track A]:** Implement refund domain entities (`DisruptionCase`, `CaseEvent`, `RefundRule`, `CaseEvaluation`).
- **T12 [Track A]:** Implement `RefundPolicy` abstract strategy and concrete policies (`LateRunningPolicy`, `TrainCancelledPolicy`).
- **T13 [Track A]:** Implement `RefundEvaluator` with temporal interval lookup and canonical JSON serialization.
- **T26 [Track B]:** Populate canonical refund rules in `02_seed.sql` with verified and unverified test versions.
- **T27 [Track B]:** Implement `evaluate_case` stored procedure executing policies and persisting evaluation tables.
- **T28 [Track B]:** Implement `03_views.sql` for reporting views (`v_latest_case_evaluation`, `v_journey_occupancy`).
- **T37 [Track C]:** Populate all disruption fixtures `D-01` through `D-14` in `fixtures/disruption/`.
- **T38 [Track C]:** Develop `tools/check_parity.py` comparing Java vs MySQL JSON outputs field-by-field.
- **T39 [Track C]:** Execute parity verification harness across all 14 D-fixtures; ensure 100% field equality.
- **T40 [Track C]:** Gate 3 review and verification run; output evidence to `evidence/gate3/`.

### 4.4 Gate 4 Tasks (Verification, Console UI & Submission Polish)
- **T14 [Track A]:** Implement interactive `ConsoleApp` supporting all 8 operations specified in `FR-R10`.
- **T15 [Track A]:** Author unit and integration test suite executing full regression across Java tier.
- **T29 [Track B]:** Author complete SQL test harness executing all regression tests via MySQL CLI.
- **T30 [Track B]:** Validate database backup, export scripts, and schema teardown/rebuild repeatability (`00_reset.sql`).
- **T41 [Track C]:** Author `docs/TRACEABILITY.md` mapping every SRS requirement to code, tests, and evidence files.
- **T42 [Track C]:** Author `docs/TEST_CHECKLIST.md` documenting observed results for all R, D, and S fixtures.
- **T43 [Track C]:** Author `docs/VIVA_NOTES.md` providing comprehensive student explanations and viva Q&A.
- **T44 [Track C]:** Author top-level `README.md` with complete step-by-step setup and execution instructions.
- **T45 [Track C]:** Gate 4 final acceptance audit, artifact collation, and submission sign-off.

---

## 5. Gate Checklists and Acceptance Criteria

### Gate 1: Foundations
- [ ] Java domain entities compile cleanly with `javac` (Zero warnings).
- [ ] MySQL schema `01_tables.sql` and `02_seed.sql` execute cleanly on MySQL 8.
- [ ] Triggers enforce exact status lifecycle including `PENDING` $\rightarrow$ `CANCELLED`.
- [ ] Invariants `INV-01` through `INV-06` pass with 0 violations.
- [ ] Rolled-back transactions leave zero committed audit rows in `BOOKING_AUDIT`.
- [ ] Evidence stored in `evidence/gate1/`.

### Gate 2: Concurrency & Transactional Integrity
- [ ] Bounded FIFO queue passes producer-consumer test with graceful shutdown.
- [ ] `UnsafeInventory` reproduces over-allocation race condition (Fixture `R-01`).
- [ ] `SafeInventory` passes 100 repetitions with 10 threads and 0 over-allocations (Fixture `R-02`).
- [ ] MySQL two-session script proves lock acquisition on `JOURNEY`, session waiting, and 0 overbooking (Fixture `R-03`).
- [ ] Group booking savepoint rollback leaves zero partial state for failed members (Fixture `R-08`).
- [ ] Invariant `INV-07` holds on all cancellations.
- [ ] Evidence stored in `evidence/gate2/`.

### Gate 3: Disruption Refund Advisor & Parity
- [ ] Java rule engine evaluates all fixtures `D-01` through `D-14` correctly.
- [ ] MySQL stored procedure `evaluate_case` evaluates all fixtures correctly.
- [ ] Epistemic honesty verified: unverified rules or missing facts evaluate to `UNRESOLVED`.
- [ ] `check_parity.py` reports 100% match across all parity fields between Java and MySQL.
- [ ] Evidence stored in `evidence/gate3/`.

### Gate 4: Verification, Console UI & Submission Polish
- [ ] Interactive `ConsoleApp` runs cleanly and handles invalid inputs gracefully.
- [ ] `docs/TRACEABILITY.md` is 100% complete with 0 unmapped requirements.
- [ ] `docs/TEST_CHECKLIST.md` documents all test runs with real observed outputs.
- [ ] `docs/VIVA_NOTES.md` covers all OOP and RDBMS viva questions.
- [ ] Fresh checkout walkthrough from `README.md` succeeds on clean environment.
- [ ] Final evidence archive compiled in `evidence/gate4/`.

---

## 6. Evidence Plan

### 6.1 Unsafe vs Safe Java Race Methodology
1. **Unsafe Race (Dual-Barrier Coordinated Methodology):** Launch 2 worker threads competing for 1 seat. Coordinated via two distinct synchronization gates:
   - **Gate 1 (`StartGate`):** Releases both worker threads simultaneously into `bookTicket()`.
   - **Gate 2 (`ReadBarrier`):** Positioned inside `UnsafeInventory` immediately after the capacity check. Thread 1 reads `availableSeats = 1` and waits at `ReadBarrier`. Thread 2 reads `availableSeats = 1` and arrives at `ReadBarrier`. Once both threads have observed `availableSeats == 1`, `ReadBarrier` trips, allowing both threads to proceed to claim the single seat.
   - **Result:** Both threads confirm their bookings and decrement the counter, recording 2 confirmed bookings for a single physical seat (over-allocation proven deterministically). Recorded in `evidence/gate2/unsafe_race.log`.
2. **Safe Race:** Launch 10 worker threads against `SafeInventory` with 1 seat. Run across 100 iterations. In every iteration, exactly 1 thread acquires the lock, confirms the booking, and decrements seats to 0; remaining 9 threads receive `WAITLISTED`. Result: 0 over-allocations across 1,000 requests. Recorded in `evidence/gate2/safe_race_100reps.log`.

### 6.2 MySQL Two-Session Concurrency Experiment (Lock-First)
1. **Session 1:** Starts explicit transaction: `START TRANSACTION;`
2. **Session 1:** Executes mandatory parent lock: `SELECT journey_id FROM JOURNEY WHERE journey_id = 101 FOR UPDATE;`
3. **Session 1:** Executes child class lock: `SELECT journey_class_id, total_seats FROM JOURNEY_CLASS WHERE journey_class_id = 1 FOR UPDATE;`
4. **Session 2:** Concurrently starts transaction: `START TRANSACTION;`
5. **Session 2:** Attempts to call `book_seat(...)` or queries `SELECT journey_id FROM JOURNEY WHERE journey_id = 101 FOR UPDATE;` $\rightarrow$ **Blocks waiting for Session 1's lock on `JOURNEY`!**
6. **Session 1:** Checks available capacity (1 seat available), creates booking, assigns seat allocation, logs audit, and commits (`COMMIT;`).
7. **Session 2:** Unblocks immediately upon Session 1's commit, acquires `JOURNEY` and `JOURNEY_CLASS` locks, reads updated capacity (now 0), creates booking with status `WAITLISTED`, inserts waitlist entry, commits.
8. Output captured via `scripts/run_two_session_test.bat` into `evidence/gate2/mysql_two_session.txt`.

### 6.3 Group Booking Partial Failure & Savepoint Verification
1. Start single transaction for 3 passenger bookings with shared `group_ref`.
2. **Member 1:** Create savepoint `sp_p1`, insert booking, allocate seat $\rightarrow$ Success.
3. **Member 2:** Create savepoint `sp_p2`, insert booking, trigger intentional error (duplicate passenger on same journey or constraint violation) $\rightarrow$ Fails.
4. Catch error, execute `ROLLBACK TO SAVEPOINT sp_p2;`.
5. **Verification of Member 2 Rollback:**
   - Member 2's booking row is eliminated.
   - Member 2's seat allocation row is eliminated.
   - Member 2's `BOOKING_AUDIT` transactional rows are eliminated.
   - Member 2's generated PNR is discarded with an intentional gap; it is never re-issued.
6. **Member 3:** Create savepoint `sp_p3`, insert booking, allocate seat $\rightarrow$ Success.
7. Commit transaction (`COMMIT;`).
8. Verify committed state: Members 1 and 3 are `CONFIRMED` with valid seat allocations and committed audit rows. Member 2 has zero presence in `BOOKING`, `SEAT_ALLOCATION`, and `BOOKING_AUDIT`. Logged in `evidence/gate2/group_savepoint.log`.

### 6.4 Invariant Verification Harness
Automated SQL script `mysql/08_invariants.sql` executing queries for all 7 invariants:
- Count queries verifying confirmed count $\le$ total seats.
- Outer join queries verifying orphaned allocations or waitlist entries.
- Grouping queries verifying passenger confirmation uniqueness per journey across all classes.
- Cross-table audit check verifying status transition audit completeness.

### 6.5 Canonical JSON Parity Harness
Python script `tools/check_parity.py` runs both `java -cp bin railsync.test.DisruptionFixtureTest` and `mysql -e "CALL run_parity_tests()"`:
- Collects JSON output files for fixtures `D-01` through `D-14`.
- Normalizes field ordering, whitespace, and decimal precision (`INR` values formatted to 2 decimal places).
- Performs strict semantic diff; prints exact matching status per fixture. Output saved to `evidence/gate3/parity_report.txt`.

---

## 7. Teaching Plan & Viva Guide

### 7.1 Course Alignment
- **CSC2104 (Java OOP):** Polymorphic domain modeling, abstract classes vs interfaces, thread synchronization, intrinsic monitors (`synchronized`, `wait`, `notifyAll`), bounded queue mechanics, race conditions, exception hierarchies.
- **CSC2131 (RDBMS Lab):** 3NF relational normalization, primary/foreign key constraints, domain integrity with CHECK constraints, ACID transaction properties, InnoDB row-level locking vs table locking, stored procedures, cursor loops, trigger execution ordering, database views, privilege management.

### 7.2 Module Ownership Breakdown
| Module | Primary Course | Core Concepts Demonstrated | Student Lead Responsibilities |
|---|---|---|---|
| Domain Model & Fare Strategy | CSC2104 | Abstraction, Polymorphism, Inheritance | Java class hierarchy, unit tests |
| Bounded Queue & Concurrency | CSC2104 | Multithreading, Monitors, Race Conditions | Monitor implementation, race experiments |
| Relational Schema & Constraints | CSC2131 | DDL, Normalization, CHECK Constraints | 16-table schema, seed scripts |
| Transactional Engine & Triggers | CSC2131 | Triggers, Stored Procedures, Savepoints | Lifecycle triggers, booking procedures |
| Disruption Advisor Rule Engine | Both | Temporal Logic, Determinism, Parity | Policy evaluation, parity validation |
| Test Harness & Documentation | Both | Verification, Traceability, Viva Prep | Test checklists, viva guide, evidence |

### 7.3 Sample Viva Questions and Model Answers

#### Q1: Why did you use `wait()` inside a `while` loop rather than an `if` statement in `BoundedFIFOQueue`?
> **Answer:** In Java multithreading, threads can wake up without a corresponding notification due to **spurious wakeups**. Furthermore, in a multi-consumer or multi-producer environment, between the time a thread is awakened by `notifyAll()` and the time it re-acquires the intrinsic lock, another thread may have already executed and altered the condition (e.g., consumed the only available slot). Checking the condition inside a `while` loop ensures the thread re-evaluates the invariant before proceeding.

#### Q2: What is the difference between `notify()` and `notifyAll()`, and why is `notifyAll()` required in your queue?
> **Answer:** `notify()` wakes up a single arbitrary thread waiting on the object's monitor, whereas `notifyAll()` wakes up all waiting threads. In our `BoundedFIFOQueue`, both producer threads waiting for space (`count < capacity`) and consumer threads waiting for items (`count > 0`) wait on the same monitor lock. If `notify()` is used, a producer might signal another producer instead of a consumer, leading to a missed signal and potential thread deadlock where all threads wait forever. `notifyAll()` guarantees that all waiting threads wake up and the correct thread can make progress.

#### Q3: Why is locking `JOURNEY` first strictly necessary in MySQL when booking a seat, rather than just locking `JOURNEY_CLASS`?
> **Answer:** Invariant `INV-05` mandates that a passenger can have at most one confirmed booking on a journey across *all* classes. If transactions locked only `JOURNEY_CLASS`, two concurrent transactions for the same passenger—one booking Sleeper and one booking AC on the same journey—would lock separate class rows independently. Both would observe no prior confirmation and both would commit, violating `INV-05`. By locking the parent `JOURNEY` row first, all reservation operations on that journey are serialized, guaranteeing that passenger duplicate checks evaluate against the true current state.

#### Q4: What is the purpose of `SAVEPOINT` in your group booking procedure, and how does rollback affect PNRs and audit logs?
> **Answer:** In a group booking involving multiple passengers, a failure on an individual passenger should not invalidate bookings for valid group members if the business policy permits partial fulfillment. Using `SAVEPOINT` before each passenger allows executing `ROLLBACK TO SAVEPOINT` if that passenger fails. This unwinds only the failed member's booking, seat allocation, and transactional audit rows. The failed member's generated PNR is permanently consumed and abandoned, leaving an intentional gap in the sequence to ensure PNRs are never recycled.

#### Q5: How do you enforce Invariant 5 across different seat classes in MySQL?
> **Answer:** We enforce this at the database storage engine level using a relational invariant in `SEAT_ALLOCATION`: the table includes both `passenger_id` and `journey_id`, with a composite unique key `UNIQUE KEY uq_psg_journey (passenger_id, journey_id)`. Because a seat allocation is created only for `CONFIRMED` bookings, any attempt by the same passenger to hold two confirmed seats on the same journey immediately triggers a unique key constraint violation at the InnoDB level.

---

## 8. SRS Issues, Ambiguities and Decisions

| Issue # | Topic / Clause | Description of Ambiguity or Conflict | Authoritative Engineering Resolution |
|---|---|---|---|
| **ISS-01** | Scope of Disruption Advisor (§5.1, §5.2) | SRS states advisor models single confirmed e-ticket; Appendix A test D-12 references waitlisted tickets. | Explicitly enforce scope guard: tickets with status `WAITLISTED` or non-e-ticket types are rejected with `UNRESOLVED` and reason code `UNSUPPORTED_TICKET_SCOPE`. |
| **ISS-02** | Passenger Single Confirmation (§3.3 INV-05) | Invariant prohibits passenger from holding two confirmed bookings on same journey across classes. Does this apply to waitlist? | No. A passenger may be confirmed in class `SL` and simultaneously waitlisted in class `3A`. Invariant `INV-05` strictly restricts status `CONFIRMED`. Waitlist promotion must check `INV-05` before promoting. |
| **ISS-03** | Queue Sizing & Shutdown (§4 FR-R13) | Handout mandates fixed-array queue; does shutdown reject queued items or drain them? | Strict graceful shutdown semantics: `shutdown()` prevents new `put()` submissions (throws `IllegalStateException`) but allows existing queued requests to be fully consumed (`take()` returns remaining items until empty, then returns `null`). |
| **ISS-04** | Promotion Eligibility Order (§4 FR-R17, §3.3 INV-07) | If waiter #1 is ineligible due to holding confirmed booking in another class, does promotion abort? | No. Ineligible candidates are skipped **without mutation** (they remain on waitlist). The procedure continues scanning to promote the next eligible candidate in FIFO order. |
| **ISS-05** | Savepoint Semantics, PNR Gaps & Audit Rows | Resolution of PNR consumption vs atomic rollback requirements. | PNRs are allocated from a monotonic non-recycling source. If a transaction or savepoint rolls back, all booking, allocation, and audit rows are rolled back atomically (zero committed audit rows). The PNR is discarded, leaving an intentional gap in the sequence. PNRs are never recycled. |
| **ISS-06** | Clock Isolation (§5.4, §8 NFR-01) | Risk of developers using `System.currentTimeMillis()` or MySQL `NOW()` in policy evaluation. | Strict prohibition: `RefundEvaluator` and `evaluate_case` require explicit `policy_applicability_time` and `evaluation_time` arguments. Automated checks fail build if clock functions are detected in rule logic. |
| **ISS-07** | Event Contradictions (§5.5, §9.2 D-14) | Conflicting facts (e.g., official delay 210m vs official delay 120m). | Invariant check: if multiple official events of the same fact type contradict each other, evaluation must abort with outcome `UNRESOLVED` and reason code `EVENT_CONFLICT`. |
| **ISS-08** | Unverified Rule Behavior (§5.3 FR-D05) | Does an unverified rule evaluate to `NOT_ELIGIBLE` or `UNRESOLVED`? | Strict epistemic honesty: unverified rules (`verified = false`) must evaluate to `UNRESOLVED` with code `RULE_SOURCE_UNVERIFIED`. It is forbidden to output `ELIGIBLE` or `NOT_ELIGIBLE` on unverified rules. |
| **ISS-09** | MySQL 8 CHECK Constraint Limitations | MySQL 8 enforces CHECK constraints, but subqueries inside CHECK are forbidden. | Enforce single-row bounds via CHECK (e.g., `fare_inr >= 0`, `total_seats >= 0`). Enforce multi-row constraints (cross-table allocations, status lifecycle) via InnoDB triggers and unique composite keys. |
| **ISS-10** | Floating-Point Parity on Currency | Potential rounding differences between Java `double` and MySQL `DECIMAL(10,2)`. | All monetary amounts must be stored as `DECIMAL(10,2)` in SQL and represented as `BigDecimal` or fixed 2-decimal formatted strings in canonical JSON (`"1250.00"`). |
| **ISS-11** | Lock Ordering Hierarchy in Concurrency | Risk of deadlocks and `INV-05` races if class row is locked before journey row. | Mandate strict hierarchical locking: `JOURNEY` first, then `JOURNEY_CLASS`. Locking `JOURNEY` first serializes cross-class bookings for the same passenger. |
| **ISS-12** | Booking Lifecycle State Transitions | Shorthand omitted valid transition `PENDING` $\rightarrow$ `CANCELLED`. | Explicitly adopt full SRS transition table including `PENDING` $\rightarrow$ `CANCELLED`. All other non-enumerated transitions are rejected. |
| **ISS-13** | PNR Persistence Across Application Restarts | Memory-only counter resets on JVM restart, risking duplicate PNR issuance across runs. | In Java, `PnrGenerator` persists highest issued sequence to `data/pnr_sequence.dat`. In MySQL, powered directly by `BOOKING` auto-increment ID (ADR-19, Candidate SRS §6.1). Monotonic, permanent, gaps on rollback. |
| **ISS-14** | Java Audit Log Transactional Commit Boundary | File logger cannot rollback written disk entries on subsequent runtime error. | Implement staged commit boundary: `InMemoryBookingService` buffers audit records during execution; flushes to file logger only when transaction completes successfully; discards on error. |
| **ISS-15** | Cross-Table Trigger Circular Dependency | Mutually-referencing row triggers on `BOOKING` and `SEAT_ALLOCATION` fail intermediate transition steps. | Enforce via procedural coordination in stored procedures + foreign key constraints + post-transaction invariant assertions (`run_invariants`), avoiding circular trigger deadlocks. |
| **ISS-16** | Lock Hierarchy in Cancellation and Promotion | Cancellation starts from PNR, risking inverse lock order against concurrent bookings. | Enforce lookup-and-lock pattern: read IDs first without mutation, then acquire row locks in canonical order (`JOURNEY` $\rightarrow$ `JOURNEY_CLASS` $\rightarrow$ `BOOKING`), then mutate. |

---

## 9. Risk Register and Mitigation Strategies

| Risk ID | Risk Description | Likelihood | Impact | Early Warning Indicator | Mitigation Strategy |
|---|---|---|---|---|---|
| **RSK-01** | MySQL Deadlocks on Concurrent Bookings | Medium | High | `Deadlock found when trying to get lock` error during concurrent tests. | Enforce strict hierarchical locking order across all transactions: `JOURNEY` -> `JOURNEY_CLASS` -> `BOOKING`. |
| **RSK-02** | Race Conditions in Waitlist Promotion | Medium | High | Capacity exceeded after simultaneous cancellations. | Synchronize cancellation and promotion under the identical journey-level monitor lock in Java, and serialized row locks in MySQL. |
| **RSK-03** | JSON Serialization Differences Breaking Parity | High | Medium | `check_parity.py` reports diffs on whitespace, keys, or float formatting. | Implement custom `CanonicalJsonWriter` with sorted keys, standardized ISO-8601 timestamps, and two-decimal currency formatting. |
| **RSK-04** | Windows Environment Path Inconsistencies | Low | Medium | `mysql` command not recognized in standard command line. | Explicitly reference full binary path `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe` in all runner scripts and test batches. |
| **RSK-05** | Thread Hang / Missed Notification on Queue Shutdown | Medium | High | Concurrency test runner hangs indefinitely during queue drain. | Always invoke `notifyAll()` (never `notify()`) on queue `shutdown()` to awaken all blocked producers and consumers. |
| **RSK-06** | Accidental Dependency on Java Collections | Medium | High | Build review flags `import java.util.ArrayList` in assessed packages. | Pre-commit static check script grepping `java/src/railsync/model` and `concurrency` for forbidden imports. |
| **RSK-07** | Clock Skew Breaking Fixture Reproducibility | Low | High | Fixture evaluations change when executed at different system times. | Absolute ban on system clock in evaluation logic; test harnesses pass fixed timestamps explicitly. |
| **RSK-08** | Incomplete Cleanup Between Test Runs | Medium | Medium | Invariant checks fail due to dirty leftover data from previous runs. | Every test script executes `00_reset.sql` teardown and fresh seed restore before and after test suites. |
| **RSK-09** | Scope Creep into Complex Network / JDBC APIs | Low | Medium | Time wasted attempting premature JDBC integration before Gates 1-3 pass. | Strict enforcement of architectural independence: Tier 1 and Tier 2 remain fully standalone until all gate criteria are met. |

---

## 10. Critical Self-Review Notes

Following the Lead Architecture Review on Revision 1.0, the following items have been verified and corrected:

1. **Transaction & Audit Semantics Corrected:** Disentangled PNR generation from audit history. PNRs are monotonic and never recycled; rollbacks leave PNR sequence gaps. Rolled-back operations leave zero rows in `BOOKING_AUDIT`.
2. **Locking Order Unified:** The parent `JOURNEY` lock is established as the mandatory first lock in all procedures, transactions, and concurrency tests. The two-session test methodology reflects Session 2 blocking on `JOURNEY`.
3. **Lifecycle State Machine Complete:** Formally incorporated `PENDING` $\rightarrow$ `CANCELLED` alongside all legal SRS lifecycle transitions.
4. **Routine Names & Script Order Canonicalized:** All SQL routines match the SRS specification (`book_seat`, `cancel_booking`, `promote_waitlist`, `book_group`, `evaluate_case`). Scripts adopt the numbered sequence `00_reset.sql` through `09_users.sql`.
5. **Course Restrictions & Prerequisites Documented:** Academic constraints are flagged as provisional pending review of the official CSC2104 course handout, with the codebase architected to satisfy the strictest expected constraints.
6. **Target Timeline vs Acceptance Criteria:** The 3-4 day timeframe is maintained as a planning target; gate transitions require concrete technical evidence.

---

## 11. Milestone Tracking & M1.3 Implementation Status

### Milestone Status
- **M0 (Documentation Migration):** Complete (Committed at `d22a2add871c2884edfe8a19dbd47450234ff815`).
- **M1.1 (Candidate SRS v1.0 Reconciliation Audit):** Complete.
- **M1.2 (Schema Consolidation Design Review & Disposable DB Validation):** Complete.
- **M1.3 (Controlled MySQL Schema Consolidation and Integrity Implementation):** Implemented in isolated feature branch `feature/m1.3-schema-consolidation`.

### M1.3 Implementation Summary
1. **15 Application Tables:** Exactly 15 tables implemented in `mysql/01_tables.sql` matching Candidate SRS §6.1. Removed separate `PNR_SEQUENCE` and `RULE_VERSION` tables.
2. **Refund Rule Consolidation & Overlap Guard:** Consolidated rule versioning directly into `REFUND_RULE`. Added `trg_refund_rule_overlap_guard` enforcing non-overlapping half-open intervals `[effective_from, effective_to)` among active rules within each rule family per Candidate SRS FR-D03 (`BEFORE INSERT`).
3. **PNR Monotonic Generation & Column Width:** PNR derived from `BOOKING` auto-increment ID (`CONCAT('PNR-', LPAD(booking_id, GREATEST(8, LENGTH(booking_id)), '0'))`), populated immediately at status `PENDING` before allocation or waitlist processing without false audit generation. Target column defined as `VARCHAR(24)` per ADR-19 to safely store the full signed `BIGINT` range up to 19 digits.
4. **Relational Integrity & Foreign Keys:** `SEAT_ALLOCATION` declares composite foreign keys for physical seat/class and class/journey relationships, and a single-column foreign key to `BOOKING(booking_id)`. Invariant `INV-08` enforces cross-table consistency across both booking-class and physical seat-class paths in `08_invariants.sql` and `run_invariants`.
5. **Group Booking Savepoint Isolation:** Enforced member-level savepoints in `book_group` so recoverable member failures unwind only to the member savepoint leaving auto-increment gaps, while unexpected SQL/infrastructure errors trigger full transaction rollback via `EXIT HANDLER FOR SQLEXCEPTION`.
6. **Disposable Database Audit Note:** A test cleanup command truncated `BOOKING_AUDIT` in `railsync_m1_isolated_test`; pre-existing audit rows were removed and cannot be treated as intact evidence. Fresh audit insertion and rollback omission were verified on subsequent test runs.
