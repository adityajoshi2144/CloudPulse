import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Incident } from '../services/types';
import {
  AlertTriangle,
  FileSearch,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  Activity,
  Layers,
  Sparkles,
  RotateCcw,
  RefreshCw,
  Search,
  ExternalLink,
  Info
} from 'lucide-react';

interface IncidentTimelineStep {
  step: number;
  label: string;
  timestamp: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
}

const DEMO_INCIDENT: Incident = {
  id: 'INC-2026-088',
  title: 'Inbound HTTP Burst Surge Causing Edge Response Degradation',
  severity: 'P1',
  status: 'mitigating',
  affected_services: ['demo.cloudpulse.local', 'api-gateway', 'cloudpulse-test-service'],
  started_at: '2026-11-15 23:25:10',
  resolved_at: null,
  duration_minutes: 12,
  probable_cause: 'Synchronized burst traffic exceeding 15 req/s threshold without client backoff',
  impact_summary: 'P95 latency elevated to 142ms; edge buffer queue increased by 38%',
  recommended_action: 'Engage rate-limiting filter on ingress gateway and scale replica pool from 2 to 4 pods',
};

const TIMELINE_STEPS: IncidentTimelineStep[] = [
  {
    step: 1,
    label: '1. Service Degradation Detected',
    timestamp: '23:25:10 UTC',
    description: 'P95 response latency climbed above normal baseline (from 16ms to 78ms).',
    status: 'completed',
  },
  {
    step: 2,
    label: '2. Critical Threshold Exceeded',
    timestamp: '23:25:14 UTC',
    description: 'HTTP request rate crossed warning limit (> 15 req/s); CPU exceeded 70%.',
    status: 'completed',
  },
  {
    step: 3,
    label: '3. Security Alert Dispatched',
    timestamp: '23:25:18 UTC',
    description: 'Alert ALT-CRIT-099 posted to SOC notification queue and telemetry stream.',
    status: 'completed',
  },
  {
    step: 4,
    label: '4. Incident Created & Triaged',
    timestamp: '23:25:22 UTC',
    description: 'Incident INC-2026-088 registered with severity P1-Critical priority.',
    status: 'completed',
  },
  {
    step: 5,
    label: '5. Root Cause Analysis (RCA) Computed',
    timestamp: '23:25:28 UTC',
    description: 'Engine isolated traffic anomaly to test-route flood without cache coverage.',
    status: 'completed',
  },
  {
    step: 6,
    label: '6. Automated Mitigation & Scaling',
    timestamp: '23:25:35 UTC',
    description: 'Rate-limiting policy enforced (20 req/s cap); native HPA scaled 2 -> 4 pods.',
    status: 'in_progress',
  },
  {
    step: 7,
    label: '7. Service Stabilization & Health Restored',
    timestamp: 'Pending',
    description: 'Latency percentiles returning to < 20ms envelope; error rates settling to 0.00%.',
    status: 'pending',
  },
];

