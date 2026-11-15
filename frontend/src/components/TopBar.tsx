import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Clock,
  Zap,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  ShieldCheck,
  Globe,
  Sun,
  Moon,
  Sparkles,
  Wifi,
  WifiOff
} from 'lucide-react';

export const TopBar: React.FC<{ onOpenSidebar: () => void }> = ({ onOpenSidebar }) => {
  const {
    activeTab,
    timeRange,
    setTimeRange,
    overview,
    simulator,
    activeAlertsCount,
    setIsCommandPaletteOpen,
    isNotificationOpen,
    setIsNotificationOpen,
    setActiveTab,
    protectedWebsite,
    setProtectedWebsite,
    environment,
    setEnvironment,
    setIsFacultyDemoOpen,
    theme,
    toggleTheme,
    wsConnected,
    threatLevel,
  } = useApp();

  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showWebsiteDropdown, setShowWebsiteDropdown] = useState(false);
  const [showEnvDropdown, setShowEnvDropdown] = useState(false);

  const timeRanges = ['1m', '5m', '15m', '1h'];
  const websites = [
    'demo.cloudpulse.local',
    'api.cloudpulse.local',
    'store.cloudpulse.local',
  ];
  const environments = [
    'Production (Protected)',
    'Staging',
    'Simulation Lab',
  ];

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-[#090c14]/90 backdrop-blur-md border-b border-border/80 px-4 lg:px-6 flex items-center justify-between transition-colors">
        {/* Left: Mobile Toggle & Page / Website Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-200 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Protected Website Selector */}
          <div className="relative">
            <button
              onClick={() => setShowWebsiteDropdown(!showWebsiteDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-200/70 hover:bg-surface-200 border border-border/80 text-xs text-slate-200 font-mono transition-colors"
              title="Select Protected Website Target"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-slate-100">{protectedWebsite}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showWebsiteDropdown && (
              <div className="absolute left-0 mt-1 w-56 bg-surface-100 rounded-xl border border-border shadow-2xl p-1 z-50 animate-in fade-in-50 duration-150">
                <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase text-slate-400 border-b border-border/60">
                  Select Protected Target
                </div>
                {websites.map((site) => (
                  <button
                    key={site}
                    onClick={() => {
                      setProtectedWebsite(site);
                      setShowWebsiteDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between ${
                      protectedWebsite === site
                        ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                        : 'text-slate-300 hover:bg-surface-200'
                    }`}
                  >
                    <span>{site}</span>
                    {protectedWebsite === site && <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Environment Selector */}
          <div className="relative hidden xl:block">
            <button
              onClick={() => setShowEnvDropdown(!showEnvDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-300/60 hover:bg-surface-200 border border-border/60 text-[11px] font-mono text-slate-300"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>{environment}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showEnvDropdown && (
              <div className="absolute left-0 mt-1 w-48 bg-surface-100 rounded-xl border border-border shadow-2xl p-1 z-50">
                {environments.map((env) => (
                  <button
                    key={env}
                    onClick={() => {
                      setEnvironment(env);
                      setShowEnvDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:bg-surface-200"
                  >
                    {env}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Faculty Demo Launcher Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFacultyDemoOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-mono font-bold shadow-glow-cyan transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span>START FACULTY DEMO</span>
          </button>

          {/* Command Palette Trigger */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-200/60 hover:bg-surface-200 border border-border/70 text-slate-400 hover:text-slate-200 text-xs transition-all w-52 justify-between"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span className="truncate">Search SOC...</span>
            </div>
            <kbd className="font-mono text-[10px] bg-surface-300 text-slate-400 px-1.5 py-0.5 rounded border border-border">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Telemetry, Simulator Banner, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Simulator Banner */}
          {simulator?.is_running && (
            <button
              onClick={() => setActiveTab('simulator')}
              className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-mono animate-pulse hover:bg-cyan-900/60 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">
                SIMULATING: {simulator.pattern.toUpperCase()} ({simulator.progress_percent}%)
              </span>
              <span className="sm:hidden font-semibold">SIM</span>
            </button>
          )}

          {/* Threat Level Badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono uppercase font-semibold ${
              threatLevel === 'Critical'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : threatLevel === 'High Risk'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : threatLevel === 'Suspicious'
                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                : threatLevel === 'Monitoring'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                threatLevel === 'Critical' ? 'bg-rose-400' : threatLevel === 'High Risk' ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span>Threat: {threatLevel}</span>
          </div>

          {/* Live WebSocket Status Indicator */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border/80 bg-surface-200/70 text-[11px] font-mono text-slate-300"
            title={wsConnected ? 'WebSocket Telemetry Connected' : 'Telemetry Polling Mode (2s)'}
          >
            {wsConnected ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden md:inline text-slate-300">Live WS</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span className="hidden md:inline text-slate-400">Polling</span>
              </>
            )}
          </div>

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

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-200 border border-transparent hover:border-border transition-all"
            aria-label="Toggle color theme"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

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
              SOC
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Drawer */}
      {isNotificationOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-84 bg-surface-100 border-l border-border shadow-2xl flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-slate-100">Website Protection Alerts</h2>
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
              <div className="flex items-center justify-between">
                <span className="text-slate-200 font-medium">Protection Status</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  SHIELD ACTIVE
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-1.5">
                Target: <span className="font-mono text-cyan-300">{protectedWebsite}</span>
              </p>
              <p className="text-slate-400 text-[11px]">
                API Status: {overview?.status ?? 'healthy'} · Observed RPS: {overview?.total_rps ?? 0}
              </p>
              <div className="mt-3 pt-2 border-t border-border/60">
                <button
                  onClick={() => {
                    setActiveTab('alerts');
                    setIsNotificationOpen(false);
                  }}
                  className="w-full py-1.5 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                >
                  View Alerts Center ({activeAlertsCount}) <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
