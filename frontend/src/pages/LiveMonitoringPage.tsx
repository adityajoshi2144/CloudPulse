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

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await api.getHistory(timeRange);
        setHistory(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchLive();
    const interval = setInterval(fetchLive, 1000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const latest = history[history.length - 1] || {
    rps: 920,
    latency_p95: 24,
    latency_avg: 12,
    error_rate: 0.02,
    cpu_percent: 38,
    memory_percent: 48,
    active_replicas: 14
  };

  const hasAnomaly = latest.error_rate > 2.0 || latest.cpu_percent > 85.0;

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
                1000ms Resolution
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ingesting stream metrics across all worker nodes and container runtimes.
            </p>
          </div>
        </div>

        {/* Anomaly Detection Status Pill */}
        <div className="flex items-center gap-2">
          {hasAnomaly ? (
            <div className="px-3 py-1 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
              <span>Anomaly Detected (Threshold Exceeded)</span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Metrics Within Statistical Bounds</span>
            </div>
          )}
        </div>
      </div>

      {/* Primary 4 Live Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. Requests Per Second (RPS) */}
        <div className="p-4 rounded-xl bg-surface-100/80 border border-border flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold text-slate-200 font-mono">THROUGHPUT (RPS)</span>
              <p className="text-[11px] text-slate-400">Total requests arriving at cluster gateway</p>
            </div>
            <span className="text-sm font-mono font-bold text-cyan-400">{latest.rps} RPS</span>
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
              <p className="text-[11px] text-slate-400">P95 (solid) vs Avg (dashed) • SLA: 100ms</p>
            </div>
            <span className="text-sm font-mono font-bold text-indigo-400">{latest.latency_p95} ms</span>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history.slice(-30)}>
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f1420', borderColor: 'rgba(255,255,255,0.1)', fontSize: '11px', fontFamily: 'monospace' }} />
                <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Warning 60ms', fill: '#f59e0b', fontSize: 9 }} />
                <Line type="monotone" dataKey="latency_p95" stroke="#818cf8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="latency_avg" stroke="#38bdf8" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. CPU Utilization with HPA Target (70%) */}
        <div className="p-4 rounded-xl bg-surface-100/80 border border-border flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold text-slate-200 font-mono">CPU UTILIZATION (%)</span>
              <p className="text-[11px] text-slate-400">Average across pods • Target HPA: 70%</p>
            </div>
            <span className="text-sm font-mono font-bold text-amber-400">{latest.cpu_percent}%</span>
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
                <ReferenceLine y={70} stroke="#06b6d4" strokeDasharray="4 4" label={{ value: 'HPA Target 70%', fill: '#06b6d4', fontSize: 9 }} />
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
            <span className={`text-sm font-mono font-bold ${latest.error_rate > 2.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {latest.error_rate}%
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
