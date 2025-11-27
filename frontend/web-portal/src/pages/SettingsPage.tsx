import React from 'react';
import DashboardLayout from '../components/DashboardLayout';

const SettingsCard = ({ title, description, children }: any) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const SettingsPage = () => {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      <div className="space-y-8">
        <SettingsCard title="Account Information" description="Update your personal details.">
          {/* Form inputs would go here */}
          <button className="bg-teal-700 text-white px-5 py-2 rounded-lg font-semibold hover:bg-teal-800">Save Changes</button>
        </SettingsCard>
        
        <SettingsCard title="Change Password" description="Choose a new, strong password.">
          {/* Form inputs would go here */}
          <button className="bg-teal-700 text-white px-5 py-2 rounded-lg font-semibold hover:bg-teal-800">Update Password</button>
        </SettingsCard>

        <SettingsCard title="Danger Zone" description="These actions are irreversible.">
          <button className="bg-red-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-red-700">Delete Account</button>
        </SettingsCard>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
