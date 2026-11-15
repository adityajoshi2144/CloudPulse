export interface SystemOverview {
  status: 'healthy' | 'degraded' | 'critical' | 'unknown';
  total_requests: number;
  requests_per_second: number;
  requests_per_minute: number;
  requests_in_window: number;
  total_rps: number;
  avg_latency_ms: number | null;
  p95_latency_ms: number | null;
  p99_latency_ms: number | null;
  error_rate_percent: number | null;
  cpu_utilization_percent: number;
  process_cpu_percent: number;
  memory_utilization_percent: number;
  process_memory_percent: number;
  database_response_time_ms: number | null;
  queue_depth: number | null;
  active_containers: number | null;
  active_replicas: number | null;
  simulated_replicas: number;
  cache_hit_ratio_percent: number | null;
  uptime: string;
  uptime_percent: number | null;
  total_services: number | null;
  healthy_services: number | null;
  degraded_services: number | null;
  critical_services: number | null;
  metrics_source: string;
  metrics_scope: string;
}

export interface PodInstance {
  id: string;
  service_id: string;
  status: 'Running' | 'Pending' | 'CrashLoopBackOff' | 'Terminating';
  ready: boolean;
  node: string;
  ip: string;
  cpu_percent: number | null;
  memory_percent: number | null;
  restarts: number;
  uptime_seconds: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  tier: 'gateway' | 'core' | 'data' | 'cache';
  status: 'healthy' | 'degraded' | 'critical' | 'unknown' | 'simulated';
  replicas: number | null;
  min_replicas: number;
  max_replicas: number;
  target_cpu: number;
  cpu_percent: number | null;
  memory_percent: number | null;
  rps: number | null;
  latency_p95: number | null;
  error_rate: number | null;
  restart_count: number | null;
  dependencies: string[];
  version: string;
  metrics_source: string;
  execution_mode: string;
  pods?: PodInstance[];
}

export interface ScalingPolicy {
  service_id: string;
  service_name: string;
  target_cpu: number;
  min_replicas: number;
  max_replicas: number;
  current_replicas: number | null;
  current_cpu: number | null;
  scale_up_cooldown: number;
  scale_down_cooldown: number;
  is_hpa_active: boolean;
  orchestrator: string;
  execution_mode: string;
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
  latency_p95: number | null;
  error_rate: number | null;
  cpu_percent: number | null;
  memory_percent: number | null;
  active_replicas: number | null;
  virtual_users: number;
}

export type SimulatorPattern = 'normal' | 'spike' | 'flood' | 'burst' | 'resource' | 'failure' | 'gradual';

export interface SimulatorConfig {
  pattern: SimulatorPattern;
  virtual_users: number;
  intensity: 'low' | 'medium' | 'high';
  duration_seconds: number;
  ramp_up_seconds: number;
  max_requests: number;
  target_service: 'cloudpulse-test-service';
  safe_simulation_mode: true;
}

export interface SimulatorStatus {
  is_running: boolean;
  is_paused: boolean;
  pattern: 'idle' | SimulatorPattern;
  virtual_users: number;
  intensity: 'low' | 'medium' | 'high';
  duration_seconds: number;
  elapsed_seconds: number;
  progress_percent: number;
  target_service: string;
  safe_simulation_mode: boolean;
  safety_scope: string;
  scenario_status: string;
  requests_sent: number;
  request_cap: number;
  errors_seen: number;
  failure_reason: string | null;
  report_id?: string | null;
  live_timeline: SimulatorTimelinePoint[];
}

export interface SimulatorLimits {
  target: string;
  max_concurrency: number;
  max_requests_per_run: number;
  max_requests_per_second: number;
  max_duration_seconds: number;
  external_targets_allowed: false;
}

export interface RiskFactor {
  key: string;
  label: string;
  value: number | null;
  unit: string;
  baseline: number | null;
  warning_threshold: number | null;
  critical_threshold: number | null;
  normalized_score: number | null;
  threshold_status: 'normal' | 'warning' | 'critical' | 'unknown';
  weight: number;
  available: boolean;
  evidence: string;
}

export interface RiskAnalysis {
  score: number | null;
  classification: 'low' | 'moderate' | 'high' | 'critical' | 'unknown';
  risk_by_category: {
    infrastructure_overload: number | null;
    traffic_anomaly: number | null;
    service_availability: number | null;
  };
  coverage: { available_factors: number; total_factors: number; note: string };
  top_contributors: RiskFactor[];
  factors: RiskFactor[];
  threshold_violations: RiskFactor[];
  explanation: string;
  recommended_action: string;
  calculated_at: string;
  metrics_source: string;
  metrics_scope: string;
  configuration: RiskConfiguration;
}

export interface RiskConfiguration {
  weights: Record<string, number>;
  thresholds: Record<string, { warning: number; critical: number }>;
  classification_thresholds: { moderate: number; high: number; critical: number };
  scope: string;
}

export interface SimulationReport {
  id: string;
  created_at: string;
  started_at: string;
  completed_at: string;
  scenario: SimulatorPattern;
  status: string;
  target_service: string;
  safety_scope: string;
  workload: {
    intensity: string;
    concurrency: number;
    duration_seconds: number;
    elapsed_seconds: number;
    request_cap: number;
    requests_sent: number;
    errors_seen: number;
  };
  risk_before: { score: number | null; classification: string; top_contributors: RiskFactor[] };
  risk_after: { score: number | null; classification: string; top_contributors: RiskFactor[] };
  metrics_before: Record<string, number | null>;
  metrics_after: Record<string, number | null>;
  scaling_note: string;
  recovery: { test_endpoint_available: boolean; scope: string };
  metrics_scope: string;
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
  avg_latency_ms: number | null;
  total_commands_processed: number;
  sample_keys: CacheKeySample[];
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  created_at: string;
  status: string;
  scenario: SimulatorPattern;
  workload: {
    intensity: string;
    concurrency: number;
    duration_seconds: number;
    elapsed_seconds: number;
    request_cap: number;
    requests_sent: number;
    errors_seen: number;
  };
  metrics_before: Record<string, number | null>;
  metrics_after: Record<string, number | null>;
  metric_deltas: Record<string, number>;
  risk_before: { score: number | null; classification: string; top_contributors: RiskFactor[] };
  risk_after: { score: number | null; classification: string; top_contributors: RiskFactor[] };
  metrics_source: string;
  metrics_scope: string;
  scaling_note: string;
  report_id: string;
  timeline: SimulatorTimelinePoint[];
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
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  period: string;
}

export interface TelemetryPoint {
  timestamp: string;
  rps: number;
  requests_per_minute: number;
  latency_p95: number | null;
  p99_latency_ms: number | null;
  latency_avg: number | null;
  error_rate: number | null;
  cpu_percent: number;
  memory_percent: number;
  active_replicas: number | null;
  cache_hit_ratio: number | null;
}

export type ThreatLevel = 'Normal' | 'Monitoring' | 'Suspicious' | 'High Risk' | 'Critical';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'traffic_spike' | 'threat_detected' | 'threshold_breach' | 'alert_fired' | 'mitigation_active' | 'scaling_triggered' | 'recovered' | 'baseline_normal';
  severity: 'info' | 'warning' | 'high' | 'critical' | 'success';
  title: string;
  description: string;
  source: string;
}

