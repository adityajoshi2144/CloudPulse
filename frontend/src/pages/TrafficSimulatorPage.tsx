import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Pause,
  Play,
  ShieldCheck,
  ShieldAlert,
  Square,
  Zap,
  RotateCcw,
  Download,
  Flame,
  TrendingUp,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine
} from 'recharts';
import { api } from '../services/api';
import { SimulatorConfig, SimulatorLimits, SimulatorPattern, SimulatorStatus } from '../services/types';
import { useApp } from '../context/AppContext';

interface ScenarioMeta {
  id: SimulatorPattern;
  mode: 'legitimate' | 'suspicious';
  title: string;
  badge: string;
  description: string;
  recommendedDuration: number;
  recommendedUsers: number;
}

const ALL_SCENARIOS: ScenarioMeta[] = [
  // MODE A: Legitimate Traffic Scenarios
  {
    id: 'normal',
    mode: 'legitimate',
    title: 'Normal Website Traffic',
    badge: 'BASELINE',
    description: 'Steady genuine user browsing with low concurrency and nominal latency.',
    recommendedDuration: 15,
    recommendedUsers: 2,
  },
  {
    id: 'spike',
    mode: 'legitimate',
    title: 'Legitimate Traffic Surge',
    badge: 'FLASH SALE',
    description: 'Sudden influx of genuine shoppers testing elasticity and autoscaling capacity.',
    recommendedDuration: 20,
    recommendedUsers: 4,
  },
  {
    id: 'gradual',
    mode: 'legitimate',
    title: 'Gradual Traffic Increase',
    badge: 'RAMP UP',
    description: 'Smooth organic traffic climb over time testing predictive metrics.',
    recommendedDuration: 25,
    recommendedUsers: 5,
  },

  // MODE B: Simulated Suspicious Traffic Scenarios
  {
    id: 'burst',
    mode: 'suspicious',
    title: 'Abnormal Traffic Burst',
    badge: 'SUSPICIOUS BURST',
    description: 'High-frequency irregular request spikes triggering anomaly detection thresholds.',
    recommendedDuration: 15,
    recommendedUsers: 6,
  },
  {
    id: 'flood',
    mode: 'suspicious',
    title: 'HTTP Request Flood Attack',
    badge: 'THREAT FLOOD',
    description: 'Rapid inbound request stream testing edge rate-limiting and shield controls.',
    recommendedDuration: 15,
    recommendedUsers: 8,
  },
  {
    id: 'resource',
    mode: 'suspicious',
    title: 'Compute Exhaustion Attack',
    badge: 'CPU STRESS',
    description: 'Capped CPU stress workload triggering infrastructure threshold warnings.',
    recommendedDuration: 15,
    recommendedUsers: 4,
  },
  {
    id: 'failure',
    mode: 'suspicious',
    title: 'Test Endpoint Fault & Recovery',
    badge: 'ENDPOINT FAILURE',
    description: 'Simulates target failure (HTTP 503) and validates automated self-recovery.',
    recommendedDuration: 15,
    recommendedUsers: 3,
  },
];

const formatMetric = (value: number | null | undefined, unit = '') =>
  value === null || value === undefined ? '—' : `${value}${unit}`;

