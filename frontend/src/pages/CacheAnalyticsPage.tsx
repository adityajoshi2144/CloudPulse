import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { CacheStats } from '../services/types';
import {
  Database,
  Zap,
  Gauge,
  RotateCcw,
  Trash2,
  HardDrive,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export const CacheAnalyticsPage: React.FC = () => {
  const { addToast } = useApp();
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);
  const [isRunningBench, setIsRunningBench] = useState(false);
  const [isFlushing, setIsFlushing] = useState(false);

  const fetchCacheStats = async () => {
    try {
      const data = await api.getCacheStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCacheStats();
    const interval = setInterval(fetchCacheStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleFlush = async () => {
    try {
      setIsFlushing(true);
      await api.flushCache();
      addToast('Redis cache flushed successfully', 'info');
      fetchCacheStats();
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setIsFlushing(false);
    }
  };

  const handleRunBenchmark = async () => {
    try {
      setIsRunningBench(true);
      const res = await api.runCacheBenchmark();
      setBenchmarkResult(res);
      addToast(`Benchmark finished: Redis is ${res.comparison.speedup_factor}`, 'success');
      fetchCacheStats();
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setIsRunningBench(false);
    }
  };

  const hitRatio = stats?.hit_ratio_percent;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-4 rounded-xl bg-surface-100/90 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Database className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100">
                Distributed Cache Analytics & Memory Subsystem
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-700/40">
                {stats?.engine || 'Checking cache connection…'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cache hit/miss ratios, key memory footprint, eviction rate and live query latency acceleration.
            </p>
          </div>
        </div>

        {/* Flush Action */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleFlush}
            disabled={isFlushing}
            className="px-3 py-1.5 rounded-lg bg-surface-200 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-500/30 border border-border text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            {isFlushing ? 'Flushing...' : 'Flush Cache'}
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface-100/80 border border-border">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Cache Hit Ratio</span>
            <Gauge className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-400">{hitRatio == null ? '—' : `${hitRatio}%`}</p>
          <div className="w-full h-1.5 bg-surface-300 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${hitRatio ?? 0}%` }} />
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            {stats ? `${stats.hits.toLocaleString()} Hits / ${stats.misses.toLocaleString()} Misses` : 'Cache counters unavailable'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-surface-100/80 border border-border">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Average Read Latency</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-cyan-400">{stats?.avg_latency_ms == null ? '—' : `${stats.avg_latency_ms} ms`}</p>
          <span className="text-[10px] text-slate-400 font-mono mt-2 block">
            Sub-millisecond high-speed RAM retrieval
          </span>
        </div>

        <div className="p-4 rounded-xl bg-surface-100/80 border border-border">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Allocated Memory</span>
            <HardDrive className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-indigo-400">{stats?.used_memory_human ?? '—'}</p>
          <span className="text-[10px] text-slate-400 font-mono mt-2 block">
            Max Memory Quota: 256 MB (LRU Eviction)
          </span>
        </div>

        <div className="p-4 rounded-xl bg-surface-100/80 border border-border">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Keys & Evictions</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-100">{stats?.total_keys ?? '—'} Keys</p>
          <span className="text-[10px] text-slate-400 font-mono mt-2 block">
            Evictions: {stats?.evictions ?? '—'} • Commands: {stats?.total_commands_processed ?? '—'}
          </span>
        </div>
      </div>

      {/* WORKING LIVE BENCHMARK: CACHED VS UNCACHED */}
      <div className="p-5 rounded-xl bg-surface-100/80 border border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" /> Working Benchmark: Cached vs Uncached Query Engine
            </h3>
            <p className="text-[11px] text-slate-400">
              Executes real side-by-side requests to compare Redis in-memory speed against PostgreSQL disk joins.
            </p>
          </div>
          <button
            onClick={handleRunBenchmark}
            disabled={isRunningBench}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-2 shadow-glow-cyan transition-all"
          >
            <Gauge className="w-3.5 h-3.5" />
            {isRunningBench ? 'Benchmarking Latencies...' : 'Run Live Benchmark Comparison'}
          </button>
        </div>

        {benchmarkResult && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Cached Card */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-400 font-mono">REDIS CACHE (L2)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  HTTP 200
                </span>
              </div>
              <p className="text-3xl font-mono font-bold text-slate-100">
                {benchmarkResult.cached.latency_ms} <span className="text-sm font-normal text-slate-400">ms</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-2 font-mono">
                Source: {benchmarkResult.cached.source}
              </p>
            </div>

            {/* Uncached Card */}
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-400 font-mono">DIRECT POSTGRESQL</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  HTTP 200
                </span>
              </div>
              <p className="text-3xl font-mono font-bold text-slate-100">
                {benchmarkResult.uncached.latency_ms} <span className="text-sm font-normal text-slate-400">ms</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-2 font-mono">
                Source: {benchmarkResult.uncached.source}
              </p>
            </div>

            {/* Comparison Metrics Card */}
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-cyan-400 font-mono">SPEEDUP & SAVINGS</span>
                <p className="text-2xl font-mono font-bold text-cyan-300 mt-1">
                  {benchmarkResult.comparison.speedup_factor}
                </p>
                <p className="text-xs text-slate-300 mt-1 font-mono">
                  Latency Reduced: <strong className="text-emerald-400">{benchmarkResult.comparison.latency_reduction_percent}</strong>
                </p>
              </div>
              <p className="text-[11px] text-slate-400 font-mono pt-2 border-t border-cyan-500/20">
                Saved {benchmarkResult.comparison.time_saved_ms}ms of thread blocking time per call.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Keyspace Inspector Table */}
      <div className="p-5 rounded-xl bg-surface-100/80 border border-border">
        <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono mb-3">
          Active Cache Keyspace Sample ({stats?.sample_keys.length || 0} Keys Sampled)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border text-slate-400 text-[11px]">
                <th className="pb-2.5 font-medium">Key Name</th>
                <th className="pb-2.5 font-medium">Memory Size</th>
                <th className="pb-2.5 font-medium">TTL Remaining</th>
                <th className="pb-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {(stats?.sample_keys || []).map((k, idx) => (
                <tr key={idx} className="hover:bg-surface-200/40">
                  <td className="py-2.5 text-cyan-300 font-medium">{k.key}</td>
                  <td className="py-2.5 text-slate-400">{k.size} bytes</td>
                  <td className="py-2.5 text-slate-300">{k.ttl > 0 ? `${k.ttl}s` : 'No Expiry'}</td>
                  <td className="py-2.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Cached
                    </span>
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
