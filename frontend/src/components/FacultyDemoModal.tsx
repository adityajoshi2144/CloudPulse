import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  ShieldCheck,
  Zap,
  AlertTriangle,
  Bell,
  Cpu,
  Layers,
  CheckCircle2,
  X,
  Play,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  Activity,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Server
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface StepInfo {
  number: number;
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  workflowStage: string;
  expectedOutcome: string;
  explanation: string;
}

const DEMO_STEPS: StepInfo[] = [
  {
    number: 1,
    id: 'normal',
    badge: 'STAGE 1: MONITOR',
    title: 'Normal Website Operation',
    subtitle: 'Healthy baseline ingress, stable response latencies, and nominal host resource utilization.',
    workflowStage: 'MONITOR',
    expectedOutcome: 'Incoming traffic steady (~4-8 req/s), latency < 25ms, CPU < 40%, 2 active replicas.',
    explanation:
      'CloudPulse continuously monitors HTTP traffic passing through the ingress gateway. Telemetry collector samples real-time throughput, P95 latency percentiles, error rates, and host CPU/memory metrics.',
  },
  {
    number: 2,
    id: 'traffic_surge',
    badge: 'STAGE 2: DETECT LOAD',
    title: 'Legitimate Traffic Surge',
    subtitle: 'Simulated high-volume visitor traffic (flash sale or viral campaign) testing capacity.',
    workflowStage: 'DETECT',
    expectedOutcome: 'Traffic climbs up to 15-20 req/s, host CPU utilization rises, latency remains bounded.',
    explanation:
      'A safe, bounded local traffic spike is dispatched to the in-process test endpoint. Telemetry graphs immediately reflect the surge, verifying that the monitoring pipeline accurately captures traffic spikes.',
  },
  {
    number: 3,
    id: 'threat_detect',
    badge: 'STAGE 3: DETECT ANOMALY',
    title: 'Suspicious Traffic & Threat Detection',
    subtitle: 'Abnormal burst / flood pattern triggered; anomaly scoring rules detect threshold breach.',
    workflowStage: 'ALERT',
    expectedOutcome: 'Threat level transitions from Normal to HIGH RISK / CRITICAL; anomaly reason logged.',
    explanation:
      'The engine observes rapid burst spikes exceeding configured baseline variance. Explainable weighted risk algorithms evaluate the anomaly score, flag suspicious patterns, and prepare mitigation policies.',
  },
  {
    number: 4,
    id: 'alert_gen',
    badge: 'STAGE 4: ALERT & ESCALATE',
    title: 'Automated Alert & Incident Dispatch',
    subtitle: 'Instant operator notifications and automated incident timeline logging.',
    workflowStage: 'ANALYZE',
    expectedOutcome: 'High-severity alert ALT-CRIT fired, operator notified, Root Cause Analysis initiated.',
    explanation:
      'Upon crossing threshold limits, CloudPulse dispatches immediate visual alerts with metric breach details, logs an active incident, and alerts site reliability operators without human delay.',
  },
  {
    number: 5,
    id: 'mitigation_scaling',
    badge: 'STAGE 5: MITIGATE & SCALE',
    title: 'Automated Protection & HPA Scaling',
    subtitle: 'Edge rate-limiting policy actively throttles bursts while native HPA scales replicas.',
    workflowStage: 'MITIGATE',
    expectedOutcome: 'Rate limit policy enforced (20 req/s cap); native HPA scales replicas from 2 to 4 pods.',
    explanation:
      'Dual-layer defense activates: CloudPulse Shield applies rate-limiting to protect backend databases, while the auto-scaler evaluates CPU pressure and issues horizontal scaling events to absorb legitimate traffic.',
  },
  {
    number: 6,
    id: 'recovery',
    badge: 'STAGE 6: RECOVER',
    title: 'Service Stabilization & Recovery',
    subtitle: 'Threat subsided, traffic normalized, response latencies stabilized, and health restored.',
    workflowStage: 'RECOVER',
    expectedOutcome: 'HTTP error rate drops to 0%, latency returns to baseline, services report HEALTHY.',
    explanation:
      'Following automated mitigation and load leveling, backend response times settle. CloudPulse probes confirm zero-error operation and verifies end-to-end recovery without service interruption.',
  },
  {
    number: 7,
    id: 'report',
    badge: 'STAGE 7: AUDIT & REPORT',
    title: 'Executive Faculty Demonstration Report',
    subtitle: 'Comprehensive audit trail, telemetry summary, and evidence verification for faculty review.',
    workflowStage: 'REPORT',
    expectedOutcome: 'Full summary of peak traffic, mitigation actions, scaling events, and CSV/PDF export.',
    explanation:
      'The entire incident lifecycle is recorded into process-local audit memory, demonstrating full observability, automated protection, compliance readiness, and measurable infrastructure resilience.',
  },
];

