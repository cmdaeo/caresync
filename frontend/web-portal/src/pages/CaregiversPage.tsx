import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Trash2, Mail } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { getCaregivers, inviteCaregiver, removeCaregiver } from '../api/services';

const CaregiversPage = () => {
  const [caregivers, setCaregivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', relationship: '' });

  useEffect(() => {
    loadCaregivers();
  }, []);

  const loadCaregivers = async () => {
    try {
      const data = await getCaregivers();
      // FIX: Handle different response structures
      const caregiversList = data.data?.caregivers || data.caregivers || [];
      setCaregivers(Array.isArray(caregiversList) ? caregiversList : []);
    } catch (err) {
      console.error(err);
      setCaregivers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inviteCaregiver(inviteData.email, inviteData.relationship);
      setShowInviteModal(false);
      setInviteData({ email: '', relationship: '' });
      loadCaregivers();
    } catch (err) {
      alert('Failed to send invitation');
    }
  };

  const handleRemove = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this caregiver?')) {
      try {
        await removeCaregiver(id);
        loadCaregivers();
      } catch (err) {
        alert('Failed to remove caregiver');
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Caregivers</h1>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
        >
          <UserPlus size={18} />
          <span>Invite Caregiver</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading caregivers...</div>
      ) : caregivers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="text-gray-300 mx-auto mb-4" size={64} />
          <p className="text-gray-500 text-lg mb-2">No caregivers yet</p>
          <p className="text-gray-400 text-sm">Invite someone to help manage your medications</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {caregivers.map((caregiver) => (
            <div key={caregiver.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <Users className="text-teal-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {caregiver.caregiver?.firstName} {caregiver.caregiver?.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{caregiver.relationship || 'Caregiver'}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Mail size={12} />
                      {caregiver.caregiver?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(caregiver.id)}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  title="Remove caregiver"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {caregiver.permissions && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Permissions:</p>
                  <div className="flex flex-wrap gap-2">
                    {caregiver.permissions.canViewMedications && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">View Meds</span>
                    )}
                    {caregiver.permissions.canManageMedications && (
                      <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">Manage Meds</span>
                    )}
                    {caregiver.permissions.canReceiveAlerts && (
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">Alerts</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Invite Caregiver</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="caregiver@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship
                </label>
                <input
                  type="text"
                  value={inviteData.relationship}
                  onChange={(e) => setInviteData({ ...inviteData, relationship: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., Family Member, Friend, Nurse"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CaregiversPage;
