//import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ShowcaseLayout } from './features/showcase/layouts/ShowcaseLayout';
import { HardwareEvolutionPage } from './features/showcase/pages/HardwareEvolutionPage';
import { SecurityDeepDivePage } from './features/showcase/pages/SecurityDeepDivePage';
import { SoftwareArchitecturePage } from './features/showcase/pages/SoftwareArchitecturePage';
import { UnifiedTimelinePage } from './features/showcase/pages/UnifiedTimelinePage';
import { DashboardHome } from './features/dashboard/pages/DashboardHome';

// Placeholder for TeamPage until we build it
const TeamPage = () => <div className="text-white text-center py-20">Team Credits Coming Soon</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Showcase Routes */}
        <Route path="/showcase" element={<ShowcaseLayout />}>
          <Route path="hardware" element={<HardwareEvolutionPage />} />
          <Route path="software" element={<SoftwareArchitecturePage />} />
          <Route path="security" element={<SecurityDeepDivePage />} />
          <Route path="timeline" element={<UnifiedTimelinePage />} />
          <Route path="team" element={<TeamPage />} />
          <Route index element={<Navigate to="hardware" replace />} />
        </Route>

        {/* Product Routes (Legacy Logic) */}
        <Route path="/app" element={<DashboardHome />} />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/showcase" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
