import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  Activity,
  Server,
  Box,
  TrendingUp,
  Zap,
  AlertTriangle,
  Bell,
  Database,
  FlaskConical,
  ShieldCheck,
  History,
  Settings,
  ChevronRight,
  Radio,
  FileText,
  Sparkles,
  Globe,
  Sliders,
  CheckCircle2
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const {
    activeTab,
    setActiveTab,
    overview,
    activeAlertsCount,
    simulator,
    setIsFacultyDemoOpen,
    protectedWebsite,
    threatLevel,
  } = useApp();

  const statusColor =
    overview?.status === 'critical' || threatLevel === 'Critical'
      ? 'bg-rose-500'
      : overview?.status === 'degraded' || threatLevel === 'High Risk'
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  const sections: NavSection[] = [
    {
      title: 'OPERATIONS & DEFENSE',
      items: [
        { id: 'overview', label: 'Website Protection Center', icon: Shield },
        {
          id: 'simulator',
          label: 'Traffic & Attack Simulator',
          icon: Zap,
          badge: simulator?.is_running ? 'RUNNING' : undefined,
          badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
        },
        { id: 'risk', label: 'Threat & Risk Engine', icon: ShieldCheck },
        { id: 'monitoring', label: 'Live Traffic Ingress', icon: Activity },
      ],
    },
    {
      title: 'INFRASTRUCTURE & RESILIENCE',
      items: [
        { id: 'scaling', label: 'Ingress Shield & Protection', icon: ShieldCheck },
        { id: 'services', label: 'Service Catalog', icon: Server },
        { id: 'infrastructure', label: 'Infrastructure Map', icon: Box },
      ],
    },
    {
      title: 'INCIDENTS & AUDIT',
      items: [
        { id: 'incidents', label: 'Incident Management & RCA', icon: AlertTriangle },
        {
          id: 'alerts',
          label: 'Alerts & Thresholds',
          icon: Bell,
          badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
          badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
        },
        { id: 'reports', label: 'Simulation Reports', icon: FileText },
        { id: 'audit', label: 'Security Audit Trail', icon: History },
      ],
    },
    {
      title: 'PERFORMANCE & PLATFORM',
      items: [
        { id: 'slo', label: 'SLO & Availability', icon: Radio },
        { id: 'cache', label: 'Cache Performance', icon: Database },
        { id: 'experiments', label: 'Workload Experiments', icon: FlaskConical },
        { id: 'health', label: 'System Health Probes', icon: CheckCircle2 },
        { id: 'settings', label: 'Defense Settings', icon: Settings },
      ],
    },
  ];

  const handleSelect = (id: string) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#080b12]/95 backdrop-blur-xl border-r border-border flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-4 border-b border-border/80 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-blue-500 flex items-center justify-center shadow-glow-cyan border border-cyan-400/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-100 text-sm tracking-tight">CloudPulse</span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/40">
                  SOC
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Website Traffic Protection</p>
            </div>
          </div>
        </div>

        {/* Protected Website Ribbon */}
        <div className="px-3.5 py-2.5 bg-surface-300/40 border-b border-border/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className={`inline-flex h-2 w-2 rounded-full ${statusColor} shrink-0`} />
            <span className="text-slate-300 font-mono text-[11px] truncate">{protectedWebsite}</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0">
            PROTECTED
          </span>
        </div>

        {/* Faculty Demo Quick Launcher Pill */}
        <div className="p-3 border-b border-border/50">
          <button
            onClick={() => {
              setIsFacultyDemoOpen(true);
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-600/30 via-indigo-600/30 to-purple-600/30 hover:from-cyan-600/50 hover:to-indigo-600/50 border border-cyan-500/40 text-cyan-200 text-xs font-mono font-semibold transition-all shadow-sm group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
              <span>FACULTY DEMO</span>
            </div>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30 group-hover:bg-cyan-500/30">
              Start
            </span>
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {sections.map((sec, secIdx) => (
            <div key={secIdx}>
              <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1.5 font-mono">
                {sec.title}
              </div>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-surface-100/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                            isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                            item.badgeColor || (isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-surface-200 text-slate-400')
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer / Telemetry Status */}
        <div className="p-3 border-t border-border/80">
          <div className="p-2.5 rounded-lg bg-surface-200/50 border border-border/60 text-xs">
            <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
              <span className="text-slate-400">Observed RPS</span>
              <span className="text-cyan-400 font-semibold">{overview?.total_rps ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Local Ingress</span>
              <span className="text-emerald-400">Shield Active</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
