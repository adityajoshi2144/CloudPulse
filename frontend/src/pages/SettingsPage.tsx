import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Save, Server, Shield, Database, Radio, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { environment, setEnvironment, addToast } = useApp();
  const [prometheusUrl, setPrometheusUrl] = useState('http://localhost:9090');
  const [grafanaUrl, setGrafanaUrl] = useState('http://localhost:3000');
  const [scaleUpCooldown, setScaleUpCooldown] = useState(15);
  const [scaleDownCooldown, setScaleDownCooldown] = useState(30);

  const handleSave = () => {
    addToast('Cluster configuration saved', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-4 rounded-xl bg-surface-100/90 border border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-surface-200 text-cyan-400 border border-border">
            <Settings className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Platform Configuration & Environment Topology
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Kubernetes HPA parameters, observability scrape targets, and persistence settings.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-2 shadow-glow-cyan transition-all"
        >
          <Save className="w-3.5 h-3.5" /> Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Kubernetes & HPA Settings */}
        <div className="p-5 rounded-xl bg-surface-100/80 border border-border space-y-4">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" /> Auto-Scaling & Cooldown Policies
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 text-[11px] font-mono block mb-1">
                Scale-Up Cooldown Window (Seconds)
              </label>
              <input
                type="number"
                value={scaleUpCooldown}
                onChange={(e) => setScaleUpCooldown(parseInt(e.target.value) || 15)}
                className="w-full px-3 py-1.5 rounded bg-surface-200 border border-border text-slate-200 font-mono text-xs focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">
                Minimum delay before triggering another scale-out after a spike.
              </span>
            </div>

            <div>
              <label className="text-slate-400 text-[11px] font-mono block mb-1">
                Scale-Down Stabilization Window (Seconds)
              </label>
              <input
                type="number"
                value={scaleDownCooldown}
                onChange={(e) => setScaleDownCooldown(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-1.5 rounded bg-surface-200 border border-border text-slate-200 font-mono text-xs focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">
                Prevents flapping by enforcing a cooldown before deallocating pods.
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry & Scrape Endpoints */}
        <div className="p-5 rounded-xl bg-surface-100/80 border border-border space-y-4">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" /> Observability Integrations
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 text-[11px] font-mono block mb-1">
                Prometheus Scrape Endpoint
              </label>
              <input
                type="text"
                value={prometheusUrl}
                onChange={(e) => setPrometheusUrl(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-surface-200 border border-border text-slate-200 font-mono text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[11px] font-mono block mb-1">
                Grafana Cloud Instance URL
              </label>
              <input
                type="text"
                value={grafanaUrl}
                onChange={(e) => setGrafanaUrl(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-surface-200 border border-border text-slate-200 font-mono text-xs focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
