import DashboardLayout from '../components/DashboardLayout';
import { useTranslation } from 'react-i18next';

const SettingsPage = () => {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('settings')}</h1>
      <div className="space-y-8">
        {/* Settings content will be added here */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('account_settings')}</h2>
          {/* Account settings form would go here */}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('notification_settings')}</h2>
          {/* Notification settings would go here */}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('language')}</h2>
          {/* Language settings would go here */}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
