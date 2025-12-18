import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X, Pill, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import { getPatientMedications, deletePatientMedication, createMedicationForPatient, getAvailableCompartments } from '../api/services';
import { motion, fadeIn, PageTransition } from '../animations';
import CompartmentSelector from '../components/CompartmentSelector';
import { useLocation } from 'react-router-dom';

const CaregiverMedicationsPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [meds, setMeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [_, setAvailableCompartments] = useState<number[]>([]);
  const [usedCompartments, setUsedCompartments] = useState<number[]>([]);

  // Get patientId from location state or URL
  const patientId = location.state?.patientId || new URLSearchParams(location.search).get('patientId');

  // Form State
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    dosageUnit: 'mg',
    frequency: '1x daily',
    timesPerDay: 1,
    totalQuantity: 30,
    compartment: null as number | null,
    startDate: new Date().toISOString().split('T')[0]
  });

  const loadMeds = async () => {
    if (!patientId) {
      setError('No patient selected');
      setLoading(false);
      return;
    }

    try {
      const data = await getPatientMedications(patientId);
      setMeds(data.data || []);
      
      // Extract used compartments
      const used = data.data
        ? data.data.filter((med: any) => med.compartment).map((med: any) => med.compartment)
        : [];
      setUsedCompartments(used);
      
      // Load available compartments
      const compartmentsResponse = await getAvailableCompartments(patientId);
      if (compartmentsResponse.success) {
        setAvailableCompartments(compartmentsResponse.data.available || []);
      }

    } catch (err) {
      setError('Failed to load medications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeds();
  }, [patientId]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientId) {
      setError('No patient selected');
      return;
    }

    try {
      await createMedicationForPatient(patientId, newMed);
      setShowAddModal(false);
      loadMeds(); // Refresh list
      setNewMed({
        name: '',
        dosage: '',
        dosageUnit: 'mg',
        frequency: '1x daily',
        timesPerDay: 1,
        totalQuantity: 30,
        compartment: null,
        startDate: new Date().toISOString().split('T')[0]
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add medication');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      try {
        await deletePatientMedication(id);
        loadMeds();
      } catch (err) {
        setError('Failed to delete');
      }
    }
  };

  const handleCompartmentSelect = (compartment: number) => {
    setNewMed({ ...newMed, compartment });
  };

  const handleCompartmentDeselect = (compartment: number) => {
    if (newMed.compartment === compartment) {
      setNewMed({ ...newMed, compartment: null });
    }
  };

  if (!patientId) {
    return (
      <DashboardLayout>
        <PageTransition>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Users className="text-gray-300 mx-auto mb-4" size={64} />
            <p className="text-gray-500 text-lg mb-2">{t('no_patient_selected')}</p>
            <p className="text-gray-400 text-sm">{t('select_patient_to_manage_medications')}</p>
          </div>
        </PageTransition>
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
            <Pill size={24} />
            {t('patient_medications')}
          </motion.h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-800 transition-colors"
          >
            <Plus size={18} />
            <span>{t('add_medication')}</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meds.map((med) => (
              <div key={med.id} className="bg-white p-5 rounded-xl border shadow-sm">
                <div className="flex justify-between">
                  <h3 className="font-bold text-gray-900">{med.name}</h3>
                  <button onClick={() => handleDelete(med.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">{med.dosage} {med.dosageUnit}</p>
                <div className="mt-2 text-sm text-gray-600">
                  {med.frequency || `${med.timesPerDay}x daily`}
                </div>
                {med.compartment && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xs font-bold">{med.compartment}</span>
                    </div>
                    <span className="text-sm text-gray-500">{t('compartment')} {med.compartment}</span>
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {t('remaining')}: {med.remainingQuantity} / {med.totalQuantity}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    med.remainingQuantity < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {med.remainingQuantity < 10 ? t('low_stock') : t('in_stock')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Medication Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6 relative">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">{t('add_medication')}</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('medication_name')}
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      value={newMed.name}
                      onChange={e => setNewMed({...newMed, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('dosage')}
                    </label>
                    <input
                      type="number"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      value={newMed.dosage}
                      onChange={e => setNewMed({...newMed, dosage: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('dosage_unit')}
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      value={newMed.dosageUnit}
                      onChange={e => setNewMed({...newMed, dosageUnit: e.target.value})}
                    >
                      <option value="mg">mg</option>
                      <option value="ml">ml</option>
                      <option value="tablets">tablets</option>
                      <option value="capsules">capsules</option>
                      <option value="drops">drops</option>
                      <option value="units">units</option>
                      <option value="puffs">puffs</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('times_per_day')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      value={newMed.timesPerDay}
                      onChange={e => setNewMed({...newMed, timesPerDay: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('total_stock')}
                    </label>
                    <input
                      type="number"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      value={newMed.totalQuantity}
                      onChange={e => setNewMed({...newMed, totalQuantity: parseInt(e.target.value)})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('start_date')}
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      value={newMed.startDate}
                      onChange={e => setNewMed({...newMed, startDate: e.target.value})}
                    />
                  </div>
                </div>

                {/* Compartment Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('compartment_assignment')}
                  </label>
                  <div className="flex flex-col items-center gap-4">
                    <CompartmentSelector
                      totalCompartments={12}
                      selectedCompartments={newMed.compartment ? [newMed.compartment] : []}
                      usedCompartments={usedCompartments}
                      onSelect={handleCompartmentSelect}
                      onDeselect={handleCompartmentDeselect}
                      size={250}
                    />
                    {newMed.compartment && (
                      <div className="text-sm text-gray-600">
                        {t('selected_compartment')}: {newMed.compartment}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 font-medium"
                  >
                    {t('save_medication')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    {t('cancel')}
                  </button>
                </div>

                {error && (
                  <div className="text-red-500 text-sm mt-2">
                    {error}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </PageTransition>
    </DashboardLayout>
  );
};

export default CaregiverMedicationsPage;