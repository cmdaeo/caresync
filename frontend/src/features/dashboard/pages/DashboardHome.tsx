// src/features/dashboard/pages/DashboardHome.tsx
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../shared/store/authStore';
import { client } from '../../../shared/api/client';
import { Bell, Pill, Activity, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  compartment: number;
}

export const DashboardHome = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const fetchMeds = async () => {
      try {
        const res = await client.get('/medications?limit=5').catch(() => null);
        if (res && res.data && res.data.data && res.data.data.length > 0) {
          setMeds(res.data.data);
        } else {
          setMeds([
            { id: '1', name: 'Lisinopril', dosage: '10mg', time: '08:00 AM', compartment: 1 },
            { id: '2', name: 'Metformin', dosage: '500mg', time: '08:00 AM', compartment: 2 },
          ]);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeds();
  }, []);

  return (
    /* Changed to h-dvh and overflow-y-auto */
    <div className="h-dvh w-full overflow-y-auto bg-bg-page text-text-main p-6 transition-colors duration-200 themed-scrollbar">
      
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.firstName || user?.email?.split('@')[0]}</h1>
            <p className="text-text-muted mt-1 text-sm">Here is your daily overview.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2.5 bg-bg-card rounded-full border border-border-subtle hover:bg-bg-hover transition-colors">
              <Bell className="text-text-muted w-5 h-5" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2.5 bg-bg-card rounded-full border border-border-subtle hover:bg-red-500/10 hover:text-red-500 transition-colors group"
              title="Logout"
            >
              <LogOut className="text-text-muted group-hover:text-red-500 w-5 h-5 transition-colors" />
            </button>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upcoming Medications Card */}
          <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle shadow-sm transition-colors duration-200">
            <div className="flex items-center gap-2 mb-5">
              <Pill className="text-brand-primary w-5 h-5" />
              <h2 className="font-semibold text-lg">Upcoming Doses</h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8"><Activity className="animate-spin text-text-muted" /></div>
            ) : (
              <div className="space-y-3">
                {meds.map((med) => (
                  <div key={med.id} className="flex justify-between items-center p-3.5 bg-bg-page rounded-xl border border-border-subtle">
                    <div>
                      <div className="font-semibold text-text-main">{med.name}</div>
                      <div className="text-xs text-text-muted mt-0.5">{med.dosage} • {med.time}</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-sm">
                      {med.compartment}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Adherence Stats Card */}
          <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle shadow-sm transition-colors duration-200">
            <div className="flex items-center gap-2 mb-5">
              <Activity className="text-green-500 w-5 h-5" />
              <h2 className="font-semibold text-lg">Weekly Adherence</h2>
            </div>
            
            <div className="h-40 flex items-end justify-between px-2 pt-4">
              {[90, 85, 100, 100, 95, 80, 100].map((h, i) => (
                <div key={i} className="w-8 bg-green-500/20 rounded-t-md relative" style={{ height: `${h}%` }}>
                  <div 
                    className="w-full bg-green-500 rounded-t-md absolute bottom-0 transition-all duration-1000" 
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* You can now add more widgets down here, and they will scroll perfectly! */}
      </div>
    </div>
  );
};
