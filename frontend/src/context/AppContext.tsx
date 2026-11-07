import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SystemOverview, ServiceItem, SimulatorStatus } from '../services/types';
import { api } from '../services/api';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  environment: string;
  setEnvironment: (env: string) => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
  overview: SystemOverview | null;
  services: ServiceItem[];
  simulator: SimulatorStatus | null;
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
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [environment, setEnvironment] = useState<string>('production');
  const [timeRange, setTimeRange] = useState<string>('15m');
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [simulator, setSimulator] = useState<SimulatorStatus | null>(null);
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(1);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
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
          console.log('[WebSocket] Connected to CloudPulse Telemetry stream');
        };
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.overview) setOverview(data.overview);
            if (data.services) setServices(data.services);
            if (data.simulator) setSimulator(data.simulator);
          } catch (e) {
            // ignore
          }
        };
        ws.onerror = () => {
          // If WS fails, fallback to 2s polling
          if (!pollInterval) {
            pollInterval = setInterval(refreshData, 2000);
          }
        };
        ws.onclose = () => {
          if (!pollInterval) {
            pollInterval = setInterval(refreshData, 2000);
          }
          // Try reconnecting in 5s
          setTimeout(connectWebSocket, 5000);
        };
      } catch (e) {
        pollInterval = setInterval(refreshData, 2000);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [refreshData]);

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
        environment,
        setEnvironment,
        timeRange,
        setTimeRange,
        overview,
        services,
        simulator,
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
