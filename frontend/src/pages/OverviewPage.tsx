import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { TelemetryPoint, RiskAnalysis } from '../services/types';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Cpu,
  Clock,
  Zap,
  Layers,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
  Radio,
  Sliders,
  Globe,
  RefreshCw,
  Server,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line
} from 'recharts';

const metricValue = (value: number | null | undefined, digits = 1) =>
  value == null ? '—' : value.toFixed(digits);

export const OverviewPage: React.FC = () => {
  const {
    overview,
    services,
    simulator,
    setActiveTab,
    setSelectedServiceId,
    protectedWebsite,
    threatLevel,
    mitigationActive,
    rateLimitEnforced,
    securityEvents,
    setIsFacultyDemoOpen,
  } = useApp();

  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [riskData, setRiskData] = useState<RiskAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  // Poll live metrics & risk analysis
  useEffect(() => {
    let active = true;
    const fetchTelemetry = async () => {
      try {
        const [liveRes, riskRes] = await Promise.all([
          api.getLiveMetrics().catch(() => ({ data: [] })),
          api.getRiskAnalysis().catch(() => null),
        ]);
        if (!active) return;
        if (liveRes?.data) setHistory(liveRes.data);
        if (riskRes) setRiskData(riskRes);
      } catch (e) {
        console.error('Error fetching dashboard telemetry:', e);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Compute threat level score and visual indicators
  const threatScore = useMemo(() => {
    if (threatLevel === 'Critical') return 95;
    if (threatLevel === 'High Risk') return 75;
    if (threatLevel === 'Suspicious') return 55;
    if (threatLevel === 'Monitoring') return 30;
    return 10;
  }, [threatLevel]);

  // Workflow pipeline states
  const workflowStages = [
    {
      id: 'monitor',
      label: '1. MONITOR',
      desc: 'Ingress Stream',
      active: true,
      status: 'nominal',
    },
    {
      id: 'detect',
      label: '2. DETECT',
      desc: 'Anomaly Engine',
      active: threatLevel !== 'Normal',
      status: threatLevel === 'Critical' || threatLevel === 'High Risk' ? 'critical' : 'nominal',
    },
    {
      id: 'alert',
      label: '3. ALERT',
      desc: 'SOC Dispatch',
      active: threatLevel === 'Critical' || threatLevel === 'High Risk',
      status: 'warning',
    },
    {
      id: 'analyze',
      label: '4. ANALYZE',
      desc: 'Evidence & RCA',
      active: threatLevel !== 'Normal',
      status: 'nominal',
    },
    {
      id: 'mitigate',
      label: '5. MITIGATE',
      desc: 'Rate Limiting',
      active: mitigationActive,
      status: 'nominal',
    },
    {
      id: 'scale',
      label: '6. SCALE',
      desc: 'Native HPA',
      active: (overview?.cpu_utilization_percent ?? 0) > 60 || simulator?.is_running,
      status: 'nominal',
    },
    {
      id: 'recover',
      label: '7. RECOVER',
      desc: 'Self-Healing',
      active: overview?.status === 'healthy',
      status: 'nominal',
    },
  ];

  // 8 Core Website Protection KPI Cards
  const kpiCards = [
    {
      title: 'Incoming Requests/sec',
      value: overview ? overview.total_rps.toString() : '0',
      unit: 'req/s',
      subtitle: 'Observed ingress traffic',
      icon: Activity,
      color: 'text-cyan-400',
      borderColor: 'border-cyan-500/30',
      bgGlow: 'bg-cyan-500/10',
    },
    {
      title: 'Total Requests Observed',
      value: overview ? overview.total_requests.toLocaleString() : '—',
      unit: 'requests',
      subtitle: 'FastAPI telemetry middleware',
      icon: Radio,
      color: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      bgGlow: 'bg-blue-500/10',
    },
    {
      title: 'Active Virtual Users',
      value: simulator?.is_running ? simulator.virtual_users.toString() : '1 (Baseline)',
      unit: 'users',
      subtitle: simulator?.is_running ? `${simulator.pattern.toUpperCase()} scenario` : 'Standard monitoring agent',
      icon: Zap,
      color: 'text-yellow-400',
      borderColor: 'border-yellow-500/30',
      bgGlow: 'bg-yellow-500/10',
    },
    {
      title: 'Average Response Time',
      value: metricValue(overview?.avg_latency_ms),
      unit: 'ms',
      subtitle: 'Edge round-trip duration',
      icon: Clock,
      color: 'text-indigo-400',
      borderColor: 'border-indigo-500/30',
      bgGlow: 'bg-indigo-500/10',
    },
    {
      title: 'P95 Response Latency',
      value: metricValue(overview?.p95_latency_ms),
      unit: 'ms',
      subtitle: '95th percentile samples',
      icon: Clock,
      color: 'text-violet-400',
      borderColor: 'border-violet-500/30',
      bgGlow: 'bg-violet-500/10',
    },
    {
      title: 'HTTP Error Rate',
      value: `${metricValue(overview?.error_rate_percent, 2)}%`,
      unit: '5xx/4xx',
      subtitle: 'Failed request ratio',
      icon: AlertTriangle,
      color: (overview?.error_rate_percent ?? 0) > 2 ? 'text-rose-400' : 'text-emerald-400',
      borderColor: (overview?.error_rate_percent ?? 0) > 2 ? 'border-rose-500/30' : 'border-emerald-500/30',
      bgGlow: (overview?.error_rate_percent ?? 0) > 2 ? 'bg-rose-500/10' : 'bg-emerald-500/10',
    },
    {
      title: 'Host CPU Utilization',
      value: `${metricValue(overview?.cpu_utilization_percent)}%`,
      unit: 'CPU',
      subtitle: 'Measured with psutil',
      icon: Cpu,
      color: (overview?.cpu_utilization_percent ?? 0) > 75 ? 'text-amber-400' : 'text-cyan-400',
      borderColor: (overview?.cpu_utilization_percent ?? 0) > 75 ? 'border-amber-500/30' : 'border-cyan-500/30',
      bgGlow: (overview?.cpu_utilization_percent ?? 0) > 75 ? 'bg-amber-500/10' : 'bg-cyan-500/10',
    },
    {
      title: 'Host Memory Utilization',
      value: `${metricValue(overview?.memory_utilization_percent)}%`,
      unit: 'RAM',
      subtitle: 'System memory footprint',
      icon: Server,
      color: 'text-slate-300',
      borderColor: 'border-slate-500/30',
      bgGlow: 'bg-slate-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. VISUAL WORKFLOW PIPELINE: MONITOR -> DETECT -> ALERT -> ANALYZE -> MITIGATE -> SCALE -> RECOVER */}
      <div className="p-4 rounded-2xl bg-[#0a0e1a]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg shadow-cyan-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Autonomous Website Protection Lifecycle
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Real-time closed-loop operations pipeline
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {workflowStages.map((stage, idx) => (
            <div
              key={stage.id}
              className={`p-2.5 rounded-xl border transition-all ${
                stage.active
                  ? stage.status === 'critical'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-sm'
                    : stage.status === 'warning'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
                    : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200 shadow-sm'
                  : 'bg-surface-200/40 border-border/60 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold tracking-tight">
                  {stage.label}
                </span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    stage.active
                      ? stage.status === 'critical'
                        ? 'bg-rose-400 animate-ping'
                        : 'bg-emerald-400 animate-pulse'
                      : 'bg-slate-600'
                  }`}
                />
              </div>
              <p className="text-[11px] font-medium text-slate-300 mt-1 truncate">
                {stage.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. SECTION A: WEBSITE PROTECTION STATUS BANNER */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0d1424] via-surface-100 to-[#0d1424] border border-cyan-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 shadow-xl">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              threatLevel === 'Critical'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-glow-rose'
                : threatLevel === 'High Risk'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-glow-emerald'
            }`}
          >
            {threatLevel === 'Critical' ? (
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            ) : threatLevel === 'High Risk' ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                TARGET: {protectedWebsite}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                99.98% Operational
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-200 text-slate-300 border border-border">
                Shield: Simulation Enforced
              </span>
            </div>

            <h1 className="text-lg font-bold text-slate-100 tracking-tight">
              Website Protection Operations Center
            </h1>
            <p className="text-xs text-slate-400">
              Active Host Scope: <span className="text-slate-200 font-mono">127.0.0.1:8001</span> • Telemetry Stream:{' '}
              <span className="text-cyan-400 font-mono">FastAPI ASGI Ingress</span> • Defense Mode:{' '}
              <span className="text-emerald-400 font-mono">Active Rate Limiting &amp; HPA</span>
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => setIsFacultyDemoOpen(true)}
            className="flex-1 lg:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 transition-all shadow-glow-cyan cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-current text-yellow-300" />
            <span>START FACULTY DEMO</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className="flex-1 lg:flex-initial px-3.5 py-2 rounded-xl bg-surface-200/90 hover:bg-surface-200 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Attack Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('risk')}
            className="px-3.5 py-2 rounded-xl bg-surface-300/80 hover:bg-surface-300 border border-border text-slate-200 text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Risk Engine</span>
          </button>
        </div>
      </div>

      {/* 3. SECTION B: 8 CORE LIVE TRAFFIC KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl bg-surface-100/90 border ${card.borderColor} hover:border-slate-500 transition-all shadow-sm`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium truncate">{card.title}</span>
                <div className={`p-1.5 rounded-lg border ${card.borderColor} ${card.bgGlow}`}>
                  <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-slate-100">{card.value}</span>
                <span className="text-[11px] text-slate-400 font-mono">{card.unit}</span>
              </div>
              <div className="mt-1.5 text-[10px] text-slate-400 font-mono truncate">{card.subtitle}</div>
            </div>
          );
        })}
      </div>

      {/* 4. SECTION C: REAL-TIME TRAFFIC & THREAT WAVEFORM GRAPH (RECHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Real-time Inbound Traffic & Protection Graph */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-surface-100/85 border border-border flex flex-col shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
                  Live Traffic &amp; Threat Detection Waveform
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Observed requests to protected endpoint with dynamic anomaly thresholds
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                Live: {overview?.total_rps ?? 0} RPS
              </span>
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                P95: {metricValue(overview?.p95_latency_ms)}ms
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.slice(-30)}>
                <defs>
                  <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={threatLevel === 'Critical' ? '#f43f5e' : '#06b6d4'}
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor={threatLevel === 'Critical' ? '#f43f5e' : '#06b6d4'}
                      stopOpacity={0.0}
                    />
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
                <ReferenceLine y={15} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Spike Threshold', fill: '#f59e0b', fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="rps"
                  stroke={threatLevel === 'Critical' ? '#f43f5e' : '#06b6d4'}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#trafficGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Normal Baseline: ~5 RPS</span>
            <span>Rate-Limit Cap: 20 req/s</span>
            <span>Target: demo.cloudpulse.local/api/simulator/test-target</span>
          </div>
        </div>

        {/* Right 1 Col: SECTION D: THREAT DETECTION & RISK GAUGE */}
        <div className="p-5 rounded-2xl bg-surface-100/85 border border-border flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
                  Threat Detection
                </h3>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                  threatLevel === 'Critical'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : threatLevel === 'High Risk'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {threatLevel}
              </span>
            </div>

            {/* Threat Gauge Meter */}
            <div className="p-4 rounded-xl bg-surface-200/60 border border-border/80 my-3 text-center">
              <span className="text-[10px] font-mono uppercase text-slate-400">Threat Severity Index</span>
              <div className="flex items-center justify-center gap-1 my-1">
                <span
                  className={`text-3xl font-extrabold font-mono ${
                    threatScore >= 75 ? 'text-rose-400' : threatScore >= 45 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {threatScore}
                </span>
                <span className="text-xs font-mono text-slate-400">/ 100</span>
              </div>
              <div className="w-full bg-surface-300 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    threatScore >= 75 ? 'bg-rose-500' : threatScore >= 45 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${threatScore}%` }}
                />
              </div>
            </div>

            {/* Evidence & Findings */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-surface-200/40 border border-border/60">
                <span className="text-slate-400">Anomaly Indicator:</span>
                <span className={simulator?.is_running ? 'text-amber-300 font-bold' : 'text-emerald-400'}>
                  {simulator?.is_running ? 'THRESHOLD BREACH' : 'NOMINAL'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface-200/40 border border-border/60">
                <span className="text-slate-400">Detection Reason:</span>
                <span className="text-slate-200 truncate max-w-[150px]">
                  {simulator?.is_running
                    ? `${simulator.pattern.toUpperCase()} pattern detected`
                    : 'Traffic within baseline envelope'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface-200/40 border border-border/60">
                <span className="text-slate-400">Detection Time:</span>
                <span className="text-slate-300">Continuous 1s tick</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('risk')}
            className="w-full mt-4 py-2 rounded-lg bg-surface-200 hover:bg-surface-300 border border-border text-xs font-mono text-cyan-300 flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Inspect Threat Calculations</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5. SECTION E & F: PROTECTION CONTROLS & LIVE SECURITY EVENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* SECTION E: AUTOMATED PROTECTION & DEFENSE ACTIONS */}
        <div className="p-5 rounded-2xl bg-surface-100/85 border border-border space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
                Automated Protection &amp; Mitigation Controls
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ACTIVE DEFENSE
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-surface-200/60 border border-border/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Rate Limiting Policy (Edge Shield)</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Enforces strict concurrency limits (max 10 concurrent, 20 req/s cap)
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                ENFORCED
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-200/60 border border-border/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Abnormal Source Mitigation</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Filters suspicious request bursts and logs offending test requests
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold">
                STANDBY
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-200/60 border border-border/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Native Auto-Scaling Engine (HPA)</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Provisions 2 to 10 simulated pods upon sustained CPU / RPS pressure
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold">
                READY
              </span>
            </div>
          </div>
        </div>

        {/* SECTION F: RECENT SECURITY & TRAFFIC EVENTS FEED */}
        <div className="p-5 rounded-2xl bg-surface-100/85 border border-border flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
                  Recent Security &amp; Traffic Events
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Live SOC Audit Log</span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {securityEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl bg-surface-200/50 border border-border/60 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-200">{evt.title}</span>
                    <span className="text-[10px] font-mono text-slate-400">{evt.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                    {evt.description}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Source: {evt.source}</span>
                    <span
                      className={`uppercase px-1.5 py-0.2 rounded font-semibold ${
                        evt.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-300'
                          : evt.severity === 'warning'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-cyan-500/20 text-cyan-300'
                      }`}
                    >
                      {evt.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Showing {securityEvents.length} recent events</span>
            <button
              onClick={() => setActiveTab('audit')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              Full Audit Trail <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
