import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pill, Clock, Calendar, Package } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { getMedicationById, refillMedication } from '../api/services';

const MedicationDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [medication, setMedication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refillAmount, setRefillAmount] = useState('');

  useEffect(() => {
    loadMedication();
  }, [id]);

  const loadMedication = async () => {
    try {
      const data = await getMedicationById(id!);
      setMedication(data.data?.medication);
    } catch (err) {
      console.error('Failed to load medication');
    } finally {
      setLoading(false);
    }
  };

  const handleRefill = async () => {
    try {
      await refillMedication(id!, parseInt(refillAmount));
      loadMedication();
      setRefillAmount('');
    } catch (err) {
      alert('Failed to refill medication');
    }
  };

  if (loading) return <DashboardLayout><div className="text-center py-20">Loading...</div></DashboardLayout>;
  if (!medication) return <DashboardLayout><div className="text-center py-20">Medication not found</div></DashboardLayout>;

  const stockPercentage = (medication.remainingQuantity / medication.totalQuantity) * 100;

  return (
    <DashboardLayout>
      <button
        onClick={() => navigate('/dashboard/medications')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        Back to Medications
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
              <Pill className="text-teal-600" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{medication.name}</h1>
              <p className="text-gray-600 mt-1">{medication.dosage} {medication.dosageUnit}</p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-lg font-medium ${
            medication.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {medication.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-4 bg-blue-50 rounded-lg">
            <Clock className="text-blue-600 mb-2" size={24} />
            <p className="text-sm text-gray-600">Frequency</p>
            <p className="text-xl font-bold text-gray-900">{medication.timesPerDay}x daily</p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <Calendar className="text-purple-600 mb-2" size={24} />
            <p className="text-sm text-gray-600">Start Date</p>
            <p className="text-xl font-bold text-gray-900">
              {new Date(medication.startDate).toLocaleDateString()}
            </p>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg">
            <Package className="text-orange-600 mb-2" size={24} />
            <p className="text-sm text-gray-600">Route</p>
            <p className="text-xl font-bold text-gray-900">{medication.route || 'Oral'}</p>
          </div>
        </div>

        {/* Stock Level */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-900">Stock Level</h3>
            <span className="text-sm text-gray-600">
              {medication.remainingQuantity} / {medication.totalQuantity} doses
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                stockPercentage > 50 ? 'bg-green-500' : stockPercentage > 20 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${stockPercentage}%` }}
            />
          </div>
        </div>

        {/* Refill Section */}
        <div className="border-t pt-6">
          <h3 className="font-bold text-gray-900 mb-4">Refill Medication</h3>
          <div className="flex gap-4">
            <input
              type="number"
              value={refillAmount}
              onChange={(e) => setRefillAmount(e.target.value)}
              placeholder="Enter quantity"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={handleRefill}
              disabled={!refillAmount}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Refill
            </button>
          </div>
        </div>

        {/* Instructions */}
        {medication.instructions && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
            <p className="text-gray-700">{medication.instructions}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MedicationDetailsPage;
