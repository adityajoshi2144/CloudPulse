import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InfrastructureDiagram2D } from '../components/three/InfrastructureDiagram2D';
import { NodeInspectorDrawer } from '../components/three/NodeInspectorDrawer';
import { Box, Layers } from 'lucide-react';

export const InfrastructurePage: React.FC = () => {
  const { overview, services } = useApp();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-100/90 border border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100">Service Dependency Map</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                Catalog view
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a service to inspect its catalogued dependencies and available telemetry.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Layers className="h-4 w-4 text-cyan-400" />
          <span>Dependency layout, not live request flow</span>
        </div>
      </div>

      <div className="relative">
        <InfrastructureDiagram2D
          onSelectService={(id) => setSelectedServiceId(id)}
          selectedId={selectedServiceId}
        />
        <NodeInspectorDrawer
          serviceId={selectedServiceId}
          onClose={() => setSelectedServiceId(null)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 rounded-lg bg-surface-100/70 border border-border">
          <span className="text-slate-400 text-[10px] uppercase">API request rate</span>
          <p className="text-slate-200 font-bold text-sm mt-0.5">
            {overview?.requests_per_second ?? '—'} RPS
          </p>
          <span className="text-slate-400 text-[10px]">CloudPulse API telemetry</span>
        </div>
        <div className="p-3 rounded-lg bg-surface-100/70 border border-border">
          <span className="text-slate-400 text-[10px] uppercase">Host CPU</span>
          <p className="text-slate-200 font-bold text-sm mt-0.5">
            {overview?.cpu_utilization_percent ?? '—'}%
          </p>
          <span className="text-slate-400 text-[10px]">Host measurement</span>
        </div>
        <div className="p-3 rounded-lg bg-surface-100/70 border border-border">
          <span className="text-slate-400 text-[10px] uppercase">Kubernetes</span>
          <p className="text-slate-200 font-bold text-sm mt-0.5">Not integrated</p>
          <span className="text-amber-400 text-[10px]">Pods and nodes unavailable</span>
        </div>
        <div className="p-3 rounded-lg bg-surface-100/70 border border-border">
          <span className="text-slate-400 text-[10px] uppercase">Instrumented services</span>
          <p className="text-slate-200 font-bold text-sm mt-0.5">
            {services.filter((service) => service.metrics_source !== 'not_instrumented').length} / {services.length}
          </p>
          <span className="text-slate-400 text-[10px]">Per-service telemetry coverage</span>
        </div>
      </div>
    </div>
  );
};
