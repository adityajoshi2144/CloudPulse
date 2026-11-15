import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';
import { api } from '../services/api';

type HealthCheck = {
  status: string;
  details?: string;
  engine?: string;
  latency_ms?: number;
  error?: string;
};

type HealthResponse = {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
  data_mode: string;
  operational_state_persistent: boolean;
  checks: Record<string, HealthCheck>;
};

const labelFor = (key: string) => ({
  database: 'Database',
  cache: 'Redis / cache',
  prometheus: 'Prometheus',
  orchestration: 'Kubernetes',
  model: 'Risk model',
  frontend: 'Frontend',
  operational_state: 'Operational state',
}[key] ?? key);

const stateStyle = (status: string) => {
  if (['connected', 'healthy', 'available'].includes(status)) return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/5';
  if (['not_integrated', 'disabled', 'not_implemented', 'not_probed', 'process_local', 'fallback'].includes(status)) return 'text-amber-300 border-amber-500/30 bg-amber-500/5';
  return 'text-rose-300 border-rose-500/30 bg-rose-500/5';
};

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const started = performance.now();
      try {
        const next = await api.getHealth() as HealthResponse;
        if (active) {
          setHealth(next);
          setApiLatency(Math.round(performance.now() - started));
          setError(null);
        }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Health API unavailable.');
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 10000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <Activity className="mt-1 h-5 w-5 text-cyan-400" />
        <div>
          <h1 className="text-xl font-semibold text-slate-100">System health</h1>
          <p className="mt-1 text-sm text-slate-400">Live dependency probes and integration availability, not seeded health badges.</p>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Backend health probe failed: {error}
        </div>
      )}

      {health && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className={`rounded-xl border p-4 ${stateStyle(health.status)}`}>
              <p className="text-xs opacity-70">Backend</p>
              <p className="mt-2 text-lg font-semibold capitalize">{health.status}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-100 p-4">
              <p className="text-xs text-slate-500">Browser → API response</p>
              <p className="mt-2 text-lg font-semibold tabular-nums text-slate-100">{apiLatency ?? '—'}{apiLatency === null ? '' : ' ms'}</p>
            </div>
            <div className={`rounded-xl border p-4 ${stateStyle('healthy')}`}>
              <p className="text-xs opacity-70">Frontend</p>
              <p className="mt-2 text-lg font-semibold">Loaded in this browser</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-100 p-4">
              <p className="text-xs text-slate-500">Environment</p>
              <p className="mt-2 text-lg font-semibold capitalize text-slate-100">{health.environment}</p>
            </div>
            <div className={`rounded-xl border p-4 ${health.operational_state_persistent ? stateStyle('healthy') : stateStyle('process_local')}`}>
              <p className="text-xs opacity-70">State persistence</p>
              <p className="mt-2 text-lg font-semibold">{health.operational_state_persistent ? 'Persistent' : 'Process-local'}</p>
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            {Object.entries(health.checks).map(([key, check]) => (
              <article key={key} className={`rounded-xl border p-4 ${stateStyle(check.status)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">{labelFor(key)}</h2>
                    <p className="mt-1 text-xs capitalize opacity-80">{check.status.replace(/_/g, ' ')}</p>
                  </div>
                  {['connected', 'healthy', 'available'].includes(check.status)
                    ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                    : <AlertTriangle className="h-4 w-4 shrink-0" />}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-400">
                  {check.details ?? check.error ?? check.engine ?? 'No additional probe detail.'}
                </p>
                {check.latency_ms !== undefined && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-slate-300">
                    <Clock3 className="h-3 w-3" /> Probe {check.latency_ms} ms
                  </p>
                )}
              </article>
            ))}
          </section>

          <p className="text-xs text-slate-500">
            Updated {new Date(health.timestamp).toLocaleTimeString()} · API {health.version} · {health.data_mode.replace(/_/g, ' ')}.
            Kubernetes, Prometheus, Redis, and model states reflect actual probes or explicitly reported missing integrations.
          </p>
        </>
      )}
    </div>
  );
};
