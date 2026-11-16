import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  SystemOverview,
  ServiceItem,
  SimulatorStatus,
  SecurityEvent,
  ThreatLevel,
  SecurityVerdict,
  FacultyDemoStatus,
  ShieldStatus,
  PlatformNotification
} from '../services/types';
import { api } from '../services/api';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
  overview: SystemOverview | null;
  services: ServiceItem[];
  simulator: SimulatorStatus | null;
  securityVerdict: SecurityVerdict | null;
  demoStatus: FacultyDemoStatus | null;
  shieldStatus: ShieldStatus | null;
  isInitialLoading: boolean;
  activeAlertsCount: number;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isNotificationOpen: boolean;
  setIsNotificationOpen: (open: boolean) => void;
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  notifications: PlatformNotification[];
  addNotification: (notif: Omit<PlatformNotification, 'id' | 'time'>) => void;
  refreshData: () => Promise<void>;
  selectedServiceId: string | null;
  setSelectedServiceId: (id: string | null) => void;

  // Website Protection & Demonstration State
  protectedWebsite: string;
  setProtectedWebsite: (site: string) => void;
  environment: string;
  setEnvironment: (env: string) => void;
  isFacultyDemoOpen: boolean;
  setIsFacultyDemoOpen: (open: boolean) => void;
  facultyDemoStep: number;
  setFacultyDemoStep: (step: number) => void;
  threatLevel: ThreatLevel;
  mitigationActive: boolean;
  setMitigationActive: (active: boolean) => void;
  rateLimitEnforced: boolean;
  setRateLimitEnforced: (enforced: boolean) => void;
  securityEvents: SecurityEvent[];
  addSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  wsConnected: boolean;

  // Faculty Demo Controls
  startFacultyDemo: () => Promise<void>;
  pauseFacultyDemo: () => Promise<void>;
  resumeFacultyDemo: () => Promise<void>;
  stopFacultyDemo: () => Promise<void>;
  resetFacultyDemo: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const INITIAL_SECURITY_EVENTS: SecurityEvent[] = [
  {
    id: 'evt-1',
    timestamp: '2 mins ago',
    type: 'baseline_normal',
    severity: 'info',
    title: 'Website Traffic Baseline Normal',
    description: 'Inbound requests to demo.cloudpulse.local within 99.9% SLO latency bounds.',
    source: 'Edge Gateway Ingress',
  },
  {
    id: 'evt-2',
    timestamp: '15 mins ago',
    type: 'threshold_breach',
    severity: 'warning',
    title: 'Transient CPU Warning Threshold',
    description: 'Host CPU briefly registered 78.4% utilization during automated health scan.',
    source: 'FastAPI Host Collector',
  },
  {
    id: 'evt-3',
    timestamp: '1 hour ago',
    type: 'mitigation_active',
    severity: 'success',
    title: 'Edge Ingress Filter Policy Verified',
    description: 'Rate limiting rules confirmed active for test endpoints (max 20 req/s).',
    source: 'CloudPulse Shield',
  },
];

