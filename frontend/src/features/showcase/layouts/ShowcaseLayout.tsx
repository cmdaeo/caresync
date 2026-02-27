// frontend/src/features/showcase/layouts/ShowcaseLayout.tsx
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const ShowcaseLayout = () => {
  return (
    // 1. Outer container is fixed height (viewport)
    <div className="flex flex-col h-dvh w-full bg-bg-page text-text-main overflow-hidden">
      
      {/* 2. Navbar stays fixed at the top */}
      <div className="shrink-0 z-50">
        <Navbar />
      </div>

      {/* 3. Main scrolls AND contains the Footer at the bottom */}
      <main className="flex-1 min-h-0 w-full relative overflow-y-auto overflow-x-hidden themed-scrollbar flex flex-col">
        
        {/* Content grows to fill space or pushes footer down */}
        <div className="flex-1">
          <Outlet />
        </div>

        {/* Footer is now part of the scrollable flow */}
        <div className="shrink-0 z-40 mt-auto">
          <Footer />
        </div>
        
      </main>
    </div>
  );
};
