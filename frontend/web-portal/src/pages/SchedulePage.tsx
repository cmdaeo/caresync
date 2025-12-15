import { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight, List, CalendarDays } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { getDailySchedule, logAdherenceRecord } from '../api/services';

const SchedulePage = () => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
      await logAdherenceRecord({
        medicationId,
        status: 'taken',
        takenAt: new Date()
      } as any);
      loadSchedule();
    } catch (err) {
      alert('Failed to log medication intake.');
    }
  };

  const handleSkip = async (medicationId: string) => {
    try {
      await logAdherenceRecord({
        medicationId,
        status: 'skipped'
      } as any);
      loadSchedule();
    } catch (err) {
      alert('Failed to skip dose.');
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isPastTime = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const selectDate = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, day);
    setSelectedDate(date.toISOString().split('T')[0]);
    setViewMode('list');
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelectedDay = (day: number) => {
    const selected = new Date(selectedDate);
    return (
      day === selected.getDate() &&
      currentMonth.getMonth() === selected.getMonth() &&
      currentMonth.getFullYear() === selected.getFullYear()
    );
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Medication Schedule</h1>
          
          {/* View Toggle */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-teal-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List size={18} />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-white text-teal-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays size={18} />
              <span>Calendar</span>
            </button>
          </div>
        </div>

        {/* Date Picker for List View */}
        {viewMode === 'list' && (
          <div className="flex items-center gap-4">
            <Calendar className="text-teal-600" size={20} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        )}
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-6 max-w-2xl mx-auto">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">{monthName}</h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="h-10 sm:h-12" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const today = isToday(day);
              const selected = isSelectedDay(day);

              return (
                <button
                  key={day}
                  onClick={() => selectDate(day)}
                  className={`h-10 sm:h-12 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                    selected
                      ? 'bg-teal-600 text-white shadow-md'
                      : today
                      ? 'bg-teal-50 text-teal-600 border-2 border-teal-600'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 sm:gap-6 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100 text-xs sm:text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-teal-600 rounded"></div>
              <span className="text-gray-600">Selected Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-teal-600 bg-teal-50 rounded"></div>
              <span className="text-gray-600">Today</span>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading schedule...</div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} /> {error}
            </div>
          ) : (
            <div className="space-y-4">
              {schedule.length === 0 && (
                <p className="text-gray-500 text-center py-10">No medications scheduled for this day.</p>
              )}
              
              {schedule.map((dose, idx) => {
                const past = isPastTime(dose.scheduledTime);
                const taken = dose.status === 'taken';
                const skipped = dose.status === 'skipped';
                
                return (
                  <div
                    key={idx}
                    className={`bg-white p-5 rounded-xl border-2 shadow-sm transition-all ${
                      taken
                        ? 'border-green-200 bg-green-50'
                        : skipped
                        ? 'border-gray-300 bg-gray-50 opacity-60'
                        : past
                        ? 'border-red-200 bg-red-50'
                        : 'border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${
                          taken ? 'bg-green-100' : skipped ? 'bg-gray-200' : 'bg-blue-100'
                        }`}>
                          <Clock className={taken ? 'text-green-600' : skipped ? 'text-gray-500' : 'text-blue-600'} size={24} />
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{dose.medicationName}</h3>
                          <p className="text-sm text-gray-600">{dose.dosage} {dose.dosageUnit}</p>
                          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                            <Clock size={14} />
                            {formatTime(dose.scheduledTime)}
                          </p>
                          {dose.instructions && (
                            <p className="text-xs text-gray-500 mt-1 italic">{dose.instructions}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {!taken && !skipped && (
                          <>
                            <button
                              onClick={() => handleMarkAsTaken(dose.medicationId)}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle size={18} />
                              <span>Taken</span>
                            </button>
                            <button
                              onClick={() => handleSkip(dose.medicationId)}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                              <XCircle size={18} />
                              <span>Skip</span>
                            </button>
                          </>
                        )}
                        
                        {taken && (
                          <span className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                            <CheckCircle size={18} />
                            Completed
                          </span>
                        )}
                        
                        {skipped && (
                          <span className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-600 rounded-lg font-medium">
                            <XCircle size={18} />
                            Skipped
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default SchedulePage;
