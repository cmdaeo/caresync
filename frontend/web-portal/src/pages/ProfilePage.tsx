import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Save, Lock, Trash2, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { updateProfile, changePassword, deleteAccount } from '../api/services';
import useAuthStore from '../store/useAuthStore';
import { motion, fadeIn, PageTransition } from '../animations';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const user = useAuthStore((state) => state.user);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [deleteData, setDeleteData] = useState({
    password: '',
    confirmAccount: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        // FIX: Handle null/invalid dateOfBirth properly
        dateOfBirth: user.dateOfBirth && !isNaN(new Date(user.dateOfBirth).getTime())
          ? new Date(user.dateOfBirth).toISOString().split('T')[0]
          : ''
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await updateProfile(profileData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to change password. Check your current password.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteData.confirmAccount) {
      setMessage({ type: 'error', text: 'Please confirm that you understand this action cannot be undone.' });
      return;
    }

    if (deleteData.password.length < 6) {
      setMessage({ type: 'error', text: 'Please enter your password to confirm deletion.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await deleteAccount(deleteData.password);
      setMessage({ type: 'success', text: 'Account deleted successfully. You will be logged out.' });

      // Logout user and redirect to home
      setTimeout(() => {
        logout();
        navigate('/');
      }, 2000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete account. Please check your password and try again.' });
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <DashboardLayout>
      <PageTransition>
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="text-2xl font-bold text-gray-900 mb-6"
        >
          My Profile
        </motion.h1>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Profile Information */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="text-teal-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Mail size={16} />
                Email Address
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Phone size={16} />
                Phone Number
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} />
                Date of Birth
              </label>
              <input
                type="date"
                value={profileData.dateOfBirth}
                onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="text-teal-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Lock size={18} />
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Delete Account Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-6">
          <div className="flex items-center gap-3 mb-6">
            <Trash2 className="text-red-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Delete Account</h2>
          </div>

          <div className="mb-4">
            <p className="text-gray-600 mb-2">
              Deleting your account will permanently remove all your data and cannot be undone.
            </p>
            <p className="text-gray-600 mb-4">
              This includes your profile information, medication history, and all related data.
            </p>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 size={18} />
            Delete Account
          </button>
        </div>

        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">Confirm Account Deletion</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <div className="flex">
                    <AlertTriangle className="text-red-500 mr-3" size={20} />
                    <div>
                      <p className="font-medium text-red-800">Warning</p>
                      <p className="text-red-700">This action is permanent and cannot be undone.</p>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete your CareSync account? All your data including:
                </p>
                <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                  <li>Profile information</li>
                  <li>Medication history</li>
                  <li>Adherence records</li>
                  <li>Device connections</li>
                  <li>Caregiver relationships</li>
                </ul>
              </div>

              <div className="mb-4">
                <label className="flex items-start gap-2 text-sm font-medium text-gray-700 mb-2">
                  <input
                    type="checkbox"
                    checked={deleteData.confirmAccount}
                    onChange={(e) => setDeleteData({ ...deleteData, confirmAccount: e.target.checked })}
                    className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span>I understand that this action cannot be undone and all my data will be permanently deleted.</span>
                </label>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={deleteData.password}
                  onChange={(e) => setDeleteData({ ...deleteData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Your password"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Delete Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </PageTransition>
    </DashboardLayout>
  );
};

export default ProfilePage;