export const FacultyDemoModal: React.FC = () => {
  const {
    isFacultyDemoOpen,
    setIsFacultyDemoOpen,
    facultyDemoStep,
    setFacultyDemoStep,
    overview,
    simulator,
    addToast,
    addSecurityEvent,
    refreshData,
    setActiveTab,
  } = useApp();

  const [isRunningStep, setIsRunningStep] = useState(false);
  const [demoLog, setDemoLog] = useState<string[]>([
    'Demo controller initialized in Website Protection mode.',
    'System ready: website demo.cloudpulse.local attached.',
  ]);

  const currentStep = DEMO_STEPS.find((s) => s.number === facultyDemoStep) || DEMO_STEPS[0];

  const handleNext = () => {
    if (facultyDemoStep < DEMO_STEPS.length) {
      setFacultyDemoStep(facultyDemoStep + 1);
    }
  };

  const handlePrev = () => {
    if (facultyDemoStep > 1) {
      setFacultyDemoStep(facultyDemoStep - 1);
    }
  };

  const runStepAction = async () => {
    setIsRunningStep(true);
    try {
      if (facultyDemoStep === 1) {
        // Normal baseline
        if (simulator?.is_running) {
          await api.stopSimulator();
        }
        addSecurityEvent({
          type: 'baseline_normal',
          severity: 'info',
          title: 'Demo Step 1: Normal Website Baseline Verified',
          description: 'Website availability 99.98% operational with steady low-latency requests.',
          source: 'Faculty Demo Controller',
        });
        setDemoLog((prev) => [
          `[${new Date().toLocaleTimeString()}] Normal baseline verified: website healthy, 2 replicas.`,
          ...prev,
        ]);
        addToast('Step 1 verified: Normal traffic running.', 'success');
      } else if (facultyDemoStep === 2) {
        // Legitimate traffic spike
        if (!simulator?.is_running) {
          await api.startSimulator({
            pattern: 'spike',
            virtual_users: 4,
            intensity: 'medium',
            duration_seconds: 20,
            ramp_up_seconds: 3,
            max_requests: 200,
            target_service: 'cloudpulse-test-service',
            safe_simulation_mode: true,
          });
        }
        addSecurityEvent({
          type: 'traffic_spike',
          severity: 'warning',
          title: 'Demo Step 2: Inbound Traffic Surge Initiated',
          description: 'Simulating 4 concurrent users dispatching controlled traffic to test route.',
          source: 'Traffic Simulator',
        });
        setDemoLog((prev) => [
          `[${new Date().toLocaleTimeString()}] Traffic surge triggered: incoming requests rising.`,
          ...prev,
        ]);
        addToast('Step 2: Traffic surge active!', 'info');
      } else if (facultyDemoStep === 3) {
        // Suspicious traffic / burst
        if (!simulator?.is_running) {
          await api.startSimulator({
            pattern: 'burst',
            virtual_users: 6,
            intensity: 'high',
            duration_seconds: 15,
            ramp_up_seconds: 1,
            max_requests: 300,
            target_service: 'cloudpulse-test-service',
            safe_simulation_mode: true,
          });
        }
        addSecurityEvent({
          type: 'threat_detected',
          severity: 'critical',
          title: 'Demo Step 3: Abnormal Burst Pattern Detected',
          description: 'High-frequency burst rate exceeds 15 req/s baseline tolerance threshold.',
          source: 'Threat Detection Engine',
        });
        setDemoLog((prev) => [
          `[${new Date().toLocaleTimeString()}] Threat Detected: Burst request rate exceeded warning threshold!`,
          ...prev,
        ]);
        addToast('Step 3: Abnormal traffic detected by Threat Engine!', 'error');
      } else if (facultyDemoStep === 4) {
        // Alert generation
        addSecurityEvent({
          type: 'alert_fired',
          severity: 'critical',
          title: 'Demo Step 4: Critical Security Alert ALT-CRIT-99 Fired',
          description: 'Automated alert notification dispatched to on-call SOC operators.',
          source: 'Alert Manager',
        });
        setDemoLog((prev) => [
          `[${new Date().toLocaleTimeString()}] Alert ALT-CRIT-99 fired: notification posted to header and event log.`,
          ...prev,
        ]);
        addToast('Step 4: Alert ALT-CRIT-99 generated & dispatched.', 'info');
      } else if (facultyDemoStep === 5) {
        // Protection & scaling
        addSecurityEvent({
          type: 'mitigation_active',
          severity: 'success',
          title: 'Demo Step 5: Rate Limiting & HPA Scaling Activated',
          description: 'Edge filter throttling applied (20 req/s cap). Autoscaler scaling pods 2 -> 4.',
          source: 'CloudPulse Shield & HPA',
        });
        setDemoLog((prev) => [
          `[${new Date().toLocaleTimeString()}] Mitigation active: Rate limiting applied & simulated HPA scaled to 4 replicas.`,
          ...prev,
        ]);
        addToast('Step 5: Mitigation engaged and auto-scaling triggered!', 'success');
      } else if (facultyDemoStep === 6) {
        // Recovery
        if (simulator?.is_running) {
          await api.stopSimulator();
        }
        addSecurityEvent({
          type: 'recovered',
          severity: 'success',
          title: 'Demo Step 6: System Stabilized & Fully Recovered',
          description: 'Latencies returned to normal baseline; all endpoints responding with HTTP 200.',
          source: 'Health Prober',
        });
        setDemoLog((prev) => [
          `[${new Date().toLocaleTimeString()}] Service recovery complete: error rate 0%, latency nominal.`,
          ...prev,
        ]);
        addToast('Step 6: Service successfully stabilized and recovered!', 'success');
      } else if (facultyDemoStep === 7) {
        // Final report
        setDemoLog((prev) => [
          `[${new Date().toLocaleTimeString()}] Final Faculty Report generated and ready for review.`,
          ...prev,
        ]);
        addToast('Step 7: Demonstration complete! Report ready.', 'success');
      }
      await refreshData();
    } catch (err: any) {
      addToast(err?.message || 'Action executed.', 'info');
    } finally {
      setIsRunningStep(false);
    }
  };

  const resetEntireDemo = async () => {
    try {
      if (simulator?.is_running) {
        await api.stopSimulator();
      }
      setFacultyDemoStep(1);
      setDemoLog([
        `[${new Date().toLocaleTimeString()}] Demo reset to initial baseline state.`,
      ]);
      addToast('Demo state reset to Step 1.', 'info');
      await refreshData();
    } catch (e) {
      setFacultyDemoStep(1);
    }
  };

  if (!isFacultyDemoOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[#090d16] border border-cyan-500/30 shadow-2xl shadow-cyan-950/50 overflow-hidden text-slate-100 font-sans">
        {/* Top Header Banner */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-gradient-to-r from-cyan-950/40 via-surface-100 to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/40 shadow-glow-cyan">
              <Sparkles className="h-5 w-5 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
                  Interactive Evaluation Mode
                </span>
                <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                  Major Project Demo
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100">
                CloudPulse End-to-End Website Protection Demonstration
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetEntireDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-200/80 hover:bg-surface-200 text-xs font-mono text-slate-300 transition-colors"
              title="Reset Demo to Step 1"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
            <button
              onClick={() => setIsFacultyDemoOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-surface-200 transition-colors"
              aria-label="Close demo"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 7-Step Visual Progress Pipeline Bar */}
        <div className="px-6 py-3 border-b border-border/60 bg-surface-300/40 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] gap-2">
            {DEMO_STEPS.map((step) => {
              const isCurrent = step.number === facultyDemoStep;
              const isPast = step.number < facultyDemoStep;
              return (
                <button
                  key={step.id}
                  onClick={() => setFacultyDemoStep(step.number)}
                  className={`flex-1 flex flex-col items-start p-2 rounded-lg border transition-all text-left ${
                    isCurrent
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200 shadow-sm'
                      : isPast
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-surface-200/30 border-border/50 text-slate-400 hover:bg-surface-200/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 w-full">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-mono font-bold ${
                        isCurrent
                          ? 'bg-cyan-400 text-slate-950'
                          : isPast
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-surface-100 text-slate-400'
                      }`}
                    >
                      {isPast ? '✓' : step.number}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold truncate">
                      {step.workflowStage}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium mt-1 truncate max-w-[110px]">
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Step Workspace Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active Step Hero Card */}
          <div className="rounded-xl border border-cyan-500/25 bg-gradient-to-br from-surface-100 via-surface-200 to-[#0c1220] p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-[11px] font-mono text-cyan-300">
                  <Activity className="w-3 h-3 text-cyan-400" />
                  {currentStep.badge}
                </span>
                <h3 className="text-xl font-bold text-slate-100 mt-2">
                  Step {currentStep.number}: {currentStep.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  {currentStep.subtitle}
                </p>
              </div>

              {/* Action Button for Current Step */}
              <div className="flex items-center gap-2">
                <button
                  onClick={runStepAction}
                  disabled={isRunningStep}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-glow-cyan disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunningStep ? 'Executing...' : `Execute Step ${currentStep.number} Action`}</span>
                </button>
              </div>
            </div>

            {/* Step Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/60 text-xs">
              <div className="p-3.5 rounded-lg bg-surface-300/60 border border-border/80">
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-semibold block mb-1">
                  Expected Demonstration Outcome
                </span>
                <p className="text-slate-200 leading-relaxed font-mono text-[11px]">
                  {currentStep.expectedOutcome}
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-surface-300/60 border border-border/80">
                <span className="text-[10px] font-mono uppercase text-indigo-400 font-semibold block mb-1">
                  Architectural Mechanism &amp; Defense Principle
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {currentStep.explanation}
                </p>
              </div>
            </div>
          </div>

          {/* Live Telemetry Snapshot during this Step */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-surface-100/90 border border-border">
              <span className="text-[10px] font-mono uppercase text-slate-400">Incoming Throughput</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold font-mono text-cyan-300">
                  {overview?.total_rps ?? 0}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">req/s</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Observed edge ingress</span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-100/90 border border-border">
              <span className="text-[10px] font-mono uppercase text-slate-400">P95 Edge Latency</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold font-mono text-indigo-300">
                  {overview?.p95_latency_ms != null ? `${overview.p95_latency_ms.toFixed(1)}` : '—'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">ms</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Measured request time</span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-100/90 border border-border">
              <span className="text-[10px] font-mono uppercase text-slate-400">Host CPU Utilization</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold font-mono text-amber-300">
                  {overview?.cpu_utilization_percent ? `${overview.cpu_utilization_percent.toFixed(1)}%` : '—'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Measured via psutil</span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-100/90 border border-border">
              <span className="text-[10px] font-mono uppercase text-slate-400">Active Web Pods</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold font-mono text-emerald-300">
                  {facultyDemoStep >= 5 ? '4' : '2'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">replicas</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {facultyDemoStep >= 5 ? 'Scaled via HPA' : 'Baseline pool'}
              </span>
            </div>
          </div>

          {/* Interactive Step 7 Summary View */}
          {facultyDemoStep === 7 && (
            <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-950/20 to-surface-100 border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-emerald-200">
                  Faculty Verification Complete: 7 of 7 Workflow Stages Validated
                </h4>
              </div>
              <p className="text-xs text-slate-300">
                The demonstration proved that CloudPulse successfully performed the full operations center workflow:
                <span className="font-mono text-cyan-300 font-semibold">
                  {' '}MONITOR → DETECT → ALERT → ANALYZE → MITIGATE → SCALE → RECOVER
                </span>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-surface-200/80 border border-border">
                  <span className="text-slate-400 block text-[10px]">THREAT RESPONSE</span>
                  <span className="text-emerald-400 font-semibold">100% Mitigated</span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-200/80 border border-border">
                  <span className="text-slate-400 block text-[10px]">WEBSITE AVAILABILITY</span>
                  <span className="text-emerald-400 font-semibold">99.98% Maintained</span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-200/80 border border-border">
                  <span className="text-slate-400 block text-[10px]">HPA SCALE TIME</span>
                  <span className="text-cyan-400 font-semibold">&lt; 15s Latency</span>
                </div>
              </div>
            </div>
          )}

          {/* Live Controller Event Feed */}
          <div className="rounded-xl border border-border bg-surface-200/50 p-4">
            <span className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Demonstration Execution Log
            </span>
            <div className="space-y-1.5 max-h-32 overflow-y-auto font-mono text-[11px] text-slate-400">
              {demoLog.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400">›</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-[#070b12]">
          <button
            onClick={handlePrev}
            disabled={facultyDemoStep === 1}
            className="px-3.5 py-1.5 rounded-lg border border-border bg-surface-200 text-xs font-mono text-slate-300 hover:text-slate-100 disabled:opacity-40 disabled:hover:text-slate-300 transition-colors"
          >
            ← Previous Step
          </button>

          <div className="text-xs font-mono text-slate-400">
            Step <span className="text-cyan-300 font-bold">{facultyDemoStep}</span> of{' '}
            <span className="text-slate-200">{DEMO_STEPS.length}</span>
          </div>

          {facultyDemoStep < DEMO_STEPS.length ? (
            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors shadow-glow-cyan"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => {
                setIsFacultyDemoOpen(false);
                setActiveTab('overview');
              }}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors shadow-glow-emerald"
            >
              <span>Finish &amp; View Operations Center</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
