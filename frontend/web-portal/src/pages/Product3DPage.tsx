import { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Menu } from 'lucide-react';
import { COLORS } from '../theme/colors';

// Lazy load the 3D viewer
const Product3DViewer = lazy(() => import('../components/3d/Product3DViewer'));

const Product3DPage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        navigate('/');
      });
    } else {
      navigate('/');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-b from-slate-50 to-white min-h-screen font-sans"
    >
      {/* --- Hardcoded Navbar (Matches Landing Page) --- */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200/80 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
               {/* Using the icon from your screenshot/design */}
               <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="w-5 h-5"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
               </div>
               <span className="text-xl font-bold text-slate-900 tracking-tight">CareSync</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {['Impact', 'Products', 'Team', 'About'].map((item) => (
                <button
                  key={item}
                  onClick={() => navigate('/')} // Navigate home since these are anchors on landing
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>

            {/* CTA Button */}
            <div className="flex items-center gap-4">
              <button
                className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-2xl text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
              >
                Open Dashboard
              </button>
              <button className="md:hidden p-2 text-slate-600">
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        
        {/* Back Navigation */}
        <button
          onClick={handleBack}
          className="group flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-8 pl-1"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        {/* Product Showcase Card */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100 p-2">
          <div className="bg-slate-50/50 rounded-[1.5rem] p-6 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              
              {/* Left Column: Context & Details */}
              <div className="flex flex-col justify-center order-2 lg:order-1">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700 mb-6 w-fit">
                  Interactive Demo
                </div>
                
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
                  CareBox <span className="text-blue-600">3D</span>
                </h1>
                
                <p className="text-lg text-slate-600 leading-relaxed mb-8">
                  Experience the future of medication management. Rotate and zoom to explore the sleek design, secure locking mechanism, and intuitive interface of the CareBox hub.
                </p>

                <div className="space-y-4">
                  {[
                    "Smart sensor technology detects pill removal",
                    "Child-safe biometric locking mechanism",
                    "Cellular backup for 24/7 connectivity"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: 3D Viewer Container */}
              <div className="order-1 lg:order-2 h-[400px] lg:h-[500px] w-full relative rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-inner">
                <Suspense
                  fallback={
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50">
                      <div 
                        className="w-10 h-10 border-4 rounded-full animate-spin mb-4"
                        style={{ 
                          borderColor: COLORS.blueBell,
                          borderTopColor: 'transparent'
                        }}
                      />
                      <p className="text-sm font-semibold text-slate-500">Loading Model...</p>
                    </div>
                  }
                >
                  {/* Ensure your Product3DViewer handles its own specific styling/canvas if needed, 
                      or wraps it in a div like this to constrain it */}
                  <Product3DViewer />
                </Suspense>
                
                {/* Overlay Hint */}
                <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                  <span className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium text-slate-500 shadow-sm border border-slate-200">
                    Click & Drag to Rotate · Scroll to Zoom
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
};

export default Product3DPage;
