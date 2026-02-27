// shared/components/UniversalNavbar.tsx
// Re-exports the Navbar as a shared component that can be used on any page.
// The Navbar is auth-aware: shows "Dashboard" when logged in, "Live Demo" when not.
// Zustand persist reads localStorage synchronously, so there is no auth-state flicker.

export { Navbar as UniversalNavbar } from '@/features/showcase/components/Navbar';
