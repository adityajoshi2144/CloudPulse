import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InfrastructureScene3D } from '../components/three/InfrastructureScene3D';
import { InfrastructureDiagram2D } from '../components/three/InfrastructureDiagram2D';
import { NodeInspectorDrawer } from '../components/three/NodeInspectorDrawer';
import { Box, Layers, Radio, ShieldCheck, Eye, EyeOff, RotateCcw } from 'lucide-react';

export const InfrastructurePage: React.FC = () => {
  const { overview } = useApp();
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Infrastructure Observatory Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-100/90 border border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100">
                Cloud Infrastructure Observatory
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                {viewMode === '3d' ? 'Three.js / WebGL 3D' : '2D Topology Map'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live spatial topology of edge ingress, microservices, container pods, Redis caching, and PostgreSQL.
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-lg bg-surface-200 border border-border">
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                viewMode === '3d'
                  ? 'bg-cyan-600 text-white shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Box className="w-3.5 h-3.5" /> 3D Observatory
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                viewMode === '2d'
                  ? 'bg-cyan-600 text-white shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> 2D Topology
            </button>
          </div>
        </div>
      </div>

      {/* Main Observatory Stage */}
      <div className="relative">
        {viewMode === '3d' ? (
          <InfrastructureScene3D
            onSelectService={(id) => setSelectedServiceId(id)}
            selectedId={selectedServiceId}
          />
        ) : (
          <InfrastructureDiagram2D
            onSelectService={(id) => setSelectedServiceId(id)}
            selectedId={selectedServiceId}
          />
        )}

        {/* Interactive Node Inspector Drawer */}
        <NodeInspectorDrawer
          serviceId={selectedServiceId}
          onClose={() => setSelectedServiceId(null)}
        />
      </div>

      {/* Cluster Node Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 rounded-lg bg-surface-100/70 border border-border">
          <span className="text-slate-400 text-[10px] uppercase">Cluster Nodes</span>
          <p className="text-slate-200 font-bold text-sm mt-0.5">3 Worker Nodes</p>
          <span className="text-emerald-400 text-[10px]">100% Ready</span>
        </div>
        <div className="p-3 rounded-lg bg-surface-100/70 border border-border">
          <span className="text-slate-400 text-[10px] uppercase">Allocated Pods</span>
          <p className="text-cyan-400 font-bold text-sm mt-0.5">{overview?.active_replicas || 14} Active</p>
          <span className="text-slate-400 text-[10px]">Managed by HPA</span>
        </div>
        <div className="p-3 rounded-lg bg-surface-100/70 border border-border">
          <span className="text-slate-400 text-[10px] uppercase">Network Gateway</span>
          <p className="text-slate-200 font-bold text-sm mt-0.5">NGINX Ingress</p>
          <span className="text-cyan-400 text-[10px]">Round-Robin Mesh</span>
        </div>
        <div className="p-3 rounded-lg bg-surface-100/70 border border-border">
          <span className="text-slate-400 text-[10px] uppercase">Persistence Layer</span>
          <p className="text-slate-200 font-bold text-sm mt-0.5">Postgres + Redis</p>
          <span className="text-indigo-400 text-[10px]">Sub-2ms Cache Read</span>
        </div>
      </div>
    </div>
  );
};
