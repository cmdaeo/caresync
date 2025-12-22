import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar'; 
import { Footer } from '../components/Footer'; 

export const ShowcaseLayout = () => {
  return (
    <div className="min-h-screen bg-bg-page flex flex-col transition-colors duration-300">
      <Navbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
