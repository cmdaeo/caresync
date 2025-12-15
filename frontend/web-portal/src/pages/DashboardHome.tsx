import { useEffect, useState } from 'react';
import { Activity, Pill, AlertTriangle, TrendingUp, Clock, Calendar, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import { getAdherenceStats, getUpcomingDoses, getRefillNeeded, getAdherenceTrends } from '../api/services';
import { motion, fadeIn, PageTransition, StaggeredContainer } from '../animations';
import LoadingSpinner from '../components/LoadingSpinner';
import { COLORS } from '../theme/colors';

const DashboardHome = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [upcomingDoses, setUpcomingDoses] = useState<any[]>([]);
  const [lowStockMeds, setLowStockMeds] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, dosesRes, refillRes, trendsRes] = await Promise.all([
        getAdherenceStats(),
        getUpcomingDoses(24),
        getRefillNeeded(),
        getAdherenceTrends()
      ]);

       setStats(statsRes.data);
       setUpcomingDoses(dosesRes.data?.upcomingDoses || []);
       setLowStockMeds(refillRes.data?.medications || []);
       setTrends(trendsRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) return <LoadingSpinner isLoading={true} />;

  return (
    <DashboardLayout>
      <PageTransition>
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="text-2xl font-bold mb-6"
          style={{ color: COLORS.balticBlue }}
        >
          {t('dashboard')}
        </motion.h1>

        <StaggeredContainer>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Card 1: Adherence */}
            <div 
              className="p-6 rounded-xl shadow-sm border"
              style={{ backgroundColor: COLORS.white, borderColor: COLORS.slate200 }}
            >
              <div className="flex items-center justify-between mb-4">
                {/* freshSky used for "Active/Bright" stat */}
                <Activity size={32} style={{ color: COLORS.freshSky }} />
                <span className="text-3xl font-bold" style={{ color: COLORS.freshSky }}>
                  {stats?.rate || 0}%
                </span>
              </div>
              <h3 className="font-medium" style={{ color: COLORS.slate600 }}>{t('adherence')}</h3>
              <p className="text-sm mt-1" style={{ color: COLORS.slate500 }}>{t('last_30_days')}</p>
            </div>

            {/* Card 2: Taken */}
            <div 
              className="p-6 rounded-xl shadow-sm border"
              style={{ backgroundColor: COLORS.white, borderColor: COLORS.slate200 }}
            >
              <div className="flex items-center justify-between mb-4">
                {/* blueBellMedium used for standard "Primary" stat */}
                <Pill size={32} style={{ color: COLORS.blueBellMedium }} />
                <span className="text-3xl font-bold" style={{ color: COLORS.blueBellMedium }}>
                  {stats?.taken || 0}
                </span>
              </div>
              <h3 className="font-medium" style={{ color: COLORS.slate600 }}>{t('taken')}</h3>
              <p className="text-sm mt-1" style={{ color: COLORS.slate500 }}>
                {t('out_of_scheduled', { count: stats?.total || 0 })}
              </p>
            </div>

            {/* Card 3: Missed */}
            <div 
              className="p-6 rounded-xl shadow-sm border"
              style={{ backgroundColor: COLORS.white, borderColor: COLORS.slate200 }}
            >
              <div className="flex items-center justify-between mb-4">
                {/* balticBlueDeep used for "Serious/Heavy" stat */}
                <TrendingUp size={32} style={{ color: COLORS.balticBlueDeep }} />
                <span className="text-3xl font-bold" style={{ color: COLORS.balticBlueDeep }}>
                  {stats?.missed || 0}
                </span>
              </div>
              <h3 className="font-medium" style={{ color: COLORS.slate600 }}>{t('missed')}</h3>
              <p className="text-sm mt-1" style={{ color: COLORS.slate500 }}>{t('requires_attention')}</p>
            </div>
          </div>

          {/* Detailed Metrics Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Pills Taken */}
            <div
              className="p-6 rounded-xl shadow-sm border"
              style={{ backgroundColor: COLORS.white, borderColor: COLORS.slate200 }}
            >
              <div className="flex items-center justify-between mb-4">
                <Pill size={32} style={{ color: COLORS.blueBellMedium }} />
                <span className="text-3xl font-bold" style={{ color: COLORS.blueBellMedium }}>
                  {stats?.taken || 0}
                </span>
              </div>
              <h3 className="font-medium" style={{ color: COLORS.slate600 }}>{t('pills_taken')}</h3>
              <p className="text-sm mt-1" style={{ color: COLORS.slate500 }}>{t('last_30_days')}</p>
            </div>

            {/* Pills Missed */}
            <div
              className="p-6 rounded-xl shadow-sm border"
              style={{ backgroundColor: COLORS.white, borderColor: COLORS.slate200 }}
            >
              <div className="flex items-center justify-between mb-4">
                <AlertTriangle size={32} style={{ color: COLORS.balticBlueDeep }} />
                <span className="text-3xl font-bold" style={{ color: COLORS.balticBlueDeep }}>
                  {stats?.missed || 0}
                </span>
              </div>
              <h3 className="font-medium" style={{ color: COLORS.slate600 }}>{t('pills_missed')}</h3>
              <p className="text-sm mt-1" style={{ color: COLORS.slate500 }}>{t('last_30_days')}</p>
            </div>

            {/* Pills Skipped */}
            <div
              className="p-6 rounded-xl shadow-sm border"
              style={{ backgroundColor: COLORS.white, borderColor: COLORS.slate200 }}
            >
              <div className="flex items-center justify-between mb-4">
                <TrendingUp size={32} style={{ color: COLORS.freshSky }} />
                <span className="text-3xl font-bold" style={{ color: COLORS.freshSky }}>
                  {stats?.skipped || 0}
                </span>
              </div>
              <h3 className="font-medium" style={{ color: COLORS.slate600 }}>{t('pills_skipped')}</h3>
              <p className="text-sm mt-1" style={{ color: COLORS.slate500 }}>{t('last_30_days')}</p>
            </div>

            {/* Total Doses */}
            <div
              className="p-6 rounded-xl shadow-sm border"
              style={{ backgroundColor: COLORS.white, borderColor: COLORS.slate200 }}
            >
              <div className="flex items-center justify-between mb-4">
                <BarChart2 size={32} style={{ color: COLORS.blueBell }} />
                <span className="text-3xl font-bold" style={{ color: COLORS.blueBell }}>
                  {stats?.total || 0}
                </span>
              </div>
              <h3 className="font-medium" style={{ color: COLORS.slate600 }}>{t('total_doses')}</h3>
              <p className="text-sm mt-1" style={{ color: COLORS.slate500 }}>{t('last_30_days')}</p>
            </div>
          </div>

          {/* Calendar History View */}
          <div
            className="rounded-xl shadow-sm p-6 border mb-8"
            style={{ backgroundColor: COLORS.white, borderColor: COLORS.slate200 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Calendar size={24} style={{ color: COLORS.blueBell }} />
                <h2 className="text-lg font-bold" style={{ color: COLORS.balticBlue }}>
                  {t('calendar_history')}
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'day'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {t('day_view')}
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'week'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {t('week_view')}
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'month'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {t('month_view')}
                </button>
              </div>
            </div>

            {viewMode === 'day' && (
              <div className="space-y-4">
                {trends.slice(0, 7).map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border"
                       style={{ backgroundColor: COLORS.slate50, borderColor: COLORS.slate200 }}>
                    <div>
                      <p className="font-medium" style={{ color: COLORS.balticBlue }}>{day.date}</p>
                      <p className="text-sm" style={{ color: COLORS.slate600 }}>
                        {t('pills_taken')}: {day.taken}, {t('pills_missed')}: {day.missed}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold" style={{ color: COLORS.blueBellMedium }}>
                        {day.rate}%
                      </p>
                      <p className="text-sm" style={{ color: COLORS.slate500 }}>
                        {t('adherence')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'week' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2">
                {trends.slice(0, 7).map((day, index) => (
                  <div key={index} className="text-center p-3 rounded-lg"
                       style={{ backgroundColor: COLORS.slate50 }}>
                    <p className="text-sm font-medium" style={{ color: COLORS.balticBlue }}>
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <div className="w-8 h-8 mx-auto mt-2 rounded-full flex items-center justify-center"
                         style={{
                           backgroundColor: day.rate > 75 ? '#10B981' : day.rate > 50 ? '#F59E0B' : '#EF4444',
                           color: 'white'
                         }}>
                      {day.rate}%
                    </div>
                    <p className="text-xs mt-1" style={{ color: COLORS.slate600 }}>
                      {day.taken}/{day.total}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'month' && (
              <div className="grid grid-cols-7 gap-1 text-center">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-sm font-medium p-2" style={{ color: COLORS.slate600 }}>
                    {day}
                  </div>
                ))}

                {/* Generate calendar days - this is a simplified version */}
                {Array.from({ length: 30 }).map((_, index) => {
                  const dayData = trends.find(t => new Date(t.date).getDate() === index + 1);
                  const day = index + 1;
                  const rate = dayData?.rate || 0;
                  const taken = dayData?.taken || 0;
                  const total = dayData?.total || 0;

                  return (
                    <div key={index} className="p-2 rounded"
                         style={{
                           backgroundColor: rate > 75 ? '#D1FAE5' : rate > 50 ? '#FEF3C7' : '#FEE2E2',
                           minHeight: '60px'
                         }}>
                      <p className="text-sm font-medium" style={{ color: COLORS.balticBlue }}>{day}</p>
                      <div className="w-6 h-6 mx-auto mt-1 rounded-full flex items-center justify-center text-xs"
                           style={{
                             backgroundColor: rate > 75 ? '#10B981' : rate > 50 ? '#F59E0B' : '#EF4444',
                             color: 'white'
                           }}>
                        {rate}%
                      </div>
                      <p className="text-xs mt-1" style={{ color: COLORS.slate600 }}>
                        {taken}/{total}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Low Stock Alerts */}
          {lowStockMeds.length > 0 && (
            <div 
              className="rounded-xl p-5 mb-8 border-2"
              // Using hardcoded red for alerts as it's missing from theme
              style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }} 
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={24} style={{ color: '#EF4444' }} />
                <h2 className="text-lg font-bold" style={{ color: '#991B1B' }}>
                  {t('refill_needed')}
                </h2>
              </div>
              <div className="space-y-2">
                {lowStockMeds.map((med) => (
                  <div 
                    key={med.id} 
                    className="flex justify-between items-center p-3 rounded-lg"
                    style={{ backgroundColor: COLORS.white }}
                  >
                    <div>
                      <p className="font-medium" style={{ color: COLORS.balticBlue }}>{med.name}</p>
                      <p className="text-sm" style={{ color: COLORS.slate600 }}>
                        {med.remainingQuantity} {t('doses_remaining')}
                      </p>
                    </div>
                    <button 
                      className="px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium hover:opacity-90"
                      style={{ backgroundColor: '#EF4444' }}
                    >
                      {t('refill_now')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Doses */}
          <div 
            className="rounded-xl shadow-sm p-6 border"
            style={{ backgroundColor: COLORS.white, borderColor: COLORS.slate200 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Clock size={24} style={{ color: COLORS.blueBell }} />
              <h2 className="text-lg font-bold" style={{ color: COLORS.balticBlue }}>
                {t('upcoming_doses_next_24h')}
              </h2>
            </div>

            {upcomingDoses.length === 0 ? (
              <p className="text-center py-8" style={{ color: COLORS.slate500 }}>
                {t('no_upcoming_doses')}
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingDoses.slice(0, 5).map((dose, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-4 rounded-lg border"
                    style={{ 
                      backgroundColor: COLORS.slate50, 
                      borderColor: COLORS.slate200 
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: COLORS.slate100 }}
                      >
                        <Pill size={20} style={{ color: COLORS.blueBell }} />
                      </div>
                      <div>
                        <h3 className="font-medium" style={{ color: COLORS.balticBlue }}>
                          {dose.medicationName}
                        </h3>
                        <p className="text-sm" style={{ color: COLORS.slate600 }}>
                          {dose.dosage} {dose.dosageUnit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold" style={{ color: COLORS.blueBellMedium }}>
                        {formatTime(dose.scheduledTime)}
                      </p>
                      {dose.isRefillDue && (
                        <p className="text-xs font-medium mt-1" style={{ color: '#EF4444' }}>
                          {t('refill_needed')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </StaggeredContainer>
      </PageTransition>
    </DashboardLayout>
  );
};

export default DashboardHome;
