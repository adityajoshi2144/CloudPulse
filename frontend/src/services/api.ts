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
  TelemetryPoint
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
  restartService: (id: string) => request<{ status: string; message: string; restarted_pods: number }>(`/services/${id}/restart`, { method: 'POST' }),
  getServiceLogs: (id: string) => request<{ service_id: string; logs: any[] }>(`/services/${id}/logs`),

  // Scaling
  getScalingPolicies: () => request<ScalingPolicy[]>('/scaling/policies'),
  updateScalingPolicy: (id: string, policy: Partial<ScalingPolicy>) =>
    request<any>(`/scaling/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(policy),
    }),
  getScalingEvents: () => request<ScalingEvent[]>('/scaling/events'),
  triggerManualScale: (serviceId: string, replicas: number) =>
    request<any>(`/scaling/manual?service_id=${serviceId}&replicas=${replicas}`, { method: 'POST' }),

  // Simulator
  getSimulatorStatus: () => request<SimulatorStatus>('/simulator/status'),
  startSimulator: (config: any) =>
    request<SimulatorStatus>('/simulator/start', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
  pauseSimulator: () => request<SimulatorStatus>('/simulator/pause', { method: 'POST' }),
  resumeSimulator: () => request<SimulatorStatus>('/simulator/resume', { method: 'POST' }),
  stopSimulator: () => request<SimulatorStatus>('/simulator/stop', { method: 'POST' }),

  // Incidents
  getIncidents: () => request<Incident[]>('/incidents'),
  triggerPodFailure: (serviceId: string = 'order-service') =>
    request<{ status: string; incident: Incident }>(`/incidents/trigger-failure?service_id=${serviceId}`, { method: 'POST' }),
  recoverIncident: (incidentId?: string) =>
    request<any>(`/incidents/recover${incidentId ? `?incident_id=${incidentId}` : ''}`, { method: 'POST' }),
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
  runExperiment: (req: { name: string; test_duration_seconds: number; virtual_users: number }) =>
    request<Experiment>('/experiments/run', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  // Audit & SLO
  getAuditLogs: () => request<AuditLogItem[]>('/audit'),
  getSLOs: () => request<{ slos: SLOItem[] }>('/slo'),
};
