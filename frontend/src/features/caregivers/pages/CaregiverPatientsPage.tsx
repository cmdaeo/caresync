import { useEffect, useState } from 'react';
import { Users, Search, CheckCircle2, ChevronRight, XCircle, HeartPulse, Loader2 } from 'lucide-react';
import { client } from '../../../shared/api/client';
import { useNavigate } from 'react-router-dom';

interface Patient {
  id: string; // Relationship ID
  patientId: string; // User ID
  patient: {
    firstName: string;
    lastName: string;
    email: string;
  };
  permissions: {
    canViewMedications: boolean;
    canViewAdherence: boolean;
  };
  isActive: boolean;
}

export const CaregiverPatientsPage = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const patientsRes = await client.get('/patients');
      const pts = patientsRes.data?.data?.patients || patientsRes.data?.data || [];
      const activePts = Array.isArray(pts) ? pts.filter(p => p.status === 'Active') : [];
      setPatients(activePts);
    } catch (err) {
      console.error('Failed to load patients data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPatients = patients.filter(p => 
    `${p.patient?.firstName} ${p.patient?.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    p.patient?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <Users size={28} className="text-brand-primary" />
            My Patients
          </h1>
          <p className="text-text-muted mt-1">Directory of all patients you manage.</p>
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-bg-card border border-border-subtle rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all w-full sm:w-64 text-text-main"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 size={32} className="animate-spin text-brand-primary" />
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-bg-card p-10 rounded-2xl border border-border-subtle shadow-sm flex flex-col items-center justify-center text-text-muted">
          <HeartPulse size={48} className="mb-4 text-brand-primary/60" />
          <p className="text-lg font-semibold text-text-main">No active patients</p>
          <p className="text-sm mt-2 max-w-sm text-center opacity-80">You are not currently managing any patients. Invite patients from the dashboard.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((p) => (
            <div 
              key={p.id} 
              onClick={() => navigate(`/app/caregiver/patient/${p.patientId}`)}
              className="bg-bg-card border border-border-subtle rounded-2xl p-5 shadow-sm group hover:shadow-md transition-all hover:border-brand-primary/30 cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-text-main truncate mt-1 group-hover:text-brand-primary transition-colors">
                    {p.patient?.firstName} {p.patient?.lastName}
                  </h3>
                  <p className="text-sm text-text-muted truncate">{p.patient?.email}</p>
                </div>
                <div className="bg-bg-main p-2 rounded-full text-text-muted group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                  <ChevronRight size={18} />
                </div>
              </div>
              
              <div className="p-3 bg-bg-main/50 rounded-xl space-y-2 mt-auto">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-2 flex items-center gap-1.5"><CheckCircle2 size={12}/>Permissions</h4>
                <div className="flex items-center gap-2 text-sm text-text-main">
                  <CheckCircle2 size={14} className={p.permissions?.canViewMedications ? "text-emerald-500" : "text-border-subtle"} />
                  <span className={!p.permissions?.canViewMedications ? "text-text-muted line-through opacity-50" : ""}>Manage Medications</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-main">
                  <CheckCircle2 size={14} className={p.permissions?.canViewAdherence ? "text-emerald-500" : "text-border-subtle"} />
                  <span className={!p.permissions?.canViewAdherence ? "text-text-muted line-through opacity-50" : ""}>Monitor Adherence</span>
                </div>
              </div>
            </div>
          ))}
          {filteredPatients.length === 0 && search && (
            <div className="col-span-full p-10 text-center text-text-muted bg-bg-card rounded-2xl border border-border-subtle">
              No patients found matching "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
