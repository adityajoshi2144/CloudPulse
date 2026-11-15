import React, { useEffect, useState } from 'react';
import { AlertTriangle, Download, FileText } from 'lucide-react';
import { api } from '../services/api';
import { SimulationReport } from '../services/types';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<SimulationReport[]>([]);
  const [persistence, setPersistence] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const result = await api.getReports();
        if (active) {
          setReports(result.reports);
          setPersistence(result.persistence);
          setError(null);
          setLoading(false);
        }
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason.message : 'Reports are unavailable.');
          setLoading(false);
        }
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
        <FileText className="mt-1 h-5 w-5 text-cyan-400" />
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Simulation reports</h1>
          <p className="mt-1 text-sm text-slate-400">Export actual scenario workload, measured metrics, risk evidence, and recovery state.</p>
        </div>
      </header>

      {persistence && <p className="text-xs text-amber-300">{persistence}.</p>}
      {error && (
        <div role="alert" className="flex gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          <AlertTriangle className="h-4 w-4 shrink-0" /> Reports API unavailable: {error}
        </div>
      )}
      {loading && <div role="status" className="h-40 animate-pulse rounded-xl border border-border bg-surface-100" />}
      {!loading && !error && reports.length === 0 && (
        <div className="rounded-xl border border-border bg-surface-100 p-8 text-center">
          <FileText className="mx-auto h-7 w-7 text-slate-500" />
          <p className="mt-3 text-sm font-medium text-slate-200">No completed simulation reports</p>
          <p className="mt-1 text-xs text-slate-400">Run a bounded scenario in the Attack &amp; Stress Lab to generate a report.</p>
        </div>
      )}

      <section className="space-y-3">
        {reports.map((report) => (
          <article key={report.id} className="rounded-xl border border-border bg-surface-100 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold capitalize text-slate-100">{report.scenario.replace(/_/g, ' ')} scenario</h2>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] capitalize text-slate-400">{report.status.replace(/_/g, ' ')}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{new Date(report.created_at).toLocaleString()} · {report.target_service}</p>
              </div>
              <div className="flex gap-2">
                <a href={`/api/reports/${report.id}/csv`} download
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-slate-200 hover:bg-surface-200">
                  <Download className="h-3.5 w-3.5" /> CSV
                </a>
                <a href={`/api/reports/${report.id}/pdf`} download
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-500/20">
                  <Download className="h-3.5 w-3.5" /> PDF
                </a>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-y border-border py-4 sm:grid-cols-4">
              <div><p className="text-[11px] text-slate-500">Requests sent</p><p className="mt-1 text-sm tabular-nums text-slate-200">{report.workload.requests_sent} / {report.workload.request_cap}</p></div>
              <div><p className="text-[11px] text-slate-500">HTTP errors</p><p className="mt-1 text-sm tabular-nums text-slate-200">{report.workload.errors_seen}</p></div>
              <div><p className="text-[11px] text-slate-500">Risk before → after</p><p className="mt-1 text-sm tabular-nums text-slate-200">
                {report.risk_before.score ?? '—'} → {report.risk_after.score ?? '—'}
              </p></div>
              <div><p className="text-[11px] text-slate-500">Test endpoint recovery</p><p className={`mt-1 text-sm ${report.recovery.test_endpoint_available ? 'text-emerald-300' : 'text-rose-300'}`}>
                {report.recovery.test_endpoint_available ? 'Available' : 'Not verified'}
              </p></div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">{report.scaling_note}</p>
            <p className="mt-1 text-[11px] text-slate-500">{report.metrics_scope}</p>
          </article>
        ))}
      </section>
    </div>
  );
};
