import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { SystemOverview, ServiceItem, SimulatorStatus, SecurityEvent, ThreatLevel } from '../services/types';
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
  isInitialLoading: boolean;
  activeAlertsCount: number;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isNotificationOpen: boolean;
  setIsNotificationOpen: (open: boolean) => void;
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialTab = urlParams?.get('tab') || 'overview';
  const initialDemo = urlParams?.get('demo') === 'true';

  const [activeTab, setActiveTabState] = useState<string>(initialTab);
  const [timeRange, setTimeRange] = useState<string>('15m');
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [simulator, setSimulator] = useState<SimulatorStatus | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

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
      const [ov, svcs, sim, alerts] = await Promise.all([
        api.getOverview().catch(() => null),
        api.getServices().catch(() => []),
        api.getSimulatorStatus().catch(() => null),
        api.getAlerts().catch(() => []),
      ]);
      if (ov) setOverview(ov);
      if (svcs.length > 0) setServices(svcs);
      if (sim) setSimulator(sim);
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

  // Derive dynamic Threat Level from actual metrics and active simulations
  const threatLevel: ThreatLevel = useMemo(() => {
    if (simulator?.is_running) {
      const p = simulator.pattern;
      if (p === 'failure' || p === 'flood') return 'Critical';
      if (p === 'burst' || p === 'resource') return 'High Risk';
      if (p === 'spike' || p === 'gradual') return 'Suspicious';
      return 'Monitoring';
    }
    if (overview) {
      if (overview.status === 'critical' || (overview.error_rate_percent && overview.error_rate_percent > 5)) {
        return 'Critical';
      }
      if (overview.status === 'degraded' || (overview.error_rate_percent && overview.error_rate_percent > 2)) {
        return 'High Risk';
      }
      if (overview.total_rps > 12 || overview.cpu_utilization_percent > 85) {
        return 'Suspicious';
      }
    }
    return 'Normal';
  }, [simulator, overview]);

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
        isInitialLoading,
        activeAlertsCount,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isNotificationOpen,
        setIsNotificationOpen,
        toasts,
        addToast,
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
