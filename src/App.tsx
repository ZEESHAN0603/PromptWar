import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { AppLayout } from './components/layout/AppLayout';
import { AdaptivePlanningModal } from './components/adaptive/AdaptivePlanningModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { EventWizardPage } from './pages/EventWizardPage';
import { EventOverviewPage } from './pages/EventOverviewPage';
import { BudgetPage } from './pages/BudgetPage';
import { TimelinePage } from './pages/TimelinePage';
import { GuestPage } from './pages/GuestPage';
import { VendorPage } from './pages/VendorPage';
import { IdeasPage } from './pages/IdeasPage';
import { SettingsPage } from './pages/SettingsPage';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Protected Route Wrapper for frontend demo
function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated } = useAppStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const { theme } = useAppStore();
  const [isAdaptiveModalOpen, setIsAdaptiveModalOpen] = useState(false);

  // Sync theme to root html element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleOpenAdaptiveModal = () => {
    setIsAdaptiveModalOpen(true);
  };

  const handleCloseAdaptiveModal = () => {
    setIsAdaptiveModalOpen(false);
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Application Layout Protected Routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout onOpenAdaptiveModal={handleOpenAdaptiveModal} />
            </ProtectedRoute>
          }
        >
          {/* Main Dashboard */}
          <Route path="dashboard" element={<DashboardPage onOpenAdaptiveModal={handleOpenAdaptiveModal} />} />

          {/* Event Creation Wizard */}
          <Route path="events/new" element={<EventWizardPage />} />

          {/* Event Workspace Routes */}
          <Route
            path="events/:eventId/overview"
            element={<EventOverviewPage onOpenAdaptiveModal={handleOpenAdaptiveModal} />}
          />
          <Route
            path="events/:eventId/budget"
            element={<BudgetPage onOpenAdaptiveModal={handleOpenAdaptiveModal} />}
          />
          <Route
            path="events/:eventId/timeline"
            element={<TimelinePage onOpenAdaptiveModal={handleOpenAdaptiveModal} />}
          />
          <Route
            path="events/:eventId/guests"
            element={<GuestPage onOpenAdaptiveModal={handleOpenAdaptiveModal} />}
          />
          <Route
            path="events/:eventId/vendors"
            element={<VendorPage onOpenAdaptiveModal={handleOpenAdaptiveModal} />}
          />
          <Route
            path="events/:eventId/ideas"
            element={<IdeasPage onOpenAdaptiveModal={handleOpenAdaptiveModal} />}
          />

          {/* User Settings */}
          <Route path="settings" element={<SettingsPage />} />

          {/* Default redirect inside /app */}
          <Route index element={<Navigate to="/app/dashboard" replace />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Adaptive Re-Planning Simulation Modal */}
      {isAdaptiveModalOpen && (
        <AdaptivePlanningModal
          isOpen={isAdaptiveModalOpen}
          onClose={handleCloseAdaptiveModal}
        />
      )}
    </BrowserRouter>
  );
}
