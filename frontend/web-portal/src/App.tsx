import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';

// Page Imports
import LandingPage from './pages/LandingPage';
import DashboardHome from './pages/DashboardHome';
import SchedulePage from './pages/SchedulePage';
import MedicationsPage from './pages/MedicationsPage';
import CaregiversPage from './pages/CaregiversPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; // ADD THIS
import MedicationDetailsPage from './pages/MedicationDetailsPage';
import DeviceDetailsPage from './pages/DeviceDetailsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import DevicesPage from './pages/DevicesPage';
import NFCTransferPage from './pages/NFCTransferPage';

// This component protects routes that require authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} /> {/* ADD THIS */}

        {/* Private Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
        <Route path="/dashboard/schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
        <Route path="/dashboard/medications" element={<ProtectedRoute><MedicationsPage /></ProtectedRoute>} />
        <Route path="/dashboard/medications/:id" element={<MedicationDetailsPage />} />
        <Route path="/dashboard/devices" element={<ProtectedRoute><DevicesPage /></ProtectedRoute>} />
        <Route path="/dashboard/caregivers" element={<ProtectedRoute><CaregiversPage /></ProtectedRoute>} />
        <Route path="/dashboard/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/dashboard/devices/:id" element={<DeviceDetailsPage />} />
        <Route path="/dashboard/notifications" element={<NotificationsPage />} />
        <Route path="/dashboard/profile" element={<ProfilePage />} />
        <Route path="/dashboard/nfc" element={<ProtectedRoute><NFCTransferPage /></ProtectedRoute>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
