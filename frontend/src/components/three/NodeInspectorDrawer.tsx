import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Server,
  Cpu,
  HardDrive,
  Activity,
  ArrowRight
} from 'lucide-react';

interface NodeInspectorDrawerProps {
  serviceId: string | null;
  onClose: () => void;
}

export const NodeInspectorDrawer: React.FC<NodeInspectorDrawerProps> = ({ serviceId, onClose }) => {
  const { services, setActiveTab } = useApp();

  if (!serviceId) return null;

  const service = services.find((item) => item.id === serviceId);
  if (!service) return null;

  const displayMetric = (value: number | null, unit = '') =>
    value === null ? 'Not measured' : `${value}${unit}`;

  const statusClass = service.status === 'critical'
    ? 'text-rose-400'
    : service.status === 'degraded'
      ? 'text-amber-400'
      : service.status === 'healthy'
        ? 'text-emerald-400'
        : 'text-slate-400';

  return (
    <div className="absolute top-4 right-4 bottom-4 w-96 bg-surface-100/95 backdrop-blur-xl border border-border shadow-2xl rounded-xl z-20 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      <div className="p-4 border-b border-border flex items-center justify-between bg-surface-200/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-surface-300 border border-border flex items-center justify-center">
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">{service.name}</h2>
            <p className="text-[11px] font-mono text-slate-400">{service.id} • {service.version === 'unknown' ? 'version not reported' : service.version}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-300 transition-colors"
          aria-label="Close service details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-200/70 border border-border">
          <span className="text-xs text-slate-400 font-mono">Reported service status</span>
          <span className={`text-xs font-semibold uppercase font-mono ${statusClass}`}>{service.status}</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-lg bg-surface-200/60 border border-border/70">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>CPU</span>
            </div>
            <p className="text-sm font-semibold font-mono text-slate-100">{displayMetric(service.cpu_percent, '%')}</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-200/60 border border-border/70">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              <span>Memory</span>
            </div>
            <p className="text-sm font-semibold font-mono text-slate-100">{displayMetric(service.memory_percent, '%')}</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-200/60 border border-border/70">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Request rate</span>
            </div>
            <p className="text-sm font-semibold font-mono text-slate-100">{displayMetric(service.rps, ' RPS')}</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-200/60 border border-border/70">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>P95 latency</span>
            </div>
            <p className="text-sm font-semibold font-mono text-slate-100">{displayMetric(service.latency_p95, ' ms')}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-700/40">
          <p className="text-xs font-semibold text-amber-200">Infrastructure integration unavailable</p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-100/80">
            Replicas, pod health, service CPU, and restart operations are not connected. No infrastructure action is available from this panel.
          </p>
        </div>

        {service.dependencies.length > 0 && (
          <div className="p-3 rounded-lg bg-surface-200/40 border border-border/70">
            <span className="text-xs font-medium text-slate-300 block mb-2">Catalogued dependencies</span>
            <div className="flex flex-wrap gap-1.5">
              {service.dependencies.map((dependency) => (
                <span key={dependency} className="px-2 py-1 rounded bg-surface-300 text-[11px] font-mono text-slate-300 border border-border">
                  {dependency}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => setActiveTab('services')}
          className="w-full py-2 px-3 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
        >
          Open service catalog <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
