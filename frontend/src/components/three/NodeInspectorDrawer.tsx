import React from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  X,
  Server,
  Cpu,
  HardDrive,
  Activity,
  RotateCcw,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface NodeInspectorDrawerProps {
  serviceId: string | null;
  onClose: () => void;
}

export const NodeInspectorDrawer: React.FC<NodeInspectorDrawerProps> = ({ serviceId, onClose }) => {
  const { services, addToast, refreshData, setActiveTab } = useApp();

  if (!serviceId) return null;

  const service = services.find((s) => s.id === serviceId);

  if (!service) return null;

  const handleRestart = async () => {
    try {
      await api.restartService(service.id);
      addToast(`Restart initiated for ${service.name}`, 'success');
      refreshData();
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  const handleScale = async (delta: number) => {
    const nextCount = Math.max(service.min_replicas, Math.min(service.max_replicas, service.replicas + delta));
    try {
      await api.triggerManualScale(service.id, nextCount);
      addToast(`Scaled ${service.name} to ${nextCount} pods`, 'success');
      refreshData();
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  return (
    <div className="absolute top-4 right-4 bottom-4 w-96 bg-surface-100/95 backdrop-blur-xl border border-border shadow-2xl rounded-xl z-20 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-surface-200/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-surface-300 border border-border flex items-center justify-center">
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">{service.name}</h2>
            <p className="text-[11px] font-mono text-slate-400">{service.id} • {service.version}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-200/70 border border-border">
          <span className="text-xs text-slate-400 font-mono">Service Health</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                service.status === 'critical'
                  ? 'bg-rose-500 animate-ping'
                  : service.status === 'degraded'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
            <span
              className={`text-xs font-semibold uppercase font-mono ${
                service.status === 'critical'
                  ? 'text-rose-400'
                  : service.status === 'degraded'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {service.status}
            </span>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-lg bg-surface-200/60 border border-border/70">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>CPU Usage</span>
            </div>
            <p className="text-base font-semibold font-mono text-slate-100">{service.cpu_percent}%</p>
            <span className="text-[10px] text-slate-400">Target: {service.target_cpu}%</span>
          </div>

          <div className="p-3 rounded-lg bg-surface-200/60 border border-border/70">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              <span>Memory</span>
            </div>
            <p className="text-base font-semibold font-mono text-slate-100">{service.memory_percent}%</p>
            <span className="text-[10px] text-slate-400">Heap Allocated</span>
          </div>

          <div className="p-3 rounded-lg bg-surface-200/60 border border-border/70">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Throughput</span>
            </div>
            <p className="text-base font-semibold font-mono text-slate-100">{service.rps} RPS</p>
            <span className="text-[10px] text-slate-400">Active Load</span>
          </div>

          <div className="p-3 rounded-lg bg-surface-200/60 border border-border/70">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>P95 Latency</span>
            </div>
            <p className="text-base font-semibold font-mono text-slate-100">{service.latency_p95} ms</p>
            <span className="text-[10px] text-slate-400">Error: {service.error_rate}%</span>
          </div>
        </div>

        {/* Replica Controls */}
        <div className="p-3.5 rounded-lg bg-surface-200/70 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200">Pod Replicas</span>
            <span className="text-xs font-mono text-cyan-400">{service.replicas} Active</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleScale(-1)}
              disabled={service.replicas <= service.min_replicas}
              className="flex-1 py-1.5 rounded bg-surface-300 hover:bg-surface-400 disabled:opacity-40 text-slate-300 text-xs font-medium border border-border flex items-center justify-center gap-1"
            >
              <Minus className="w-3 h-3" /> Scale In
            </button>
            <button
              onClick={() => handleScale(1)}
              disabled={service.replicas >= service.max_replicas}
              className="flex-1 py-1.5 rounded bg-surface-300 hover:bg-surface-400 disabled:opacity-40 text-slate-300 text-xs font-medium border border-border flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" /> Scale Out
            </button>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-mono text-center">
            HPA Bounds: {service.min_replicas} min - {service.max_replicas} max
          </div>
        </div>

        {/* Service Dependencies */}
        {service.dependencies && service.dependencies.length > 0 && (
          <div className="p-3 rounded-lg bg-surface-200/40 border border-border/70">
            <span className="text-xs font-medium text-slate-300 block mb-2">Downstream Dependencies</span>
            <div className="flex flex-wrap gap-1.5">
              {service.dependencies.map((dep) => (
                <span
                  key={dep}
                  className="px-2 py-1 rounded bg-surface-300 text-[11px] font-mono text-slate-300 border border-border"
                >
                  {dep}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <button
            onClick={handleRestart}
            className="w-full py-2 px-3 rounded-lg bg-surface-200 hover:bg-surface-300 border border-border text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            Perform Rolling Restart
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className="w-full py-2 px-3 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            View Full Service Metrics & Logs <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
