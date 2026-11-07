import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuditLogItem } from '../services/types';
import { History, Search, Shield, Filter, User, Clock } from 'lucide-react';

export const AuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const data = await api.getAuditLogs();
        setLogs(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchAudit();
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.operator.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.resource_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-4 rounded-xl bg-surface-100/90 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <History className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Immutable Operator Audit Trail & Event Ledger
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cryptographically verified audit records for all cluster mutations, scaling events, and chaos tests.
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit actions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-lg bg-surface-200 border border-border text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-56 font-mono"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="p-5 rounded-xl bg-surface-100/80 border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border text-slate-400 text-[11px]">
                <th className="pb-3 font-medium">Timestamp (UTC)</th>
                <th className="pb-3 font-medium">Operator Identity</th>
                <th className="pb-3 font-medium">Action Event</th>
                <th className="pb-3 font-medium">Resource Target</th>
                <th className="pb-3 font-medium">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-surface-200/40">
                  <td className="py-3 text-slate-400 text-[11px] whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-3 text-cyan-300 font-medium whitespace-nowrap">{log.operator}</td>
                  <td className="py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-surface-200 text-slate-200 border border-border font-bold text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300 font-semibold">{log.resource_id}</td>
                  <td className="py-3 text-slate-400 font-sans text-xs max-w-sm truncate">
                    {JSON.stringify(log.details)}
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
