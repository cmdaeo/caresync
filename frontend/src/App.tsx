// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { ShowcaseLayout } from './features/showcase/layouts/ShowcaseLayout';
import { AuthLayout } from './features/auth/layouts/AuthLayout';

// Auth & Protection
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';

import { ForgotPasswordPage } from './features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/pages/ResetPasswordPage';

// Showcase Pages
import LandingPage from './features/showcase/pages/LandingPage';
import { HardwareEvolutionPage } from './features/showcase/pages/HardwareEvolutionPage';
import { SecurityDeepDivePage } from './features/showcase/pages/SecurityDeepDivePage';
import { SoftwareArchitecturePage } from './features/showcase/pages/SoftwareArchitecturePage';
import { UnifiedTimelinePage } from './features/showcase/pages/UnifiedTimelinePage';
import { TeamPage } from './features/showcase/pages/TeamPage';

// Dashboard Pages
import { DashboardHome } from './features/dashboard/pages/DashboardHome';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<LandingPage />} />
        
        {/* AUTH ROUTES (Wrapped in Theme-Aware Layout) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* PUBLIC SHOWCASE */}
        <Route path="/showcase" element={<ShowcaseLayout />}>
          <Route path="hardware" element={<HardwareEvolutionPage />} />
          <Route path="software" element={<SoftwareArchitecturePage />} />
          <Route path="security" element={<SecurityDeepDivePage />} />
          <Route path="timeline" element={<UnifiedTimelinePage />} />
          <Route path="team" element={<TeamPage />} />
          <Route index element={<Navigate to="hardware" replace />} />
        </Route>

        {/* PROTECTED DASHBOARD ROUTES */}
        <Route 
          path="/app" 
          element={
            <ProtectedRoute>
              <DashboardHome />
            </ProtectedRoute>
          } 
        />

        {/* 404 Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
