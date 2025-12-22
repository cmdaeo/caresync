import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { ShowcaseLayout } from './features/showcase/layouts/ShowcaseLayout';

// Showcase Pages
import { HardwareEvolutionPage } from './features/showcase/pages/HardwareEvolutionPage';
import { SecurityDeepDivePage } from './features/showcase/pages/SecurityDeepDivePage';
import { SoftwareArchitecturePage } from './features/showcase/pages/SoftwareArchitecturePage';
import { UnifiedTimelinePage } from './features/showcase/pages/UnifiedTimelinePage';
import { TeamPage } from './features/showcase/pages/TeamPage';

// Dashboard Pages
import { DashboardHome } from './features/dashboard/pages/DashboardHome';

// --- MAIN APP COMPONENT ---
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* PUBLIC SHOWCASE SECTION (Wrapped in Layout) */}
        <Route path="/showcase" element={<ShowcaseLayout />}>
          <Route path="hardware" element={<HardwareEvolutionPage />} />
          <Route path="software" element={<SoftwareArchitecturePage />} />
          <Route path="security" element={<SecurityDeepDivePage />} />
          <Route path="timeline" element={<UnifiedTimelinePage />} />
          <Route path="team" element={<TeamPage />} />
          
          {/* Default to hardware if just /showcase is visited */}
          <Route index element={<Navigate to="hardware" replace />} />
        </Route>

        {/* DASHBOARD/PRODUCT SECTION (No Showcase Layout) */}
        <Route path="/app" element={<DashboardHome />} />

        {/* ROOT REDIRECT */}
        <Route path="/" element={<Navigate to="/showcase" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}
