import { useEffect, useState } from 'react';
import { Calendar, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { getDailySchedule, logAdherenceRecord } from '../api/services';

const SchedulePage = () => {
  const [schedule, setSchedule] = useState<any[]>([]);
  // Initialize with today's date formatted as YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // CONSTANT: How many hours before a pending dose is considered "Missed"
  const MISSED_THRESHOLD_HOURS = 2;

  useEffect(() => {
    loadSchedule();
  }, [selectedDate]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const data = await getDailySchedule(selectedDate);
      const schedList = data.data?.schedule || data.schedule || [];
      setSchedule(Array.isArray(schedList) ? schedList : []);
    } catch (err) {
      console.error('Failed to load schedule:', err);
      setError('Failed to load schedule.');
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsTaken = async (medicationId: string) => {
    try {
      const dose = schedule.find(item => item.medicationId === medicationId);
      const scheduledTime = dose ? dose.scheduledTime : new Date().toISOString();

      await logAdherenceRecord({
        medicationId,
        status: 'taken',
        takenAt: new Date().toISOString(),
        scheduledTime: scheduledTime
      } as any);
      
      loadSchedule();
    } catch (err) {
      alert('Failed to log medication intake.');
    }
  };

  // Helper to change date by +/- 1 day
  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isPastTime = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const isMissedDose = (scheduledTime: string, status: string) => {
    if (status === 'taken') return false;
    const scheduledDate = new Date(scheduledTime);
    const now = new Date();
    const diffInHours = (now.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60);
    return diffInHours > MISSED_THRESHOLD_HOURS;
  };

  // Format date for display header
  const displayDate = new Date(selectedDate).toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <DashboardLayout>
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Schedule</h1>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => changeDate(-1)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-md border border-gray-200">
            <Calendar size={16} className="text-teal-600" />
            <span className="font-medium text-gray-700 text-sm">{displayDate}</span>
          </div>

          <button 
            onClick={() => changeDate(1)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 text-sm">Loading...</div>
      ) : error ? (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      ) : (
        <div className="space-y-2">
          {schedule.length === 0 && (
            <p className="text-gray-500 text-center py-8 text-sm">No medications scheduled.</p>
          )}
          
          {schedule.map((dose, idx) => {
            const taken = dose.status === 'taken';
            const missed = !taken && isMissedDose(dose.scheduledTime, dose.status);
            const late = !taken && !missed && isPastTime(dose.scheduledTime);
            
            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg border shadow-sm transition-all ${
                  taken
                    ? 'border-green-200 bg-green-50/50'
                    : missed
                    ? 'border-red-200 bg-red-50/50'
                    : late
                    ? 'border-orange-200 bg-orange-50/50'
                    : 'border-gray-200 bg-white hover:border-teal-200'
                }`}
              >
                {/* Left: Time & Status Icon */}
                <div className="flex items-center gap-3">
                  <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg ${
                    taken ? 'bg-green-100 text-green-700' : 
                    missed ? 'bg-red-100 text-red-700' : 
                    'bg-blue-50 text-blue-700'
                  }`}>
                    <span className="text-xs font-bold">{formatTime(dose.scheduledTime)}</span>
                  </div>

                  {/* Middle: Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base leading-tight">
                      {dose.medicationName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-medium">
                        {dose.dosage} {dose.dosageUnit}
                      </span>
                      {dose.instructions && (
                        <span className="italic truncate max-w-[150px]">{dose.instructions}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Action */}
                <div>
                  {!taken && !missed ? (
                    <button
                      onClick={() => handleMarkAsTaken(dose.medicationId)}
                      className="px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-md hover:bg-teal-700 transition-colors shadow-sm active:scale-95"
                    >
                      Take
                    </button>
                  ) : (
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      taken ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {taken ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {taken ? 'DONE' : 'MISSED'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default SchedulePage;
