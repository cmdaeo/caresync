import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Pill } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { getCalendarData } from '../api/services';
import { motion, fadeIn, PageTransition } from '../animations';
import LoadingSpinner from '../components/LoadingSpinner';
import useAuthStore from '../store/useAuthStore';

const CalendarViewPage = () => {
  const { t } = useTranslation();
  const user = useAuthStore(state => state.user);
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate date range based on view mode
  const getDateRange = () => {
    const endDate = new Date(selectedDate);
    const startDate = new Date(selectedDate);

    if (viewMode === 'week') {
      // Get start of week (Monday)
      const day = selectedDate.getDay();
      const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
      startDate.setDate(diff);
      endDate.setDate(diff + 6);
    } else {
      // Month view - show full month
      startDate.setDate(1);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const loadCalendarData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { startDate, endDate } = getDateRange();
      
      // For caregivers, we might want to add patientId parameter
      const response = await getCalendarData(startDate, endDate);
      
      if (response.success) {
        setCalendarData(response.data.calendar);
      } else {
        setError(response.message || 'Failed to load calendar data');
      }
    } catch (err) {
      console.error('Failed to load calendar data:', err);
      setError('Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, [selectedDate, viewMode]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
    }
    
    setSelectedDate(newDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken': return 'bg-green-500 text-white';
      case 'missed': return 'bg-red-500 text-white';
      case 'late': return 'bg-yellow-500 text-white';
      case 'early': return 'bg-blue-500 text-white';
      case 'skipped': return 'bg-gray-500 text-white';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken': return '✓';
      case 'missed': return '✗';
      case 'late': return '⏰';
      case 'early': return '⏱';
      case 'skipped': return '⊘';
      default: return '⏳';
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Generate calendar grid for month view
  const renderMonthView = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Generate calendar grid
    const calendarGrid = [];
    let dayCounter = 1;

    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < firstDay) {
          week.push(null); // Empty cells before first day
        } else if (dayCounter <= daysInMonth) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayCounter).padStart(2, '0')}`;
          const dayData = calendarData.find(day => day.date === dateStr);
          week.push({ day: dayCounter, date: dateStr, data: dayData });
          dayCounter++;
        } else {
          week.push(null); // Empty cells after last day
        }
      }
      calendarGrid.push(week);
      if (dayCounter > daysInMonth) break;
    }

    return calendarGrid;
  };

  // Render week view
  const renderWeekView = () => {
    const { startDate } = getDateRange();
    const weekStart = new Date(startDate);
    const weekDays = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = calendarData.find(day => day.date === dateStr);
      
      weekDays.push({
        date: currentDate,
        dateStr,
        dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        dayOfMonth: currentDate.getDate(),
        data: dayData
      });
    }

    return weekDays;
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
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="text-2xl font-bold mb-6 flex items-center gap-2"
        >
          <CalendarIcon size={24} />
          {t('medication_calendar')}
        </motion.h1>

        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="text-center">
              <h2 className="text-xl font-semibold">
                {selectedDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </h2>
              {viewMode === 'week' && (
                <p className="text-sm text-gray-600">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </div>

            <button
              onClick={() => navigateDate('next')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="flex gap-2">
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
          </div>
        </div>

        {/* Calendar View */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {viewMode === 'month' ? (
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center p-2 font-medium text-gray-600">
                  {day}
                </div>
              ))}

              {/* Calendar grid */}
              {renderMonthView().map((week, weekIndex) => (
                <React.Fragment key={weekIndex}>
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`min-h-[100px] p-2 border border-gray-100 rounded ${
                        day ? 'hover:bg-gray-50 cursor-pointer' : 'bg-gray-50'
                      }`}
                      onClick={() => day && setSelectedDate(new Date(day.date))}
                    >
                      {day ? (
                        <div>
                          <div className="text-right font-medium text-gray-800">
                            {day.day}
                          </div>
                          <div className="mt-2 space-y-1">
                            {day.data?.medications?.slice(0, 3).map((med: any, idx: number) => (
                              <div
                                key={idx}
                                className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                                  getStatusColor(med.status)
                                }`}
                                title={`${med.name} - ${formatTime(med.scheduledTime)}`}
                              >
                                <span>{getStatusIcon(med.status)}</span>
                                <span>{formatTime(med.scheduledTime)}</span>
                              </div>
                            ))}
                            {day.data?.medications?.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{day.data.medications.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="min-h-[100px]"></div>
                      )}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
              {renderWeekView().map((day) => (
                <div key={day.dateStr} className="p-3 border border-gray-100 rounded-lg">
                  <div className="text-center mb-2">
                    <div className="font-medium text-gray-800">{day.dayOfWeek}</div>
                    <div className="text-2xl font-bold text-gray-900">{day.dayOfMonth}</div>
                  </div>
                  <div className="space-y-2">
                    {day.data?.medications?.map((med: any, idx: number) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                          getStatusColor(med.status)
                        }`}
                      >
                        <Pill size={16} />
                        <div className="flex-1">
                          <div className="font-medium truncate">{med.name}</div>
                          <div className="text-xs opacity-80">
                            {formatTime(med.scheduledTime)} - {med.dosage}
                          </div>
                        </div>
                        <div className="font-bold">{getStatusIcon(med.status)}</div>
                      </div>
                    ))}
                    {!day.data?.medications?.length && (
                      <div className="text-center text-gray-400 text-sm">
                        No medications scheduled
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold mb-3">{t('legend')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { status: 'taken', label: t('taken') },
              { status: 'missed', label: t('missed') },
              { status: 'late', label: t('late') },
              { status: 'early', label: t('early') },
              { status: 'skipped', label: t('skipped') }
            ].map((item) => (
              <div key={item.status} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${getStatusColor(item.status)}`} />
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

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

export default CalendarViewPage;