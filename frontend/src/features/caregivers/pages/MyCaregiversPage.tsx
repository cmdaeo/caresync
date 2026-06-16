// src/features/caregivers/pages/MyCaregiversPage.tsx
import { useEffect, useState } from 'react';
import { Users, UserPlus, CheckCircle2, XCircle, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import { client } from '../../../shared/api/client';

interface Caregiver {
  id: string; // Relationship ID
  caregiverId: string;
  firstName: string;
  lastName: string;
  email: string;
  permissions: {
    canViewMedications: boolean;
    canViewAdherence: boolean;
  };
  isActive: boolean;
}

interface Invitation {
  id: string; // The CaregiverPatient relationship ID
  caregiverName: string;
  caregiverEmail: string;
  createdAt: string;
}

export const MyCaregiversPage = () => {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Accept Modal State
  const [acceptModalInv, setAcceptModalInv] = useState<Invitation | null>(null);
  const [permissions, setPermissions] = useState({ canViewMedications: true, canViewAdherence: true });

  // Edit Permissions State
  const [editModalCg, setEditModalCg] = useState<Caregiver | null>(null);

  const fetchData = async () => {
    try {
      const [caregiversRes, invitesRes] = await Promise.all([
        client.get('/caregivers'),
        client.get('/patients/pending')
      ]);
      
      const cgs = caregiversRes.data?.data?.caregivers || caregiversRes.data?.data || [];
      const invs = invitesRes.data?.data || [];

      // Filter to only show active caregivers (since backend might return both depending on the route)
      const activeCgs = Array.isArray(cgs) ? cgs.filter(c => c.status === 'Active') : [];
      setCaregivers(activeCgs);
      setInvitations(Array.isArray(invs) ? invs : []);
    } catch (err) {
      console.error('Failed to load caregivers data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDecline = async (id: string) => {
    setActionLoading(id);
    try {
      await client.post(`/patients/${id}/decline`);
      await fetchData();
    } catch (err) {
      console.error('Failed to decline invitation', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptModalInv) return;
    
    setActionLoading(acceptModalInv.id);
    setAcceptModalInv(null);
    try {
      await client.post(`/patients/${acceptModalInv.id}/accept`, { permissions });
      await fetchData();
    } catch (err) {
      console.error('Failed to accept invitation', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalCg) return;
    
    setActionLoading(editModalCg.relationshipId);
    setEditModalCg(null);
    try {
      await client.put(`/patients/${editModalCg.relationshipId}/permissions`, { permissions });
      await fetchData();
    } catch (err) {
      console.error('Failed to update permissions', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke access for this caregiver?')) return;
    setActionLoading(id);
    try {
      await client.delete(`/patients/${id}/revoke`);
      await fetchData();
    } catch (err) {
      console.error('Failed to revoke caregiver', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleInviteCaregiver = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError('');
    setInviteSuccess(false);

    try {
      await client.post('/caregivers/invite', {
        email: inviteEmail,
        relationship: 'Caregiver',
        permissions
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
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 py-8 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-brand-primary" size={28} />
          <h1 className="text-3xl font-bold tracking-tight text-text-main">My Caregivers</h1>
        </div>
        <button
          onClick={() => {
            setPermissions({ canViewMedications: true, canViewAdherence: true });
            setShowInviteModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-lg hover:bg-brand-primary/90 transition-colors shadow-sm"
        >
          <UserPlus size={18} />
          Invite Caregiver
        </button>
      </div>

      <p className="text-text-muted">
        Manage who has access to your medication schedule and adherence history.
      </p>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-text-main">
            <UserPlus size={20} className="text-brand-primary" />
            Caregiver Requests
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {invitations.map((inv) => (
              <div key={inv.id} className="bg-brand-primary/5 border border-brand-primary/20 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-text-main">{inv.caregiverName}</h3>
                    <p className="text-sm text-text-muted">{inv.caregiverEmail}</p>
                  </div>
                  <div className="text-xs text-text-muted bg-bg-main px-2 py-1 rounded-md border border-border-subtle">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-sm text-text-main mb-4">
                  Would like to manage your medication schedule.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setPermissions({ canViewMedications: true, canViewAdherence: true });
                      setAcceptModalInv(inv);
                    }}
                    disabled={actionLoading === inv.id}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading === inv.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(inv.id)}
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

      {/* Active Caregivers */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-text-main">
          <Users size={20} className="text-brand-primary" />
          Active Caregivers
        </h2>
        
        {caregivers.length === 0 ? (
          <div className="bg-bg-card p-10 rounded-2xl border border-border-subtle shadow-sm flex flex-col items-center justify-center text-text-muted">
            <Users size={48} className="mb-4 text-brand-primary/60" />
            <p className="text-lg font-semibold text-text-main">No active caregivers</p>
            <p className="text-sm mt-2 max-w-sm text-center opacity-80">Invite a family member or healthcare provider to help manage your schedule.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {caregivers.map((c) => (
              <div key={c.id} className="bg-bg-card border border-border-subtle rounded-2xl p-5 shadow-sm group hover:shadow-md transition-all">
                <h3 className="font-bold text-lg text-text-main mb-1 truncate">
                  {c.firstName} {c.lastName}
                </h3>
                <p className="text-sm text-text-muted truncate mb-5">{c.email}</p>
                
                <div className="p-3 bg-bg-main/50 rounded-xl space-y-2 mb-5">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-1.5"><CheckCircle2 size={12}/>Granted Permissions</h4>
                  <div className="flex items-center gap-2 text-sm text-text-main">
                    <CheckCircle2 size={14} className={c.permissions?.canViewMedications ? "text-emerald-500" : "text-border-subtle"} />
                    <span className={!c.permissions?.canViewMedications ? "text-text-muted line-through opacity-50" : ""}>Manage Medications</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-main">
                    <CheckCircle2 size={14} className={c.permissions?.canViewAdherence ? "text-emerald-500" : "text-border-subtle"} />
                    <span className={!c.permissions?.canViewAdherence ? "text-text-muted line-through opacity-50" : ""}>Monitor Adherence</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setPermissions(c.permissions || { canViewMedications: true, canViewAdherence: true });
                      setEditModalCg(c);
                    }}
                    disabled={actionLoading === c.relationshipId}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-bg-card text-brand-primary hover:bg-brand-primary hover:text-white border border-brand-primary/30 font-semibold text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleRevoke(c.id)}
                    disabled={actionLoading === c.id}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-bg-card text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 font-semibold text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {actionLoading === c.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-text-main mb-2">Invite Caregiver</h2>
            <p className="text-sm text-text-muted mb-6">Enter the email address of the caregiver. They must be registered on CareSync.</p>
            
            <form onSubmit={handleInviteCaregiver} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Caregiver Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="caregiver@example.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-border-subtle bg-bg-main text-text-main focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                />
              </div>

              <div className="space-y-3 bg-bg-main p-4 rounded-xl border border-border-subtle">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="flex-shrink-0 mt-0.5">
                    <input 
                      type="checkbox"
                      checked={permissions.canViewMedications}
                      onChange={(e) => setPermissions({ ...permissions, canViewMedications: e.target.checked })}
                      className="w-4 h-4 rounded border-border-subtle text-brand-primary focus:ring-brand-primary/20 transition-colors"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-main group-hover:text-brand-primary transition-colors">Manage Medications</p>
                    <p className="text-xs text-text-muted">Allow this caregiver to view, add, edit, or remove medications from your schedule.</p>
                  </div>
                </label>
                
                <div className="h-px bg-border-subtle/50 w-full"></div>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="flex-shrink-0 mt-0.5">
                    <input 
                      type="checkbox"
                      checked={permissions.canViewAdherence}
                      onChange={(e) => setPermissions({ ...permissions, canViewAdherence: e.target.checked })}
                      className="w-4 h-4 rounded border-border-subtle text-brand-primary focus:ring-brand-primary/20 transition-colors"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-main group-hover:text-brand-primary transition-colors">Monitor Adherence</p>
                    <p className="text-xs text-text-muted">Allow this caregiver to see if you have taken your medications on time.</p>
                  </div>
                </label>
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

      {/* Accept Invitation Modal */}
      {acceptModalInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-text-main mb-2">Accept Request</h2>
            <p className="text-sm text-text-muted mb-6">
              Configure what <span className="font-semibold text-text-main">{acceptModalInv.caregiverName}</span> is allowed to view and manage before accepting.
            </p>
            
            <form onSubmit={handleAcceptSubmit} className="space-y-4">
              
              <div className="space-y-3 bg-bg-main p-4 rounded-xl border border-border-subtle">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="flex-shrink-0 mt-0.5">
                    <input 
                      type="checkbox"
                      checked={permissions.canViewMedications}
                      onChange={(e) => setPermissions({ ...permissions, canViewMedications: e.target.checked })}
                      className="w-4 h-4 rounded border-border-subtle text-brand-primary focus:ring-brand-primary/20 transition-colors"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-main group-hover:text-brand-primary transition-colors">Manage Medications</p>
                    <p className="text-xs text-text-muted">Allow this caregiver to view, add, edit, or remove medications from your schedule.</p>
                  </div>
                </label>
                
                <div className="h-px bg-border-subtle/50 w-full"></div>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="flex-shrink-0 mt-0.5">
                    <input 
                      type="checkbox"
                      checked={permissions.canViewAdherence}
                      onChange={(e) => setPermissions({ ...permissions, canViewAdherence: e.target.checked })}
                      className="w-4 h-4 rounded border-border-subtle text-brand-primary focus:ring-brand-primary/20 transition-colors"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-main group-hover:text-brand-primary transition-colors">Monitor Adherence</p>
                    <p className="text-xs text-text-muted">Allow this caregiver to see if you have taken your medications on time.</p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setAcceptModalInv(null)}
                  className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-main transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  Confirm & Accept
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {editModalCg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-text-main mb-2">Edit Permissions</h2>
            <p className="text-sm text-text-muted mb-6">
              Update what <span className="font-semibold text-text-main">{editModalCg.firstName} {editModalCg.lastName}</span> is allowed to view and manage.
            </p>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              
              <div className="space-y-3 bg-bg-main p-4 rounded-xl border border-border-subtle">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="flex-shrink-0 mt-0.5">
                    <input 
                      type="checkbox"
                      checked={permissions.canViewMedications}
                      onChange={(e) => setPermissions({ ...permissions, canViewMedications: e.target.checked })}
                      className="w-4 h-4 rounded border-border-subtle text-brand-primary focus:ring-brand-primary/20 transition-colors"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-main group-hover:text-brand-primary transition-colors">Manage Medications</p>
                    <p className="text-xs text-text-muted">Allow this caregiver to view, add, edit, or remove medications from your schedule.</p>
                  </div>
                </label>
                
                <div className="h-px bg-border-subtle/50 w-full"></div>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="flex-shrink-0 mt-0.5">
                    <input 
                      type="checkbox"
                      checked={permissions.canViewAdherence}
                      onChange={(e) => setPermissions({ ...permissions, canViewAdherence: e.target.checked })}
                      className="w-4 h-4 rounded border-border-subtle text-brand-primary focus:ring-brand-primary/20 transition-colors"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-main group-hover:text-brand-primary transition-colors">Monitor Adherence</p>
                    <p className="text-xs text-text-muted">Allow this caregiver to see if you have taken your medications on time.</p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditModalCg(null)}
                  className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-main transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
