import { motion } from 'framer-motion';
import { ArrowRight, Activity, DollarSign, AlertTriangle } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* --- HEADER --- */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-md shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <span className="text-2xl font-bold text-teal-700">CareSync</span>
            <div className="hidden md:flex space-x-8 items-center">
              <a href="#features" className="text-gray-600 hover:text-teal-700">Features</a>
              <a href="#team" className="text-gray-600 hover:text-teal-700">Team</a>
              <a href="/dashboard" className="bg-teal-700 text-white px-5 py-2 rounded-full font-medium hover:bg-teal-800 transition-colors">
                Open Dashboard
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 text-center px-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-extrabold text-gray-900 sm:text-6xl"
        >
          CareSync: Your health, <span className="text-teal-700">on time.</span>
        </motion.h1>
        <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
          The complete medication management ecosystem designed for reliability, accessibility, and peace of mind.
        </p>
        <div className="mt-8">
          <a href="#features" className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-md text-white bg-teal-700 hover:bg-teal-800 transition-all">
            Learn More <ArrowRight className="ml-2 h-5 w-5" />
          </a>
        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6 bg-gray-50 rounded-2xl">
            <Activity className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <div className="text-4xl font-bold text-gray-900">50%</div>
            <div className="text-sm text-gray-500 uppercase mt-2">Non-Adherence Rate</div>
            <p className="mt-2 text-gray-600">Patients with chronic diseases don't take meds as prescribed.</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl">
            <DollarSign className="h-10 w-10 text-green-500 mx-auto mb-4" />
            <div className="text-4xl font-bold text-gray-900">$300B</div>
            <div className="text-sm text-gray-500 uppercase mt-2">Annual Cost</div>
            <p className="mt-2 text-gray-600">Avoidable healthcare costs generated annually.</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl">
            <AlertTriangle className="h-10 w-10 text-orange-500 mx-auto mb-4" />
            <div className="text-4xl font-bold text-gray-900">125,000</div>
            <div className="text-sm text-gray-500 uppercase mt-2">Annual Deaths</div>
            <p className="mt-2 text-gray-600">Lives lost in the US annually due to non-adherence.</p>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500">© 2025 CareSync. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
