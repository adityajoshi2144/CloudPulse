import React, { useEffect, useState } from 'react';
import { AlertTriangle, BrainCircuit, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { RiskAnalysis, RiskConfiguration, RiskFactor } from '../services/types';

const riskTone: Record<RiskAnalysis['classification'], string> = {
  low: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
  moderate: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
  high: 'text-orange-300 border-orange-500/30 bg-orange-500/10',
  critical: 'text-rose-300 border-rose-500/30 bg-rose-500/10',
  unknown: 'text-slate-300 border-border bg-surface-200',
};

const displayValue = (value: number | null, unit: string) =>
  value === null ? 'Unknown' : `${value} ${unit}`;

const FactorRow: React.FC<{ factor: RiskFactor }> = ({ factor }) => (
  <div className="grid gap-3 border-b border-border/70 py-4 last:border-0 md:grid-cols-[minmax(150px,1.3fr)_repeat(3,minmax(90px,1fr))_minmax(140px,1.4fr)]">
    <div>
      <p className="text-sm font-medium text-slate-200">{factor.label}</p>
      <p className={`mt-1 text-[11px] leading-relaxed ${
        factor.threshold_status === 'critical' ? 'text-rose-300' :
        factor.threshold_status === 'warning' ? 'text-amber-300' : 'text-slate-500'
      }`}>
        {factor.threshold_status === 'warning' || factor.threshold_status === 'critical'
          ? `${factor.threshold_status.toUpperCase()} threshold · ` : ''}
        {factor.evidence}
      </p>
    </div>
    <div>
      <p className="text-[11px] text-slate-500">Measured</p>
      <p className="mt-1 text-sm tabular-nums text-slate-200">{displayValue(factor.value, factor.unit)}</p>
    </div>
    <div>
      <p className="text-[11px] text-slate-500">Baseline</p>
      <p className="mt-1 text-sm tabular-nums text-slate-300">{displayValue(factor.baseline, factor.unit)}</p>
    </div>
    <div>
      <p className="text-[11px] text-slate-500">Warning / critical</p>
      <p className="mt-1 text-sm tabular-nums text-slate-300">
        {factor.warning_threshold === null ? 'Not configured' : `${factor.warning_threshold} / ${factor.critical_threshold} ${factor.unit}`}
      </p>
    </div>
    <div className="flex items-center gap-3">
      {factor.normalized_score === null ? (
        <span className="text-xs text-slate-500">Not measured</span>
      ) : (
        <>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-300">
            <div className={`h-full rounded-full ${
              factor.normalized_score >= 75 ? 'bg-rose-400' :
              factor.normalized_score >= 50 ? 'bg-orange-400' :
              factor.normalized_score >= 25 ? 'bg-amber-400' : 'bg-emerald-400'
            }`} style={{ width: `${factor.normalized_score}%` }} />
          </div>
          <span className="min-w-12 text-right text-xs tabular-nums text-slate-300">
            {factor.normalized_score}/100
          </span>
        </>
      )}
    </div>
  </div>
);

export const RiskAnalysisPage: React.FC = () => {
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
  const [configuration, setConfiguration] = useState<RiskConfiguration | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const next = await api.getRiskAnalysis();
        if (active) {
          setAnalysis(next);
          setConfiguration((current) => current ?? next.configuration);
          setError(null);
          setLoading(false);
        }
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason.message : 'Risk analysis is unavailable.');
          setLoading(false);
        }
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const saveConfiguration = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!configuration) return;
    setSaving(true);
    setSaveMessage(null);
    setError(null);
    try {
      const saved = await api.updateRiskConfiguration(configuration);
      setConfiguration(saved);
      setAnalysis(await api.getRiskAnalysis());
      setSaveMessage('Risk weights and thresholds saved for this API process.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Risk configuration could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const setWeight = (key: string, value: number) => {
    setConfiguration((current) => current && ({
      ...current,
      weights: { ...current.weights, [key]: value },
    }));
  };

  const setThreshold = (key: string, name: 'warning' | 'critical', value: number) => {
    setConfiguration((current) => current && ({
      ...current,
      thresholds: {
        ...current.thresholds,
        [key]: { ...current.thresholds[key], [name]: value },
      },
    }));
  };

  if (loading) {
    return <div role="status" className="animate-pulse space-y-4">
      <div className="h-24 rounded-xl border border-border bg-surface-100" />
      <div className="h-72 rounded-xl border border-border bg-surface-100" />
    </div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-cyan-400" />
            <h1 className="text-xl font-semibold text-slate-100">Infrastructure risk analysis</h1>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            Explainable scores use measured telemetry only. Missing integrations are reported as unknown and excluded from scoring.
          </p>
        </div>
        {analysis && (
          <span className="text-xs text-slate-500">
            Updated {new Date(analysis.calculated_at).toLocaleTimeString()}
          </span>
        )}
      </header>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Risk API unavailable: {error}
        </div>
      )}

      {analysis && (
        <>
          <section className="grid gap-4 lg:grid-cols-[minmax(240px,.8fr)_2fr]">
            <div className="rounded-xl border border-border bg-surface-100 p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Overall Security Risk</p>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-5xl font-semibold tabular-nums text-slate-100">
                  {analysis.score === null ? '—' : Math.round(analysis.score)}
                </span>
                <span className="pb-1 text-sm text-slate-500">/ 100</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase font-mono ${riskTone[analysis.classification]}`}>
                  {analysis.risk_level || analysis.classification}
                </span>
                {analysis.traffic_classification && (
                  <span className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono text-cyan-300">
                    {analysis.traffic_classification}
                  </span>
                )}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-slate-400">
                {analysis.coverage.available_factors} of {analysis.coverage.total_factors} factors measurable
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-100 p-5">
              <h2 className="text-sm font-semibold text-slate-100">Why this score?</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{analysis.explanation}</p>
              <div className="mt-4 flex gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                <p className="text-xs leading-relaxed text-slate-300">{analysis.recommended_action}</p>
              </div>
              <p className="mt-3 text-[11px] text-slate-500">
                {analysis.metrics_source}. {analysis.metrics_scope}
              </p>
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-3">
            {[
              ['Infrastructure overload', analysis.risk_by_category.infrastructure_overload],
              ['Traffic anomaly', analysis.risk_by_category.traffic_anomaly],
              ['Service availability', analysis.risk_by_category.service_availability],
            ].map(([label, score]) => (
              <div key={label as string} className="rounded-xl border border-border bg-surface-100 p-4">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-100">
                  {score === null ? '—' : `${score}/100`}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-xl border border-border bg-surface-100 px-5">
            <div className="border-b border-border py-4">
              <h2 className="text-sm font-semibold text-slate-100">Risk factor evidence</h2>
              <p className="mt-1 text-xs text-slate-400">
                Normalized risk is 0–100 using configured warning and critical thresholds.
              </p>
            </div>
            {analysis.factors.map((factor) => <FactorRow key={factor.key} factor={factor} />)}
          </section>

          <details className="rounded-xl border border-border bg-surface-100 p-5">
            <summary className="cursor-pointer text-sm font-semibold text-slate-100">
              Configure risk weights and thresholds
            </summary>
            <form onSubmit={saveConfiguration} className="mt-4 space-y-4">
              <p className="text-xs text-slate-400">
                Changes are process-local and reset when the API restarts. Pod health uses lower-is-worse thresholds.
              </p>
              <div className="space-y-2">
                {analysis.factors.map((factor) => {
                  const thresholds = configuration?.thresholds[factor.key];
                  return (
                    <div key={factor.key} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[minmax(130px,1fr)_90px_110px_110px] sm:items-end">
                      <span className="text-xs text-slate-300">{factor.label}</span>
                      <label className="text-[11px] text-slate-500">
                        Weight
                        <input type="number" min="0" max="5" step="0.1" value={configuration?.weights[factor.key] ?? 1}
                          onChange={(event) => setWeight(factor.key, Number(event.target.value))}
                          className="mt-1 w-full rounded border border-border bg-surface-200 px-2 py-1 text-slate-100" />
                      </label>
                      <label className="text-[11px] text-slate-500">
                        Warning
                        <input type="number" min="0" step="0.1" value={thresholds?.warning ?? 0}
                          onChange={(event) => setThreshold(factor.key, 'warning', Number(event.target.value))}
                          className="mt-1 w-full rounded border border-border bg-surface-200 px-2 py-1 text-slate-100" />
                      </label>
                      <label className="text-[11px] text-slate-500">
                        Critical
                        <input type="number" min="0" step="0.1" value={thresholds?.critical ?? 1}
                          onChange={(event) => setThreshold(factor.key, 'critical', Number(event.target.value))}
                          className="mt-1 w-full rounded border border-border bg-surface-200 px-2 py-1 text-slate-100" />
                      </label>
                    </div>
                  );
                })}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {(['moderate', 'high', 'critical'] as const).map((classification) => (
                  <label key={classification} className="text-xs capitalize text-slate-400">
                    {classification} score
                    <input type="number" min="1" max="100" step="1"
                      value={configuration?.classification_thresholds[classification] ?? 25}
                      onChange={(event) => setConfiguration((current) => current && ({
                        ...current,
                        classification_thresholds: {
                          ...current.classification_thresholds,
                          [classification]: Number(event.target.value),
                        },
                      }))}
                      className="mt-1 block w-full rounded border border-border bg-surface-200 px-2 py-1.5 text-slate-100" />
                  </label>
                ))}
              </div>
              <button type="submit" disabled={!configuration || saving}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-medium text-white hover:bg-cyan-500 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save risk configuration'}
              </button>
              {saveMessage && <p role="status" className="text-xs text-emerald-300">{saveMessage}</p>}
            </form>
          </details>

          <p className="text-xs leading-relaxed text-slate-500">
            These initial thresholds and weights are configurable; classifications are project defaults, not universal standards.
            No automated scaling action is performed by this analysis.
          </p>
        </>
      )}
    </div>
  );
};
