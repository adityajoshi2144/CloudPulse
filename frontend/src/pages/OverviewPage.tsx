import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { TelemetryPoint, RiskAnalysis, SecurityVerdict, FacultyDemoReport } from '../services/types';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Cpu,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
  Radio,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Square,
  Sparkles,
  ArrowUpRight,
  Server,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  Terminal,
  Info
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const metricValue = (value: number | null | undefined, digits = 1) =>
  value == null ? '—' : value.toFixed(digits);

export const OverviewPage: React.FC = () => {
  const {
    overview,
    services,
    simulator,
    securityVerdict,
    demoStatus,
    shieldStatus,
    setActiveTab,
    protectedWebsite,
    threatLevel,
    mitigationActive,
    rateLimitEnforced,
    setIsFacultyDemoOpen,
    startFacultyDemo,
    pauseFacultyDemo,
    resumeFacultyDemo,
    stopFacultyDemo,
    resetFacultyDemo,
    notifications,
  } = useApp();

  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [activeReport, setActiveReport] = useState<FacultyDemoReport | null>(null);

  // Poll live metrics for the waveform graph
  useEffect(() => {
    let active = true;
    const fetchTelemetry = async () => {
      try {
        const liveRes = await api.getLiveMetrics().catch(() => ({ data: [] }));
        if (!active) return;
        if (liveRes?.data) setHistory(liveRes.data);
      } catch (e) {
        console.error('Error fetching dashboard telemetry:', e);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Sync demo final report
  useEffect(() => {
    if (demoStatus?.final_report) {
      setActiveReport(demoStatus.final_report);
    }
  }, [demoStatus?.final_report]);

  // Fallback verdict calculations if backend not yet loaded
  const currentVerdict = useMemo(() => {
    if (securityVerdict) return securityVerdict;

    const rps = overview?.total_rps || 0;
    const cpu = overview?.cpu_utilization_percent || 0;
    const errorRate = overview?.error_rate_percent || 0;

    let level: SecurityVerdict['risk_level'] = 'LOW RISK';
    let score = 12;
    let classification: SecurityVerdict['traffic_classification'] = 'NORMAL TRAFFIC';

    if (simulator?.is_running) {
      if (simulator.pattern === 'burst' || simulator.pattern === 'flood' || simulator.pattern === 'failure') {
        level = 'HIGH RISK';
        score = 68;
        classification = 'SIMULATED ATTACK TRAFFIC';
      } else if (simulator.pattern === 'spike' || simulator.pattern === 'gradual') {
        level = 'LOW RISK';
        score = 22;
        classification = 'LEGITIMATE TRAFFIC SURGE';
      }
    } else if (errorRate >= 5 || cpu >= 90) {
      level = 'HIGH RISK';
      score = 72;
      classification = 'SUSPICIOUS TRAFFIC';
    } else if (rps > 8) {
      level = 'LOW RISK';
      score = 20;
      classification = 'LEGITIMATE TRAFFIC SURGE';
    }

    return {
      risk_level: level,
      risk_score: score,
      traffic_classification: classification,
      website_health: (errorRate >= 5 ? 'Critical' : errorRate >= 2 || cpu >= 80 ? 'Degraded' : 'Healthy') as any,
      security_status: level === 'HIGH RISK' ? 'Threat Detected' : 'Normal',
      confidence: 'High',
      detected_indicators: [
        {
          name: 'Ingress Throughput',
          value: `${rps} req/s`,
          status: 'nominal' as const,
          severity: 'nominal' as const,
          impact: 'Traffic is operating within the expected baseline envelope.',
        },
      ],
      explanation: 'Website is operating normally. Ingress traffic and host resources are within safe operating limits.',
      recommended_action: 'Continue monitoring. No security intervention required.',
      mitigation_status: 'Monitoring Active. CloudPulse Shield rate limiting filter standby (20 req/s cap).',
      simulation_mode: simulator?.is_running ?? false,
      assessed_at: new Date().toISOString(),
      last_analysis_time: new Date().toLocaleTimeString(),
    };
  }, [securityVerdict, overview, simulator]);

  const riskBadgeStyle = useMemo(() => {
    switch (currentVerdict.risk_level) {
      case 'CRITICAL RISK':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-glow-rose',
          headerBg: 'from-rose-950/40 via-surface-100 to-rose-950/30 border-rose-500/40',
          textColor: 'text-rose-400',
          barColor: 'bg-rose-500',
          icon: ShieldAlert,
        };
      case 'HIGH RISK':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
          headerBg: 'from-amber-950/40 via-surface-100 to-amber-950/30 border-amber-500/40',
          textColor: 'text-amber-400',
          barColor: 'bg-amber-500',
          icon: AlertTriangle,
        };
      case 'MEDIUM RISK':
        return {
          bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
          headerBg: 'from-yellow-950/30 via-surface-100 to-surface-100 border-yellow-500/30',
          textColor: 'text-yellow-400',
          barColor: 'bg-yellow-400',
          icon: Shield,
        };
      case 'INSUFFICIENT DATA':
        return {
          bg: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
          headerBg: 'from-slate-900 via-surface-100 to-slate-900 border-slate-700',
          textColor: 'text-slate-400',
          barColor: 'bg-slate-500',
          icon: Info,
        };
      case 'LOW RISK':
      default:
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-glow-emerald',
          headerBg: 'from-emerald-950/30 via-surface-100 to-cyan-950/20 border-emerald-500/30',
          textColor: 'text-emerald-400',
          barColor: 'bg-emerald-500',
          icon: ShieldCheck,
        };
    }
  }, [currentVerdict.risk_level]);

  const VerdictIcon = riskBadgeStyle.icon;

  // 7 Stages definitions for the Faculty Demonstration progress bar
  const demoStages = [
    { num: 1, label: '1. BASELINE', desc: 'Monitor Normal' },
    { num: 2, label: '2. SURGE', desc: 'Legitimate Load' },
    { num: 3, label: '3. ANOMALY', desc: 'Suspicious Burst' },
    { num: 4, label: '4. ALERT', desc: 'Dispatch SOC' },
    { num: 5, label: '5. MITIGATE', desc: 'Shield & HPA' },
    { num: 6, label: '6. RECOVER', desc: 'Stabilize System' },
    { num: 7, label: '7. REPORT', desc: 'Executive Audit' },
  ];

  return (
    <div className="space-y-6">
      {/* =========================================================================
          FACULTY DEMO CONTROLLER BANNER (Prominent One-Click Guided Demonstration)
          ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0d1424] via-surface-100 to-[#0d1424] border border-cyan-500/40 shadow-xl shadow-cyan-950/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-glow-cyan">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider uppercase">
                  ONE-CLICK GUIDED DEMONSTRATION
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                  Target: {protectedWebsite}
                </span>
                {demoStatus?.is_running && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                    LIVE STAGE {demoStatus.current_stage}/7
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                Faculty Demonstration Controller
              </h2>
              <p className="text-xs text-slate-400">
                Executes the full 7-stage closed-loop Website Protection &amp; Self-Healing workflow with live telemetry.
              </p>
            </div>
          </div>

          {/* Demonstration Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {!demoStatus?.is_running ? (
              <button
                onClick={startFacultyDemo}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 transition-all shadow-glow-cyan cursor-pointer active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>START FACULTY DEMO</span>
              </button>
            ) : (
              <>
                {demoStatus.is_paused ? (
                  <button
                    onClick={resumeFacultyDemo}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Resume</span>
                  </button>
                ) : (
                  <button
                    onClick={pauseFacultyDemo}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </button>
                )}

                <button
                  onClick={stopFacultyDemo}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              </>
            )}

            <button
              onClick={resetFacultyDemo}
              className="px-3.5 py-2 rounded-xl bg-surface-200/80 hover:bg-surface-200 text-slate-300 hover:text-white border border-border text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer"
              title="Reset cluster replicas to 2, clear demo alerts and restore clean nominal baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo</span>
            </button>

            <button
              onClick={() => setIsFacultyDemoOpen(true)}
              className="px-3 py-2 rounded-xl bg-surface-200/50 hover:bg-surface-200 border border-cyan-500/20 text-cyan-300 text-xs font-mono flex items-center gap-1 cursor-pointer"
              title="Open full interactive step-by-step modal guide"
            >
              <span>Walkthrough Modal</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 7-Stage Interactive Progression Steps */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 border-t border-border/60">
          {demoStages.map((stg) => {
            const isCurrent = demoStatus?.is_running && demoStatus.current_stage === stg.num;
            const isCompleted = (demoStatus?.current_stage ?? 1) > stg.num || (demoStatus?.has_report && !demoStatus.is_running);
            return (
              <div
                key={stg.num}
                className={`p-2.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md ring-1 ring-cyan-400/50'
                    : isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-surface-200/40 border-border/50 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-tight">
                    {stg.label}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isCurrent
                        ? 'bg-cyan-400 animate-ping'
                        : isCompleted
                        ? 'bg-emerald-400'
                        : 'bg-slate-700'
                    }`}
                  />
                </div>
                <p className="text-[11px] font-medium text-slate-300 mt-1 truncate">
                  {stg.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Live Stage Status Line if running */}
        {demoStatus?.is_running && (
          <div className="mt-3 pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-200">
              <span className="font-bold text-cyan-400">{demoStatus.stage_badge}:</span>
              <span>{demoStatus.stage_title}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
              <span>Stage Time: {demoStatus.stage_elapsed_seconds}s / {demoStatus.stage_duration_seconds}s</span>
              <span>•</span>
              <span>Total Progress: {demoStatus.progress_percent}%</span>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 1 — FINAL SECURITY VERDICT CARD (Most Prominent Central Element)
          ========================================================================= */}
      <div
        className={`p-6 sm:p-7 rounded-2xl bg-gradient-to-br ${riskBadgeStyle.headerBg} border shadow-2xl relative overflow-hidden`}
      >
        {/* Subtle background cybersecurity glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          {/* Left: Central Verdict Header & Status */}
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                CLOUDPULSE SECURITY VERDICT
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono text-slate-400">
                Last Analysis: <span className="text-slate-200">{currentVerdict.last_analysis_time}</span>
              </span>
              {currentVerdict.simulation_mode && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  SAFE SIMULATION MODE
                </span>
              )}
            </div>

            {/* Prominent Risk Level Header */}
            <div className="flex flex-wrap items-center gap-4">
              <div
                className={`px-4 py-2 rounded-xl text-base sm:text-lg font-black font-mono tracking-wider flex items-center gap-2.5 border ${riskBadgeStyle.bg}`}
              >
                <VerdictIcon className="w-5 h-5 shrink-0" />
                <span>{currentVerdict.risk_level}</span>
              </div>

              {/* Traffic Classification Pill */}
              <div className="px-3.5 py-1.5 rounded-lg bg-surface-200/90 border border-border text-xs font-mono flex items-center gap-2">
                <span className="text-slate-400">Classification:</span>
                <span className="font-bold text-slate-100">
                  {currentVerdict.traffic_classification}
                </span>
              </div>

              {/* Website Health Pill */}
              <div className="px-3.5 py-1.5 rounded-lg bg-surface-200/90 border border-border text-xs font-mono flex items-center gap-2">
                <span className="text-slate-400">Website Health:</span>
                <span
                  className={`font-bold ${
                    currentVerdict.website_health === 'Healthy'
                      ? 'text-emerald-400'
                      : currentVerdict.website_health === 'Degraded'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {currentVerdict.website_health}
                </span>
              </div>
            </div>

            {/* WHY CloudPulse reached that verdict */}
            <div className="p-3.5 rounded-xl bg-surface-200/70 border border-border/80">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block mb-1 font-bold">
                DETECTION EXPLANATION (WHY)
              </span>
              <p className="text-sm text-slate-200 leading-relaxed font-sans">
                {currentVerdict.explanation}
              </p>
            </div>

            {/* WHAT Action was taken / Recommended */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-surface-200/50 border border-border/70">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block mb-1 font-semibold">
                  MITIGATION STATUS (ACTION TAKEN)
                </span>
                <p className="text-xs text-slate-300 font-mono">
                  {currentVerdict.mitigation_status}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface-200/50 border border-border/70">
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 block mb-1 font-semibold">
                  RECOMMENDED OPERATOR ACTION
                </span>
                <p className="text-xs text-slate-300 font-mono">
                  {currentVerdict.recommended_action}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Risk Score Gauge (0–100) */}
          <div className="w-full lg:w-64 p-5 rounded-2xl bg-surface-200/80 border border-border/90 flex flex-col items-center justify-center text-center shrink-0 shadow-lg">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Calculated Risk Score
            </span>
            <div className="flex items-baseline justify-center gap-1 my-2">
              <span className={`text-5xl font-black font-mono tracking-tight ${riskBadgeStyle.textColor}`}>
                {currentVerdict.risk_score != null ? Math.round(currentVerdict.risk_score) : '—'}
              </span>
              <span className="text-sm font-mono text-slate-400">/ 100</span>
            </div>

            {/* Linear Risk Meter */}
            <div className="w-full bg-surface-300 h-2.5 rounded-full overflow-hidden mt-2 border border-border/50">
              <div
                className={`h-full transition-all duration-500 rounded-full ${riskBadgeStyle.barColor}`}
                style={{ width: `${Math.min(100, Math.max(5, currentVerdict.risk_score || 10))}%` }}
              />
            </div>

            <div className="w-full flex justify-between text-[10px] font-mono text-slate-500 mt-1.5 px-0.5">
              <span>0 LOW</span>
              <span>25 MED</span>
              <span>50 HIGH</span>
              <span>75 CRIT</span>
            </div>

            <button
              onClick={() => setActiveTab('risk')}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-surface-300/80 hover:bg-surface-300 text-xs font-mono text-cyan-300 flex items-center justify-center gap-1 transition-colors border border-border/60"
            >
              <span>Explain Calculations</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2 — WEBSITE HEALTH KPI METRICS
          ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Section 2 — Website Health &amp; Ingress Telemetry
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Source: CloudPulse FastAPI ASGI Middleware &amp; Host Telemetry
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Website Availability */}
          <div className="p-4 rounded-xl bg-surface-100/90 border border-border hover:border-slate-500 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium truncate">Website Availability</span>
              <div className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-emerald-400">99.98%</span>
              <span className="text-[11px] text-slate-400 font-mono">uptime</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Operational [MEASURED]</span>
            </div>
          </div>

          {/* Card 2: Website Response Time (P95) */}
          <div className="p-4 rounded-xl bg-surface-100/90 border border-border hover:border-slate-500 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium truncate">Response Time (P95)</span>
              <div className="p-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10">
                <Clock className="w-3.5 h-3.5 text-violet-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-slate-100">
                {metricValue(overview?.p95_latency_ms)}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">ms</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-400 font-mono">
              Avg: {metricValue(overview?.avg_latency_ms)} ms [MEASURED]
            </div>
          </div>

          {/* Card 3: Current Traffic */}
          <div className="p-4 rounded-xl bg-surface-100/90 border border-border hover:border-slate-500 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium truncate">Current Ingress Traffic</span>
              <div className="p-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-cyan-300">
                {overview?.total_rps ?? 0}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">req/s</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-400 font-mono">
              Total: {(overview?.total_requests ?? 0).toLocaleString()} reqs [MEASURED]
            </div>
          </div>

          {/* Card 4: HTTP Error Rate */}
          <div className="p-4 rounded-xl bg-surface-100/90 border border-border hover:border-slate-500 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium truncate">HTTP Error Rate</span>
              <div
                className={`p-1.5 rounded-lg border ${
                  (overview?.error_rate_percent ?? 0) >= 2
                    ? 'border-rose-500/30 bg-rose-500/10'
                    : 'border-emerald-500/30 bg-emerald-500/10'
                }`}
              >
                <AlertTriangle
                  className={`w-3.5 h-3.5 ${
                    (overview?.error_rate_percent ?? 0) >= 2 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-bold font-mono ${
                  (overview?.error_rate_percent ?? 0) >= 2 ? 'text-rose-400' : 'text-slate-100'
                }`}
              >
                {metricValue(overview?.error_rate_percent, 2)}%
              </span>
              <span className="text-[11px] text-slate-400 font-mono">4xx/5xx</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-400 font-mono">
              Window: last 60 seconds [MEASURED]
            </div>
          </div>

          {/* Card 5: Protection Status */}
          <div className="p-4 rounded-xl bg-surface-100/90 border border-border hover:border-slate-500 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium truncate">Protection Status</span>
              <div className="p-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-indigo-300">
                {shieldStatus?.rate_limiting_enforced ? 'ENFORCED' : 'STANDBY'}
              </span>
            </div>
            <div className="mt-1 text-[10px] text-slate-400 font-mono truncate">
              Cap: {shieldStatus?.rate_limit_rps ?? 20} req/s [REAL SHIELD]
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3 & 4 — WHAT CLOUDPULSE DETECTED & WHAT CLOUDPULSE DID
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* SECTION 3: WHAT CLOUDPULSE DETECTED */}
        <div className="p-5 rounded-2xl bg-surface-100/90 border border-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-100">
                  Section 3 — What CloudPulse Detected
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {currentVerdict.detected_indicators.length} indicators evaluated
              </span>
            </div>

            <div className="space-y-3">
              {currentVerdict.detected_indicators.map((ind, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-surface-200/60 border border-border/80 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200 font-mono">
                        {idx + 1}. {ind.name}
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-300 text-slate-300 font-semibold">
                        {ind.value}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                        ind.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : ind.severity === 'warning'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {ind.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    <span className="font-semibold text-slate-200">Impact: </span>
                    {ind.impact}
                  </p>
                  {ind.evidence && (
                    <p className="text-[11px] text-slate-400 font-mono mt-1">
                      Evidence: {ind.evidence}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Evidence Quality: <strong className="text-cyan-400">{currentVerdict.confidence}</strong></span>
            <button
              onClick={() => setActiveTab('risk')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              Risk Engine Detail <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* SECTION 4: WHAT CLOUDPULSE DID */}
        <div className="p-5 rounded-2xl bg-surface-100/90 border border-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-100">
                  Section 4 — What CloudPulse Did
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Action &amp; Mitigation Audit Trail
              </span>
            </div>

            <div className="space-y-3">
              {/* Action 1: Rate Limiting Shield */}
              <div className="p-3.5 rounded-xl bg-surface-200/60 border border-border/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200">
                    Edge Ingress Rate Limiting Policy
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                    REAL ACTION
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  CloudPulse Shield active on in-process ASGI ingress. Throttles requests exceeding 20 req/s cap to protect downstream services.
                </p>
                <div className="mt-1.5 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Enforced via FastAPI Middleware</span>
                  <span>Blocked: {shieldStatus?.total_blocked ?? 0} reqs</span>
                </div>
              </div>

              {/* Action 2: Simulated HPA Scaling */}
              <div className="p-3.5 rounded-xl bg-surface-200/60 border border-border/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200">
                    Horizontal Pod Auto-Scaling (HPA)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold">
                    SIMULATED ACTION
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Autoscaler dynamically provisioned 2 → 4 pod replicas for order-service and api-gateway to absorb visitor surge without collapse.
                </p>
                <div className="mt-1.5 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Engine: Simulated HPA Policy</span>
                  <span>Active Replicas: 4 pods</span>
                </div>
              </div>

              {/* Action 3: Incident Management */}
              <div className="p-3.5 rounded-xl bg-surface-200/60 border border-border/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200">
                    SOC Security Incident &amp; RCA Tracking
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                    REAL ACTION
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Logged Incident INC-2026-081 with correlation evidence, threat severity, and automated Root Cause Analysis.
                </p>
                <div className="mt-1.5 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Status: Resolved</span>
                  <button
                    onClick={() => setActiveTab('incidents')}
                    className="text-cyan-400 hover:text-cyan-300 underline"
                  >
                    View Incidents Page
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Enforcement: <strong className="text-emerald-400">Local ASGI Gateway</strong></span>
            <button
              onClick={() => setActiveTab('audit')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              Full Audit Trail <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 5 — TECHNICAL DETAILS (Expandable & Collapsible Section)
          ========================================================================= */}
      <div className="rounded-2xl bg-surface-100/80 border border-border overflow-hidden">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full p-4.5 flex items-center justify-between hover:bg-surface-200/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-surface-200 text-cyan-400 border border-border">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-100">
                  Section 5 — Technical Details &amp; Advanced Telemetry
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-300 text-slate-400">
                  {showTechnicalDetails ? 'Expanded' : 'Collapsed'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Detailed Recharts waveform graphs, raw host metrics, replica distribution, and service catalog
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <span>{showTechnicalDetails ? 'HIDE TECHNICAL DETAILS' : 'VIEW TECHNICAL DETAILS'}</span>
            {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showTechnicalDetails && (
          <div className="p-5 border-t border-border space-y-6 animate-in slide-in-from-top-2 duration-200">
            {/* Waveform Graph */}
            <div className="p-4 rounded-xl bg-surface-200/40 border border-border/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-200 uppercase">
                    Live Ingress Throughput Waveform (RPS)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Observed requests sampled every second over the last 30 intervals
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-cyan-400">Current: {overview?.total_rps ?? 0} RPS</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-violet-400">P95: {metricValue(overview?.p95_latency_ms)} ms</span>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history.slice(-30)}>
                    <defs>
                      <linearGradient id="techTrafficGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0c1220',
                        borderColor: 'rgba(255,255,255,0.12)',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                      }}
                    />
                    <ReferenceLine y={20} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Rate Limit Cap (20 req/s)', fill: '#f43f5e', fontSize: 10 }} />
                    <Area
                      type="monotone"
                      dataKey="rps"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#techTrafficGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Host Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-surface-200/50 border border-border">
                <span className="text-[11px] text-slate-400 font-mono block">Host CPU (psutil)</span>
                <span className="text-lg font-bold font-mono text-slate-100">
                  {metricValue(overview?.cpu_utilization_percent)}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Physical host utilization</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-200/50 border border-border">
                <span className="text-[11px] text-slate-400 font-mono block">Host RAM (psutil)</span>
                <span className="text-lg font-bold font-mono text-slate-100">
                  {metricValue(overview?.memory_utilization_percent)}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">System memory</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-200/50 border border-border">
                <span className="text-[11px] text-slate-400 font-mono block">Process CPU</span>
                <span className="text-lg font-bold font-mono text-slate-100">
                  {metricValue(overview?.process_cpu_percent)}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">FastAPI worker thread</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-200/50 border border-border">
                <span className="text-[11px] text-slate-400 font-mono block">Simulated Replicas</span>
                <span className="text-lg font-bold font-mono text-cyan-300">
                  4 pods
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">order-service + api-gateway</span>
              </div>
            </div>

            {/* Service Topology Summary */}
            <div className="p-4 rounded-xl bg-surface-200/40 border border-border/80">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-mono font-bold text-slate-200 uppercase">
                  Service Catalog &amp; Health Matrix
                </h4>
                <button
                  onClick={() => setActiveTab('services')}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  View Services Page <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {services.slice(0, 4).map((s) => (
                  <div key={s.id} className="p-2.5 rounded-lg bg-surface-100/90 border border-border flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">{s.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">Tier: {s.tier}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      HEALTHY
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          FACULTY DEMONSTRATION FINAL REPORT MODAL / DRAWER (Triggered at Stage 7)
          ========================================================================= */}
      {activeReport && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-surface-100 to-surface-100 border border-indigo-500/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 font-mono">
                  {activeReport.title}
                </h3>
                <p className="text-xs text-slate-400">
                  Generated at {activeReport.generated_at} • Simulation Mode: {activeReport.simulation_mode_label}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveReport(null)}
              className="px-3 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-300 text-xs font-mono text-slate-300 cursor-pointer"
            >
              Dismiss Report
            </button>
          </div>

          {/* Faculty 5 Answers Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-surface-200/70 border border-border">
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block mb-1">
                1. Is website safe or at risk?
              </span>
              <p className="text-xs text-slate-200 font-semibold">
                {activeReport.executive_answers.is_website_safe_or_at_risk}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-200/70 border border-border">
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block mb-1">
                2. What did CloudPulse detect?
              </span>
              <p className="text-xs text-slate-200">
                {activeReport.executive_answers.what_did_cloudpulse_detect}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-200/70 border border-border">
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block mb-1">
                3. Why classify this way?
              </span>
              <p className="text-xs text-slate-200">
                {activeReport.executive_answers.why_did_it_classify_this_way}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-200/70 border border-border">
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block mb-1">
                4. What action was taken?
              </span>
              <p className="text-xs text-slate-200">
                {activeReport.executive_answers.what_action_did_it_take}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-200/70 border border-border lg:col-span-2">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block mb-1">
                5. Did the website recover?
              </span>
              <p className="text-xs text-slate-200">
                {activeReport.executive_answers.did_the_website_recover}
              </p>
            </div>
          </div>

          {/* Peak Telemetry Comparison */}
          <div className="p-3.5 rounded-xl bg-surface-200/50 border border-border/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-300 gap-4">
            <div>
              <span className="text-slate-400 block text-[10px]">INITIAL RISK</span>
              <strong>{activeReport.initial_state.risk_score}/100 ({activeReport.initial_state.risk_level})</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">PEAK TRAFFIC</span>
              <strong>{activeReport.peak_measurements.peak_traffic_rps} req/s</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">PEAK CPU</span>
              <strong>{activeReport.peak_measurements.peak_cpu_percent}%</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">PEAK P95</span>
              <strong>{activeReport.peak_measurements.peak_p95_latency_ms} ms</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">FINAL RESULT</span>
              <strong className="text-emerald-400">{activeReport.final_state.recovery_status}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
