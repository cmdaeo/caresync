// src/features/dashboard/pages/CaregiverPatientDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, FileText, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { client } from '../../../shared/api/client';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

interface ScheduleEntry {
  id: string | null;
  medicationId: string;
  name: string;
  dosage: string;
  scheduledTime: string;
  status: 'taken' | 'late' | 'early' | 'missed' | 'skipped' | 'scheduled' | 'overdue';
}

const STATUS_CONFIG: Record<string, { colour: string; label: string }> = {
  taken: { colour: '#10b981', label: 'Taken' },
  early: { colour: '#10b981', label: 'Taken Early' },
  late: { colour: '#f59e0b', label: 'Taken Late' },
  missed: { colour: '#ef4444', label: 'Missed' },
  skipped: { colour: '#9ca3af', label: 'Skipped' },
  scheduled: { colour: '#6366f1', label: 'Scheduled' },
  overdue: { colour: '#f97316', label: 'Overdue' }
};

export const CaregiverPatientDetail = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, scheduleRes] = await Promise.all([
          client.get('/patients'),
          client.get('/medications/schedule', { params: { patientId } })
        ]);

        const pts = patientsRes.data?.data?.patients || patientsRes.data?.data || [];
        const pt = pts.find((p: any) => p.patientId === patientId);
        
        if (pt) {
          setPatientInfo(pt);
        }

        const calendarData = scheduleRes.data?.data?.calendar || scheduleRes.data?.data || [];
        const mappedEvents = calendarData.flatMap((day: any) => {
          const meds = Array.isArray(day.medications) ? day.medications : [];
          return meds
            .filter((m: any) => m && (m.name || m.medicationId))
            .map((m: any) => {
              const start = m.scheduledTime || day.date;
              const cfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.scheduled;
              return {
                id: m.id || `${m.medicationId}-${start}`,
                title: `${m.name} (${m.dosage})`,
                start,
                backgroundColor: cfg.colour,
                borderColor: cfg.colour,
                textColor: '#ffffff',
                extendedProps: { ...m }
              };
            });
        });
        setEvents(mappedEvents);

      } catch (err) {
        console.error('Failed to load patient detail', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId]);

  const handleRevoke = async () => {
    if (!patientInfo) return;
    setRevoking(true);
    try {
      await client.delete(`/patients/${patientInfo.id}/revoke`);
      navigate('/app/caregiver');
    } catch (err) {
      console.error('Failed to revoke access', err);
      setRevoking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-text-muted" size={32} />
      </div>
    );
  }

  if (!patientInfo) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center text-text-main animate-in fade-in">
        <h2 className="text-2xl font-bold">Patient Not Found</h2>
        <button onClick={() => navigate('/app/caregiver')} className="mt-4 text-brand-primary underline">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 sm:px-0 animate-in fade-in duration-500">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/app/caregiver')} className="p-2 hover:bg-bg-card rounded-full text-text-muted transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text-main">
              {patientInfo.patient?.firstName} {patientInfo.patient?.lastName}
            </h1>
            <p className="text-text-muted">{patientInfo.patient?.email}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/app/caregiver/reports?patientId=${patientId}`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary/90 transition-colors shadow-sm"
          >
            <FileText size={18} />
            Download Report
          </button>
          <button
            onClick={() => setShowRevokeModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-bg-card text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            <XCircle size={18} />
            Revoke Access
          </button>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-text-main mb-4 flex items-center gap-2">
          <CheckCircle2 className="text-brand-primary" size={20} />
          Your Permissions
        </h3>
        <div className="flex gap-6">
          <div className="flex items-center gap-2 text-sm text-text-main">
            <CheckCircle2 size={16} className={patientInfo.permissions?.canViewMedications ? "text-emerald-500" : "text-border-subtle"} />
            <span className={!patientInfo.permissions?.canViewMedications ? "text-text-muted line-through opacity-50" : ""}>Manage Medications</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-main">
            <CheckCircle2 size={16} className={patientInfo.permissions?.canViewAdherence ? "text-emerald-500" : "text-border-subtle"} />
            <span className={!patientInfo.permissions?.canViewAdherence ? "text-text-muted line-through opacity-50" : ""}>Monitor Adherence</span>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 shadow-sm overflow-hidden">
        <h3 className="font-semibold text-text-main mb-6 flex items-center gap-2">
          <Calendar className="text-brand-primary" size={20} />
          Patient Schedule
        </h3>

        <style>{`
        /* Remove external heavy borders */
        .fc-theme-standard .fc-scrollgrid { border: none !important; }
        
        /* Softer internal borders */
        .fc-theme-standard td, .fc-theme-standard th { border-color: var(--border-subtle, #e5e7eb) !important; }

        /* Modern Typography & Header */
        .fc .fc-toolbar-title { font-size: 1.125rem !important; font-weight: 800 !important; color: var(--text-main, #111827); text-transform: capitalize; }

        /* Modernize Navigation Buttons */
        .fc .fc-button-primary {
          background-color: var(--bg-page, #f9fafb) !important;
          border: 1px solid var(--border-subtle, #e5e7eb) !important;
          color: var(--text-main, #111827) !important;
          text-transform: capitalize;
          font-weight: 600;
          font-size: 0.8rem !important;
          padding: 0.35rem 0.75rem !important;
          border-radius: 8px !important;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .fc .fc-button-primary:hover {
          background-color: var(--bg-hover, #f3f4f6) !important;
          border-color: var(--brand-primary, #6366f1) !important;
        }
        .fc .fc-button-primary:disabled { opacity: 0.4; }
        
        .fc-button-group { gap: 4px; }
        .fc-button-group > .fc-button { border-radius: 8px !important; margin: 0 !important; }

        /* Day Headers (Mon, Tue, Wed...) */
        .fc-col-header-cell-cushion {
          color: var(--text-muted, #6b7280) !important;
          font-weight: 700;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 10px 0 !important;
        }

        /* Today Highlight */
        .fc-day-today { background-color: transparent !important; }
        .fc-day-today .fc-daygrid-day-number {
          background-color: var(--brand-primary, #6366f1);
          color: white !important;
          border-radius: 6px;
          padding: 2px 6px;
        }

        /* Day Numbers */
        .fc-daygrid-day-number { color: var(--text-main, #111827); font-weight: 600; font-size: 0.8rem; padding: 4px 8px; margin: 4px; }

        /* Event Pills (Compact) */
        .fc-daygrid-event-harness { margin-bottom: 2px !important; }
        .fc-event {
          border-radius: 6px !important;
          padding: 2px 6px !important;
          font-size: 0.65rem !important;
          font-weight: 700 !important;
          border: none !important;
          cursor: pointer !important;
          transition: transform 0.15s ease, opacity 0.15s ease;
        }
        .fc-event:hover { transform: scale(1.02); opacity: 0.9; }

        /* "+X more" link */
        .fc-daygrid-more-link {
          font-weight: 700 !important;
          font-size: 0.7rem !important;
          color: var(--brand-primary, #6366f1) !important;
          background: rgba(99, 102, 241, 0.1) !important;
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-block;
          margin-top: 2px;
          transition: background 0.2s;
        }
        .fc-daygrid-more-link:hover { background: rgba(99, 102, 241, 0.2) !important; }
        `}</style>
        
        {patientInfo.permissions?.canViewMedications ? (
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={events}
            contentHeight="auto"
            aspectRatio={1.6}
            fixedWeekCount={false}
            dayMaxEvents={2}
            headerToolbar={{
              left: 'title',
              center: '',
              right: 'prev,next today'
            }}
            eventContent={(arg) => {
              return (
                <div
                  className="px-1.5 py-0.5 text-[10px] sm:text-xs truncate rounded w-full font-medium shadow-sm transition-all flex items-center gap-1.5"
                  style={{ backgroundColor: arg.event.backgroundColor, color: arg.event.textColor || '#fff' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40 shadow-inner" />
                  <span className="truncate">{arg.event.title}</span>
                </div>
              )
            }}
          />
        ) : (
          <div className="text-center py-12 text-text-muted">
            <AlertTriangle className="mx-auto mb-3" size={32} />
            <p>You do not have permission to view this patient's medications.</p>
          </div>
        )}
      </div>

      {/* Revoke Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 w-full max-w-md shadow-xl text-center">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-xl font-bold text-text-main mb-2">Revoke Access?</h2>
            <p className="text-sm text-text-muted mb-6">
              Are you sure you want to stop managing <strong>{patientInfo.patient?.firstName} {patientInfo.patient?.lastName}</strong>? You will no longer be able to see their medications or adherence history.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRevokeModal(false)}
                className="flex-1 px-4 py-2 bg-bg-main border border-border-subtle text-text-main font-semibold rounded-lg hover:bg-bg-card transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={revoking}
                className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {revoking ? <Loader2 size={18} className="animate-spin" /> : 'Yes, Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