export const TrafficSimulatorPage: React.FC = () => {
  const { addToast, refreshData, addSecurityEvent, setIsFacultyDemoOpen } = useApp();

  const [activeMode, setActiveMode] = useState<'legitimate' | 'suspicious'>('legitimate');
  const [pattern, setPattern] = useState<SimulatorPattern>('spike');
  const [virtualUsers, setVirtualUsers] = useState(4);
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [duration, setDuration] = useState(20);
  const [maxRequests, setMaxRequests] = useState(250);
  const [limits, setLimits] = useState<SimulatorLimits | null>(null);
  const [status, setStatus] = useState<SimulatorStatus | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const [current, safety] = await Promise.all([
          api.getSimulatorStatus(),
          limits ? Promise.resolve(limits) : api.getSimulatorLimits(),
        ]);
        if (!active) return;
        setStatus(current);
        setLimits(safety);
        setConnectionError(null);
      } catch (error) {
        if (active) {
          setConnectionError(
            error instanceof Error ? error.message : 'Unable to reach the simulation API.'
          );
        }
      }
    };
    void poll();
    const timer = window.setInterval(poll, 1000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [limits]);

  const runAction = async (action: () => Promise<SimulatorStatus>, message: string) => {
    setBusy(true);
    try {
      const next = await action();
      setStatus(next);
      addToast(message, 'success');
      await refreshData();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Simulation action failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleStart = () => {
    const config: SimulatorConfig = {
      pattern,
      virtual_users: virtualUsers,
      intensity,
      duration_seconds: duration,
      ramp_up_seconds: pattern === 'gradual' ? duration : Math.min(3, duration),
      max_requests: maxRequests,
      target_service: 'cloudpulse-test-service',
      safe_simulation_mode: true,
    };

    addSecurityEvent({
      type: activeMode === 'suspicious' ? 'threat_detected' : 'traffic_spike',
      severity: activeMode === 'suspicious' ? 'critical' : 'warning',
      title: `Simulation Dispatched: ${pattern.toUpperCase()}`,
      description: `${virtualUsers} virtual users active for ${duration}s (Max ${maxRequests} requests).`,
      source: 'Traffic & Attack Simulator',
    });

    return runAction(() => api.startSimulator(config), `Started ${pattern.toUpperCase()} simulation.`);
  };

  const handleSelectScenario = (sc: ScenarioMeta) => {
    setPattern(sc.id);
    setDuration(sc.recommendedDuration);
    setVirtualUsers(sc.recommendedUsers);
  };

  const running = Boolean(status?.is_running);
  const points = status?.live_timeline ?? [];
  const lastPoint = points[points.length - 1];
  const progress = Math.min(100, status?.progress_percent ?? 0);

  const displayedScenarios = ALL_SCENARIOS.filter((sc) => sc.mode === activeMode);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-5 rounded-2xl bg-surface-100/90 border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30">
              <Zap className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100">Live Traffic &amp; Attack Simulator</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                  Interactive Evaluation Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dispatch controlled, bounded HTTP scenarios to observe real-time threat detection, automated scaling, and recovery.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFacultyDemoOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-mono font-bold shadow-glow-cyan transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span>START FACULTY DEMO</span>
          </button>

          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-mono font-semibold ${
              running
                ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300 animate-pulse'
                : 'border-border bg-surface-200 text-slate-400'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${running ? 'bg-cyan-400' : 'bg-slate-500'}`} />
            {status?.scenario_status ? status.scenario_status.toUpperCase() : 'READY'}
          </span>
        </div>
      </header>

      {/* Safety & Compliance Policy Banner */}
      <section className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 text-xs">
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
        <div className="leading-relaxed text-slate-300">
          <span className="font-bold text-emerald-300 block mb-0.5">Strict Local-Only Safety Sandbox</span>
          <p>
            Requests are executed strictly via in-process ASGI loop to{' '}
            <span className="font-mono text-cyan-300">demo.cloudpulse.local/api/simulator/test-target</span>. External IP
            addresses or non-local endpoints are strictly rejected by architectural design.
          </p>
          <p className="mt-1 font-mono text-[11px] text-slate-400">
            Hard Caps: Concurrency ≤ {limits?.max_concurrency ?? 10} • Throughput ≤ {limits?.max_requests_per_second ?? 20} req/s • Total requests ≤ {limits?.max_requests_per_run ?? 1000} • Duration ≤ {limits?.max_duration_seconds ?? 60}s
          </p>
        </div>
      </section>

      {/* Mode Selector Tabs (Mode A vs Mode B) */}
      <div className="flex border-b border-border/80">
        <button
          onClick={() => setActiveMode('legitimate')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold border-b-2 transition-all ${
            activeMode === 'legitimate'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-surface-100/40'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>MODE A: LEGITIMATE TRAFFIC SPIKE</span>
        </button>
        <button
          onClick={() => setActiveMode('suspicious')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold border-b-2 transition-all ${
            activeMode === 'suspicious'
              ? 'border-rose-400 text-rose-300 bg-rose-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-surface-100/40'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>MODE B: SIMULATED SUSPICIOUS TRAFFIC &amp; ATTACK</span>
        </button>
      </div>

      {/* Scenario Selection Grid */}
      <section className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {displayedScenarios.map((sc) => {
          const isSelected = pattern === sc.id;
          return (
            <button
              type="button"
              key={sc.id}
              onClick={() => handleSelectScenario(sc)}
              disabled={running}
              className={`rounded-2xl border p-4 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected
                  ? activeMode === 'suspicious'
                    ? 'border-rose-500/60 bg-rose-950/20 shadow-glow-rose'
                    : 'border-cyan-500/60 bg-cyan-950/20 shadow-glow-cyan'
                  : 'border-border/80 bg-surface-100/80 hover:border-slate-500 hover:bg-surface-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    activeMode === 'suspicious'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  {sc.badge}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {sc.recommendedDuration}s / {sc.recommendedUsers} users
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100">{sc.title}</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed font-sans">{sc.description}</p>
            </button>
          );
        })}
      </section>

      {/* Simulator Workspace: Parameters + Live Waveform */}
      <section className="grid gap-6 lg:grid-cols-[330px_1fr]">
        {/* Controls Column */}
        <div className="space-y-5 rounded-2xl border border-border bg-surface-100/90 p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Simulation Parameters
            </span>
            <span className="text-[10px] font-mono text-slate-400">Target: cloudpulse-test-service</span>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 flex justify-between text-xs font-mono text-slate-300">
                <span>Concurrent Users</span>
                <span className="font-bold text-cyan-300">{virtualUsers} users</span>
              </span>
              <input
                className="w-full accent-cyan-400 cursor-pointer"
                type="range"
                min="1"
                max={limits?.max_concurrency ?? 10}
                value={virtualUsers}
                disabled={running}
                onChange={(e) => setVirtualUsers(Number(e.target.value))}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 flex justify-between text-xs font-mono text-slate-300">
                <span>Duration</span>
                <span className="font-bold text-cyan-300">{duration} seconds</span>
              </span>
              <input
                className="w-full accent-cyan-400 cursor-pointer"
                type="range"
                min="5"
                max={limits?.max_duration_seconds ?? 60}
                value={duration}
                disabled={running}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 flex justify-between text-xs font-mono text-slate-300">
                <span>Max Request Cap</span>
                <span className="font-bold text-cyan-300">{maxRequests} requests</span>
              </span>
              <input
                className="w-full accent-cyan-400 cursor-pointer"
                type="range"
                min="50"
                max={limits?.max_requests_per_run ?? 1000}
                step="25"
                value={maxRequests}
                disabled={running}
                onChange={(e) => setMaxRequests(Number(e.target.value))}
              />
            </label>

            <label className="block text-xs font-mono text-slate-300">
              <span>Traffic Intensity</span>
              <select
                value={intensity}
                disabled={running}
                onChange={(e) => setIntensity(e.target.value as typeof intensity)}
                className="mt-1.5 w-full rounded-xl border border-border bg-surface-200 px-3 py-2 text-xs font-mono text-slate-100"
              >
                <option value="low">Low · 2-4 requests/sec</option>
                <option value="medium">Medium · 8-12 requests/sec</option>
                <option value="high">High · up to 20 requests/sec</option>
              </select>
            </label>
          </div>

          {/* Action Trigger Buttons */}
          <div className="pt-2">
            {!running ? (
              <button
                type="button"
                onClick={handleStart}
                disabled={!limits || Boolean(connectionError) || busy}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-4 py-3 text-xs font-mono font-bold text-white shadow-glow-cyan disabled:opacity-50 cursor-pointer transition-all"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Launch {pattern.toUpperCase()} Scenario</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    runAction(
                      status?.is_paused ? api.resumeSimulator : api.pauseSimulator,
                      status?.is_paused ? 'Simulation resumed.' : 'Simulation paused.'
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-200 px-3 py-2.5 text-xs font-mono text-slate-200 hover:bg-surface-300 transition-colors"
                >
                  {status?.is_paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  <span>{status?.is_paused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    runAction(api.stopSimulator, 'Simulation stopped and test service recovered.')
                  }
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-3 py-2.5 text-xs font-mono font-bold text-white transition-colors"
                >
                  <Square className="h-4 w-4 fill-current" />
                  <span>Stop</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Simulation Visualizer Column */}
        <div className="rounded-2xl border border-border bg-surface-100/90 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-100">Live Measured Simulation Telemetry</h2>
                <p className="text-xs text-slate-400">
                  Continuous ASGI measurements intercepting FastAPI request latency and host psutil CPU.
                </p>
              </div>
              <div className="text-xs font-mono text-slate-300">
                Elapsed: <span className="text-cyan-300 font-bold">{status?.elapsed_seconds ?? 0}s</span> /{' '}
                {status?.duration_seconds ?? duration}s
              </div>
            </div>

            {/* Progress Bar */}
            <div className="my-4 h-2 w-full overflow-hidden rounded-full bg-surface-300">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Waveform Graph */}
            <div className="h-64 w-full">
              {points.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={points} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="simTraffic" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={activeMode === 'suspicious' ? '#f43f5e' : '#06b6d4'}
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor={activeMode === 'suspicious' ? '#f43f5e' : '#06b6d4'}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                    <XAxis dataKey="second" tickFormatter={(v) => `${v}s`} stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        background: '#0c1220',
                        border: '1px solid #293447',
                        borderRadius: 8,
                        fontSize: 11,
                        fontFamily: 'monospace',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rps"
                      name="Throughput (req/s)"
                      stroke={activeMode === 'suspicious' ? '#f43f5e' : '#06b6d4'}
                      strokeWidth={2}
                      fill="url(#simTraffic)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-xs font-mono text-slate-500">
                  <Activity className="h-6 w-6 text-slate-600 animate-pulse" />
                  <span>{running ? 'Sampling initial telemetry frames...' : 'Select a scenario and click Launch to start.'}</span>
                </div>
              )}
            </div>

            {/* Live Metrics Grid */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-border/60 pt-4 text-xs font-mono">
              <div className="rounded-xl bg-surface-200/50 p-3 border border-border/60">
                <span className="text-[10px] text-slate-400 uppercase">Requests Sent</span>
                <p className="mt-1 text-sm font-bold text-slate-100">
                  {status?.requests_sent ?? 0} / {status?.request_cap ?? maxRequests}
                </p>
              </div>
              <div className="rounded-xl bg-surface-200/50 p-3 border border-border/60">
                <span className="text-[10px] text-slate-400 uppercase">Observed RPS</span>
                <p className="mt-1 text-sm font-bold text-cyan-300">
                  {formatMetric(lastPoint?.rps)} req/s
                </p>
              </div>
              <div className="rounded-xl bg-surface-200/50 p-3 border border-border/60">
                <span className="text-[10px] text-slate-400 uppercase">P95 Latency</span>
                <p className="mt-1 text-sm font-bold text-indigo-300">
                  {formatMetric(lastPoint?.latency_p95, ' ms')}
                </p>
              </div>
              <div className="rounded-xl bg-surface-200/50 p-3 border border-border/60">
                <span className="text-[10px] text-slate-400 uppercase">Host CPU</span>
                <p className="mt-1 text-sm font-bold text-amber-300">
                  {formatMetric(lastPoint?.cpu_percent, '%')}
                </p>
              </div>
            </div>
          </div>

          {/* Status Alert or Completion */}
          {status?.scenario_status === 'completed' && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Simulation completed successfully. Process-local report generated.</span>
              </div>
              {status.report_id && (
                <a
                  href={`/api/reports/${status.report_id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold font-mono text-[11px] flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Report (PDF)</span>
                </a>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
