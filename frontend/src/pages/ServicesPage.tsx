import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ServiceItem, PodInstance } from '../services/types';
import {
  Server,
  RotateCcw,
  Plus,
  Minus,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Cpu,
  HardDrive,
  Activity,
  X,
  Radio
} from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const { services, selectedServiceId, setSelectedServiceId, addToast, refreshData } = useApp();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [activeDetailService, setActiveDetailService] = useState<ServiceItem | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (selectedServiceId) {
      const match = services.find((s) => s.id === selectedServiceId);
      if (match) setActiveDetailService(match);
    }
  }, [selectedServiceId, services]);

  const fetchServiceDetail = async (id: string) => {
    try {
      setLoadingLogs(true);
      const [detail, logData] = await Promise.all([
        api.getServiceDetail(id),
        api.getServiceLogs(id)
      ]);
      setActiveDetailService(detail);
      setLogs(logData.logs || []);
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleRestart = async (id: string, name: string) => {
    try {
      await api.restartService(id);
      addToast(`Rolling restart initiated for ${name}`, 'success');
      refreshData();
      if (activeDetailService?.id === id) {
        fetchServiceDetail(id);
      }
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  const handleScale = async (id: string, current: number, delta: number, min: number, max: number) => {
    const next = Math.max(min, Math.min(max, current + delta));
    try {
      await api.triggerManualScale(id, next);
      addToast(`Scaled ${id} to ${next} pods`, 'success');
      refreshData();
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  const filtered = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === 'all' || s.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6">
      {/* Header and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-100/90 border border-border">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            Microservice Ecosystem & Fleet Management
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-200 text-slate-300 border border-border">
              {services.length} Services
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time replica health, resource quotas, dependencies and rolling restart controls.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-surface-200 border border-border text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-44"
            />
          </div>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-surface-200 border border-border text-xs text-slate-300 font-mono focus:outline-none"
          >
            <option value="all">All Tiers</option>
            <option value="gateway">Gateway</option>
            <option value="core">Core App</option>
            <option value="data">Database</option>
            <option value="cache">Cache</option>
          </select>
        </div>
      </div>

      {/* Services Table / Cards */}
      <div className="grid grid-cols-1 gap-3.5">
        {filtered.map((svc) => (
          <div
            key={svc.id}
            className={`p-4 rounded-xl border transition-all ${
              svc.status === 'critical'
                ? 'bg-rose-950/20 border-rose-500/40'
                : svc.status === 'degraded'
                ? 'bg-amber-950/20 border-amber-500/40'
                : 'bg-surface-100/80 hover:bg-surface-100 border-border/80'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left: Service Identity */}
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 rounded-xl border ${
                  svc.status === 'critical' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                  svc.status === 'degraded' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-surface-200 text-cyan-400 border-border'
                }`}>
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-100">{svc.name}</h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-200 text-slate-400 uppercase border border-border">
                      {svc.tier}
                    </span>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                      svc.status === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      svc.status === 'degraded' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {svc.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                    <span>ID: {svc.id}</span>
                    <span>•</span>
                    <span>Build: {svc.version}</span>
                    <span>•</span>
                    <span>Restarts: {svc.restart_count}</span>
                  </div>
                </div>
              </div>

              {/* Center: Live Resource Meters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-400 text-[10px]">CPU</span>
                  <p className="text-slate-200 font-medium text-sm">{svc.cpu_percent}%</p>
                  <div className="w-20 h-1 bg-surface-300 rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${svc.cpu_percent > 80 ? 'bg-rose-500' : 'bg-cyan-500'}`}
                      style={{ width: `${Math.min(100, svc.cpu_percent)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px]">RAM</span>
                  <p className="text-slate-200 font-medium text-sm">{svc.memory_percent}%</p>
                  <div className="w-20 h-1 bg-surface-300 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${Math.min(100, svc.memory_percent)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px]">THROUGHPUT</span>
                  <p className="text-slate-200 font-medium text-sm">{svc.rps} RPS</p>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px]">P95 LATENCY</span>
                  <p className="text-slate-200 font-medium text-sm">{svc.latency_p95} ms</p>
                </div>
              </div>

              {/* Right: Actions and Replicas */}
              <div className="flex items-center gap-3">
                {/* Pod Scale Buttons */}
                {svc.tier !== 'data' && svc.tier !== 'cache' && (
                  <div className="flex items-center gap-1.5 p-1 rounded-lg bg-surface-200 border border-border">
                    <button
                      onClick={() => handleScale(svc.id, svc.replicas, -1, svc.min_replicas, svc.max_replicas)}
                      disabled={svc.replicas <= svc.min_replicas}
                      className="p-1 rounded hover:bg-surface-300 text-slate-300 disabled:opacity-30"
                      title="Scale in"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-mono font-bold text-cyan-400 px-1.5 min-w-[32px] text-center">
                      {svc.replicas}
                    </span>
                    <button
                      onClick={() => handleScale(svc.id, svc.replicas, 1, svc.min_replicas, svc.max_replicas)}
                      disabled={svc.replicas >= svc.max_replicas}
                      className="p-1 rounded hover:bg-surface-300 text-slate-300 disabled:opacity-30"
                      title="Scale out"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => handleRestart(svc.id, svc.name)}
                  className="p-2 rounded-lg bg-surface-200 hover:bg-surface-300 text-slate-300 border border-border transition-colors"
                  title="Rolling Restart Service"
                >
                  <RotateCcw className="w-4 h-4 text-cyan-400" />
                </button>

                <button
                  onClick={() => fetchServiceDetail(svc.id)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> Details & Logs
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Service Detail Drawer with Real Pod List & Logs */}
      {activeDetailService && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl h-full bg-surface-100 border-l border-border shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface-200/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-surface-300 border border-border">
                  <Server className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">{activeDetailService.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Service: {activeDetailService.id} • Version: {activeDetailService.version}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveDetailService(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Tabs */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Pod Instances List */}
              <div>
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono mb-2.5">
                  Allocated Kubernetes Pod Instances ({activeDetailService.pods?.length || activeDetailService.replicas})
                </h4>
                <div className="space-y-2">
                  {(activeDetailService.pods || []).map((pod) => (
                    <div
                      key={pod.id}
                      className="p-3 rounded-lg bg-surface-200/60 border border-border flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            pod.status === 'CrashLoopBackOff' ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                          }`}
                        />
                        <div>
                          <p className="font-mono text-slate-200 font-medium">{pod.id}</p>
                          <p className="text-[11px] text-slate-400 font-mono">Node: {pod.node} • IP: {pod.ip}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 font-mono text-[11px]">
                        <span>CPU: {pod.cpu_percent}%</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pod.status === 'CrashLoopBackOff'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {pod.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dependencies Graph Summary */}
              {activeDetailService.dependencies && activeDetailService.dependencies.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono mb-2">
                    Downstream Service Call Graph
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeDetailService.dependencies.map((dep) => (
                      <span
                        key={dep}
                        className="px-2.5 py-1 rounded bg-surface-200 text-xs font-mono text-cyan-300 border border-border"
                      >
                        &rarr; {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Container Logs Stream */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                    Container Standard Output (stdout/stderr)
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse" /> Live Tail
                  </span>
                </div>
                <div className="bg-[#05070b] rounded-lg p-3 font-mono text-xs border border-border text-slate-300 h-56 overflow-y-auto space-y-1.5">
                  {logs.length === 0 ? (
                    <div className="text-slate-500 text-center py-8">No log events recorded.</div>
                  ) : (
                    logs.map((log, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px]">
                        <span className="text-slate-500 shrink-0">{log.timestamp.slice(11, 19)}</span>
                        <span className={`shrink-0 font-bold ${
                          log.level === 'CRITICAL' ? 'text-rose-400' :
                          log.level === 'ERROR' ? 'text-rose-400' :
                          log.level === 'WARN' ? 'text-amber-400' : 'text-cyan-400'
                        }`}>
                          [{log.level}]
                        </span>
                        <span className="text-slate-300 break-all">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-border bg-surface-200/50 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">Service UUID: {activeDetailService.id}</span>
              <button
                onClick={() => handleRestart(activeDetailService.id, activeDetailService.name)}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Execute Rolling Pod Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
