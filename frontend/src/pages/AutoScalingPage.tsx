import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ScalingPolicy, ScalingEvent } from '../services/types';
import {
  TrendingUp,
  Cpu,
  Layers,
  Clock,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Info
} from 'lucide-react';

export const AutoScalingPage: React.FC = () => {
  const { addToast } = useApp();
  const [policies, setPolicies] = useState<ScalingPolicy[]>([]);
  const [events, setEvents] = useState<ScalingEvent[]>([]);
  const [editingPolicy, setEditingPolicy] = useState<Record<string, { target_cpu: number; min: number; max: number }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [pols, evts] = await Promise.all([
        api.getScalingPolicies(),
        api.getScalingEvents()
      ]);
      setPolicies(pols);
      setEvents(evts);
      
      const editMap: Record<string, any> = {};
      pols.forEach((p) => {
        editMap[p.service_id] = {
          target_cpu: p.target_cpu,
          min: p.min_replicas,
          max: p.max_replicas,
        };
      });
      setEditingPolicy(editMap);
    } catch (e: any) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
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
      addToast(`Updated HPA policy for ${serviceId}`, 'success');
      fetchData();
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-4 rounded-xl bg-surface-100/90 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Intelligent Horizontal Pod Auto-Scaler (HPA)
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                Formula: ceil[currentReplicas * (currentCPU / targetCPU)]
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configurable autoscaling bounds, cooldown stabilization windows, and audit log of scaling decisions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-200 border border-border">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Scale-up Cooldown: 15s • Scale-down: 30s
          </span>
        </div>
      </div>

      {/* Scaling Policies Config Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {policies.map((pol) => {
          const edit = editingPolicy[pol.service_id] || {
            target_cpu: pol.target_cpu,
            min: pol.min_replicas,
            max: pol.max_replicas,
          };

          return (
            <div key={pol.service_id} className="p-4 rounded-xl bg-surface-100/80 border border-border flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-slate-100">{pol.service_name}</h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-200 text-cyan-400 border border-border">
                    {pol.current_replicas} Pods Active
                  </span>
                </div>

                <div className="text-[11px] font-mono text-slate-400 mb-3 flex items-center justify-between">
                  <span>Current CPU: <strong className="text-slate-200">{pol.current_cpu}%</strong></span>
                  <span>Target: <strong className="text-cyan-400">{pol.target_cpu}%</strong></span>
                </div>

                {/* Policy Inputs */}
                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">
                      Target CPU Utilization (%)
                    </label>
                    <input
                      type="number"
                      min={20}
                      max={95}
                      value={edit.target_cpu}
                      onChange={(e) =>
                        setEditingPolicy({
                          ...editingPolicy,
                          [pol.service_id]: { ...edit, target_cpu: parseInt(e.target.value) || 70 },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded bg-surface-200 border border-border text-slate-100 font-mono text-xs focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">
                        Min Pods
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={edit.min}
                        onChange={(e) =>
                          setEditingPolicy({
                            ...editingPolicy,
                            [pol.service_id]: { ...edit, min: parseInt(e.target.value) || 1 },
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-surface-200 border border-border text-slate-100 font-mono text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">
                        Max Pods
                      </label>
                      <input
                        type="number"
                        min={2}
                        max={30}
                        value={edit.max}
                        onChange={(e) =>
                          setEditingPolicy({
                            ...editingPolicy,
                            [pol.service_id]: { ...edit, max: parseInt(e.target.value) || 10 },
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-surface-200 border border-border text-slate-100 font-mono text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSavePolicy(pol.service_id)}
                disabled={savingId === pol.service_id}
                className="w-full py-1.5 rounded-lg bg-surface-200 hover:bg-cyan-600/30 text-slate-200 hover:text-cyan-200 border border-border hover:border-cyan-500/40 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {savingId === pol.service_id ? 'Saving...' : 'Apply Policy'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Scaling Events Log Table */}
      <div className="p-5 rounded-xl bg-surface-100/80 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Auto-Scaling Decision Ledger
            </h3>
            <p className="text-[11px] text-slate-400">
              Complete chronological audit trail explaining why pods scaled up or down
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {events.length} Historical Decisions Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border text-slate-400 text-[11px]">
                <th className="pb-2.5 font-medium">Timestamp</th>
                <th className="pb-2.5 font-medium">Service</th>
                <th className="pb-2.5 font-medium">Replica Transition</th>
                <th className="pb-2.5 font-medium">Trigger Metric</th>
                <th className="pb-2.5 font-medium">Reason & Justification</th>
                <th className="pb-2.5 font-medium">Engine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {events.map((evt) => (
                <tr key={evt.id} className="hover:bg-surface-200/50 transition-colors">
                  <td className="py-3 text-slate-400 text-[11px] whitespace-nowrap">{evt.timestamp}</td>
                  <td className="py-3 text-slate-200 font-semibold">{evt.service_id}</td>
                  <td className="py-3 whitespace-nowrap">
                    <span className="text-slate-400">{evt.from_replicas} pods</span>
                    <span className="mx-1.5 text-cyan-400">→</span>
                    <span className="text-emerald-400 font-bold">{evt.to_replicas} pods</span>
                  </td>
                  <td className="py-3 text-slate-300">
                    {evt.trigger_metric} ({evt.metric_value})
                  </td>
                  <td className="py-3 text-slate-400 font-sans text-xs max-w-md">
                    {evt.reason}
                  </td>
                  <td className="py-3 whitespace-nowrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded ${
                      evt.is_real_k8s
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-surface-200 text-slate-400 border border-border'
                    }`}>
                      {evt.is_real_k8s ? 'Kubernetes HPA (v2)' : 'CloudPulse Native Engine'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
