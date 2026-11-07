import React, { useState, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { CommandPalette } from './components/CommandPalette';

import { OverviewPage } from './pages/OverviewPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { ServicesPage } from './pages/ServicesPage';
import { AutoScalingPage } from './pages/AutoScalingPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { AlertsPage } from './pages/AlertsPage';
import { CacheAnalyticsPage } from './pages/CacheAnalyticsPage';
import { SLOPage } from './pages/SLOPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { SettingsPage } from './pages/SettingsPage';

// Lazy-load heavy 3D and computational scenes for performance
const InfrastructurePage = lazy(() =>
  import('./pages/InfrastructurePage').then((m) => ({ default: m.InfrastructurePage }))
);
const TrafficSimulatorPage = lazy(() =>
  import('./pages/TrafficSimulatorPage').then((m) => ({ default: m.TrafficSimulatorPage }))
);
const ExperimentsPage = lazy(() =>
  import('./pages/ExperimentsPage').then((m) => ({ default: m.ExperimentsPage }))
);

const PageSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-20 bg-surface-200/50 rounded-xl border border-border" />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="h-28 bg-surface-200/40 rounded-xl border border-border" />
      <div className="h-28 bg-surface-200/40 rounded-xl border border-border" />
      <div className="h-28 bg-surface-200/40 rounded-xl border border-border" />
      <div className="h-28 bg-surface-200/40 rounded-xl border border-border" />
    </div>
    <div className="h-96 bg-surface-200/30 rounded-xl border border-border flex items-center justify-center text-xs font-mono text-slate-500">
      Initializing WebGL shaders & telemetry pipeline...
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { activeTab, toasts } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPage />;
      case 'monitoring':
        return <LiveMonitoringPage />;
      case 'services':
        return <ServicesPage />;
      case 'infrastructure':
        return (
          <Suspense fallback={<PageSkeleton />}>
            <InfrastructurePage />
          </Suspense>
        );
      case 'scaling':
        return <AutoScalingPage />;
      case 'simulator':
        return (
          <Suspense fallback={<PageSkeleton />}>
            <TrafficSimulatorPage />
          </Suspense>
        );
      case 'incidents':
        return <IncidentsPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'cache':
        return <CacheAnalyticsPage />;
      case 'experiments':
        return (
          <Suspense fallback={<PageSkeleton />}>
            <ExperimentsPage />
          </Suspense>
        );
      case 'slo':
        return <SLOPage />;
      case 'audit':
        return <AuditTrailPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex">
      {/* Persistent Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main App Workspace */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <TopBar onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {renderActivePage()}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-border/60 py-3.5 px-6 text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span>CloudPulse Platform v2.4</span>
            <span>•</span>
            <span className="text-emerald-400">Cluster Quorum: 99.98%</span>
            <span>•</span>
            <span>HPA v2</span>
          </div>
          <div>
            Built with React 19, TypeScript, Tailwind, Three.js & Python FastAPI
          </div>
        </footer>
      </div>

      {/* Global Command Palette (Cmd + K) */}
      <CommandPalette />

      {/* Global Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-lg border shadow-2xl text-xs font-mono flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
                : toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/40'
                : 'bg-surface-100/90 text-slate-200 border-border'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${
              toast.type === 'success' ? 'bg-emerald-400' : toast.type === 'error' ? 'bg-rose-400' : 'bg-cyan-400'
            }`} />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
