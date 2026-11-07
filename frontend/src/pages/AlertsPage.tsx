import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { AlertItem } from '../services/types';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sliders,
  Save,
  Radio,
  Send,
  ShieldAlert,
  Check
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { addToast } = useApp();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [thresholds, setThresholds] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'thresholds' | 'channels'>('active');
  const [saving, setSaving] = useState(false);

  const fetchAlerts = async () => {
    try {
      const [alts, ths] = await Promise.all([
        api.getAlerts(),
        api.getAlertThresholds()
      ]);
      setAlerts(alts);
      setThresholds(ths);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (id: string) => {
    try {
      await api.acknowledgeAlert(id);
      addToast('Alert marked as acknowledged', 'info');
      fetchAlerts();
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await api.resolveAlert(id);
      addToast('Alert marked as resolved', 'success');
      fetchAlerts();
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  const handleSaveThresholds = async () => {
    try {
      setSaving(true);
      await api.updateAlertThresholds(thresholds);
      addToast('Alert thresholds updated successfully', 'success');
      fetchAlerts();
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Switcher */}
      <div className="p-4 rounded-xl bg-surface-100/90 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Bell className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Alert Rules, Thresholds & Notification Dispatcher
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-tiered warning and critical thresholds with automated escalation to PagerDuty and Slack.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-lg bg-surface-200 border border-border">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
              activeTab === 'active' ? 'bg-cyan-600 text-white shadow-glow-cyan' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Firing Alerts ({alerts.filter((a) => a.status === 'firing').length})
          </button>
          <button
            onClick={() => setActiveTab('thresholds')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
              activeTab === 'thresholds' ? 'bg-cyan-600 text-white shadow-glow-cyan' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Threshold Rules
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
              activeTab === 'channels' ? 'bg-cyan-600 text-white shadow-glow-cyan' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dispatch Channels
          </button>
        </div>
      </div>

      {/* View: Firing Alerts */}
      {activeTab === 'active' && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-surface-100/50 border border-border">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-200">Zero Active Alert Breaches</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">All cluster metrics within configured thresholds.</p>
            </div>
          ) : (
            alerts.map((alt) => (
              <div
                key={alt.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  alt.severity === 'critical'
                    ? 'bg-rose-950/30 border-rose-500/50 shadow-glow-rose'
                    : 'bg-amber-950/30 border-amber-500/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    alt.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        alt.severity === 'critical' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-900'
                      }`}>
                        {alt.severity}
                      </span>
                      <h3 className="text-xs font-semibold text-slate-100">{alt.service_name}</h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-300 text-slate-300 border border-border">
                        {alt.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{alt.message}</p>
                    <p className="text-[11px] font-mono text-slate-400 mt-1">
                      Metric: {alt.metric} • Current: <strong className="text-slate-200">{alt.current_value}</strong> (Threshold: {alt.threshold}) • Triggered: {alt.triggered_at}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {alt.status === 'firing' && (
                    <button
                      onClick={() => handleAcknowledge(alt.id)}
                      className="px-3 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-300 border border-border text-slate-200 text-xs font-medium"
                    >
                      Acknowledge
                    </button>
                  )}
                  {alt.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolve(alt.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-glow-emerald"
                    >
                      <Check className="w-3.5 h-3.5" /> Resolve
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* View: Threshold Rules Configuration */}
      {activeTab === 'thresholds' && (
        <div className="p-5 rounded-xl bg-surface-100/80 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Telemetry Metric Threshold Rules
              </h3>
              <p className="text-[11px] text-slate-400">Define statistical bounds for alerts evaluation</p>
            </div>
            <button
              onClick={handleSaveThresholds}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-2 shadow-glow-cyan"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save Rule Changes'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-slate-400 text-[11px]">
                  <th className="pb-3 font-medium">Metric</th>
                  <th className="pb-3 font-medium">Unit</th>
                  <th className="pb-3 font-medium">Warning Threshold</th>
                  <th className="pb-3 font-medium">Critical Threshold</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {thresholds.map((t, idx) => (
                  <tr key={idx} className="hover:bg-surface-200/40">
                    <td className="py-3 text-slate-200 font-semibold">{t.metric}</td>
                    <td className="py-3 text-slate-400">{t.unit}</td>
                    <td className="py-3">
                      <input
                        type="number"
                        value={t.warning_threshold}
                        onChange={(e) => {
                          const copy = [...thresholds];
                          copy[idx].warning_threshold = parseFloat(e.target.value) || 0;
                          setThresholds(copy);
                        }}
                        className="w-24 px-2 py-1 rounded bg-surface-200 border border-border text-slate-100"
                      />
                    </td>
                    <td className="py-3">
                      <input
                        type="number"
                        value={t.critical_threshold}
                        onChange={(e) => {
                          const copy = [...thresholds];
                          copy[idx].critical_threshold = parseFloat(e.target.value) || 0;
                          setThresholds(copy);
                        }}
                        className="w-24 px-2 py-1 rounded bg-surface-200 border border-border text-slate-100"
                      />
                    </td>
                    <td className="py-3">
                      <span className="text-emerald-400 font-bold">Enabled</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View: Notification Dispatch Channels */}
      {activeTab === 'channels' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-surface-100/80 border border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-100">Slack Webhook</h3>
              <span className="text-[10px] font-mono text-emerald-400">Connected</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Dispatches firing alerts to #cloudops-alerts</p>
            <input
              type="text"
              readOnly
              value="https://hooks.slack.com/services/T00/B00/X8892"
              className="w-full px-2.5 py-1.5 rounded bg-surface-200 border border-border text-[11px] font-mono text-slate-300"
            />
          </div>

          <div className="p-4 rounded-xl bg-surface-100/80 border border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-100">PagerDuty Integration</h3>
              <span className="text-[10px] font-mono text-emerald-400">Active</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Escalates P1 critical incidents to on-call engineer</p>
            <input
              type="text"
              readOnly
              value="pd-routing-key-live-prod-8812"
              className="w-full px-2.5 py-1.5 rounded bg-surface-200 border border-border text-[11px] font-mono text-slate-300"
            />
          </div>

          <div className="p-4 rounded-xl bg-surface-100/80 border border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-100">Webhook Forwarder</h3>
              <span className="text-[10px] font-mono text-cyan-400">Configured</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Raw JSON telemetry dispatch to custom endpoint</p>
            <input
              type="text"
              readOnly
              value="https://api.internal.corp/ops/telemetry"
              className="w-full px-2.5 py-1.5 rounded bg-surface-200 border border-border text-[11px] font-mono text-slate-300"
            />
          </div>
        </div>
      )}
    </div>
  );
};
