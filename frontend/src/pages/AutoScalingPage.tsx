import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Sliders,
  Server,
  Zap,
  Clock,
  ArrowRight
} from 'lucide-react';

export const AutoScalingPage: React.FC = () => {
  const { addToast, overview, simulator, shieldStatus, refreshData, setIsFacultyDemoOpen } = useApp();
  const [isToggling, setIsToggling] = useState(false);
  const [customRateLimit, setCustomRateLimit] = useState<number>(shieldStatus?.rate_limit_rps ?? 20);

  useEffect(() => {
    if (shieldStatus?.rate_limit_rps) {
      setCustomRateLimit(shieldStatus.rate_limit_rps);
    }
  }, [shieldStatus?.rate_limit_rps]);

  const handleToggleEnforcement = async () => {
    setIsToggling(true);
    try {
      const nextState = !shieldStatus?.rate_limiting_enforced;
      await api.toggleShieldEnforcement(nextState);
      await refreshData();
      addToast(
        nextState
          ? 'CloudPulse Shield rate limiting ENFORCED.'
          : 'CloudPulse Shield rate limiting set to STANDBY.',
        'success'
      );
    } catch (e: any) {
      addToast(e?.message || 'Error updating shield enforcement.', 'error');
    } finally {
      setIsToggling(false);
    }
  };

  const isEnforced = shieldStatus?.rate_limiting_enforced ?? true;

  const protectedRoutes = [
    {
      service: 'Ingress API Gateway',
      route: '/api/*',
      rateLimit: `${customRateLimit} req/s`,
      burst: '10 reqs',
      action: 'HTTP 429 Throttling',
      status: isEnforced ? 'ACTIVE & SHIELDED' : 'STANDBY',
    },
    {
      service: 'Order Processing Service',
      route: '/api/orders/*',
      rateLimit: '15 req/s',
      burst: '5 reqs',
      action: 'Queue & Throttle',
      status: isEnforced ? 'ACTIVE & SHIELDED' : 'STANDBY',
    },
    {
      service: 'Auth & Session Service',
      route: '/api/auth/*',
      rateLimit: '10 req/s',
      burst: '3 reqs',
      action: 'IP Quarantine',
      status: isEnforced ? 'ACTIVE & SHIELDED' : 'STANDBY',
    },
    {
      service: 'Catalog & Inventory',
      route: '/api/catalog/*',
      rateLimit: '25 req/s',
      burst: '12 reqs',
      action: 'Cache Fallback',
      status: isEnforced ? 'ACTIVE & SHIELDED' : 'STANDBY',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-5 rounded-2xl bg-surface-100/90 border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30">
              <ShieldCheck className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100">
                  CloudPulse Shield — Ingress Rate Limiting &amp; Protection
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
                  REAL ASGI GATEWAY SHIELD
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Active in-process ASGI rate-limiting middleware that throttles malicious bursts (20 req/s cap), shielding downstream microservices from saturation.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsFacultyDemoOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-mono font-bold shadow-glow-cyan transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
          <span>START FACULTY DEMO</span>
        </button>
      </header>

      {/* Architectural Grounding Alert */}
      <div className="flex items-start gap-3 rounded-xl border border-cyan-500/30 bg-cyan-950/15 p-4 text-xs">
        <Lock className="h-5 w-5 shrink-0 text-cyan-400 mt-0.5" />
        <div className="leading-relaxed text-slate-300">
          <span className="font-bold text-cyan-300 block mb-0.5">
            Website Traffic Protection Architecture
          </span>
          <p>
            Rather than relying on costly infrastructure auto-scaling alone, CloudPulse provides a genuine software-defined defense layer.
            When inbound traffic violates normal baseline variance or exceeds the configured 20 req/s rate-limiting envelope,
            the ASGI middleware actively throttles surplus requests with HTTP 429, preventing backend database contention and keeping website response latencies low.
          </p>
        </div>
      </div>

      {/* Live Shield Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Shield Enforcement Status */}
        <div className="p-4 rounded-xl bg-surface-100/90 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-slate-400">Shield Protection</span>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isEnforced ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                isEnforced ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {isEnforced ? 'ENFORCED' : 'STANDBY'}
            </span>
          </div>
          <button
            onClick={handleToggleEnforcement}
            disabled={isToggling}
            className="mt-3 w-full py-1.5 px-3 rounded-lg border border-border bg-surface-200/80 hover:bg-surface-200 text-[11px] font-mono text-slate-300 transition-colors cursor-pointer"
          >
            {isToggling ? 'Updating...' : isEnforced ? 'Switch to Standby' : 'Enforce Shield Active'}
          </button>
        </div>

        {/* Metric 2: Rate Limit Threshold */}
        <div className="p-4 rounded-xl bg-surface-100/90 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-slate-400">Rate Limit Threshold</span>
            <Sliders className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-cyan-300">
              {customRateLimit}
            </span>
            <span className="text-xs font-mono text-slate-400">req/s max</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 block mt-3">
            Rolling 1.0s sliding window
          </span>
        </div>

        {/* Metric 3: Requests Evaluated & Allowed */}
        <div className="p-4 rounded-xl bg-surface-100/90 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-slate-400">Permitted Ingress</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-slate-100">
              {shieldStatus?.total_allowed ?? 0}
            </span>
            <span className="text-xs font-mono text-slate-400">reqs</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 block mt-3">
            Total evaluated: {shieldStatus?.total_evaluated ?? 0}
          </span>
        </div>

        {/* Metric 4: Requests Throttled (HTTP 429) */}
        <div className="p-4 rounded-xl bg-surface-100/90 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-slate-400">Throttled (HTTP 429)</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-2xl font-bold font-mono ${
                (shieldStatus?.total_blocked ?? 0) > 0 ? 'text-rose-400' : 'text-slate-100'
              }`}
            >
              {shieldStatus?.total_blocked ?? 0}
            </span>
            <span className="text-xs font-mono text-slate-400">blocked</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 block mt-3">
            {shieldStatus?.last_blocked_at
              ? `Last throttled: ${new Date(shieldStatus.last_blocked_at).toLocaleTimeString()}`
              : 'Zero rate-limit violations'}
          </span>
        </div>
      </div>

      {/* Protected Routes & Policy Configuration Table */}
      <div className="p-6 rounded-2xl bg-surface-100/90 border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Configured Ingress Protection Policies</h3>
            <p className="text-xs text-slate-400">
              Per-route rate limits, burst capacities, and active mitigation actions.
            </p>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
            In-Process ASGI Middleware Enforced
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border/60 text-slate-400 uppercase text-[10px]">
                <th className="py-2.5 px-3">Microservice</th>
                <th className="py-2.5 px-3">Protected Route</th>
                <th className="py-2.5 px-3">Rate Limit</th>
                <th className="py-2.5 px-3">Burst Tolerance</th>
                <th className="py-2.5 px-3">Action on Breach</th>
                <th className="py-2.5 px-3 text-right">Defense Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {protectedRoutes.map((route, idx) => (
                <tr key={idx} className="hover:bg-surface-200/40 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-200">{route.service}</td>
                  <td className="py-3 px-3 text-cyan-300 font-mono">{route.route}</td>
                  <td className="py-3 px-3 text-slate-200 font-bold">{route.rateLimit}</td>
                  <td className="py-3 px-3 text-slate-400">{route.burst}</td>
                  <td className="py-3 px-3 text-amber-300">{route.action}</td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isEnforced
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-surface-200 text-slate-400'
                      }`}
                    >
                      {route.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mitigation Actions Log */}
      <div className="p-6 rounded-2xl bg-surface-100/90 border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Recent Defense &amp; Mitigation Actions</h3>
            <p className="text-xs text-slate-400">
              Audit log of active throttling events executed by CloudPulse Shield.
            </p>
          </div>
          <span className="text-[11px] font-mono text-cyan-400">
            Real In-Process Actions
          </span>
        </div>

        <div className="space-y-2 font-mono text-xs">
          {shieldStatus?.recent_actions && shieldStatus.recent_actions.length > 0 ? (
            shieldStatus.recent_actions.map((act, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-surface-200/50 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{act.action}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {act.enforcement_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{act.details || act.policy}</p>
                </div>
                <div className="text-right text-[11px] text-slate-500 shrink-0">
                  <span>{act.timestamp}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-slate-500 text-xs">
              No recent mitigation actions. Website operating normally within configured limits.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
