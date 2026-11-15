import React from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceItem } from '../../services/types';
import {
  Globe,
  ArrowDown
} from 'lucide-react';

interface Diagram2DProps {
  onSelectService: (id: string) => void;
  selectedId: string | null;
}

export const InfrastructureDiagram2D: React.FC<Diagram2DProps> = ({ onSelectService, selectedId }) => {
  const { services, simulator } = useApp();

  const getService = (id: string) => services.find((s) => s.id === id);

  const renderServiceCard = (service?: ServiceItem) => {
    if (!service) return null;
    const isSelected = selectedId === service.id;
    const isCritical = service.status === 'critical';
    const isDegraded = service.status === 'degraded';
    const isKnownStatus = service.status === 'critical' || service.status === 'degraded' || service.status === 'healthy';

    return (
      <div
        onClick={() => onSelectService(service.id)}
        className={`p-3.5 rounded-xl transition-all cursor-pointer border ${
          isSelected
            ? 'bg-cyan-500/15 border-cyan-400 ring-1 ring-cyan-400/50 shadow-glow-cyan'
            : isCritical
            ? 'bg-rose-950/40 border-rose-500/50 hover:border-rose-400'
            : isDegraded
            ? 'bg-amber-950/40 border-amber-500/50 hover:border-amber-400'
            : 'bg-surface-200/60 hover:bg-surface-200 border-border/80 hover:border-slate-600'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isCritical ? 'bg-rose-500' : isDegraded ? 'bg-amber-500' : isKnownStatus ? 'bg-emerald-500' : 'bg-slate-500'
              }`}
            />
            <span className="text-xs font-semibold text-slate-100">{service.name.split(' ')[0]}</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-300 text-cyan-300 border border-border">
              {service.replicas === null ? 'Replicas not measured' : `${service.replicas} replicas`}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div>
            <span className="text-slate-400 text-[10px]">CPU:</span>
            <p className="text-slate-200 font-medium">{service.cpu_percent === null ? 'Not measured' : `${service.cpu_percent}%`}</p>
          </div>
          <div>
            <span className="text-slate-400 text-[10px]">P95:</span>
            <p className="text-slate-200 font-medium">{service.latency_p95 === null ? 'Not measured' : `${service.latency_p95}ms`}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full rounded-xl bg-surface-300/40 border border-border p-6 flex flex-col items-center space-y-6">
      <div className="w-full max-w-md p-3 rounded-xl bg-surface-200/80 border border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-xs font-semibold text-slate-200">External ingress</h3>
            <p className="text-[11px] text-slate-400 font-mono">External traffic source is not instrumented</p>
          </div>
        </div>
        <span className="text-xs font-mono text-cyan-400">
          {simulator?.is_running ? 'Local test traffic active' : 'Not connected'}
        </span>
      </div>

      <ArrowDown className="w-4 h-4 text-cyan-500/60 animate-bounce" />

      <div className="w-full max-w-lg">
        {renderServiceCard(getService('api-gateway'))}
      </div>

      <ArrowDown className="w-4 h-4 text-cyan-500/60" />

      <div className="w-full">
        <div className="text-center text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-3">
          Catalogued application services
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderServiceCard(getService('auth-service'))}
          {renderServiceCard(getService('order-service'))}
          {renderServiceCard(getService('inventory-service'))}
          {renderServiceCard(getService('payment-service'))}
        </div>
      </div>

      <ArrowDown className="w-4 h-4 text-cyan-500/60" />

      <div className="w-full max-w-2xl">
        <div className="text-center text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-3">
          Catalogued data dependencies
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderServiceCard(getService('postgres-db'))}
          {renderServiceCard(getService('redis-cache'))}
        </div>
      </div>
    </div>
  );
};
