// frontend/src/features/showcase/layouts/ShowcaseLayout.tsx
import { Outlet, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

const BANNER_KEY = 'caresync-demo-banner-dismissed-v1';

export const ShowcaseLayout = () => {
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    setBannerVisible(sessionStorage.getItem(BANNER_KEY) !== '1');
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(BANNER_KEY, '1');
    setBannerVisible(false);
  };

  return (
    <div className="flex flex-col h-dvh w-full bg-bg-page text-text-main overflow-hidden">
      <div className="shrink-0 z-50">
        <Navbar />
      </div>

      <main className="flex-1 min-h-0 w-full relative overflow-y-auto overflow-x-hidden themed-scrollbar flex flex-col">
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
        <div className="shrink-0 z-40 mt-auto">
          <Footer />
        </div>
      </main>

      {bannerVisible && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-3xl
                     bg-amber-500/95 dark:bg-amber-400/90 backdrop-blur-md
                     border border-amber-600/60
                     text-amber-950 text-xs font-medium
                     px-4 py-2.5 pr-2 rounded-xl shadow-2xl
                     flex items-start sm:items-center gap-3"
        >
          <span className="flex-1 leading-relaxed">
            <span className="font-bold">Demo paused.</span>{' '}
            The Supabase free tier backing this project has been suspended.{' '}
            <a
              href="https://github.com/cmdaeo/caresync"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline font-semibold"
            >
              Source on GitHub
            </a>
            {' · '}
            <Link to="/status" className="underline hover:no-underline font-semibold">
              Status
            </Link>
          </span>
          <button
            onClick={dismiss}
            className="shrink-0 p-1 rounded-md hover:bg-amber-600/30 transition-colors"
            aria-label="Dismiss notice"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};