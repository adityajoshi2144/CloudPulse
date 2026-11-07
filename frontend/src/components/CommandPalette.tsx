import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Search,
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
  Flame,
  RotateCcw,
  Gauge
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions';
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    setActiveTab,
    setEnvironment,
    addToast,
    refreshData
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    {
      id: 'nav-overview',
      title: 'Navigate to Executive Overview',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => setActiveTab('overview'),
    },
    {
      id: 'nav-monitoring',
      title: 'Navigate to Live Monitoring',
      category: 'Navigation',
      icon: Activity,
      action: () => setActiveTab('monitoring'),
    },
    {
      id: 'nav-services',
      title: 'Navigate to Services Management',
      category: 'Navigation',
      icon: Server,
      action: () => setActiveTab('services'),
    },
    {
      id: 'nav-infrastructure',
      title: 'Open 3D Infrastructure Observatory',
      category: 'Navigation',
      icon: Box,
      action: () => setActiveTab('infrastructure'),
    },
    {
      id: 'nav-scaling',
      title: 'Configure Auto-Scaling & HPA Policies',
      category: 'Navigation',
      icon: TrendingUp,
      action: () => setActiveTab('scaling'),
    },
    {
      id: 'nav-simulator',
      title: 'Launch Interactive Traffic Simulator',
      category: 'Navigation',
      icon: Zap,
      action: () => setActiveTab('simulator'),
    },
    {
      id: 'nav-incidents',
      title: 'View Incidents & Chaos Laboratory',
      category: 'Navigation',
      icon: AlertTriangle,
      action: () => setActiveTab('incidents'),
    },
    {
      id: 'nav-cache',
      title: 'Inspect Cache Analytics & Redis Layer',
      category: 'Navigation',
      icon: Database,
      action: () => setActiveTab('cache'),
    },
    {
      id: 'nav-experiments',
      title: 'Run Performance A/B Benchmark',
      category: 'Navigation',
      icon: FlaskConical,
      action: () => setActiveTab('experiments'),
    },
    {
      id: 'nav-slo',
      title: 'Review SLO Compliance & Burn Rates',
      category: 'Navigation',
      icon: ShieldCheck,
      action: () => setActiveTab('slo'),
    },
    {
      id: 'act-sim-spike',
      title: 'Start Traffic Surge Simulation (300 RPS Spike)',
      category: 'Actions',
      icon: Zap,
      action: async () => {
        try {
          await api.startSimulator({
            pattern: 'spike',
            virtual_users: 500,
            duration_seconds: 60,
            ramp_up_seconds: 10,
            target_service: 'all',
            safe_simulation_mode: true,
          });
          setActiveTab('simulator');
          addToast('Traffic Spike simulation started', 'success');
        } catch (e: any) {
          addToast(e.message, 'error');
        }
      },
    },
    {
      id: 'act-chaos-crash',
      title: 'Trigger Chaos: Pod Crash on order-service',
      category: 'Actions',
      icon: Flame,
      action: async () => {
        try {
          await api.triggerPodFailure('order-service');
          setActiveTab('incidents');
          addToast('CrashLoopBackOff injected into order-service', 'error');
          refreshData();
        } catch (e: any) {
          addToast(e.message, 'error');
        }
      },
    },
    {
      id: 'act-recover',
      title: 'Trigger Cluster Self-Healing Reconciliation',
      category: 'Actions',
      icon: RotateCcw,
      action: async () => {
        try {
          await api.recoverIncident();
          addToast('Self-healing completed. Healthy pods restored.', 'success');
          refreshData();
        } catch (e: any) {
          addToast(e.message, 'error');
        }
      },
    },
    {
      id: 'act-cache-bench',
      title: 'Run Live Cached vs Uncached Benchmark',
      category: 'Actions',
      icon: Gauge,
      action: async () => {
        setActiveTab('cache');
        try {
          const res = await api.runCacheBenchmark();
          addToast(`Benchmark finished: Redis is ${res.comparison.speedup_factor}`, 'success');
        } catch (e: any) {
          addToast(e.message, 'error');
        }
      },
    },
  ];

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const executeCommand = (cmd: CommandItem) => {
    cmd.action();
    setIsCommandPaletteOpen(false);
    setQuery('');
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isCommandPaletteOpen) return;

      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          executeCommand(filtered[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCommandPaletteOpen, filtered, selectedIndex]);

  if (!isCommandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={() => setIsCommandPaletteOpen(false)}
      />

      <div className="relative w-full max-w-xl bg-surface-100 rounded-xl border border-border shadow-2xl overflow-hidden z-10 flex flex-col max-h-[75vh]">
        {/* Search Input */}
        <div className="p-3.5 border-b border-border flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Type a command or search platform features..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
            autoFocus
          />
          <kbd className="text-[10px] font-mono bg-surface-300 text-slate-400 px-1.5 py-0.5 rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 font-mono">
              No matching commands found.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors text-xs ${
                    isSelected
                      ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-surface-200/70 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span className="font-medium">{cmd.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {cmd.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-surface-300 border-t border-border/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>CloudPulse 2026</span>
        </div>
      </div>
    </div>
  );
};
