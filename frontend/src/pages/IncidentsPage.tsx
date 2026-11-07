import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Incident } from '../services/types';
import {
  AlertTriangle,
  Flame,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  X,
  FileSearch,
  Activity,
  Layers
} from 'lucide-react';

export const IncidentsPage: React.FC = () => {
  const { addToast, refreshData } = useApp();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isInjecting, setIsInjecting] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  const fetchIncidents = async () => {
    try {
      const data = await api.getIncidents();
      setIncidents(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleInjectFailure = async () => {
    try {
      setIsInjecting(true);
      const res = await api.triggerPodFailure('order-service');
      addToast('Pod CrashLoopBackOff injected into order-service', 'error');
      fetchIncidents();
      refreshData();
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setIsInjecting(false);
    }
  };

  const handleRecover = async (incidentId?: string) => {
    try {
      setIsRecovering(true);
      await api.recoverIncident(incidentId);
      addToast('Self-healing initiated. Pod restored to Running.', 'success');
      fetchIncidents();
      refreshData();
      if (selectedIncident) {
        setSelectedIncident(null);
      }
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Chaos Injection Lab Bar */}
      <div className="p-4 rounded-xl bg-surface-100/90 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Incident Management & Automated Root Cause Analysis (RCA)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Correlates error spikes, readiness probes, container logs and scaling events into actionable diagnoses.
            </p>
          </div>
        </div>

        {/* Chaos Engineering Test Scenario Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleInjectFailure}
            disabled={isInjecting}
            className="px-3.5 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-medium flex items-center gap-2 transition-all shadow-glow-rose"
          >
            <Flame className="w-4 h-4 text-rose-400" />
            {isInjecting ? 'Simulating...' : 'Simulate Pod Crash (Chaos)'}
          </button>
          <button
            onClick={() => handleRecover()}
            disabled={isRecovering}
            className="px-3.5 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-medium flex items-center gap-2 transition-all shadow-glow-emerald"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            {isRecovering ? 'Healing...' : 'Trigger Self-Healing'}
          </button>
        </div>
      </div>

      {/* Incidents Timeline Stream */}
      <div className="space-y-3.5">
        {incidents.map((inc) => {
          const isActive = inc.status === 'active';
          return (
            <div
              key={inc.id}
              className={`p-5 rounded-xl border transition-all ${
                isActive
                  ? 'bg-rose-950/20 border-rose-500/50 shadow-glow-rose'
                  : 'bg-surface-100/70 border-border'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Incident Identity */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      inc.severity === 'P1'
                        ? 'bg-rose-500 text-white'
                        : inc.severity === 'P2'
                        ? 'bg-amber-500 text-slate-900'
                        : 'bg-indigo-500 text-white'
                    }`}>
                      {inc.severity}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-100">{inc.title}</h3>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {inc.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{inc.probable_cause}</p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400 pt-1">
                    <span>ID: {inc.id}</span>
                    <span>•</span>
                    <span>Started: {inc.started_at}</span>
                    {inc.resolved_at && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400">Resolved: {inc.resolved_at}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>Affected: {inc.affected_services.join(', ')}</span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2.5">
                  {isActive && (
                    <button
                      onClick={() => handleRecover(inc.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-glow-emerald"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reconcile & Resolve
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedIncident(inc)}
                    className="px-3 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-300 border border-border text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <FileSearch className="w-3.5 h-3.5 text-cyan-400" />
                    Inspect RCA Report
                  </button>
                </div>
              </div>

              {/* Recommended Playbook Snippet */}
              {inc.recommended_action && (
                <div className="mt-3.5 p-3 rounded-lg bg-surface-200/50 border border-border/60 text-xs flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">Recommended Operator Playbook:</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">{inc.recommended_action}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Root Cause Analysis (RCA) Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-surface-100 rounded-xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface-200/60">
              <div className="flex items-center gap-2.5">
                <FileSearch className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    Automated Root Cause Analysis (RCA)
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    Incident {selectedIncident.id} • {selectedIncident.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-surface-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-sans">
              {/* Primary Cause Card */}
              <div className="p-4 rounded-xl bg-surface-200/60 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 uppercase font-mono text-[10px]">
                    Diagnosed Probable Cause
                  </span>
                  <span className="text-emerald-400 font-mono font-bold text-[11px]">
                    Confidence: {selectedIncident.rca?.confidence_score || 94.8}%
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-100">
                  {selectedIncident.rca?.primary_cause || selectedIncident.probable_cause}
                </h4>
                <p className="text-slate-400 text-xs mt-1">
                  {selectedIncident.impact_summary}
                </p>
              </div>

              {/* Supporting Evidence Logs */}
              <div>
                <h4 className="text-slate-200 font-semibold uppercase font-mono text-[11px] mb-2">
                  Correlated Telemetry & Evidence
                </h4>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {(selectedIncident.rca?.evidence || [
                    "Pod readiness probe failed 3 consecutive checks",
                    "HTTP 502 Bad Gateway observed on edge ingress gateway",
                    "Memory exhaustion triggered container OOMKilled signal"
                  ]).map((ev, i) => (
                    <div key={i} className="p-2.5 rounded bg-surface-200/40 border border-border text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>{ev}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Timeline */}
              {selectedIncident.rca?.timeline_events && (
                <div>
                  <h4 className="text-slate-200 font-semibold uppercase font-mono text-[11px] mb-2">
                    Sequence of Events Timeline
                  </h4>
                  <div className="space-y-2 border-l border-border ml-2 pl-3">
                    {selectedIncident.rca.timeline_events.map((t, idx) => (
                      <div key={idx} className="relative">
                        <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="text-[10px] font-mono text-slate-500">{t.time}</span>
                        <p className="text-slate-200 text-xs font-mono">{t.event}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border bg-surface-200/50 flex justify-end">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 rounded-lg bg-surface-300 hover:bg-surface-400 text-slate-200 text-xs font-medium"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
