import /*React,*/ { useEffect, useState } from 'react';
import { useAuthStore } from '../../../shared/store/authStore';
//import { client } from '../../../shared/api/client'; // Using our re-implemented client
import { Bell, Pill, Activity } from 'lucide-react';

// Re-implementing Medication Types from paste.txt
interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  compartment: number;
}

export const DashboardHome = () => {
  const { user } = useAuthStore();
  const [meds, setMeds] = useState<Medication[]>([]);
  const [_, setLoading] = useState(true);

  // Logic adapted from paste.txt's "getUpcomingDoses"
  useEffect(() => {
    const fetchMeds = async () => {
      try {
        // In a real scenario, this hits the API. We'll mock for the showcase demo if API is down.
        // const res = await client.get('/medications/upcoming-doses');
        // setMeds(res.data);
        
        // Simulated response based on paste.txt data models
        setMeds([
          { id: '1', name: 'Lisinopril', dosage: '10mg', time: '08:00 AM', compartment: 1 },
          { id: '2', name: 'Metformin', dosage: '500mg', time: '08:00 AM', compartment: 2 },
        ]);
      } catch (err) {
        console.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchMeds();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.email || 'User'}</h1>
          <p className="text-gray-500">Here is your daily overview.</p>
        </div>
        <div className="p-2 bg-white rounded-full shadow-sm">
          <Bell className="text-gray-600" />
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Medications Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Pill className="text-blue-500" />
            <h2 className="font-semibold text-lg">Upcoming Doses</h2>
          </div>
          <div className="space-y-3">
            {meds.map((med) => (
              <div key={med.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{med.name}</div>
                  <div className="text-sm text-gray-500">{med.dosage} • {med.time}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                  {med.compartment}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Adherence Stats Card (Logic from paste.txt) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-green-500" />
            <h2 className="font-semibold text-lg">Weekly Adherence</h2>
          </div>
          <div className="h-32 flex items-end justify-between px-4">
             {/* Simple bar chart visualization */}
             {[90, 85, 100, 100, 95, 80, 100].map((h, i) => (
               <div key={i} className="w-8 bg-green-500/20 rounded-t" style={{ height: `${h}%` }}>
                 <div className="w-full bg-green-500 rounded-t absolute bottom-0" style={{ height: `${h}%` }} />
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};
