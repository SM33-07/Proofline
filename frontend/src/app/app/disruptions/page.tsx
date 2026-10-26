'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Flame,
  Wrench,
  Radio,
  CheckCircle2,
  Scale,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DISRUPTIONS } from '@/lib/mock-data';

interface CanonicalEvaluationResult {
  fixtureId: string;
  ruleId: string | null;
  ruleFamily: string | null;
  ruleVersion: number | null;
  outcome: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'DEADLINE_EXPIRED' | 'UNRESOLVED';
  reasonCodes: string[];
  warnings: string[];
  deadlineAt: string | null;
  actionCode: string;
  currency: string;
  refundAmount: string;
  disclaimer: string;
}

interface TestFixtureDefinition {
  id: string;
  name: string;
  description: string;
  payload: Record<string, unknown>;
}

const CANONICAL_FIXTURES: TestFixtureDefinition[] = [
  {
    "id": "D-01",
    "name": "D-01: Delay > 3 Hours (Late 210m, Eligible for 100% refund)",
    "description": "D-01: Delay > 3 Hours (Late 210m, Eligible for 100% refund)",
    "payload": {
      "fixtureId": "D-01-late-over-3hr",
      "ruleFamily": "LATE_OVER_3_HOURS_E_TICKET",
      "ruleVersion": 2,
      "verifiedRuleFixture": true,
      "ticketScope": "SIMULATED_E_TICKET_CONFIRMED",
      "policyApplicabilityTime": "2026-11-03T08:00:00+05:30",
      "evaluationTime": "2026-11-03T14:25:00+05:30",
      "fareINR": "1250.00",
      "events": [
        {
          "type": "SCHEDULED_DEPARTURE",
          "eventTime": "2026-11-03T08:00:00+05:30",
          "source": "SIMULATED_OFFICIAL"
        },
        {
          "type": "DELAY_AT_BOARDING_MINUTES",
          "value": 210,
          "eventTime": "2026-11-03T14:00:00+05:30",
          "source": "SIMULATED_OFFICIAL"
        },
        {
          "type": "PASSENGER_NOT_TRAVELLED",
          "eventTime": "2026-11-03T14:10:00+05:30",
          "source": "PASSENGER_REPORTED"
        },
        {
          "type": "FILING_ATTEMPT",
          "eventTime": "2026-11-03T14:20:00+05:30",
          "source": "SIMULATED_INPUT"
        },
        {
          "type": "ACTUAL_DEPARTURE",
          "eventTime": "2026-11-03T14:35:00+05:30",
          "source": "SIMULATED_OFFICIAL"
        }
      ]
    }
  },
  {
    "id": "D-02",
    "name": "D-02: Delay Exactly 180m (Strict >180m boundary, Ineligible)",
    "description": "D-02: Delay Exactly 180m (Strict >180m boundary, Ineligible)",
    "payload": {
      "fixtureId": "D-02-delay-exact-180min",
      "ruleFamily": "LATE_OVER_3_HOURS_E_TICKET",
      "ruleVersion": 2,
      "verifiedRuleFixture": true,
      "ticketScope": "SIMULATED_E_TICKET_CONFIRMED",
      "policyApplicabilityTime": "2026-11-03T08:00:00+05:30",
      "evaluationTime": "2026-11-03T14:25:00+05:30",
      "fareINR": "1250.00",
      "events": [
        {
          "type": "SCHEDULED_DEPARTURE",
          "eventTime": "2026-11-03T08:00:00+05:30",
          "source": "SIMULATED_OFFICIAL"
        },
        {
          "type": "DELAY_AT_BOARDING_MINUTES",
          "value": 180,
          "eventTime": "2026-11-03T14:00:00+05:30",
          "source": "SIMULATED_OFFICIAL"
        },
        {
          "type": "PASSENGER_NOT_TRAVELLED",
          "eventTime": "2026-11-03T14:10:00+05:30",
          "source": "PASSENGER_REPORTED"
        },
        {
          "type": "FILING_ATTEMPT",
          "eventTime": "2026-11-03T14:20:00+05:30",
          "source": "SIMULATED_INPUT"
        },
        {
          "type": "ACTUAL_DEPARTURE",
          "eventTime": "2026-11-03T14:35:00+05:30",
          "source": "SIMULATED_OFFICIAL"
        }
      ]
    }
  },
  {
    "id": "D-06b",
    "name": "D-06b: Filed Exactly at Departure (Deadline Expired)",
    "description": "D-06b: Filed Exactly at Departure (Deadline Expired)",
    "payload": {
      "fixtureId": "D-06b-filed-exactly-at-departure",
      "ruleFamily": "LATE_OVER_3_HOURS_E_TICKET",
      "ruleVersion": 2,
      "verifiedRuleFixture": true,
      "ticketScope": "SIMULATED_E_TICKET_CONFIRMED",
      "policyApplicabilityTime": "2026-11-03T08:00:00+05:30",
      "evaluationTime": "2026-11-03T14:35:00+05:30",
      "fareINR": "1250.00",
      "events": [
        {
          "type": "SCHEDULED_DEPARTURE",
          "eventTime": "2026-11-03T08:00:00+05:30",
          "source": "SIMULATED_OFFICIAL"
        },
        {
          "type": "DELAY_AT_BOARDING_MINUTES",
          "value": 210,
          "eventTime": "2026-11-03T14:00:00+05:30",
          "source": "SIMULATED_OFFICIAL"
        },
        {
          "type": "PASSENGER_NOT_TRAVELLED",
          "eventTime": "2026-11-03T14:10:00+05:30",
          "source": "PASSENGER_REPORTED"
        },
        {
          "type": "FILING_ATTEMPT",
          "eventTime": "2026-11-03T14:35:00+05:30",
          "source": "SIMULATED_INPUT"
        },
        {
          "type": "ACTUAL_DEPARTURE",
          "eventTime": "2026-11-03T14:35:00+05:30",
          "source": "SIMULATED_OFFICIAL"
        }
      ]
    }
  },
  {
    "id": "D-07",
    "name": "D-07: Passenger Travelled (Negative Control, Ineligible)",
    "description": "D-07: Passenger Travelled (Negative Control, Ineligible)",
    "payload": {
      "fixtureId": "D-07-passenger-travelled",
      "ruleFamily": "LATE_OVER_3_HOURS_E_TICKET",
      "ruleVersion": 2,
      "verifiedRuleFixture": true,
      "ticketScope": "SIMULATED_E_TICKET_CONFIRMED",
      "policyApplicabilityTime": "2026-11-03T08:00:00+05:30",
      "evaluationTime": "2026-11-03T14:25:00+05:30",
      "fareINR": "1250.00",
      "events": [
        {
          "type": "SCHEDULED_DEPARTURE",
          "eventTime": "2026-11-03T08:00:00+05:30",
          "source": "SIMULATED_OFFICIAL"
        },
        {
          "type": "DELAY_AT_BOARDING_MINUTES",
          "value": 210,
          "eventTime": "2026-11-03T14:00:00+05:30",
          "source": "SIMULATED_OFFICIAL"
        },
        {
          "type": "PASSENGER_TRAVELLED",
          "eventTime": "2026-11-03T14:30:00+05:30",
          "source": "PASSENGER_REPORTED"
        },
        {
          "type": "FILING_ATTEMPT",
          "eventTime": "2026-11-03T14:20:00+05:30",
          "source": "SIMULATED_INPUT"
        },
        {
          "type": "ACTUAL_DEPARTURE",
          "eventTime": "2026-11-03T14:35:00+05:30",
          "source": "SIMULATED_OFFICIAL"
        }
      ]
    }
  },
  {
    "id": "D-08",
    "name": "D-08: Train Cancelled (Auto-Refund Clause 5a, No TDR)",
    "description": "D-08: Train Cancelled (Auto-Refund Clause 5a, No TDR)",
    "payload": {
      "fixtureId": "D-08-train-cancelled-auto-refund",
      "ruleFamily": "TRAIN_CANCELLED_E_TICKET",
      "ruleVersion": 1,
      "verifiedRuleFixture": true,
      "ticketScope": "SIMULATED_E_TICKET_CONFIRMED",
      "policyApplicabilityTime": "2026-11-03T08:00:00+05:30",
      "evaluationTime": "2026-11-03T10:00:00+05:30",
      "fareINR": "1250.00",
      "events": [
        {
          "type": "SCHEDULED_DEPARTURE",
          "eventTime": "2026-11-03T08:00:00+05:30",
          "source": "SIMULATED_OFFICIAL"
        },
        {
          "type": "TRAIN_CANCELLED",
          "eventTime": "2026-11-03T07:30:00+05:30",
          "source": "SIMULATED_OFFICIAL"
        }
      ]
    }
  }
];


