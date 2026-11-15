import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { TelemetryPoint } from '../services/types';
import {
  Activity,
  AlertTriangle,
  Cpu,
  HardDrive,
  Layers,
  Clock,
  Radio,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export const LiveMonitoringPage: React.FC = () => {
  const { overview, timeRange } = useApp();
  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await api.getHistory(timeRange);
        setHistory(res.data);
        setLoadError(null);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Unable to load telemetry history.');
      }
    };
    fetchLive();
    const interval = setInterval(fetchLive, 1000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const hasThresholdBreach =
    (overview?.error_rate_percent != null && overview.error_rate_percent > 2) ||
    (overview?.cpu_utilization_percent != null && overview.cpu_utilization_percent > 85);
  const hasRequestSamples = (overview?.requests_in_window ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Top Telemetry Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-100/90 border border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Radio className="w-4 h-4 animate-pulse text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              High-Frequency Live Telemetry
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-700/40">
                {timeRange} window
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Measured CloudPulse API requests and host resources only; external nodes are not connected.
            </p>
          </div>
        </div>

        {/* Anomaly Detection Status Pill */}
        <div className="flex items-center gap-2">
          {hasThresholdBreach ? (
            <div className="px-3 py-1 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
              <span>Configured threshold exceeded</span>
            </div>
          ) : hasRequestSamples ? (
            <div className="px-3 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>No configured threshold breach</span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-lg bg-surface-200 border border-border text-slate-400 text-xs font-mono">
              Waiting for application requests
            </div>
          )}
        </div>
      </div>

      {loadError && (
        <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-xs text-rose-200">
          Telemetry unavailable: {loadError}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-surface-100/80 p-4">
          <div className="text-xs text-slate-400">Requests / second</div>
          <div className="mt-1 text-xl font-mono text-slate-100">{overview?.requests_per_second ?? '—'}</div>
        </div>
        <div className="rounded-lg border border-border bg-surface-100/80 p-4">
          <div className="text-xs text-slate-400">Requests / minute</div>
          <div className="mt-1 text-xl font-mono text-slate-100">{overview?.requests_per_minute ?? '—'}</div>
        </div>
        <div className="rounded-lg border border-border bg-surface-100/80 p-4">
          <div className="text-xs text-slate-400">P99 latency</div>
          <div className="mt-1 text-xl font-mono text-slate-100">{overview?.p99_latency_ms == null ? '—' : `${overview.p99_latency_ms} ms`}</div>
        </div>
        <div className="rounded-lg border border-border bg-surface-100/80 p-4">
          <div className="text-xs text-slate-400">Database probe</div>
          <div className="mt-1 text-xl font-mono text-slate-100">{overview?.database_response_time_ms == null ? '—' : `${overview.database_response_time_ms} ms`}</div>
        </div>
      </div>

      {/* Primary 4 Live Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. Requests Per Second (RPS) */}
        <div className="p-4 rounded-xl bg-surface-100/80 border border-border flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold text-slate-200 font-mono">THROUGHPUT (RPS)</span>
              <p className="text-[11px] text-slate-400">Requests received by the CloudPulse API</p>
            </div>
            <span className="text-sm font-mono font-bold text-cyan-400">{overview?.requests_per_second ?? '—'} RPS</span>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.slice(-30)}>
                <defs>
                  <linearGradient id="liveRpsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f1420', borderColor: 'rgba(255,255,255,0.1)', fontSize: '11px', fontFamily: 'monospace' }} />
                <Area type="monotone" dataKey="rps" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#liveRpsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Latency (P95 & Avg with Warning Threshold) */}
        <div className="p-4 rounded-xl bg-surface-100/80 border border-border flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold text-slate-200 font-mono">LATENCY (MS)</span>
              <p className="text-[11px] text-slate-400">Measured P95, P99 and average request duration</p>
            </div>
            <span className="text-sm font-mono font-bold text-indigo-400">{overview?.p95_latency_ms ?? '—'} ms</span>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history.slice(-30)}>
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f1420', borderColor: 'rgba(255,255,255,0.1)', fontSize: '11px', fontFamily: 'monospace' }} />
                <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Warning 60ms', fill: '#f59e0b', fontSize: 9 }} />
                <Line type="monotone" dataKey="latency_p95" stroke="#818cf8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="p99_latency_ms" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="latency_avg" stroke="#38bdf8" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Host CPU utilization */}
        <div className="p-4 rounded-xl bg-surface-100/80 border border-border flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold text-slate-200 font-mono">CPU UTILIZATION (%)</span>
              <p className="text-[11px] text-slate-400">Host CPU reported by psutil</p>
            </div>
            <span className="text-sm font-mono font-bold text-amber-400">{overview?.cpu_utilization_percent ?? '—'}%</span>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.slice(-30)}>
                <defs>
                  <linearGradient id="liveCpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f1420', borderColor: 'rgba(255,255,255,0.1)', fontSize: '11px', fontFamily: 'monospace' }} />
                <Area type="monotone" dataKey="cpu_percent" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#liveCpuGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. HTTP Error Rate (%) */}
        <div className="p-4 rounded-xl bg-surface-100/80 border border-border flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold text-slate-200 font-mono">HTTP ERROR RATE (%)</span>
              <p className="text-[11px] text-slate-400">4xx and 5xx edge responses • Alert: 2%</p>
            </div>
            <span className={`text-sm font-mono font-bold ${hasThresholdBreach ? 'text-rose-400' : 'text-emerald-400'}`}>
              {overview?.error_rate_percent == null ? '—' : `${overview.error_rate_percent}%`}
            </span>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.slice(-30)}>
                <defs>
                  <linearGradient id="liveErrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#0f1420', borderColor: 'rgba(255,255,255,0.1)', fontSize: '11px', fontFamily: 'monospace' }} />
                <ReferenceLine y={2.0} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Warn 2%', fill: '#f59e0b', fontSize: 9 }} />
                <ReferenceLine y={5.0} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Crit 5%', fill: '#f43f5e', fontSize: 9 }} />
                <Area type="monotone" dataKey="error_rate" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#liveErrGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
