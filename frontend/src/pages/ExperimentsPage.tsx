import React, { useEffect, useState } from 'react';
import { AlertTriangle, Download, FlaskConical, Play } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Experiment, SimulatorPattern } from '../services/types';

const scenarioOptions: { value: SimulatorPattern; label: string }[] = [
  { value: 'normal', label: 'Normal traffic' },
  { value: 'spike', label: 'Sudden traffic spike' },
  { value: 'flood', label: 'Bounded HTTP load' },
  { value: 'burst', label: 'Burst traffic' },
  { value: 'resource', label: 'Bounded CPU work' },
  { value: 'failure', label: 'Local endpoint failure' },
  { value: 'gradual', label: 'Gradual traffic increase' },
];

const metricLabels: [string, string][] = [
  ['requests_per_second', 'Observed requests/sec'],
  ['avg_latency_ms', 'Average request latency'],
  ['p95_latency_ms', 'P95 request latency'],
  ['error_rate_percent', 'HTTP error rate'],
  ['cpu_utilization_percent', 'Host CPU'],
  ['memory_utilization_percent', 'Host memory'],
];

const metricValue = (value: number | null | undefined, key: string) => {
  if (value === null || value === undefined) return 'Unknown';
  return `${value}${key === 'error_rate_percent' || key.includes('utilization') ? '%' : key.includes('latency') ? ' ms' : ''}`;
};

export const ExperimentsPage: React.FC = () => {
  const { addToast } = useApp();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [name, setName] = useState('Local measured traffic run');
  const [pattern, setPattern] = useState<SimulatorPattern>('spike');
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('low');
  const [duration, setDuration] = useState(15);
  const [concurrency, setConcurrency] = useState(2);
  const [maxRequests, setMaxRequests] = useState(200);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshExperiments = async () => {
    try {
      setExperiments(await api.getExperiments());
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Experiment history is unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshExperiments();
  }, []);

  const runExperiment = async (event: React.FormEvent) => {
    event.preventDefault();
    setRunning(true);
    setError(null);
    try {
      const result = await api.runExperiment({
        name,
        test_duration_seconds: duration,
        virtual_users: concurrency,
        pattern,
        intensity,
        max_requests: maxRequests,
      });
      setExperiments((previous) => [result, ...previous.filter((item) => item.id !== result.id)]);
      addToast(`Measured run recorded: ${result.workload.requests_sent} requests`, 'success');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Experiment failed.';
      setError(message);
      addToast(message, 'error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <FlaskConical className="mt-1 h-5 w-5 text-cyan-400" />
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Measured experiment lab</h1>
          <p className="mt-1 text-sm text-slate-400">
            Run a bounded local workload and inspect actual measurements. This lab does not claim to compare scaling strategies.
          </p>
        </div>
      </header>

      <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs leading-relaxed text-amber-100/80">
        Local ASGI test target only. The API enforces at most 10 concurrent requests, 20 requests/second, 1,000 requests, and 60 seconds.
        No Kubernetes scaling or external infrastructure changes are performed.
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={runExperiment} className="space-y-4 rounded-xl border border-border bg-surface-100 p-5">
        <h2 className="text-sm font-semibold text-slate-100">Run a local measured workload</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs text-slate-400">
            Run name
            <input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface-200 px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="text-xs text-slate-400">
            Scenario
            <select value={pattern} onChange={(event) => setPattern(event.target.value as SimulatorPattern)}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface-200 px-3 py-2 text-sm text-slate-100">
              {scenarioOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Intensity
            <select value={intensity} onChange={(event) => setIntensity(event.target.value as typeof intensity)}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface-200 px-3 py-2 text-sm text-slate-100">
              <option value="low">Low · 2 requests/sec</option>
              <option value="medium">Medium · 8 requests/sec</option>
              <option value="high">High · max 20 requests/sec</option>
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Concurrency (1–10)
            <input type="number" min={1} max={10} required value={concurrency}
              onChange={(event) => setConcurrency(Number(event.target.value))}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface-200 px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="text-xs text-slate-400">
            Duration (1–60 seconds)
            <input type="number" min={1} max={60} required value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface-200 px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="text-xs text-slate-400">
            Request cap (1–1,000)
            <input type="number" min={1} max={1000} required value={maxRequests}
              onChange={(event) => setMaxRequests(Number(event.target.value))}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface-200 px-3 py-2 text-sm text-slate-100" />
          </label>
        </div>
        <button type="submit" disabled={running}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyan-500 disabled:cursor-wait disabled:opacity-50">
          <Play className="h-4 w-4" /> {running ? 'Collecting measurements…' : 'Run experiment'}
        </button>
        {running && <p role="status" className="text-xs text-slate-400">Waiting for the bounded local scenario to finish.</p>}
      </form>

      {loading ? (
        <div role="status" className="h-32 animate-pulse rounded-xl border border-border bg-surface-100" />
      ) : experiments.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-100 p-8 text-center text-sm text-slate-400">
          No measured experiment runs yet. Start a bounded local run to create one.
        </div>
      ) : (
        <section className="space-y-4">
          {experiments.map((experiment) => (
            <article key={experiment.id} className="rounded-xl border border-border bg-surface-100 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">{experiment.name}</h2>
                  <p className="mt-1 text-xs text-slate-400">{experiment.description}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {experiment.scenario} · {experiment.workload.requests_sent} requests · {new Date(experiment.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a href={`/api/reports/${experiment.report_id}/csv`} download
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-slate-200">
                    <Download className="h-3.5 w-3.5" /> CSV
                  </a>
                  <a href={`/api/reports/${experiment.report_id}/pdf`} download
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-slate-200">
                    <Download className="h-3.5 w-3.5" /> PDF
                  </a>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-slate-500">
                      <th className="py-2 font-medium">Measured factor</th>
                      <th className="py-2 font-medium">Before run</th>
                      <th className="py-2 font-medium">After run</th>
                      <th className="py-2 font-medium">Observed delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricLabels.map(([key, label]) => (
                      <tr key={key} className="border-b border-border/50 last:border-0">
                        <td className="py-2 text-slate-300">{label}</td>
                        <td className="py-2 tabular-nums text-slate-400">{metricValue(experiment.metrics_before[key], key)}</td>
                        <td className="py-2 tabular-nums text-slate-200">{metricValue(experiment.metrics_after[key], key)}</td>
                        <td className="py-2 tabular-nums text-slate-400">{metricValue(experiment.metric_deltas[key] ?? null, key)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-3 text-xs text-slate-400">
                <span>Risk: {experiment.risk_before.score ?? '—'} → {experiment.risk_after.score ?? '—'}</span>
                <span>HTTP errors: {experiment.workload.errors_seen}</span>
                <span>{experiment.scaling_note}</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">{experiment.metrics_scope}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};
