import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ServiceItem } from '../services/types';
import {
  Server,
  FileText,
  Search,
  X,
} from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const { services, selectedServiceId, addToast } = useApp();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [activeDetailService, setActiveDetailService] = useState<ServiceItem | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logAvailability, setLogAvailability] = useState<{ available: boolean; message: string }>({
    available: false,
    message: 'Log integration has not been checked.',
  });

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
      setLogAvailability({ available: logData.available, message: logData.message });
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setLoadingLogs(false);
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
            Service Catalog
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-200 text-slate-300 border border-border">
              {services.length} Services
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Catalogued service dependencies. Per-service telemetry, logs, replicas, and restart controls are not integrated.
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
                      svc.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      'bg-surface-200 text-slate-400 border border-border'
                    }`}>
                      {svc.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                    <span>ID: {svc.id}</span>
                    <span>•</span>
                    <span>Version: {svc.version === 'unknown' ? 'Not reported' : svc.version}</span>
                    <span>•</span>
                    <span>Restarts: {svc.restart_count ?? 'Not measured'}</span>
                  </div>
                </div>
              </div>

              {/* Center: Live Resource Meters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-400 text-[10px]">CPU</span>
                  <p className="text-slate-200 font-medium text-sm">{svc.cpu_percent === null ? 'Not measured' : `${svc.cpu_percent}%`}</p>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px]">RAM</span>
                  <p className="text-slate-200 font-medium text-sm">{svc.memory_percent === null ? 'Not measured' : `${svc.memory_percent}%`}</p>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px]">THROUGHPUT</span>
                  <p className="text-slate-200 font-medium text-sm">{svc.rps === null ? 'Not measured' : `${svc.rps} RPS`}</p>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px]">P95 LATENCY</span>
                  <p className="text-slate-200 font-medium text-sm">{svc.latency_p95 === null ? 'Not measured' : `${svc.latency_p95} ms`}</p>
                </div>
              </div>

              {/* Catalog inspection */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fetchServiceDetail(svc.id)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> Inspect
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Service catalog details */}
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
                    Service: {activeDetailService.id} • Version: {activeDetailService.version === 'unknown' ? 'Not reported' : activeDetailService.version}
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
              {/* Pod inventory */}
              <div>
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono mb-2.5">
                  Pod inventory
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
                  {(!activeDetailService.pods || activeDetailService.pods.length === 0) && (
                    <p className="text-xs text-slate-400">
                      Replica count and pod health are not available without a Kubernetes integration.
                    </p>
                  )}
                </div>
              </div>

              {/* Dependencies Graph Summary */}
              {activeDetailService.dependencies && activeDetailService.dependencies.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono mb-2">
                    Catalogued Dependencies
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

              {/* Log integration status */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                    Service Logs
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">{logAvailability.available ? 'Connected' : 'Not connected'}</span>
                </div>
                <div className="bg-[#05070b] rounded-lg p-3 font-mono text-xs border border-border text-slate-300 h-56 overflow-y-auto space-y-1.5">
                  {loadingLogs ? (
                    <div className="text-slate-500 text-center py-8">Checking log integration…</div>
                  ) : !logAvailability.available ? (
                    <div className="text-slate-500 text-center py-8">{logAvailability.message}</div>
                  ) : logs.length === 0 ? (
                    <div className="text-slate-500 text-center py-8">No log events returned.</div>
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
              <span className="text-xs text-slate-400">Infrastructure controls are unavailable</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