const INITIAL_NOTIFICATIONS: PlatformNotification[] = [
  {
    id: 'notif-base',
    severity: 'LOW',
    time: 'Just now',
    reason: 'Website operating normally with healthy baseline traffic.',
    affected_service: 'api-gateway',
    current_action: 'Continuous Ingress Monitoring Active',
  },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialTab = urlParams?.get('tab') || 'overview';
  const initialDemo = urlParams?.get('demo') === 'true';

  const [activeTab, setActiveTabState] = useState<string>(initialTab);
  const [timeRange, setTimeRange] = useState<string>('15m');
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [simulator, setSimulator] = useState<SimulatorStatus | null>(null);
  const [securityVerdict, setSecurityVerdict] = useState<SecurityVerdict | null>(null);
  const [demoStatus, setDemoStatus] = useState<FacultyDemoStatus | null>(null);
  const [shieldStatus, setShieldStatus] = useState<ShieldStatus | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifications, setNotifications] = useState<PlatformNotification[]>(INITIAL_NOTIFICATIONS);

  // Website Protection State
  const [protectedWebsite, setProtectedWebsite] = useState<string>('demo.cloudpulse.local');
  const [environment, setEnvironment] = useState<string>('Production (Protected)');
  const [isFacultyDemoOpen, setIsFacultyDemoOpen] = useState<boolean>(initialDemo);

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const u = new URL(window.location.href);
      u.searchParams.set('tab', tab);
      window.history.replaceState({}, '', u.toString());
    }
  }, []);

  const [facultyDemoStep, setFacultyDemoStep] = useState<number>(1);
  const [mitigationActive, setMitigationActive] = useState<boolean>(true);
  const [rateLimitEnforced, setRateLimitEnforced] = useState<boolean>(true);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>(INITIAL_SECURITY_EVENTS);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const lastNotifKeyRef = useRef<string>('');

  // Sync theme with document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const addNotification = useCallback((notif: Omit<PlatformNotification, 'id' | 'time'>) => {
    const key = `${notif.severity}-${notif.reason}-${notif.affected_service}`;
    if (lastNotifKeyRef.current === key) return;
    lastNotifKeyRef.current = key;

    const newNotif: PlatformNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      time: new Date().toLocaleTimeString(),
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 24)]);
  }, []);

  const addSecurityEvent = useCallback((event: Omit<SecurityEvent, 'id' | 'timestamp'>) => {
    const newEvt: SecurityEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: 'Just now',
    };
    setSecurityEvents((prev) => [newEvt, ...prev.slice(0, 19)]);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const [ov, svcs, sim, alerts, verdict, demo, shield] = await Promise.all([
        api.getOverview().catch(() => null),
        api.getServices().catch(() => []),
        api.getSimulatorStatus().catch(() => null),
        api.getAlerts().catch(() => []),
        api.getSecurityVerdict().catch(() => null),
        api.getDemoStatus().catch(() => null),
        api.getShieldStatus().catch(() => null),
      ]);
      if (ov) setOverview(ov);
      if (svcs.length > 0) setServices(svcs);
      if (sim) setSimulator(sim);
      if (verdict) setSecurityVerdict(verdict);
      if (demo) {
        setDemoStatus(demo);
        setFacultyDemoStep(demo.current_stage);
      }
      if (shield) {
        setShieldStatus(shield);
        setRateLimitEnforced(shield.rate_limiting_enforced);
      }
      if (alerts) {
        setActiveAlertsCount(alerts.filter((a) => a.status === 'firing').length);
      }
    } catch (err) {
      console.warn('Refresh data warning:', err);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  // Real-time WebSocket telemetry with polling fallback
  useEffect(() => {
    refreshData();
    let ws: WebSocket | null = null;
    let pollInterval: any = null;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/telemetry`;

      try {
        ws = new WebSocket(wsUrl);
        ws.onopen = () => {
          setWsConnected(true);
        };
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.overview) setOverview(data.overview);
            if (data.services) setServices(data.services);
            if (data.simulator) setSimulator(data.simulator);
            if (data.risk) {
              setSecurityVerdict({
                risk_level: data.risk.risk_level,
                risk_score: data.risk.risk_score,
                traffic_classification: data.risk.traffic_classification,
                website_health: data.risk.website_health,
                security_status: data.risk.security_status,
                confidence: data.risk.confidence_or_evidence_quality,
                detected_indicators: data.risk.detected_indicators || [],
                explanation: data.risk.explanation,
                recommended_action: data.risk.recommended_action,
                mitigation_status: data.risk.mitigation_status,
                simulation_mode: data.risk.simulation_mode,
                assessed_at: data.risk.assessed_at,
                last_analysis_time: data.risk.last_analysis_time,
              });
            }
            if (data.demo) {
              setDemoStatus(data.demo);
              setFacultyDemoStep(data.demo.current_stage);
            }
            if (data.shield) {
              setShieldStatus(data.shield);
              setRateLimitEnforced(data.shield.rate_limiting_enforced);
            }
          } catch (e) {
            // ignore malformed frame
          }
        };
        ws.onerror = () => {
          setWsConnected(false);
          if (!pollInterval) {
            pollInterval = setInterval(refreshData, 2000);
          }
        };
        ws.onclose = () => {
          setWsConnected(false);
          if (!pollInterval) {
            pollInterval = setInterval(refreshData, 2000);
          }
          setTimeout(connectWebSocket, 5000);
        };
      } catch (e) {
        setWsConnected(false);
        pollInterval = setInterval(refreshData, 2000);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [refreshData]);

  // Derive dynamic Threat Level from backend Security Verdict
  const threatLevel: ThreatLevel = useMemo(() => {
    if (securityVerdict) {
      if (securityVerdict.risk_level === 'CRITICAL RISK') return 'Critical';
      if (securityVerdict.risk_level === 'HIGH RISK') return 'High Risk';
      if (securityVerdict.traffic_classification === 'LEGITIMATE TRAFFIC SURGE') return 'Monitoring';
      if (securityVerdict.risk_level === 'MEDIUM RISK') return 'Suspicious';
      return 'Normal';
    }
    if (simulator?.is_running) {
      const p = simulator.pattern;
      if (p === 'failure' || p === 'flood') return 'Critical';
      if (p === 'burst' || p === 'resource') return 'High Risk';
      if (p === 'spike' || p === 'gradual') return 'Monitoring';
    }
    return 'Normal';
  }, [securityVerdict, simulator]);

  // Auto-dispatch centralized notifications when verdict status changes
  useEffect(() => {
    if (!securityVerdict) return;

    if (securityVerdict.risk_level === 'CRITICAL RISK') {
      addNotification({
        severity: 'CRITICAL',
        reason: securityVerdict.explanation,
        affected_service: 'api-gateway / order-service',
        current_action: securityVerdict.mitigation_status,
        incident_link: 'INC-2026-081',
      });
    } else if (securityVerdict.risk_level === 'HIGH RISK') {
      addNotification({
        severity: 'HIGH',
        reason: securityVerdict.explanation,
        affected_service: 'api-gateway',
        current_action: securityVerdict.mitigation_status,
        incident_link: 'INC-2026-081',
      });
    } else if (securityVerdict.traffic_classification === 'LEGITIMATE TRAFFIC SURGE') {
      addNotification({
        severity: 'MEDIUM',
        reason: 'Legitimate traffic surge observed. Traffic is uniform; error rate is nominal.',
        affected_service: 'ingress-gateway',
        current_action: 'Capacity observed; HPA scaling ready',
      });
    } else if (demoStatus?.current_stage === 6) {
      addNotification({
        severity: 'RECOVERY',
        reason: 'Website traffic stabilized; error rate restored to 0.0%, latency nominal.',
        affected_service: 'cluster-wide',
        current_action: 'All endpoints reporting HEALTHY',
      });
    }
  }, [securityVerdict?.risk_level, securityVerdict?.traffic_classification, demoStatus?.current_stage, addNotification]);

  // Faculty Demo Controls
  const startFacultyDemo = useCallback(async () => {
    try {
      const res = await api.startFacultyDemo();
      setDemoStatus(res);
      addToast('Faculty Demonstration started!', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Could not start demo.', 'error');
    }
  }, [addToast]);

  const pauseFacultyDemo = useCallback(async () => {
    try {
      const res = await api.pauseFacultyDemo();
      setDemoStatus(res);
      addToast('Demonstration paused.', 'info');
    } catch (err: any) {
      addToast(err?.message || 'Could not pause demo.', 'error');
    }
  }, [addToast]);

  const resumeFacultyDemo = useCallback(async () => {
    try {
      const res = await api.resumeFacultyDemo();
      setDemoStatus(res);
      addToast('Demonstration resumed.', 'info');
    } catch (err: any) {
      addToast(err?.message || 'Could not resume demo.', 'error');
    }
  }, [addToast]);

  const stopFacultyDemo = useCallback(async () => {
    try {
      const res = await api.stopFacultyDemo();
      setDemoStatus(res);
      addToast('Demonstration stopped.', 'info');
    } catch (err: any) {
      addToast(err?.message || 'Could not stop demo.', 'error');
    }
  }, [addToast]);

  const resetFacultyDemo = useCallback(async () => {
    try {
      const res = await api.resetFacultyDemo();
      setDemoStatus(res);
      await refreshData();
      addToast('System reset to clean baseline.', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Could not reset demo.', 'error');
    }
  }, [addToast, refreshData]);

  // Global keyboard shortcut: Ctrl+K / Cmd+K for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        timeRange,
        setTimeRange,
        overview,
        services,
        simulator,
        securityVerdict,
        demoStatus,
        shieldStatus,
        isInitialLoading,
        activeAlertsCount,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isNotificationOpen,
        setIsNotificationOpen,
        toasts,
        addToast,
        notifications,
        addNotification,
        refreshData,
        selectedServiceId,
        setSelectedServiceId,

        // Website Protection & Demo
        protectedWebsite,
        setProtectedWebsite,
        environment,
        setEnvironment,
        isFacultyDemoOpen,
        setIsFacultyDemoOpen,
        facultyDemoStep,
        setFacultyDemoStep,
        threatLevel,
        mitigationActive,
        setMitigationActive,
        rateLimitEnforced,
        setRateLimitEnforced,
        securityEvents,
        addSecurityEvent,
        theme,
        setTheme,
        toggleTheme,
        wsConnected,

        // Demo controls
        startFacultyDemo,
        pauseFacultyDemo,
        resumeFacultyDemo,
        stopFacultyDemo,
        resetFacultyDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
