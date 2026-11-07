import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { SimulatorStatus, SimulatorTimelinePoint } from '../services/types';
import {
  Zap,
  Play,
  Pause,
  Square,
  RotateCcw,
  Sliders,
  Activity,
  Layers,
  Clock,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const TrafficSimulatorPage: React.FC = () => {
  const { simulator, addToast, refreshData } = useApp();
  const [pattern, setPattern] = useState<'normal' | 'spike' | 'sustained' | 'gradual' | 'reduction'>('spike');
  const [virtualUsers, setVirtualUsers] = useState(600);
  const [duration, setDuration] = useState(60);
  const [rampUp, setRampUp] = useState(10);
  const [targetService, setTargetService] = useState('all');
  const [safeMode, setSafeMode] = useState(true);
  const [timeline, setTimeline] = useState<SimulatorTimelinePoint[]>([]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await api.getSimulatorStatus();
        if (status.live_timeline) {
          setTimeline(status.live_timeline);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    try {
      await api.startSimulator({
        pattern,
        virtual_users: virtualUsers,
        duration_seconds: duration,
        ramp_up_seconds: rampUp,
        target_service: targetService,
        safe_simulation_mode: safeMode,
      });
      addToast(`Traffic simulator started (${pattern.toUpperCase()} pattern)`, 'success');
      refreshData();
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  const handlePause = async () => {
    try {
      await api.pauseSimulator();
      addToast('Traffic simulation paused', 'info');
      refreshData();
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  const handleResume = async () => {
    try {
      await api.resumeSimulator();
      addToast('Traffic simulation resumed', 'success');
      refreshData();
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  const handleStop = async () => {
    try {
      await api.stopSimulator();
      addToast('Traffic simulation stopped', 'info');
      refreshData();
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  const patterns = [
    {
      id: 'normal',
      title: 'Normal Traffic',
      desc: 'Baseline steady diurnal traffic (~150 RPS)',
      vusers: 200,
      duration: 60,
    },
    {
      id: 'spike',
      title: 'Sudden Traffic Surge',
      desc: 'Flash-sale traffic spike to trigger HPA scaling (~600 RPS)',
      vusers: 750,
      duration: 60,
    },
    {
      id: 'sustained',
      title: 'Sustained Heavy Load',
      desc: 'High continuous load to test resource saturation (~450 RPS)',
      vusers: 900,
      duration: 90,
    },
    {
      id: 'gradual',
      title: 'Gradual Ramp Up',
      desc: 'Slowly ramp virtual users up from 0 to target over duration',
      vusers: 500,
      duration: 75,
    },
    {
      id: 'reduction',
      title: 'Traffic Drop / Scale Down',
      desc: 'Sharp drop in traffic to test scale-down cooldown stabilization',
      vusers: 50,
      duration: 45,
    },
  ];

  const isRunning = simulator?.is_running;
  const isPaused = simulator?.is_paused;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-4 rounded-xl bg-surface-100/90 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100">
                Interactive Traffic Simulator & Load Generator
              </h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                isRunning
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                  : 'bg-surface-200 text-slate-400 border border-border'
              }`}>
                {isRunning ? (isPaused ? 'PAUSED' : 'ACTIVE SIMULATION') : 'IDLE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate realistic user workloads, observe autoscaler pod provisioning, and stress-test latency SLAs.
            </p>
          </div>
        </div>

        {/* Safe Mode Badge */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <span className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Safe Sandboxed Simulation Mode Active
          </span>
        </div>
      </div>

      {/* Pattern Preset Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {patterns.map((p) => {
          const isSelected = pattern === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                setPattern(p.id as any);
                setVirtualUsers(p.vusers);
                setDuration(p.duration);
              }}
              disabled={isRunning}
              className={`p-3.5 rounded-xl text-left border transition-all ${
                isSelected
                  ? 'bg-cyan-500/15 border-cyan-400 shadow-glow-cyan'
                  : 'bg-surface-100/70 hover:bg-surface-200 border-border'
              } disabled:opacity-50`}
            >
              <h3 className={`text-xs font-semibold ${isSelected ? 'text-cyan-200' : 'text-slate-200'}`}>
                {p.title}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{p.desc}</p>
              <div className="mt-2 text-[10px] font-mono text-slate-400">
                {p.vusers} VUs • {p.duration}s
              </div>
            </button>
          );
        })}
      </div>

      {/* Simulator Parameters & Control Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Configuration Controls */}
        <div className="p-5 rounded-xl bg-surface-100/80 border border-border space-y-4">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" /> Simulation Parameters
          </h3>

          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Virtual Users (VUs)</span>
              <span className="text-cyan-400 font-bold">{virtualUsers} VUs</span>
            </div>
            <input
              type="range"
              min={50}
              max={3000}
              step={50}
              disabled={isRunning}
              value={virtualUsers}
              onChange={(e) => setVirtualUsers(parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Test Duration</span>
              <span className="text-cyan-400 font-bold">{duration} seconds</span>
            </div>
            <input
              type="range"
              min={15}
              max={300}
              step={15}
              disabled={isRunning}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Ramp-up Window</span>
              <span className="text-cyan-400 font-bold">{rampUp} seconds</span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={5}
              disabled={isRunning}
              value={rampUp}
              onChange={(e) => setRampUp(parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">Target Microservice</label>
            <select
              value={targetService}
              disabled={isRunning}
              onChange={(e) => setTargetService(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-surface-200 border border-border text-xs text-slate-200 font-mono focus:outline-none"
            >
              <option value="all">All Microservices (Full Cluster Load)</option>
              <option value="api-gateway">API Gateway Ingress</option>
              <option value="order-service">Order Processing Core</option>
              <option value="inventory-service">Inventory & Catalog API</option>
              <option value="payment-service">Payment Gateway Adapter</option>
            </select>
          </div>

          {/* Execution Controls */}
          <div className="pt-2 flex items-center gap-2">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-glow-emerald"
              >
                <Play className="w-4 h-4" /> Start Simulation
              </button>
            ) : (
              <>
                {!isPaused ? (
                  <button
                    onClick={handlePause}
                    className="flex-1 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <Pause className="w-4 h-4" /> Pause
                  </button>
                ) : (
                  <button
                    onClick={handleResume}
                    className="flex-1 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <Play className="w-4 h-4" /> Resume
                  </button>
                )}
                <button
                  onClick={handleStop}
                  className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-glow-rose"
                >
                  <Square className="w-4 h-4" /> Stop
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right: Live Simulation Telemetry Timeline */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-surface-100/80 border border-border flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Live Simulation Telemetry Curve
              </h3>
              <p className="text-[11px] text-slate-400">
                Throughput (RPS) vs Auto-Scaled Pod Replicas
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {simulator?.elapsed_seconds || 0}s / {simulator?.duration_seconds || duration}s
              </span>
              <p className="text-[10px] text-slate-400 font-mono">
                Progress: {simulator?.progress_percent || 0}%
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-surface-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${simulator?.progress_percent || 0}%` }}
            />
          </div>

          {/* Live Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline.slice(-30)}>
                <defs>
                  <linearGradient id="simRps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1420',
                    borderColor: 'rgba(255,255,255,0.1)',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
                <Area type="monotone" dataKey="rps" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#simRps)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 4 Live Snapshot Indicators */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/60 text-xs font-mono text-center">
            <div className="p-2 rounded bg-surface-200/50">
              <span className="text-[10px] text-slate-400">RPS</span>
              <p className="text-cyan-400 font-bold">{timeline[timeline.length - 1]?.rps || 0}</p>
            </div>
            <div className="p-2 rounded bg-surface-200/50">
              <span className="text-[10px] text-slate-400">P95 Latency</span>
              <p className="text-indigo-400 font-bold">{timeline[timeline.length - 1]?.latency_p95 || 0}ms</p>
            </div>
            <div className="p-2 rounded bg-surface-200/50">
              <span className="text-[10px] text-slate-400">CPU Avg</span>
              <p className="text-amber-400 font-bold">{timeline[timeline.length - 1]?.cpu_percent || 0}%</p>
            </div>
            <div className="p-2 rounded bg-surface-200/50">
              <span className="text-[10px] text-slate-400">Active Pods</span>
              <p className="text-emerald-400 font-bold">{timeline[timeline.length - 1]?.active_replicas || 14}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
