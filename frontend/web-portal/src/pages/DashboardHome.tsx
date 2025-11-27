import React, { useEffect, useState } from 'react';
import { Activity, Pill, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { getAdherenceStats, getUpcomingDoses, getRefillNeeded } from '../api/services';

const DashboardHome = () => {
  const [stats, setStats] = useState<any>(null);
  const [upcomingDoses, setUpcomingDoses] = useState<any[]>([]);
  const [lowStockMeds, setLowStockMeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, dosesRes, refillRes] = await Promise.all([
        getAdherenceStats(),
        getUpcomingDoses(24),
        getRefillNeeded()
      ]);
      
      setStats(statsRes.data);
      setUpcomingDoses(dosesRes.data?.upcomingDoses || []);
      setLowStockMeds(refillRes.data?.medications || []);
    } catch (err) {
      console.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-gray-500">Loading dashboard...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Activity className="text-teal-600" size={32} />
            <span className="text-3xl font-bold text-teal-600">{stats?.rate || 0}%</span>
          </div>
          <h3 className="text-gray-600 font-medium">Adherence Rate</h3>
          <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Pill className="text-blue-600" size={32} />
            <span className="text-3xl font-bold text-blue-600">{stats?.taken || 0}</span>
          </div>
          <h3 className="text-gray-600 font-medium">Doses Taken</h3>
          <p className="text-sm text-gray-500 mt-1">Out of {stats?.total || 0} scheduled</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="text-green-600" size={32} />
            <span className="text-3xl font-bold text-green-600">{stats?.missed || 0}</span>
          </div>
          <h3 className="text-gray-600 font-medium">Missed Doses</h3>
          <p className="text-sm text-gray-500 mt-1">Requires attention</p>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockMeds.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-red-600" size={24} />
            <h2 className="text-lg font-bold text-red-900">Low Medication Stock</h2>
          </div>
          <div className="space-y-2">
            {lowStockMeds.map((med) => (
              <div key={med.id} className="flex justify-between items-center bg-white p-3 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{med.name}</p>
                  <p className="text-sm text-gray-600">{med.remainingQuantity} doses remaining</p>
                </div>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                  Refill Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Doses */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="text-blue-600" size={24} />
          <h2 className="text-lg font-bold text-gray-900">Upcoming Doses (Next 24 Hours)</h2>
        </div>
        
        {upcomingDoses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No upcoming doses scheduled.</p>
        ) : (
          <div className="space-y-3">
            {upcomingDoses.slice(0, 5).map((dose, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Pill className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{dose.medicationName}</h3>
                    <p className="text-sm text-gray-600">{dose.dosage} {dose.dosageUnit}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{formatTime(dose.scheduledTime)}</p>
                  {dose.isRefillDue && (
                    <p className="text-xs text-red-600 font-medium">Refill needed</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;