export default function DisruptionsPage() {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  // Disruption Refund Evaluator State
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>('D-01');
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<CanonicalEvaluationResult | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);

  const selectedFixture = CANONICAL_FIXTURES.find((f) => f.id === selectedFixtureId) || CANONICAL_FIXTURES[0];

  const handleEvaluate = async () => {
    setEvaluating(true);
    setEvalError(null);
    try {
      const res = await fetch('/api/refund/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedFixture.payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'HTTP ' + res.status);
      }
      setEvalResult(data);
    } catch (err) {
      setEvalError(err instanceof Error ? err.message : 'Evaluation failed');
      setEvalResult(null);
    } finally {
      setEvaluating(false);
    }
  };

  const filteredIncidents = DISRUPTIONS.filter((inc) => {
    if (filterSeverity === 'ALL') return true;
    return inc.severity === filterSeverity;
  });

  const criticalCount = DISRUPTIONS.filter((d) => d.severity === 'CRITICAL').length;
  const majorCount = DISRUPTIONS.filter((d) => d.severity === 'MAJOR').length;
  const moderateCount = DISRUPTIONS.filter((d) => d.severity === 'MODERATE').length;
  const resolvedCount = DISRUPTIONS.filter((d) => d.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disruption Management & Cascade Resolution"
        subtitle="Simulated incident response, delay propagation models, and automated passenger re-accommodation"
        breadcrumbs={[
          { label: 'Operations', href: '/app' },
          { label: 'Disruptions' },
        ]}
      />

      {/* Disruption Refund Evaluator Card (Canonical Contract Verification) */}
      <div className="rounded-2xl border border-[#E9663B]/30 bg-gradient-to-r from-[#E9663B]/10 via-[#FAF8F4] to-[#FAF8F4] dark:via-[#242521] dark:to-[#242521] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#D9D0C1] dark:border-[#353731] pb-3">
          <div className="flex items-center gap-2.5">
            <Scale className="h-5 w-5 text-[#E9663B] dark:text-[#F0784D]" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-mono text-[#242521] dark:text-[#F0E9DC]">
                  Disruption Refund Advisor (POST /api/refund/evaluate)
                </span>
                <span className="rounded-full bg-[#4A685F]/20 text-[#4A685F] dark:text-[#88A69A] border border-[#4A685F]/30 px-2 py-0.5 text-[10px] font-mono font-bold">
                  CANONICAL RULE ENGINE
                </span>
              </div>
              <p className="text-xs text-[#5E6059] dark:text-[#A39F93] mt-0.5 font-sans">
                Evaluates delay and cancellation fixtures against canonical refund rules (Clause 6 & 5a).
              </p>
            </div>
          </div>
          <button
            onClick={handleEvaluate}
            disabled={evaluating}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-lg bg-[#E9663B] dark:bg-[#F0784D] px-3.5 py-1.5 text-xs font-mono font-bold text-white dark:text-[#171815] hover:bg-[#d85830] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            {evaluating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Scale className="h-3.5 w-3.5" />
                <span>Evaluate Rule Engine</span>
              </>
            )}
          </button>
        </div>

        {/* Fixture Selector Pills */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono uppercase text-[#8C887D] dark:text-[#726F65] block">
            Select Canonical Test Fixture:
          </label>
          <div className="flex flex-wrap gap-2">
            {CANONICAL_FIXTURES.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setSelectedFixtureId(f.id);
                  setEvalResult(null);
                }}
                className={`rounded-lg px-3 py-1 text-xs font-mono transition-colors cursor-pointer ${
                  selectedFixtureId === f.id
                    ? 'bg-[#E9663B]/15 text-[#E9663B] dark:text-[#F0784D] font-bold border border-[#E9663B]/30'
                    : 'text-[#5E6059] dark:text-[#A39F93] hover:bg-[#F4F0E7] dark:hover:bg-[#171815] border border-transparent'
                }`}
              >
                {f.id}
              </button>
            ))}
          </div>
          <p className="text-xs text-[#5E6059] dark:text-[#A39F93] font-mono">
            {selectedFixture.description}
          </p>
        </div>

        {/* Evaluation Output Result Display */}
        {evalError && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 font-mono">
            <span className="font-bold">Evaluation Error: </span> {evalError}
          </div>
        )}

        {evalResult && (
          <div className="rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#171815] p-4 space-y-3 font-mono text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#D9D0C1] dark:border-[#353731] pb-2">
              <div className="flex items-center gap-2">
                <span className="text-[#8C887D] dark:text-[#726F65]">Outcome Determination:</span>
                <span
                  className={`rounded-md px-2.5 py-0.5 font-bold ${
                    evalResult.outcome === 'ELIGIBLE'
                      ? 'bg-[#4A685F]/20 text-[#4A685F] dark:text-[#88A69A] border border-[#4A685F]/30'
                      : evalResult.outcome === 'NOT_ELIGIBLE'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      : evalResult.outcome === 'DEADLINE_EXPIRED'
                      ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      : 'bg-[#8C887D]/20 text-[#8C887D] dark:text-[#726F65] border border-[#8C887D]/30'
                  }`}
                >
                  {evalResult.outcome}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#8C887D] dark:text-[#726F65]">Refund Modeled:</span>
                <span className="text-base font-bold text-[#4A685F] dark:text-[#88A69A]">
                  ₹{evalResult.refundAmount} {evalResult.currency}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-[#8C887D] dark:text-[#726F65] uppercase block">Action Code</span>
                <span className="font-bold text-[#E9663B] dark:text-[#F0784D]">{evalResult.actionCode}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8C887D] dark:text-[#726F65] uppercase block">Rule Matched</span>
                <span className="text-[#242521] dark:text-[#F0E9DC]">
                  {evalResult.ruleFamily || 'None'} (v{evalResult.ruleVersion || '-'})
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-[#8C887D] dark:text-[#726F65] uppercase block mb-1">Reason Codes (Canonical Order)</span>
              <div className="flex flex-wrap gap-1.5">
                {evalResult.reasonCodes.map((code) => (
                  <span
                    key={code}
                    className="rounded bg-[#E6DFD3] dark:bg-[#242521] px-2 py-0.5 text-[10px] text-[#242521] dark:text-[#F0E9DC] border border-[#D9D0C1] dark:border-[#353731]"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>

            {/* Mandatory Statutory Disclaimer Notice */}
            <div className="rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] p-2.5 text-[11px] text-[#5E6059] dark:text-[#A39F93] leading-relaxed">
              <span className="font-bold text-[#8C887D] dark:text-[#726F65] uppercase block text-[9px] mb-0.5">
                Statutory Regulatory Notice
              </span>
              {evalResult.disclaimer}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[#C83C2A]/30 bg-[#C83C2A]/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#C83C2A] dark:text-[#F45846] font-bold">Critical</span>
            <AlertTriangle className="h-4 w-4 text-[#C83C2A] dark:text-[#F45846]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#242521] dark:text-[#F0E9DC] mt-2">{criticalCount}</div>
          <p className="text-[11px] text-[#5E6059] dark:text-[#A39F93] mt-1">Requires immediate pilot order</p>
        </div>
        <div className="rounded-xl border border-[#E9663B]/30 bg-[#E9663B]/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#E9663B] dark:text-[#F0784D] font-bold">Major</span>
            <Flame className="h-4 w-4 text-[#E9663B] dark:text-[#F0784D]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#242521] dark:text-[#F0E9DC] mt-2">{majorCount}</div>
          <p className="text-[11px] text-[#5E6059] dark:text-[#A39F93] mt-1">Speed restrictions applied</p>
        </div>
        <div className="rounded-xl border border-[#C57613]/30 bg-[#C57613]/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#C57613] dark:text-[#E6962C] font-bold">Moderate</span>
            <Wrench className="h-4 w-4 text-[#C57613] dark:text-[#E6962C]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#242521] dark:text-[#F0E9DC] mt-2">{moderateCount}</div>
          <p className="text-[11px] text-[#5E6059] dark:text-[#A39F93] mt-1">HVAC / power inverter checks</p>
        </div>
        <div className="rounded-xl border border-[#4A685F]/30 bg-[#4A685F]/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#4A685F] dark:text-[#88A69A] font-bold">Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-[#4A685F] dark:text-[#88A69A]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#242521] dark:text-[#F0E9DC] mt-2">{resolvedCount}</div>
          <p className="text-[11px] text-[#5E6059] dark:text-[#A39F93] mt-1">Normal traction restored</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-3 shadow-sm">
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-[#8C887D] dark:text-[#726F65] mr-2 uppercase text-[11px]">Filter Severity:</span>
          {['ALL', 'CRITICAL', 'MAJOR', 'MODERATE'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`rounded-lg px-3 py-1 transition-colors cursor-pointer ${
                filterSeverity === sev
                  ? 'bg-[#E9663B]/15 text-[#E9663B] dark:text-[#F0784D] font-semibold border border-[#E9663B]/30'
                  : 'text-[#5E6059] dark:text-[#A39F93] hover:text-[#242521] dark:hover:text-[#F0E9DC] hover:bg-[#E6DFD3] dark:hover:bg-[#2A2C26]'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-[#8C887D] dark:text-[#726F65]">
          Showing {filteredIncidents.length} incident cases
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {filteredIncidents.map((inc) => (
          <div
            key={inc.id}
            className={`rounded-xl border p-5 backdrop-blur-sm space-y-4 ${
              inc.severity === 'CRITICAL'
                ? 'border-[#C83C2A]/30 bg-[#C83C2A]/10'
                : inc.severity === 'MAJOR'
                ? 'border-[#C57613]/30 bg-[#C57613]/10'
                : inc.status === 'RESOLVED'
                ? 'border-[#4A685F]/30 bg-[#4A685F]/10'
                : 'border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] shadow-sm'
            }`}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#D9D0C1] dark:border-[#353731] pb-3">
              <div className="flex items-center gap-3">
                <span className="rounded bg-[#E6DFD3] dark:bg-[#2A2C26] px-2.5 py-1 text-xs font-mono font-bold text-[#242521] dark:text-[#F0E9DC] border border-[#D9D0C1] dark:border-[#353731]">
                  Case {inc.code}
                </span>
                <h3 className="text-base font-bold text-[#242521] dark:text-[#F0E9DC]">{inc.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={inc.severity} size="sm" />
                <StatusBadge status={inc.status} size="sm" />
              </div>
            </div>

            <p className="text-xs text-[#5E6059] dark:text-[#A39F93] leading-relaxed font-sans">{inc.description}</p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] p-3.5 text-xs font-mono">
              <div>
                <span className="text-[10px] uppercase text-[#8C887D] dark:text-[#726F65] block">Affected Train</span>
                <span className="font-bold text-[#E9663B] dark:text-[#F0784D]">{inc.affectedTrainNumber}</span>
                <span className="text-[#8C887D] dark:text-[#726F65] text-[11px] block">{inc.affectedTrainName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#8C887D] dark:text-[#726F65] block">Location & Delay</span>
                <span className="font-bold text-[#C57613] dark:text-[#E6962C]">
                  Station {inc.locationStation} • +{inc.estimatedDelayMinutes}m delay
                </span>
                <span suppressHydrationWarning className="text-[#8C887D] dark:text-[#726F65] text-[11px] block">
                  Reported: {new Date(inc.reportedAt).toLocaleTimeString('en-US')}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#8C887D] dark:text-[#726F65] block">Passengers Impacted</span>
                <span className="font-bold text-[#C83C2A] dark:text-[#F45846]">
                  {inc.passengersImpacted.toLocaleString()} passengers
                </span>
                <span className="text-[#8C887D] dark:text-[#726F65] text-[11px] block">Downstream alert transmitted</span>
              </div>
            </div>

            <div className="rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase text-[#8C887D] dark:text-[#726F65] font-semibold">
                  Downstream Delay Propagation Model
                </span>
                <span className="text-[10px] font-mono text-[#E9663B] dark:text-[#F0784D]">Headway Factor: 1.25x</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                {inc.cascadeStations.map((station, idx) => (
                  <React.Fragment key={station}>
                    {idx > 0 && <span className="text-[#8C887D] dark:text-[#726F65]">→</span>}
                    <div className="flex items-center gap-1.5 rounded bg-[#E6DFD3] dark:bg-[#2A2C26] px-2.5 py-1 text-[#5E6059] dark:text-[#A39F93] border border-[#D9D0C1] dark:border-[#353731]">
                      <span className="font-bold text-[#E9663B] dark:text-[#F0784D]">{station}</span>
                      <span className="text-[#C57613] dark:text-[#E6962C] font-semibold">
                        +{Math.max(inc.estimatedDelayMinutes - idx * 10, 5)}m
                      </span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[#E9663B]/25 bg-[#E9663B]/5 p-3 flex items-start gap-3">
              <div className="rounded p-1 bg-[#E9663B]/15 text-[#E9663B] dark:text-[#F0784D] shrink-0">
                <Radio className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold font-mono text-[#E9663B] dark:text-[#F0784D] uppercase tracking-wide">
                  Active Mitigation Protocol
                </span>
                <p className="text-xs text-[#242521] dark:text-[#F0E9DC] mt-0.5 font-sans">{inc.mitigationAction}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
