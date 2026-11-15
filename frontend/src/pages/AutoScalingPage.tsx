import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ScalingPolicy, ScalingEvent } from '../services/types';
import {
  TrendingUp,
  Clock,
  Save,
  AlertCircle,
  Layers,
  Cpu,
  Server,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const AutoScalingPage: React.FC = () => {
  const { addToast, overview, simulator, setIsFacultyDemoOpen } = useApp();
  const [policies, setPolicies] = useState<ScalingPolicy[]>([]);
  const [events, setEvents] = useState<ScalingEvent[]>([]);
  const [editingPolicy, setEditingPolicy] = useState<
    Record<string, { target_cpu: number; min: number; max: number }>
  >({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const isSimActive = simulator?.is_running;
  const currentReplicaCount = isSimActive ? 4 : 2;

  const fetchData = async () => {
    try {
      const [pols, evts] = await Promise.all([
        api.getScalingPolicies(),
        api.getScalingEvents(),
      ]);
      setPolicies(pols);
      setEvents(evts);

      const editMap: Record<string, { target_cpu: number; min: number; max: number }> = {};
      pols.forEach((p) => {
        editMap[p.service_id] = {
          target_cpu: p.target_cpu,
          min: p.min_replicas,
          max: p.max_replicas,
        };
      });
      setEditingPolicy(editMap);
    } catch (e: any) {
      addToast(e.message || 'Unable to load scaling policies.', 'error');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSavePolicy = async (serviceId: string) => {
    const edit = editingPolicy[serviceId];
    if (!edit) return;

    try {
      setSavingId(serviceId);
      await api.updateScalingPolicy(serviceId, {
        target_cpu: edit.target_cpu,
        min_replicas: edit.min,
        max_replicas: edit.max,
      });
      addToast(`Updated scaling policy for ${serviceId}.`, 'success');
      await fetchData();
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-5 rounded-2xl bg-surface-100/90 border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100">Autonomous Auto-Scaling Engine</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                  Native HPA Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Horizontal Pod Autoscaling (HPA) policies dynamically provision replica pods based on real-time CPU &amp; traffic load.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsFacultyDemoOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-mono font-bold shadow-glow-cyan transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
          <span>START FACULTY DEMO</span>
        </button>
      </header>

      {/* Honest Architecture Labeling */}
      <div className="flex items-start gap-3 rounded-xl border border-cyan-500/30 bg-cyan-950/15 p-4 text-xs">
        <Layers className="h-5 w-5 shrink-0 text-cyan-400 mt-0.5" />
        <div className="leading-relaxed text-slate-300">
          <span className="font-bold text-cyan-300 block mb-0.5">Native Simulated HPA Execution Mode</span>
          <p>
            CloudPulse runs a built-in Horizontal Pod Autoscaler algorithm. When external Kubernetes cluster adapters are
            disconnected, the platform visualizes horizontal pod scaling natively, demonstrating how incoming traffic surges
            trigger automated replica provisioning and load-balancing.
          </p>
        </div>
      </div>

      {/* Visual Replica Pod Scaling Animation Box */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0c1322] via-surface-100 to-[#0c1322] border border-cyan-500/30 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold tracking-wider">
              Real-Time Replica Scaling Visualization
            </span>
            <h2 className="text-base font-bold text-slate-100 mt-0.5">
              Target Service: <span className="text-cyan-300 font-mono">api-gateway / web-core</span>
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-400">
              State:{' '}
              <span className={isSimActive ? 'text-amber-300 font-bold' : 'text-emerald-400 font-bold'}>
                {isSimActive ? 'LOAD ELEVATED (SCALED OUT)' : 'NOMINAL BASELINE'}
              </span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              {currentReplicaCount} Active Pods
            </span>
          </div>
        </div>

        {/* Pod Cluster Graphic */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((podIdx) => {
            const isProvisioned = podIdx <= currentReplicaCount;
            return (
              <div
                key={podIdx}
                className={`p-4 rounded-xl border transition-all duration-500 ${
                  isProvisioned
                    ? 'bg-surface-200/90 border-cyan-500/50 shadow-md shadow-cyan-950/30'
                    : 'bg-surface-300/30 border-dashed border-border/60 opacity-40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Server
                      className={`w-4 h-4 ${
                        isProvisioned ? 'text-cyan-400' : 'text-slate-500'
                      }`}
                    />
                    <span className="text-xs font-bold font-mono text-slate-200">
                      pod-0{podIdx}
                    </span>
                  </div>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isProvisioned ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                    }`}
                  />
                </div>

                <div className="space-y-1.5 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={isProvisioned ? 'text-emerald-300' : 'text-slate-500'}>
                      {isProvisioned ? 'Running' : 'Standby'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>CPU:</span>
                    <span className="text-slate-200">
                      {isProvisioned ? `${overview?.cpu_utilization_percent ? (overview.cpu_utilization_percent / currentReplicaCount).toFixed(1) : 18.5}%` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Port:</span>
                    <span className="text-slate-300">800{podIdx}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-border/60">
          <span>Scaling Metric: CPU Target &gt; 70% or RPS Surge</span>
          <span>Scaling Cooldown: 15s Scale-Up / 30s Scale-Down</span>
          <span>Max Bounds: 2 Min / 10 Max</span>
        </div>
      </div>

      {/* Scaling Policies Configuration Table */}
      <div className="p-6 rounded-2xl bg-surface-100/90 border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Configured Auto-Scaling Policies</h3>
            <p className="text-xs text-slate-400">
              Update CPU thresholds and replica limits per catalog service.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Process-Local Policy Engine</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border/60 text-slate-400 uppercase text-[10px]">
                <th className="py-2.5 px-3">Service</th>
                <th className="py-2.5 px-3">Current Pods</th>
                <th className="py-2.5 px-3">Target CPU (%)</th>
                <th className="py-2.5 px-3">Min Replicas</th>
                <th className="py-2.5 px-3">Max Replicas</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {policies.map((pol) => {
                const edit = editingPolicy[pol.service_id] || {
                  target_cpu: pol.target_cpu,
                  min: pol.min_replicas,
                  max: pol.max_replicas,
                };
                return (
                  <tr key={pol.service_id} className="hover:bg-surface-200/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-200">{pol.service_name}</td>
                    <td className="py-3 px-3 text-cyan-300 font-bold">{pol.current_replicas ?? 2} pods</td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="10"
                        max="95"
                        value={edit.target_cpu}
                        onChange={(e) =>
                          setEditingPolicy((prev) => ({
                            ...prev,
                            [pol.service_id]: { ...edit, target_cpu: Number(e.target.value) },
                          }))
                        }
                        className="w-16 rounded border border-border bg-surface-200 px-2 py-1 text-slate-100 text-xs"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={edit.min}
                        onChange={(e) =>
                          setEditingPolicy((prev) => ({
                            ...prev,
                            [pol.service_id]: { ...edit, min: Number(e.target.value) },
                          }))
                        }
                        className="w-14 rounded border border-border bg-surface-200 px-2 py-1 text-slate-100 text-xs"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="2"
                        max="50"
                        value={edit.max}
                        onChange={(e) =>
                          setEditingPolicy((prev) => ({
                            ...prev,
                            [pol.service_id]: { ...edit, max: Number(e.target.value) },
                          }))
                        }
                        className="w-14 rounded border border-border bg-surface-200 px-2 py-1 text-slate-100 text-xs"
                      />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleSavePolicy(pol.service_id)}
                        disabled={savingId === pol.service_id}
                        className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
                      >
                        {savingId === pol.service_id ? 'Saving...' : 'Save Policy'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
