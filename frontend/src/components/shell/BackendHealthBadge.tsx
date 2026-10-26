'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface HealthData {
  status: string;
  service: string;
  tier: string;
  version: string;
  uptimeMs: number;
  pnrSequence: number;
  invariants: Record<string, string>;
}

export function BackendHealthBadge() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/health', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const initCheck = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (mounted) {
          setHealth(data);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setHealth(null);
          setLoading(false);
        }
      }
    };

    initCheck();
    const interval = setInterval(initCheck, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const isUp = health && health.status === 'UP';

  return (
    <div
      className={`hidden lg:flex items-center gap-2 rounded-lg border px-2.5 py-1 text-[11px] font-mono transition-colors ${
        isUp
          ? 'border-[#4A685F]/40 bg-[#4A685F]/10 text-[#4A685F] dark:text-[#88A69A]'
          : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400'
      }`}
      title={
        isUp
          ? `Connected to ${health.tier} | PNR Seq: ${health.pnrSequence} | INV-01: ${health.invariants['INV-01']}`
          : 'Java Simulator unreachable on port 8080 (Using mock fallback)'
      }
    >
      {isUp ? (
        <>
          <CheckCircle2 className="h-3 w-3 text-[#4A685F] dark:text-[#88A69A] shrink-0" />
          <span>JAVA SIMULATOR: UP (Seq #{health.pnrSequence})</span>
        </>
      ) : (
        <>
          <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>JAVA: OFFLINE (Mock Mode)</span>
        </>
      )}

      <button
        onClick={fetchHealth}
        disabled={loading}
        className="rounded p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
        aria-label="Refresh backend health"
      >
        <RefreshCw className={`h-2.5 w-2.5 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
