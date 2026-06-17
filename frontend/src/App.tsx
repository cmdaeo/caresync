// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Layouts
import { ShowcaseLayout } from './features/showcase/layouts/ShowcaseLayout'
import { AuthLayout } from './features/auth/layouts/AuthLayout'
import { DashboardLayout } from './features/dashboard/layouts/DashboardLayout'

// Auth & Protection
import { LoginPage } from './features/auth/pages/LoginPage'
import { RegisterPage } from './features/auth/pages/RegisterPage'
import { ProtectedRoute } from './features/auth/components/ProtectedRoute'
import { RoleBasedRoute, dashboardPathForRole } from './features/auth/components/RoleBasedRoute'

import { ForgotPasswordPage } from './features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from './features/auth/pages/ResetPasswordPage'

// Showcase Pages
import LandingPage from './features/showcase/pages/LandingPage'
import { HardwareEvolutionPage } from './features/showcase/pages/HardwareEvolutionPage'
import { SecurityDeepDivePage } from './features/showcase/pages/SecurityDeepDivePage'
import { SoftwareArchitecturePage } from './features/showcase/pages/SoftwareArchitecturePage'
import { UnifiedTimelinePage } from './features/showcase/pages/UnifiedTimelinePage'
import { TeamPage } from './features/showcase/pages/TeamPage'
import { PresentationPage } from './features/showcase/pages/PresentationPage'
import { PrivacyPolicyPage } from './features/showcase/pages/PrivacyPolicyPage'
import { TermsOfServicePage } from './features/showcase/pages/TermsOfServicePage'
import { StatusPage } from './features/showcase/pages/StatusPage'
import { ReviewsPage } from './features/showcase/pages/ReviewsPage' // <--- Imported new page
import { SystemManualsPage } from './features/showcase/pages/SystemManualsPage'

// Dashboard Pages
import { PatientDashboard } from './features/dashboard/pages/PatientDashboard'
import { CaregiverDashboard } from './features/dashboard/pages/CaregiverDashboard'
import { CaregiverPatientDetail } from './features/dashboard/pages/CaregiverPatientDetail'
import { SecuritySettings } from './features/dashboard/pages/SecuritySettings'

// Medication Pages
import { MyMedicationsPage } from './features/medications/pages/MyMedicationsPage'
import { AddMedicationPage } from './features/medications/pages/AddMedicationPage'
import { EditMedicationPage } from './features/medications/pages/EditMedicationPage'
import { SchedulePage } from './features/medications/pages/SchedulePage'

// Device & Report Pages
import { DevicesPage } from './features/devices/pages/DevicesPage'
import { ReportsPage } from './features/reports/pages/ReportsPage'

// Caregivers
import { MyCaregiversPage } from './features/caregivers/pages/MyCaregiversPage'
import { CaregiverPatientsPage } from './features/caregivers/pages/CaregiverPatientsPage'
import { CaregiverMedicationsPage } from './features/medications/pages/CaregiverMedicationsPage'
import { CaregiverReportsPage } from './features/reports/pages/CaregiverReportsPage'
import { VerifyPage } from './features/reports/pages/VerifyPage'

// Helper: redirects /app to the user's role-appropriate dashboard
import { useAuthStore } from './shared/store/authStore'

import { Capacitor } from '@capacitor/core';

function AppIndexRedirect() {
  const user = useAuthStore((s) => s.user)
  return <Navigate to={dashboardPathForRole(user?.role)} replace />
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={
            Capacitor.isNativePlatform() 
              ? <Navigate to="/login" replace />  // <-- REMOVED /auth
              : <LandingPage />
          } 
        />

        <Route path="/presentation" element={<PresentationPage />} />
        <Route path="/reviews" element={<ReviewsPage />} /> {/* <--- New Route Map */}
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        

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
          <Route path="manual" element={<SystemManualsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route index element={<Navigate to="hardware" replace />} />
        </Route>

        {/* ─── PROTECTED DASHBOARD (nested under DashboardLayout) ─── */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* /app → redirect to role-appropriate dashboard */}
          <Route index element={<AppIndexRedirect />} />

          {/* Patient-only */}
          <Route
            path="patient"
            element={
              <RoleBasedRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </RoleBasedRoute>
            }
          />

          <Route
            path="caregiver"
            element={
              <RoleBasedRoute allowedRoles={['caregiver', 'healthcare_provider']}>
                <CaregiverDashboard />
              </RoleBasedRoute>
            }
          />
          <Route
            path="caregiver/patients"
            element={
              <RoleBasedRoute allowedRoles={['caregiver', 'healthcare_provider']}>
                <CaregiverPatientsPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="caregiver/patient/:patientId"
            element={
              <RoleBasedRoute allowedRoles={['caregiver', 'healthcare_provider']}>
                <CaregiverPatientDetail />
              </RoleBasedRoute>
            }
          />
          <Route
            path="caregiver/medications"
            element={
              <RoleBasedRoute allowedRoles={['caregiver', 'healthcare_provider']}>
                <CaregiverMedicationsPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="caregiver/medications/add"
            element={
              <RoleBasedRoute allowedRoles={['caregiver', 'healthcare_provider']}>
                <AddMedicationPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="caregiver/reports"
            element={
              <RoleBasedRoute allowedRoles={['caregiver', 'healthcare_provider']}>
                <CaregiverReportsPage />
              </RoleBasedRoute>
            }
          />

          {/* Medications — patient-only CRUD */}
          <Route
            path="medications"
            element={
              <RoleBasedRoute allowedRoles={['patient']}>
                <MyMedicationsPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="medications/add"
            element={
              <RoleBasedRoute allowedRoles={['patient']}>
                <AddMedicationPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="medications/:id/edit"
            element={
              <RoleBasedRoute allowedRoles={['patient']}>
                <EditMedicationPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="caregivers"
            element={
              <RoleBasedRoute allowedRoles={['patient']}>
                <MyCaregiversPage />
              </RoleBasedRoute>
            }
          />

          {/* Schedule — patient-only */}
          <Route
            path="schedule"
            element={
              <RoleBasedRoute allowedRoles={['patient']}>
                <SchedulePage />
              </RoleBasedRoute>
            }
          />

          {/* Devices — patient-only */}
          <Route
            path="devices"
            element={
              <RoleBasedRoute allowedRoles={['patient']}>
                <DevicesPage />
              </RoleBasedRoute>
            }
          />

          {/* Reports — patient-only */}
          <Route
            path="reports"
            element={
              <RoleBasedRoute allowedRoles={['patient']}>
                <ReportsPage />
              </RoleBasedRoute>
            }
          />

          {/* Settings — accessible to all authenticated roles */}
          <Route path="settings" element={<SecuritySettings />} />
        </Route>

        {/* 404 Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
