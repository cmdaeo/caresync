import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pill, Loader2, Calendar, Plus } from 'lucide-react';
import { client } from '../../../shared/api/client';

interface CaregiverMedication {
  id: string;
  name: string;
  dosage: string;
  dosageUnit: string;
  frequency: string | null;
  isPRN: boolean;
  totalQuantity: number | null;
  remainingQuantity: number | null;
  startDate: string | null;
  endDate: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export const CaregiverMedicationsPage = () => {
  const [medications, setMedications] = useState<CaregiverMedication[]>([]);
  const [patients, setPatients] = useState<{id: string, patientId: string, patient: {firstName: string, lastName: string, email: string}}[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [medsRes, ptsRes] = await Promise.all([
        client.get('/medications/caregiver'),
        client.get('/patients')
      ]);
      setMedications(medsRes.data?.data || []);
      
      const pts = ptsRes.data?.data?.patients || ptsRes.data?.data || [];
      const activePts = Array.isArray(pts) ? pts.filter(p => p.status === 'Active' && p.permissions?.canViewMedications) : [];
      setPatients(activePts);
    } catch (error) {
      console.error('Failed to load caregiver data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group medications by patient
  const groupedMeds = patients.reduce((acc, p) => {
    const name = `${p.patient.firstName} ${p.patient.lastName}`;
    acc[name] = {
      patientId: p.patientId,
      meds: medications.filter(m => m.patient?.id === p.patientId)
    };
    return acc;
  }, {} as Record<string, { patientId: string, meds: CaregiverMedication[] }>);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-main flex items-center gap-2">
          <Pill size={28} className="text-brand-primary" />
          Patient Medications
        </h1>
        <p className="text-text-muted mt-1">A unified view of all medications for patients you manage.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 size={32} className="animate-spin text-brand-primary" />
        </div>
      ) : Object.keys(groupedMeds).length === 0 ? (
        <div className="bg-bg-card p-10 rounded-2xl border border-border-subtle shadow-sm flex flex-col items-center justify-center text-text-muted">
          <Pill size={48} className="mb-4 text-brand-primary/60" />
          <p className="text-lg font-semibold text-text-main">No Medications Found</p>
          <p className="text-sm mt-2 max-w-sm text-center opacity-80">
            None of your active patients have medications recorded, or you do not have permission to view them.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedMeds).map(([patientName, group]) => (
            <div key={patientName} className="space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <h2 className="text-xl font-bold text-text-main">
                  {patientName}
                </h2>
                <Link 
                  to={`/app/caregiver/medications/add?patientId=${group.patientId}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  Add Medication
                </Link>
              </div>

              {group.meds.length === 0 ? (
                <div className="text-sm text-text-muted italic px-2 py-4 bg-bg-main rounded-lg border border-border-subtle text-center">
                  No medications found for {patientName}.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.meds.map(med => (
                    <div key={med.id} className="bg-bg-card border border-border-subtle rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-text-main">{med.name}</h3>
                        <p className="text-sm text-text-muted">{med.dosage} {med.dosageUnit}</p>
                      </div>
                      {med.isPRN && (
                        <span className="px-2 py-1 bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase tracking-wider rounded-md">
                          PRN
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 mt-4 text-sm">
                      {med.frequency && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-text-muted">Frequency</span>
                          <span className="font-medium text-text-main">{med.frequency}</span>
                        </div>
                      )}
                      
                      {!med.isPRN && med.remainingQuantity !== null && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-text-muted">Remaining</span>
                          <span className={`font-medium ${med.remainingQuantity < 10 ? 'text-red-500' : 'text-text-main'}`}>
                            {med.remainingQuantity}
                          </span>
                        </div>
                      )}

                      {(med.startDate || med.endDate) && (
                        <div className="flex items-center gap-2 text-text-muted mt-2 pt-2 border-t border-border-subtle">
                          <Calendar size={14} />
                          <span className="text-xs">
                            {med.startDate ? new Date(med.startDate).toLocaleDateString() : '...'} 
                            {' - '} 
                            {med.endDate ? new Date(med.endDate).toLocaleDateString() : 'Ongoing'}
                          </span>
                        </div>
                      )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
