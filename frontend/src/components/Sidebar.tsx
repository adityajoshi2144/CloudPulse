import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
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
  Radio
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
}

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, overview, activeAlertsCount, simulator } = useApp();

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'monitoring', label: 'Live Monitoring', icon: Activity },
    { id: 'services', label: 'Services', icon: Server, badge: overview?.total_services || 5 },
    { id: 'infrastructure', label: '3D Observatory', icon: Box, badge: '3D' },
    { id: 'scaling', label: 'Auto-Scaling', icon: TrendingUp },
    { 
      id: 'simulator', 
      label: 'Traffic Simulator', 
      icon: Zap,
      badge: simulator?.is_running ? 'RUNNING' : undefined,
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
    },
    { 
      id: 'incidents', 
      label: 'Incidents', 
      icon: AlertTriangle,
      badge: overview?.status !== 'healthy' ? 'ACTIVE' : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
    },
    { 
      id: 'alerts', 
      label: 'Alerts', 
      icon: Bell, 
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    },
    { id: 'cache', label: 'Cache Analytics', icon: Database },
    { id: 'experiments', label: 'Experiment Lab', icon: FlaskConical },
    { id: 'slo', label: 'SLO & SLAs', icon: ShieldCheck },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a0d14]/95 backdrop-blur-xl border-r border-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-border/80 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-glow-cyan">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 text-sm tracking-tight">CloudPulse</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">2026</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">v2.4 Enterprise</p>
            </div>
          </div>
        </div>

        {/* Live Cluster Status Ribbon */}
        <div className="px-4 py-2.5 bg-surface-400/70 border-b border-border/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                overview?.status === 'critical' ? 'bg-rose-400' : overview?.status === 'degraded' ? 'bg-amber-400' : 'bg-emerald-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                overview?.status === 'critical' ? 'bg-rose-500' : overview?.status === 'degraded' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}></span>
            </span>
            <span className="text-slate-300 font-medium capitalize">{overview?.status || 'Active'}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">{overview?.active_replicas || 14} pods</span>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1 font-mono">
            Platform Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-100/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
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

        {/* Bottom Quorum Summary Card */}
        <div className="p-3 border-t border-border/80">
          <div className="p-3 rounded-lg bg-surface-200/50 border border-border/60">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-slate-400 font-mono">Cluster Quorum</span>
              <span className="text-emerald-400 font-mono font-medium">99.98%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-400 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                style={{ width: '99%' }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>HPA Target: 70% CPU</span>
              <span className="text-cyan-400">Kubernetes v1.30</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
