import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import useAuthStore from './store/useAuthStore';
import LoadingSpinner from './components/LoadingSpinner';

import { Capacitor } from '@capacitor/core';

// Lazy load pages for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Product3DPage = lazy(() => import('./pages/Product3DPage'));
const DashboardHome = lazy(() => import('./pages/DashboardHome'));
const SchedulePage = lazy(() => import('./pages/SchedulePage'));
const MedicationsPage = lazy(() => import('./pages/MedicationsPage'));
const CaregiversPage = lazy(() => import('./pages/CaregiversPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const MedicationDetailsPage = lazy(() => import('./pages/MedicationDetailsPage'));
const DeviceDetailsPage = lazy(() => import('./pages/DeviceDetailsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const DevicesPage = lazy(() => import('./pages/DevicesPage'));
const CalendarViewPage = lazy(() => import('./pages/CalendarViewPage'));
const CaregiverDashboard = lazy(() => import('./pages/CaregiverDashboard'));
const CaregiverMedicationsPage = lazy(() => import('./pages/CaregiverMedicationsPage'));

// Route transition wrapper
const RouteWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="page-wrapper">
      {children}
    </div>
  );
};

// This component protects routes that require authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  return token ? children : <Navigate to="/login" replace />;
};

// Language selector component
const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg p-1 flex space-x-1">
        <button
          onClick={() => changeLanguage('en')}
          className={`px-3 py-1 rounded-full text-sm ${i18n.language === 'en' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300'}`}
        >
          EN
        </button>
        <button
          onClick={() => changeLanguage('pt')}
          className={`px-3 py-1 rounded-full text-sm ${i18n.language === 'pt' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300'}`}
        >
          PT
        </button>
        <button
          onClick={() => changeLanguage('es')}
          className={`px-3 py-1 rounded-full text-sm ${i18n.language === 'es' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300'}`}
        >
          ES
        </button>
        <button
          onClick={() => changeLanguage('fr')}
          className={`px-3 py-1 rounded-full text-sm ${i18n.language === 'fr' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300'}`}
        >
          FR
        </button>
      </div>
    </div>
  );
};

function App() {
  const isNative = Capacitor.isNativePlatform();
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <RouteWrapper>
                  {isNative ? <Navigate to="/login" replace /> : <LandingPage />}
                </RouteWrapper>
              }
            />
            <Route
              path="/products/:productName"
              element={
                <RouteWrapper>
                  <Product3DPage />
                </RouteWrapper>
              }
            />
            <Route
              path="/login"
              element={
                <RouteWrapper>
                  <LoginPage />
                </RouteWrapper>
              }
            />
            <Route
              path="/register"
              element={
                <RouteWrapper>
                  <RegisterPage />
                </RouteWrapper>
              }
            />

            {/* Private Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <RouteWrapper>
                    <DashboardHome />
                  </RouteWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/schedule"
              element={
                <ProtectedRoute>
                  <RouteWrapper>
                    <SchedulePage />
                  </RouteWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/medications"
              element={
                <ProtectedRoute>
                  <RouteWrapper>
                    <MedicationsPage />
                  </RouteWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/medications/:id"
              element={
                <RouteWrapper>
                  <MedicationDetailsPage />
                </RouteWrapper>
              }
            />
            <Route
              path="/dashboard/devices"
              element={
                <ProtectedRoute>
                  <RouteWrapper>
                    <DevicesPage />
                  </RouteWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/caregivers"
              element={
                <ProtectedRoute>
                  <RouteWrapper>
                    <CaregiversPage />
                  </RouteWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/reports"
              element={
                <ProtectedRoute>
                  <RouteWrapper>
                    <ReportsPage />
                  </RouteWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute>
                  <RouteWrapper>
                    <SettingsPage />
                  </RouteWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/devices/:id"
              element={
                <RouteWrapper>
                  <DeviceDetailsPage />
                </RouteWrapper>
              }
            />
            <Route
              path="/dashboard/notifications"
              element={
                <RouteWrapper>
                  <NotificationsPage />
                </RouteWrapper>
              }
            />
            <Route
              path="/dashboard/profile"
              element={
                <RouteWrapper>
                  <ProfilePage />
                </RouteWrapper>
              }
            />

            {/* New Routes */}
            <Route
              path="/dashboard/calendar"
              element={
                <ProtectedRoute>
                  <RouteWrapper>
                    <CalendarViewPage />
                  </RouteWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/caregiver"
              element={
                <ProtectedRoute>
                  <RouteWrapper>
                    <CaregiverDashboard />
                  </RouteWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/medications/add"
              element={
                <ProtectedRoute>
                  <RouteWrapper>
                    <CaregiverMedicationsPage />
                  </RouteWrapper>
                </ProtectedRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <LanguageSelector />
        </Suspense>
      </AnimatePresence>
    </BrowserRouter>
  );
}

export default App;
