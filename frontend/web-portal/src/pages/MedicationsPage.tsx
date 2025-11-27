import React, { useEffect, useState } from 'react';
import { Plus, Pill, AlertCircle, Edit, Trash2, RefreshCw } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { getMedications, deleteMedication } from '../api/services';

const MedicationsPage = () => {
  const [meds, setMeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMeds();
  }, []);

  const loadMeds = async () => {
    try {
      const data = await getMedications();
      setMeds(data.data?.medications || []);
    } catch (err) {
      setError('Failed to load medications.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this medication?')) {
      try {
        await deleteMedication(id);
        loadMeds();
      } catch (err) {
        alert('Failed to delete medication.');
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Medications</h1>
        <button className="flex items-center gap-2 bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-800 transition-colors">
          <Plus size={18} />
          <span>Add Medication</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading medications...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} /> {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meds.length === 0 && <p className="text-gray-500 col-span-2">No medications found.</p>}
          
          {meds.map((med) => (
            <div key={med.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Pill className="text-teal-600" size={20} />
                  <h3 className="font-bold text-gray-900 text-lg">{med.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(med.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mb-3">{med.dosage} {med.dosageUnit}</p>
              
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md flex items-center gap-1">
                  <RefreshCw size={12} />
                  {med.remainingQuantity || 0} / {med.totalQuantity || 0} left
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
                  {med.timesPerDay}x daily
                </span>
                {med.remainingQuantity <= 10 && (
                  <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-md">
                    Low Stock!
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MedicationsPage;