export const IncidentsPage: React.FC = () => {
  const { addToast, setIsFacultyDemoOpen } = useApp();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident>(DEMO_INCIDENT);
  const [showSimulatedIncident, setShowSimulatedIncident] = useState(true);

  useEffect(() => {
    api.getIncidents()
      .then((data) => {
        if (data && data.length > 0) {
          setIncidents(data);
          setSelectedIncident(data[0]);
        }
      })
      .catch((error: Error) => addToast(error.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const allIncidents = showSimulatedIncident
    ? [DEMO_INCIDENT, ...incidents.filter((i) => i.id !== DEMO_INCIDENT.id)]
    : incidents;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-5 rounded-2xl bg-surface-100/90 border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100">Incident Management &amp; RCA</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/50">
                  Closed-Loop Resolution
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated incident correlation, 7-step lifecycle timeline, root cause analysis, and self-healing verification.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFacultyDemoOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-mono font-bold shadow-glow-cyan transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span>START FACULTY DEMO</span>
          </button>
        </div>
      </header>

      {/* Honest Architectural Transparency Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-indigo-500/30 bg-indigo-950/15 p-4 text-xs">
        <Info className="h-5 w-5 shrink-0 text-indigo-400 mt-0.5" />
        <div className="leading-relaxed text-slate-300">
          <span className="font-bold text-indigo-300 block mb-0.5">Incident Integration Scope</span>
          <p>
            Real-world incident management systems (e.g. PagerDuty, Jira Service Desk) connect via webhook integration.
            For presentation and evaluation purposes, CloudPulse provides this interactive incident simulation scenario to
            demonstrate the complete <span className="font-mono text-cyan-300">MONITOR → DETECT → ALERT → ANALYZE → MITIGATE → RECOVER</span> lifecycle.
          </p>
        </div>
      </div>

      {/* Main Grid: Incident List (Left) + Detailed RCA & Timeline (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Incidents List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase font-bold text-slate-300 tracking-wider">
              Active &amp; Past Incidents
            </span>
            <span className="text-[10px] font-mono text-slate-400">{allIncidents.length} recorded</span>
          </div>

          <div className="space-y-2.5">
            {allIncidents.map((inc) => {
              const isSelected = selectedIncident.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-surface-200/90 border-cyan-500/50 shadow-sm'
                      : 'bg-surface-100/80 border-border/70 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        inc.severity === 'P1'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : inc.severity === 'P2'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {inc.severity} - CRITICAL
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{inc.id}</span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-100 line-clamp-2">{inc.title}</h3>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="capitalize text-amber-300">{inc.status}</span>
                    <span>{inc.started_at}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Incident Details & 7-Step Lifecycle Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Detail Card */}
          <div className="p-6 rounded-2xl bg-surface-100/90 border border-border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                    {selectedIncident.severity} INCIDENT
                  </span>
                  <span className="text-xs font-mono text-cyan-400 font-semibold">{selectedIncident.id}</span>
                </div>
                <h2 className="text-base font-bold text-slate-100 mt-1">{selectedIncident.title}</h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 w-fit">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                Status: {selectedIncident.status.toUpperCase()}
              </span>
            </div>

            {/* Tri-Metric Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-surface-200/50 border border-border">
                <span className="text-[10px] text-slate-400 uppercase">Started At</span>
                <p className="mt-1 font-semibold text-slate-200">{selectedIncident.started_at}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-200/50 border border-border">
                <span className="text-[10px] text-slate-400 uppercase">Affected Target</span>
                <p className="mt-1 font-semibold text-cyan-300 truncate">
                  {selectedIncident.affected_services.join(', ')}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-surface-200/50 border border-border">
                <span className="text-[10px] text-slate-400 uppercase">Recovery State</span>
                <p className="mt-1 font-semibold text-emerald-300">Auto-Mitigation Active</p>
              </div>
            </div>

            {/* RCA & Impact Details */}
            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-surface-200/60 border border-border">
                <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold block mb-1">
                  Probable Root Cause
                </span>
                <p className="text-slate-200 font-mono text-[11px] leading-relaxed">
                  {selectedIncident.probable_cause}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-200/60 border border-border">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block mb-1">
                  Customer &amp; Performance Impact
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {selectedIncident.impact_summary}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-200/60 border border-border">
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block mb-1">
                  Recommended Automated Action
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {selectedIncident.recommended_action}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed 7-Step Incident Lifecycle Timeline */}
          <div className="p-6 rounded-2xl bg-surface-100/90 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-100">
                  Incident Resolution Lifecycle Timeline
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">7-Phase Progression</span>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
              {TIMELINE_STEPS.map((step) => {
                const isDone = step.status === 'completed';
                const isInProgress = step.status === 'in_progress';
                return (
                  <div key={step.step} className="relative flex items-start gap-4 text-xs">
                    {/* Step Icon Indicator */}
                    <div
                      className={`absolute -left-6 mt-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-mono font-bold ${
                        isDone
                          ? 'bg-emerald-400 text-slate-950'
                          : isInProgress
                          ? 'bg-cyan-400 text-slate-950 animate-pulse'
                          : 'bg-surface-300 text-slate-500 border border-border'
                      }`}
                    >
                      {isDone ? '✓' : step.step}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 font-mono">{step.label}</span>
                        <span className="text-[10px] font-mono text-slate-400">{step.timestamp}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed font-sans">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
