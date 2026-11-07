export interface SystemOverview {
  status: 'healthy' | 'degraded' | 'critical';
  total_rps: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  error_rate_percent: number;
  cpu_utilization_percent: number;
  memory_utilization_percent: number;
  active_replicas: number;
  cache_hit_ratio_percent: number;
  uptime: string;
  uptime_percent: number;
  total_services: number;
  healthy_services: number;
  degraded_services: number;
  critical_services: number;
}

export interface PodInstance {
  id: string;
  service_id: string;
  status: 'Running' | 'Pending' | 'CrashLoopBackOff' | 'Terminating';
  ready: boolean;
  node: string;
  ip: string;
  cpu_percent: number;
  memory_percent: number;
  restarts: number;
  uptime_seconds: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  tier: 'gateway' | 'core' | 'data' | 'cache';
  status: 'healthy' | 'degraded' | 'critical';
  replicas: number;
  min_replicas: number;
  max_replicas: number;
  target_cpu: number;
  cpu_percent: number;
  memory_percent: number;
  rps: number;
  latency_p95: number;
  error_rate: number;
  restart_count: number;
  dependencies: string[];
  version: string;
  pods?: PodInstance[];
}

export interface ScalingPolicy {
  service_id: string;
  service_name: string;
  target_cpu: number;
  min_replicas: number;
  max_replicas: number;
  current_replicas: number;
  current_cpu: number;
  scale_up_cooldown: number;
  scale_down_cooldown: number;
  is_hpa_active: boolean;
  orchestrator: string;
}

export interface ScalingEvent {
  id: number;
  service_id: string;
  timestamp: string;
  from_replicas: number;
  to_replicas: number;
  trigger_metric: string;
  metric_value: number;
  reason: string;
  is_real_k8s: boolean;
}

export interface SimulatorTimelinePoint {
  second: number;
  timestamp: string;
  rps: number;
  latency_p95: number;
  error_rate: number;
  cpu_percent: number;
  memory_percent: number;
  active_replicas: number;
  virtual_users: number;
}

export interface SimulatorStatus {
  is_running: boolean;
  is_paused: boolean;
  pattern: 'idle' | 'normal' | 'spike' | 'sustained' | 'gradual' | 'reduction';
  virtual_users: number;
  duration_seconds: number;
  elapsed_seconds: number;
  progress_percent: number;
  target_service: string;
  safe_simulation_mode: boolean;
  live_timeline: SimulatorTimelinePoint[];
}

export interface IncidentRCA {
  primary_cause: string;
  confidence_score: number;
  evidence: string[];
  timeline_events: { time: string; event: string }[];
}

export interface Incident {
  id: string;
  title: string;
  severity: 'P1' | 'P2' | 'P3';
  status: 'active' | 'investigating' | 'mitigating' | 'resolved';
  affected_services: string[];
  started_at: string;
  resolved_at: string | null;
  duration_minutes: number;
  probable_cause: string;
  impact_summary: string;
  recommended_action: string;
  rca?: IncidentRCA;
}

export interface AlertItem {
  id: string;
  service_id: string;
  service_name: string;
  metric: string;
  threshold: number;
  current_value: number;
  severity: 'warning' | 'critical';
  status: 'firing' | 'acknowledged' | 'resolved';
  triggered_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  message: string;
}

export interface CacheKeySample {
  key: string;
  size: number;
  ttl: number;
}

export interface CacheStats {
  is_real_redis: boolean;
  engine: string;
  connected_clients: number;
  total_keys: number;
  hits: number;
  misses: number;
  hit_ratio_percent: number;
  evictions: number;
  used_memory_bytes: number;
  used_memory_human: string;
  avg_latency_ms: number;
  total_commands_processed: number;
  sample_keys: CacheKeySample[];
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  created_at: string;
  status: string;
  baseline_metrics: {
    throughput_rps: number;
    median_latency_ms: number;
    p95_latency_ms: number;
    error_rate_percent: number;
    replicas: number;
    cache_hit_ratio_percent: number;
    recovery_time_sec: number;
    cpu_saturation_percent: number;
  };
  optimized_metrics: {
    throughput_rps: number;
    median_latency_ms: number;
    p95_latency_ms: number;
    error_rate_percent: number;
    replicas: number;
    cache_hit_ratio_percent: number;
    recovery_time_sec: number;
    cpu_saturation_percent: number;
  };
  improvement_summary: {
    throughput_gain: string;
    p95_latency_reduction: string;
    error_reduction: string;
  };
  report_markdown: string;
}

export interface AuditLogItem {
  id: number;
  timestamp: string;
  operator: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, any>;
}

export interface SLOItem {
  id: string;
  name: string;
  target_percent?: number;
  target_ms?: number;
  current_percent?: number;
  current_ms?: number;
  error_budget_remaining_percent?: number;
  burn_rate?: number;
  compliance_percent?: number;
  status: 'healthy' | 'warning' | 'critical';
  period: string;
}

export interface TelemetryPoint {
  timestamp: string;
  rps: number;
  latency_p95: number;
  latency_avg: number;
  error_rate: number;
  cpu_percent: number;
  memory_percent: number;
  active_replicas: number;
  cache_hit_ratio: number;
}
