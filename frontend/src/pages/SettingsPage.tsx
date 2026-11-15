import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Settings, Activity, AlertCircle, ArrowRight } from 'lucide-react';

interface RuntimeHealth {
  environment: string;
  checks: {
    prometheus: { status: string };
    orchestration: { status: string };
    database: { status: string };
    cache: { status: string };
  };
}

export const SettingsPage: React.FC = () => {
  const { setActiveTab, addToast } = useApp();
  const [runtime, setRuntime] = useState<RuntimeHealth | null>(null);

  useEffect(() => {
    api.getHealth()
      .then(setRuntime)
      .catch((error: Error) => addToast(error.message, 'error'));
  }, []);

  const integrations = [
    { name: 'Database', status: runtime?.checks.database.status },
    { name: 'Cache', status: runtime?.checks.cache.status },
    { name: 'Prometheus', status: runtime?.checks.prometheus.status },
    { name: 'Kubernetes', status: runtime?.checks.orchestration.status },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-100/90 p-4">
        <div className="rounded-lg border border-border bg-surface-200 p-2.5 text-cyan-400">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Runtime Configuration</h2>
          <p className="mt-1 text-xs text-slate-400">
            This local demo is read-only here. Integration URLs and infrastructure settings are supplied by the backend environment; this page does not apply or persist changes.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-100/80 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Active runtime</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface-200/50 p-3">
            <span className="text-[10px] uppercase text-slate-400">Environment</span>
            <p className="mt-1 text-sm font-medium capitalize text-slate-100">{runtime?.environment ?? 'Loading…'}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface-200/50 p-3">
            <span className="text-[10px] uppercase text-slate-400">Scaling</span>
            <p className="mt-1 text-sm font-medium text-slate-100">Policy-only; no orchestrator adapter</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-100/80 p-5">
        <div className="mb-4 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Integration status</h3>
        </div>
        <div className="divide-y divide-border/60">
          {integrations.map((integration) => (
            <div key={integration.name} className="flex items-center justify-between py-3 text-xs">
              <span className="text-slate-300">{integration.name}</span>
              <span className="font-mono text-slate-400">{integration.status ?? 'Checking…'}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setActiveTab('health')}
          className="mt-4 flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-600/20 px-3 py-2 text-xs font-medium text-cyan-300 transition-colors hover:bg-cyan-600/30"
        >
          Open System Health <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
