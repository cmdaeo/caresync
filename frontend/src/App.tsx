import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { ShowcaseLayout } from './features/showcase/layouts/ShowcaseLayout';

// Showcase Pages
import LandingPage from './features/showcase/pages/LandingPage'; // Import your new page
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
        
        {/* 1. LANDING PAGE (The new Root) */}
        {/* We do NOT wrap this in ShowcaseLayout if you want a full-screen hero. 
            If you want the Navbar, wrap it. For a "Hacker" vibe, keep it separate. */}
        <Route path="/" element={<LandingPage />} />

        {/* 2. PUBLIC SHOWCASE SECTION (Wrapped in Layout) */}
        <Route path="/showcase" element={<ShowcaseLayout />}>
          <Route path="hardware" element={<HardwareEvolutionPage />} />
          <Route path="software" element={<SoftwareArchitecturePage />} />
          <Route path="security" element={<SecurityDeepDivePage />} />
          <Route path="timeline" element={<UnifiedTimelinePage />} />
          <Route path="team" element={<TeamPage />} />
          
          {/* Default to hardware if just /showcase is visited */}
          <Route index element={<Navigate to="hardware" replace />} />
        </Route>

        {/* 3. DASHBOARD/PRODUCT SECTION */}
        <Route path="/app" element={<DashboardHome />} />

        {/* 4. CATCH-ALL (Optional) */}
        {/* Redirect unknown 404s back to the landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}
