import { useState } from 'react';
import {Download, Calendar } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { generatePDFReport } from '../api/services';
import { format, subDays } from 'date-fns';

const ReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState('7'); // '7' or '30' days

  const handleDownload = async () => {
    setLoading(true);
    try {
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), parseInt(range)), 'yyyy-MM-dd');
      
      const blob = await generatePDFReport(startDate, endDate);
      
      // Create a fake link to force download
      const url = window.URL.createObjectURL(new Blob([blob.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CareSync-Report-${startDate}-to-${endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Adherence Reports</h1>
      
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden max-w-2xl">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Export PDF Summary</h2>
          <p className="text-sm text-gray-500 mt-1">
            Download a detailed report of medication adherence for your doctor.
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Time Range</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setRange('7')}
                className={`p-4 border rounded-xl flex items-center justify-center gap-2 transition-all ${range === '7' ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <Calendar size={20} />
                <span>Last 7 Days</span>
              </button>
              <button 
                onClick={() => setRange('30')}
                className={`p-4 border rounded-xl flex items-center justify-center gap-2 transition-all ${range === '30' ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <Calendar size={20} />
                <span>Last 30 Days</span>
              </button>
            </div>
          </div>

          <button 
            onClick={handleDownload}
            disabled={loading}
            className="w-full bg-teal-700 text-white py-4 rounded-xl font-bold text-lg hover:bg-teal-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              'Generating PDF...'
            ) : (
              <>
                <Download size={24} /> Download Report
              </>
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
