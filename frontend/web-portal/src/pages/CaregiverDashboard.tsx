import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Pill, Activity, AlertTriangle, Plus, UserPlus, Calendar as CalendarIcon } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { getPatients, getPatientMedications, getAdherenceStats } from '../api/services';
import { motion, fadeIn, PageTransition } from '../animations';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const CaregiverDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [patientMedications, setPatientMedications] = useState<any[]>([]);
  const [adherenceStats, setAdherenceStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load patients
      const patientsResponse = await getPatients();
      if (patientsResponse.success) {
        setPatients(patientsResponse.data || []);
        
        // Select first patient by default if available
        if (patientsResponse.data && patientsResponse.data.length > 0) {
          setSelectedPatient(patientsResponse.data[0].id);
        }
      }

    } catch (err) {
      console.error('Failed to load patients:', err);
      setError('Failed to load patients');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatientData = async (patientId: string) => {
    if (!patientId) return;

    try {
      setIsLoading(true);
      
      // Load patient medications
      const medsResponse = await getPatientMedications(patientId);
      if (medsResponse.success) {
        setPatientMedications(medsResponse.data || []);
      }

      // Load adherence stats
      const statsResponse = await getAdherenceStats(undefined, undefined, patientId);
      if (statsResponse.success) {
        setAdherenceStats(statsResponse.data);
      }

    } catch (err) {
      console.error('Failed to load patient data:', err);
      setError('Failed to load patient data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      loadPatientData(selectedPatient);
    }
  }, [selectedPatient]);

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatient(patientId);
  };

  const handleAddMedication = () => {
    if (selectedPatient) {
      navigate('/medications/add', { state: { patientId: selectedPatient } });
    }
  };

  const handleInvitePatient = () => {
    navigate('/caregivers');
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingSpinner isLoading={true} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="flex justify-between items-center mb-6">
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="text-2xl font-bold text-gray-900 flex items-center gap-2"
          >
            <Users size={24} />
            {t('caregiver_dashboard')}
          </motion.h1>
        </div>

        {/* Patient Selection */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">{t('my_patients')}</h2>
          <div className="flex gap-2 mb-4">
            {patients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => handlePatientSelect(patient.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedPatient === patient.id
                    ? 'bg-blue-100 text-blue-600 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                </div>
                <span>{patient.firstName} {patient.lastName}</span>
              </button>
            ))}
            <button
              onClick={handleInvitePatient}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 bg-green-100 text-green-600 hover:bg-green-200"
            >
              <UserPlus size={16} />
              <span>{t('invite_patient')}</span>
            </button>
          </div>
        </div>

        {!selectedPatient ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Users className="text-gray-300 mx-auto mb-4" size={64} />
            <p className="text-gray-500 text-lg mb-2">{t('no_patients_selected')}</p>
            <p className="text-gray-400 text-sm">{t('select_patient_to_manage')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Patient Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Adherence Rate */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <Activity size={32} className="text-green-500" />
                  <span className="text-3xl font-bold text-green-500">
                    {adherenceStats?.rate || 0}%
                  </span>
                </div>
                <h3 className="font-medium text-gray-700">{t('adherence_rate')}</h3>
                <p className="text-sm text-gray-500">{t('last_30_days')}</p>
              </div>

              {/* Medications Count */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <Pill size={32} className="text-blue-500" />
                  <span className="text-3xl font-bold text-blue-500">
                    {patientMedications.length}
                  </span>
                </div>
                <h3 className="font-medium text-gray-700">{t('active_medications')}</h3>
                <p className="text-sm text-gray-500">{t('currently_prescribed')}</p>
              </div>

              {/* Alerts */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <AlertTriangle size={32} className="text-red-500" />
                  <span className="text-3xl font-bold text-red-500">
                    {adherenceStats?.missed || 0}
                  </span>
                </div>
                <h3 className="font-medium text-gray-700">{t('missed_doses')}</h3>
                <p className="text-sm text-gray-500">{t('requires_attention')}</p>
              </div>
            </div>

            {/* Patient Medications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">{t('patient_medications')}</h2>
                <button
                  onClick={handleAddMedication}
                  className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Plus size={18} />
                  <span>{t('add_medication')}</span>
                </button>
              </div>

              {patientMedications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t('no_medications_prescribed')}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {patientMedications.map((med) => (
                    <div key={med.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-900">{med.name}</h3>
                          <p className="text-sm text-gray-500">{med.dosage} {med.dosageUnit}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {med.frequency || `${med.timesPerDay}x daily`}
                          </p>
                          {med.compartment && (
                            <p className="text-xs text-gray-400 mt-1">
                              {t('compartment')} {med.compartment}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            med.remainingQuantity < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {med.remainingQuantity} {t('remaining')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Adherence Trends */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{t('adherence_trends')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{adherenceStats?.taken || 0}</div>
                  <div className="text-sm text-gray-600">{t('taken')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{adherenceStats?.missed || 0}</div>
                  <div className="text-sm text-gray-600">{t('missed')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">{adherenceStats?.skipped || 0}</div>
                  <div className="text-sm text-gray-600">{t('skipped')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{adherenceStats?.total || 0}</div>
                  <div className="text-sm text-gray-600">{t('total_doses')}</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{t('quick_actions')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handleAddMedication}
                  className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Plus size={24} className="text-teal-600 mb-2" />
                  <span className="font-medium text-teal-600">{t('add_medication')}</span>
                </button>
                <button
                  onClick={() => navigate('/calendar')}
                  className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <CalendarIcon size={24} className="text-blue-600 mb-2" />
                  <span className="font-medium text-blue-600">{t('view_calendar')}</span>
                </button>
                <button
                  onClick={handleInvitePatient}
                  className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <UserPlus size={24} className="text-green-600 mb-2" />
                  <span className="font-medium text-green-600">{t('manage_patients')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}
      </PageTransition>
    </DashboardLayout>
  );
};

export default CaregiverDashboard;