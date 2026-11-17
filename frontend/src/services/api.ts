import {
  SystemOverview,
  ServiceItem,
  ScalingPolicy,
  ScalingEvent,
  SimulatorStatus,
  Incident,
  AlertItem,
  CacheStats,
  Experiment,
  AuditLogItem,
  SLOItem,
  TelemetryPoint,
  SimulatorConfig,
  SimulatorLimits,
  RiskAnalysis,
  RiskConfiguration,
  SimulationReport,
  SecurityVerdict,
  FacultyDemoStatus,
  FacultyDemoReport,
  ShieldStatus
} from './types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || `Request failed with status ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (err: any) {
    console.warn(`[API] ${endpoint} failed:`, err.message);
    throw err;
  }
}

export const api = {
  // Health
  getHealth: () => request<any>('/health'),

  // Metrics
  getOverview: () => request<SystemOverview>('/metrics/overview'),
  getLiveMetrics: () => request<{ count: number; data: TelemetryPoint[] }>('/metrics/live'),
  getHistory: (range: string = '15m') => request<{ range: string; points: number; data: TelemetryPoint[] }>(`/metrics/history?range=${range}`),

  // Services
  getServices: () => request<ServiceItem[]>('/services'),
  getServiceDetail: (id: string) => request<ServiceItem>(`/services/${id}`),
  getServiceLogs: (id: string) => request<{ service_id: string; available: boolean; message: string; logs: any[] }>(`/services/${id}/logs`),

  // Scaling
  getScalingPolicies: () => request<ScalingPolicy[]>('/scaling/policies'),
  updateScalingPolicy: (id: string, policy: Partial<ScalingPolicy>) =>
    request<any>(`/scaling/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(policy),
    }),
  getScalingEvents: () => request<ScalingEvent[]>('/scaling/events'),

  // Simulator
  getSimulatorStatus: () => request<SimulatorStatus>('/simulator/status'),
  getSimulatorLimits: () => request<SimulatorLimits>('/simulator/limits'),
  startSimulator: (config: SimulatorConfig) =>
    request<SimulatorStatus>('/simulator/start', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
  pauseSimulator: () => request<SimulatorStatus>('/simulator/pause', { method: 'POST' }),
  resumeSimulator: () => request<SimulatorStatus>('/simulator/resume', { method: 'POST' }),
  stopSimulator: () => request<SimulatorStatus>('/simulator/stop', { method: 'POST' }),

  // Evidence-based risk analysis
  getRiskAnalysis: () => request<RiskAnalysis>('/risk'),
  updateRiskConfiguration: (config: RiskConfiguration) =>
    request<RiskConfiguration>('/risk/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    }),

  // Simulation reports
  getReports: () => request<{ persistence: string; reports: SimulationReport[] }>('/reports'),

  // Incident history requires an external incident source.
  getIncidents: () => request<Incident[]>('/incidents'),
  getIncidentRCA: (incidentId: string) => request<any>(`/incidents/${incidentId}/rca`),

  // Alerts
  getAlerts: () => request<AlertItem[]>('/alerts'),
  acknowledgeAlert: (alertId: string) => request<any>(`/alerts/${alertId}/acknowledge`, { method: 'POST' }),
  resolveAlert: (alertId: string) => request<any>(`/alerts/${alertId}/resolve`, { method: 'POST' }),
  getAlertThresholds: () => request<any[]>('/alerts/thresholds'),
  updateAlertThresholds: (configs: any[]) =>
    request<any[]>('/alerts/thresholds', {
      method: 'POST',
      body: JSON.stringify(configs),
    }),

  // Cache
  getCacheStats: () => request<CacheStats>('/cache/stats'),
  flushCache: () => request<{ status: string; message: string }>('/cache/flush', { method: 'POST' }),
  runCacheBenchmark: () => request<any>('/cache/benchmark', { method: 'POST' }),

  // Experiments
  getExperiments: () => request<Experiment[]>('/experiments'),
  runExperiment: (req: {
    name: string;
    test_duration_seconds: number;
    virtual_users: number;
    pattern: SimulatorConfig['pattern'];
    intensity: SimulatorConfig['intensity'];
    max_requests: number;
  }) =>
    request<Experiment>('/experiments/run', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  // Audit & SLO
  getAuditLogs: () => request<AuditLogItem[]>('/audit'),
  getSLOs: () => request<{ slos: SLOItem[] }>('/slo'),

  // Faculty Demonstration Engine
  getDemoStatus: () => request<FacultyDemoStatus>('/demo/status'),
  startFacultyDemo: () => request<FacultyDemoStatus>('/demo/start', { method: 'POST' }),
  pauseFacultyDemo: () => request<FacultyDemoStatus>('/demo/pause', { method: 'POST' }),
  resumeFacultyDemo: () => request<FacultyDemoStatus>('/demo/resume', { method: 'POST' }),
  stopFacultyDemo: () => request<FacultyDemoStatus>('/demo/stop', { method: 'POST' }),
  resetFacultyDemo: () => request<FacultyDemoStatus>('/demo/reset', { method: 'POST' }),
  runDemoStep: (stage: number) => request<FacultyDemoStatus>(`/demo/step/${stage}`, { method: 'POST' }),
  getFacultyDemoReport: () => request<FacultyDemoReport>('/demo/report'),

  // Security Verdict & Shield
  getSecurityVerdict: () => request<SecurityVerdict>('/risk/verdict'),
  getShieldStatus: () => request<ShieldStatus>('/shield/status'),
  toggleShieldEnforcement: (enable: boolean) =>
    request<ShieldStatus>(`/shield/toggle-enforcement?enable=${enable}`, { method: 'POST' }),
};
