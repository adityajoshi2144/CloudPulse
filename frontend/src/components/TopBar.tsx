import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Clock,
  Layers,
  Zap,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

export const TopBar: React.FC<{ onOpenSidebar: () => void }> = ({ onOpenSidebar }) => {
  const {
    activeTab,
    environment,
    setEnvironment,
    timeRange,
    setTimeRange,
    overview,
    simulator,
    activeAlertsCount,
    setIsCommandPaletteOpen,
    isNotificationOpen,
    setIsNotificationOpen,
    setActiveTab
  } = useApp();

  const [showEnvDropdown, setShowEnvDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  const environments = [
    { id: 'production', label: 'Production (us-east-1)', color: 'bg-emerald-500' },
    { id: 'staging', label: 'Staging (us-central-1)', color: 'bg-amber-500' },
    { id: 'development', label: 'Dev-Cluster (Local Kind)', color: 'bg-cyan-500' },
  ];

  const timeRanges = ['1m', '5m', '15m', '1h', '24h'];

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-[#0a0d14]/80 backdrop-blur-md border-b border-border/80 px-4 lg:px-6 flex items-center justify-between">
        {/* Left: Mobile Toggle & Page Indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-200 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-slate-400 hidden sm:inline">Platform /</span>
            <h1 className="text-sm font-semibold text-slate-100 capitalize tracking-tight">
              {activeTab.replace('-', ' ')}
            </h1>
          </div>
        </div>

        {/* Center: Search / Command Palette Trigger */}
        <div className="hidden md:flex items-center">
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-3 px-3.5 py-1.5 rounded-lg bg-surface-200/60 hover:bg-surface-200 border border-border/70 text-slate-400 hover:text-slate-200 text-xs transition-all w-64 justify-between"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>Quick actions & telemetry...</span>
            </div>
            <kbd className="font-mono text-[10px] bg-surface-300 text-slate-400 px-1.5 py-0.5 rounded border border-border">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Actions, Filters & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Simulator Banner */}
          {simulator?.is_running && (
            <button
              onClick={() => setActiveTab('simulator')}
              className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono animate-pulse hover:bg-cyan-900/60 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">TRAFFIC SIMULATING: {simulator.pattern.toUpperCase()} ({simulator.progress_percent}%)</span>
              <span className="sm:hidden font-semibold">SIM</span>
            </button>
          )}

          {/* Time Range Selector */}
          <div className="relative">
            <button
              onClick={() => setShowTimeDropdown(!showTimeDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-200/70 hover:bg-surface-200 border border-border text-slate-300 text-xs font-mono"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{timeRange}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showTimeDropdown && (
              <div className="absolute right-0 mt-1 w-28 bg-surface-100 rounded-lg border border-border shadow-xl p-1 z-50">
                {timeRanges.map((tr) => (
                  <button
                    key={tr}
                    onClick={() => {
                      setTimeRange(tr);
                      setShowTimeDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono ${
                      timeRange === tr
                        ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                        : 'text-slate-300 hover:bg-surface-200'
                    }`}
                  >
                    {tr} window
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Environment Selector */}
          <div className="relative">
            <button
              onClick={() => setShowEnvDropdown(!showEnvDropdown)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-200/70 hover:bg-surface-200 border border-border text-slate-200 text-xs"
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span className="capitalize hidden lg:inline">{environment}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showEnvDropdown && (
              <div className="absolute right-0 mt-1 w-52 bg-surface-100 rounded-lg border border-border shadow-xl p-1 z-50">
                {environments.map((env) => (
                  <button
                    key={env.id}
                    onClick={() => {
                      setEnvironment(env.id);
                      setShowEnvDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded text-xs ${
                      environment === env.id
                        ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                        : 'text-slate-300 hover:bg-surface-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${env.color}`} />
                    <span>{env.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-200 border border-transparent hover:border-border transition-all"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {activeAlertsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-background animate-pulse" />
            )}
          </button>

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2 pl-1 border-l border-border/80">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-[11px] font-semibold text-white font-mono shadow-sm">
              CP
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Drawer */}
      {isNotificationOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 bg-surface-100 border-l border-border shadow-2xl flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-slate-100">Live Telemetry Feed</h2>
            </div>
            <button
              onClick={() => setIsNotificationOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-surface-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="p-3 rounded-lg bg-surface-200/80 border border-border text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                <span>AUTOSCALER</span>
                <span>Just now</span>
              </div>
              <p className="text-slate-200 font-medium">HPA evaluation cycle completed</p>
              <p className="text-slate-400 text-[11px] mt-0.5">All 14 active pods within 70% target utilization.</p>
            </div>

            {overview?.status !== 'healthy' && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs">
                <div className="flex items-center justify-between text-[11px] text-rose-400 font-mono mb-1">
                  <span>INCIDENT DETECTED</span>
                  <span>Active</span>
                </div>
                <p className="text-rose-200 font-medium">Order-service pod degradation</p>
                <p className="text-slate-400 text-[11px] mt-0.5">High latency threshold breach; review Incident tab.</p>
                <button
                  onClick={() => {
                    setActiveTab('incidents');
                    setIsNotificationOpen(false);
                  }}
                  className="mt-2 text-rose-400 hover:text-rose-300 font-mono text-[10px] flex items-center gap-1 underline"
                >
                  View Incident & RCA <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="p-3 rounded-lg bg-surface-200/80 border border-border text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                <span>CACHE LAYER</span>
                <span>5m ago</span>
              </div>
              <p className="text-slate-200 font-medium">Redis cache hit ratio steady at 88.6%</p>
              <p className="text-slate-400 text-[11px] mt-0.5">P95 read latency measured at 1.2ms.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
