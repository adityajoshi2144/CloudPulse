import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SLOItem } from '../services/types';
import { ShieldCheck, AlertTriangle, CheckCircle2, Flame, Clock, Database, Activity } from 'lucide-react';

export const SLOPage: React.FC = () => {
  const [slos, setSlos] = useState<SLOItem[]>([]);

  useEffect(() => {
    const fetchSLOs = async () => {
      try {
        const res = await api.getSLOs();
        setSlos(res.slos);
      } catch (e) {
        console.error(e);
      }
    };
    fetchSLOs();
    const interval = setInterval(fetchSLOs, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-4 rounded-xl bg-surface-100/90 border border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Service Level Objectives (SLOs) & Error Budget Governance
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracks 30-day rolling reliability targets, multi-window error burn rates and SLA compliance.
            </p>
          </div>
        </div>
      </div>

      {/* SLO Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {slos.map((slo) => {
          const isHealthy = slo.status === 'healthy';
          return (
            <div key={slo.id} className="p-5 rounded-xl bg-surface-100/80 border border-border flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-200 text-slate-300 border border-border">
                    {slo.period}
                  </span>
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                    isHealthy
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {slo.status}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-100">{slo.name}</h3>

                <div className="mt-4 space-y-2 text-xs font-mono">
                  {slo.target_percent && (
                    <div className="flex justify-between text-slate-400">
                      <span>Target Availability:</span>
                      <strong className="text-slate-200">{slo.target_percent}%</strong>
                    </div>
                  )}
                  {slo.current_percent && (
                    <div className="flex justify-between text-slate-400">
                      <span>Current Availability:</span>
                      <strong className="text-emerald-400">{slo.current_percent}%</strong>
                    </div>
                  )}
                  {slo.target_ms && (
                    <div className="flex justify-between text-slate-400">
                      <span>Target Latency:</span>
                      <strong className="text-slate-200">&lt; {slo.target_ms}ms</strong>
                    </div>
                  )}
                  {slo.current_ms && (
                    <div className="flex justify-between text-slate-400">
                      <span>Measured P95:</span>
                      <strong className="text-cyan-400">{slo.current_ms}ms</strong>
                    </div>
                  )}
                  {slo.error_budget_remaining_percent !== undefined && (
                    <div className="pt-2 border-t border-border/60">
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Error Budget Remaining:</span>
                        <strong className="text-slate-200">{slo.error_budget_remaining_percent}%</strong>
                      </div>
                      <div className="w-full h-1.5 bg-surface-300 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${slo.error_budget_remaining_percent}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {slo.burn_rate !== undefined && (
                    <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-400" /> Burn Rate:
                      </span>
                      <span className="text-amber-400 font-bold">{slo.burn_rate}x</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-mono pt-2 border-t border-border/50">
                Compliance: {slo.compliance_percent || 99.8}% over rolling 30 days
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
