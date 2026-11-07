import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { TelemetryPoint } from '../services/types';
import {
  Activity,
  Cpu,
  HardDrive,
  Clock,
  Layers,
  Database,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Server,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export const OverviewPage: React.FC = () => {
  const { overview, services, setActiveTab, setSelectedServiceId } = useApp();
  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.getLiveMetrics();
        setHistory(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 2000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: 'Request Throughput',
      value: `${overview?.total_rps ? overview.total_rps.toLocaleString() : '1,024'}`,
      unit: 'req/sec',
      change: '+14.2%',
      isPositive: true,
      icon: Activity,
      color: 'text-cyan-400',
      bgGlow: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'P95 Latency',
      value: `${overview?.p95_latency_ms || 24.8}`,
      unit: 'ms',
      change: '-4.1%',
      isPositive: true,
      icon: Clock,
      color: 'text-indigo-400',
      bgGlow: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: 'Cluster Error Rate',
      value: `${overview?.error_rate_percent || 0.02}%`,
      unit: '5xx/4xx',
      change: overview?.error_rate_percent && overview.error_rate_percent > 1.0 ? 'Elevated' : 'Nominal',
      isPositive: !(overview?.error_rate_percent && overview.error_rate_percent > 1.0),
      icon: AlertTriangle,
      color: overview?.error_rate_percent && overview.error_rate_percent > 1.0 ? 'text-rose-400' : 'text-emerald-400',
      bgGlow: overview?.error_rate_percent && overview.error_rate_percent > 1.0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Cluster CPU Average',
      value: `${overview?.cpu_utilization_percent || 38.2}%`,
      unit: 'Target: 70%',
      change: 'HPA Ready',
      isPositive: true,
      icon: Cpu,
      color: 'text-amber-400',
      bgGlow: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Active Pod Replicas',
      value: `${overview?.active_replicas || 14}`,
      unit: 'Kubernetes Pods',
      change: 'Autoscaling Active',
      isPositive: true,
      icon: Layers,
      color: 'text-cyan-400',
      bgGlow: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'Cache Hit Ratio',
      value: `${overview?.cache_hit_ratio_percent || 88.6}%`,
      unit: 'Redis L2',
      change: '+1.2% efficiency',
      isPositive: true,
      icon: Database,
      color: 'text-violet-400',
      bgGlow: 'bg-violet-500/10 border-violet-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Health Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-surface-200 via-surface-100 to-surface-200 border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            overview?.status === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
            overview?.status === 'degraded' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-glow-emerald'
          }`}>
            {overview?.status === 'critical' ? <AlertCircle className="w-5 h-5" /> :
             overview?.status === 'degraded' ? <AlertTriangle className="w-5 h-5" /> :
             <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-100">
                {overview?.status === 'critical' ? 'Cluster Attention Required — Pod Outage Active' :
                 overview?.status === 'degraded' ? 'Cluster Operating Under Degraded Performance' :
                 'All Microservices Operational & Healthy'}
              </h2>
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                overview?.status === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                overview?.status === 'degraded' ? 'bg-amber-500/20 text-amber-400' :
                'bg-emerald-500/20 text-emerald-400'
              }`}>
                {overview?.status || 'HEALTHY'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Uptime: <span className="text-slate-300 font-mono">{overview?.uptime || '5d 14h 22m'}</span> • Availability: <span className="text-emerald-400 font-mono">99.98%</span> • Orchestration: <span className="text-cyan-400 font-mono">HPA v2</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('simulator')}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-glow-cyan"
          >
            <Zap className="w-3.5 h-3.5" />
            Launch Traffic Simulator
          </button>
          <button
            onClick={() => setActiveTab('infrastructure')}
            className="px-3 py-1.5 rounded-lg bg-surface-300 hover:bg-surface-400 border border-border text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Inspect 3D Cluster
          </button>
        </div>
      </div>

      {/* 6 Core Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="p-4 rounded-xl bg-surface-100/90 border border-border hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium truncate">{card.title}</span>
                <div className={`p-1.5 rounded-lg border ${card.bgGlow}`}>
                  <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-slate-100">{card.value}</span>
                <span className="text-[11px] text-slate-400 font-mono">{card.unit}</span>
              </div>
              <div className="mt-2 flex items-center text-[10px] text-slate-400 font-mono">
                <span className={card.isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                  {card.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Real-time Throughput (RPS) */}
        <div className="p-4 rounded-xl bg-surface-100/80 border border-border flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                System Throughput (RPS)
              </h3>
              <p className="text-[11px] text-slate-400">Live request ingestion timeline</p>
            </div>
            <span className="text-xs font-mono font-medium text-cyan-400">
              {overview?.total_rps || 920} RPS
            </span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.slice(-30)}>
                <defs>
                  <linearGradient id="rpsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1420',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
                <Area type="monotone" dataKey="rps" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#rpsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency P95 vs Avg */}
        <div className="p-4 rounded-xl bg-surface-100/80 border border-border flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Response Latency (P95 vs Avg)
              </h3>
              <p className="text-[11px] text-slate-400">Measured edge round-trip time</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-indigo-400">P95: {overview?.p95_latency_ms || 24}ms</span>
              <span className="text-cyan-400">Avg: {overview?.avg_latency_ms || 12}ms</span>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history.slice(-30)}>
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1420',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
                <Line type="monotone" dataKey="latency_p95" stroke="#818cf8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="latency_avg" stroke="#22d3ee" strokeWidth={2} dot={false} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Services Health Matrix */}
      <div className="p-5 rounded-xl bg-surface-100/80 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Microservices Ecosystem Status
            </h3>
            <p className="text-[11px] text-slate-400">Live instances, resource quotas, and telemetry</p>
          </div>
          <button
            onClick={() => setActiveTab('services')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
          >
            Manage Services <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.map((svc) => (
            <div
              key={svc.id}
              onClick={() => {
                setSelectedServiceId(svc.id);
                setActiveTab('services');
              }}
              className="p-3.5 rounded-lg bg-surface-200/50 hover:bg-surface-200/90 border border-border/80 hover:border-slate-600 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      svc.status === 'critical' ? 'bg-rose-500 animate-ping' :
                      svc.status === 'degraded' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                  <span className="text-xs font-semibold text-slate-200">{svc.name}</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-300 text-slate-300 border border-border">
                  {svc.replicas} pods
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2">
                <span>CPU: {svc.cpu_percent}%</span>
                <span>P95: {svc.latency_p95}ms</span>
                <span>Load: {svc.rps} RPS</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
