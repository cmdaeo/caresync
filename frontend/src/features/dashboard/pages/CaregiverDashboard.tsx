// src/features/dashboard/pages/CaregiverDashboard.tsx
import { useEffect, useState } from 'react';
import { Users, UserPlus, CheckCircle2, XCircle, HeartPulse, Loader2, Calendar } from 'lucide-react';
import { client } from '../../../shared/api/client';

interface Patient {
  id: string; // Relationship ID
  patientId: string;
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

interface Invitation {
  id: string; // The CaregiverPatient relationship ID
  patient: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

export const CaregiverDashboard = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const fetchData = async () => {
    try {
      const [patientsRes, invitesRes] = await Promise.all([
        client.get('/patients'),
        client.get('/caregivers/pending')
      ]);
      
      const pts = patientsRes.data?.data?.patients || patientsRes.data?.data || [];
      const invs = invitesRes.data?.data || [];

      const activePts = Array.isArray(pts) ? pts.filter(p => p.status === 'Active') : [];
      setPatients(activePts);
      setInvitations(Array.isArray(invs) ? invs : []);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInvitation = async (id: string, action: 'accept' | 'decline') => {
    setActionLoading(id);
    try {
      await client.post(`/caregivers/${id}/${action}`);
      await fetchData();
    } catch (err) {
      console.error(`Failed to ${action} invitation`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleInvitePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError('');
    setInviteSuccess(false);

    try {
      await client.post('/patients/invite', {
        email: inviteEmail,
        relationship: 'Caregiver',
        permissions: { canViewMedications: true, canViewAdherence: true }
      });
      setInviteSuccess(true);
      setInviteEmail('');
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSuccess(false);
      }, 2000);
    } catch (err: any) {
      setInviteError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-text-muted" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="text-brand-primary" size={28} />
          <h1 className="text-3xl font-bold tracking-tight text-text-main">Caregiver Dashboard</h1>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-lg hover:bg-brand-primary/90 transition-colors shadow-sm"
        >
          <UserPlus size={18} />
          Invite Patient
        </button>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-text-main">
            <UserPlus size={20} className="text-brand-primary" />
            Pending Invitations
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {invitations.map((inv) => (
              <div key={inv.id} className="bg-brand-primary/5 border border-brand-primary/20 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-text-main">{inv.patient?.firstName} {inv.patient?.lastName}</h3>
                    <p className="text-sm text-text-muted">{inv.patient?.email}</p>
                  </div>
                  <div className="text-xs text-text-muted bg-bg-main px-2 py-1 rounded-md border border-border-subtle">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleInvitation(inv.id, 'accept')}
                    disabled={actionLoading === inv.id}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading === inv.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Accept
                  </button>
                  <button
                    onClick={() => handleInvitation(inv.id, 'decline')}
                    disabled={actionLoading === inv.id}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-bg-card hover:bg-red-500 hover:text-white text-text-main text-sm font-semibold rounded-lg border border-border-subtle hover:border-transparent transition-colors disabled:opacity-50"
                  >
                    {actionLoading === inv.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active Patients */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-text-main">
          <HeartPulse size={20} className="text-brand-primary" />
          Active Patients
        </h2>
        
        {patients.length === 0 ? (
          <div className="bg-bg-card p-10 rounded-2xl border border-border-subtle shadow-sm flex flex-col items-center justify-center text-text-muted">
            <HeartPulse size={48} className="mb-4 text-brand-primary/60" />
            <p className="text-lg font-semibold text-text-main">No active patients yet</p>
            <p className="text-sm mt-2 max-w-sm text-center opacity-80">When a patient invites you to manage their schedule, their information will appear here once you accept.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {patients.map((p) => (
              <div key={p.id} className="bg-bg-card border border-border-subtle rounded-2xl p-5 shadow-sm group hover:shadow-md transition-all hover:border-brand-primary/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary opacity-40 group-hover:opacity-100 transition-opacity"></div>
                
                <h3 className="font-bold text-lg text-text-main mb-1 truncate mt-1">
                  {p.patient?.firstName} {p.patient?.lastName}
                </h3>
                <p className="text-sm text-text-muted truncate mb-5">{p.patient?.email}</p>
                
                <div className="p-3 bg-bg-main/50 rounded-xl space-y-2 mb-5">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-1.5"><CheckCircle2 size={12}/>Permissions</h4>
                  <div className="flex items-center gap-2 text-sm text-text-main">
                    <CheckCircle2 size={14} className={p.permissions?.canViewMedications ? "text-emerald-500" : "text-border-subtle"} />
                    <span className={!p.permissions?.canViewMedications ? "text-text-muted line-through opacity-50" : ""}>Manage Medications</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-main">
                    <CheckCircle2 size={14} className={p.permissions?.canViewAdherence ? "text-emerald-500" : "text-border-subtle"} />
                    <span className={!p.permissions?.canViewAdherence ? "text-text-muted line-through opacity-50" : ""}>Monitor Adherence</span>
                  </div>
                </div>

                <button 
                  onClick={() => window.location.href = `/app/caregiver/patient/${p.patientId}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary text-white font-semibold text-sm rounded-lg transition-transform active:scale-[0.98] hover:bg-brand-primary/90 shadow-sm"
                >
                  <Calendar size={16} />
                  View Schedule
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-text-main mb-2">Invite a Patient</h2>
            <p className="text-sm text-text-muted mb-6">Enter the email address of the patient you want to manage. They must be registered on CareSync.</p>
            
            <form onSubmit={handleInvitePatient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Patient Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-border-subtle bg-bg-main text-text-main focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                />
              </div>

              {inviteError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg">
                  {inviteError}
                </div>
              )}

              {inviteSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm rounded-lg flex items-center gap-2">
                  <CheckCircle2 size={16} /> Invitation sent successfully!
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-main transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading || !inviteEmail}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-brand-primary text-white text-sm font-bold rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
                >
                  {inviteLoading ? <Loader2 size={16} className="animate-spin" /> : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
