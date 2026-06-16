// src/features/medications/pages/SchedulePage.tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, EventInput } from '@fullcalendar/core'
import { motion, AnimatePresence } from 'framer-motion'
import { client } from '../../../shared/api/client'
import { 
  Activity, CalendarDays, X, CheckCircle2, XCircle, 
  Loader2, Clock, Pill, CalendarClock, AlertTriangle, Box, ChevronLeft, ChevronRight
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface ScheduleEntry {
  id: string | null
  medicationId: string
  name: string
  dosage: string
  compartment: number | null
  scheduledTime: string
  takenAt: string | null
  status: 'taken' | 'late' | 'early' | 'missed' | 'skipped' | 'scheduled' | 'overdue'
}

interface CalendarDay {
  date: string
  medications: ScheduleEntry[]
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<string, { colour: string; label: string; icon: string }> = {
  taken:     { colour: '#10b981', label: 'Taken',      icon: '✓' }, // emerald-500
  early:     { colour: '#10b981', label: 'Taken Early', icon: '✓' }, // emerald-500
  late:      { colour: '#f59e0b', label: 'Taken Late',  icon: '⚠' }, // amber-500
  missed:    { colour: '#ef4444', label: 'Missed',      icon: '✗' }, // red-500
  skipped:   { colour: '#9ca3af', label: 'Skipped',   icon: '—' }, // gray-400
  scheduled: { colour: '#6366f1', label: 'Pending',   icon: '◦' }, // indigo-500
  overdue:   { colour: '#f97316', label: 'Overdue',   icon: '!' }, // orange-500
}

const isRecorded = (status: string) =>
  ['taken', 'early', 'late', 'missed', 'skipped'].includes(status)

const isTaken = (status: string) =>
  ['taken', 'early', 'late'].includes(status)

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function buildStart(scheduledTime: string | null | undefined, dayDate: string): string {
  if (scheduledTime) {
    const d = new Date(scheduledTime)
    if (!isNaN(d.getTime())) return d.toISOString()
  }
  return dayDate
}

function entryToEvent(entry: ScheduleEntry, dayDate: string): EventInput {
  const cfg = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.scheduled
  return {
    id: `${entry.id ?? entry.medicationId}-${entry.scheduledTime ?? dayDate}`,
    title: entry.name ?? 'Unknown Medication',
    start: buildStart(entry.scheduledTime, dayDate),
    allDay: true,
    backgroundColor: cfg.colour,
    borderColor: cfg.colour,
    extendedProps: { ...entry, dayDate },
  }
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export const SchedulePage = () => {
  const [events, setEvents] = useState<EventInput[]>([])
  const [loading, setLoading] = useState(true)

  const [selected, setSelected] = useState<(ScheduleEntry & { dayDate: string }) | null>(null)
  const [recording, setRecording] = useState(false)
  const [stockMap, setStockMap] = useState<Record<string, number | null>>({})

  const inFlightRef = useRef(false)

  const fetchSchedule = useCallback(async () => {
    setLoading(true)
    try {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 2, 0)

      const [scheduleRes, medsRes] = await Promise.allSettled([
        client.get('/medications/schedule', {
          params: { startDate: start.toISOString(), endDate: end.toISOString() },
        }),
        client.get('/medications', { params: { limit: 100, status: 'active' } }),
      ])

      if (scheduleRes.status === 'fulfilled') {
        const payload = scheduleRes.value.data?.data ?? scheduleRes.value.data
        const calendar: CalendarDay[] = Array.isArray(payload?.calendar)
          ? payload.calendar
          : Array.isArray(payload) ? payload : []

        const mapped = calendar.flatMap((day) => {
          const meds = Array.isArray(day.medications) ? day.medications : []
          return meds
            .filter((m) => m && (m.name || m.medicationId))
            .map((m) => entryToEvent(m, day.date))
        })
        setEvents(mapped)
      }

      if (medsRes.status === 'fulfilled') {
        const list = medsRes.value.data?.data ?? []
        const next: Record<string, number | null> = {}
        for (const m of list as Array<{ id: string; remainingQuantity: number | null }>) {
          next[m.id] = m.remainingQuantity ?? null
        }
        setStockMap(next)
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSchedule()
  }, [fetchSchedule])

  const recordAdherence = async (status: 'taken' | 'missed') => {
    if (!selected || inFlightRef.current) return
    if (status === 'taken') {
      const stock = stockMap[selected.medicationId]
      if (stock != null && stock <= 0) return
    }
    
    inFlightRef.current = true
    setRecording(true)
    
    try {
      await client.post('/medications/adherence', {
        medicationId: selected.medicationId,
        status,
        scheduledTime: selected.scheduledTime || new Date(selected.dayDate).toISOString(),
        takenAt: status === 'taken' ? new Date().toISOString() : null,
      })
      await fetchSchedule()
      setSelected(null)
    } catch {
      // Keep modal open
    } finally {
      inFlightRef.current = false
      setRecording(false)
    }
  }

  const handleEventClick = (info: EventClickArg) => {
    const props = info.event.extendedProps as ScheduleEntry & { dayDate: string }
    setSelected(props)
  }

  const selCfg = selected ? (STATUS_CONFIG[selected.status] ?? STATUS_CONFIG.scheduled) : null

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0 py-8">
      
      {/* Dynamic CSS for a Dashboard-like Compact Calendar */}
      <style>{`
        /* Remove external heavy borders */
        .fc-theme-standard .fc-scrollgrid {
          border: none !important;
        }
        
        /* Softer internal borders */
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: var(--border-subtle, #e5e7eb) !important;
        }

        /* Modern Typography & Header */
        .fc .fc-toolbar-title {
          font-size: 1.125rem !important;
          font-weight: 800 !important;
          color: var(--text-main, #111827);
          text-transform: capitalize;
        }

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
        .fc-day-today {
          background-color: transparent !important;
        }
        .fc-day-today .fc-daygrid-day-number {
          background-color: var(--brand-primary, #6366f1);
          color: white !important;
          border-radius: 6px;
          padding: 2px 6px;
        }

        /* Day Numbers */
        .fc-daygrid-day-number {
          color: var(--text-main, #111827);
          font-weight: 600;
          font-size: 0.8rem;
          padding: 4px 8px;
          margin: 4px;
        }

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
        .fc-event:hover {
          transform: scale(1.02);
          opacity: 0.9;
        }

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

      {/* Header & Legend Area */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-card p-5 rounded-2xl border border-border-subtle shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-primary/10 text-brand-primary">
            <CalendarDays size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-text-main leading-none">Schedule</h1>
            <p className="text-xs text-text-muted mt-1 font-medium">Track history and upcoming doses.</p>
          </div>
        </div>
        
        {/* Compact Badges Legend */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bg-page border border-border-subtle">
              <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: cfg.colour }} />
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">{cfg.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Calendar Dashboard Widget Container */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-bg-card border border-border-subtle rounded-2xl shadow-sm p-3 sm:p-5 relative overflow-hidden"
      >
        {loading && events.length === 0 ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-bg-card/60 backdrop-blur-md">
            <Activity className="animate-spin text-brand-primary mb-3" size={28} />
          </div>
        ) : null}

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          eventClick={handleEventClick}
          
          /* UX Adjustments for a Compact Dashboard Feel */
          contentHeight="auto"       // Prevents weird vertical stretching
          aspectRatio={1.6}          // Wider, less tall cells
          fixedWeekCount={false}     // Removes empty week rows at the end of the month
          dayMaxEvents={2}           // Keeps cells clean by forcing "+X more" earlier
          
          headerToolbar={{
            left: 'title',
            center: '',
            right: 'prev,next today'
          }}
        />
      </motion.div>

      {/* ---- Interactive Action Modal ---- */}
      <AnimatePresence>
        {selected && selCfg && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-bg-card border border-border-subtle rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Colored Top Bar based on status */}
              <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: selCfg.colour }} />

              <div className="p-5 sm:p-6 flex flex-col gap-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-text-main leading-tight">{selected.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-md">
                        <Pill size={10} /> {selected.dosage}
                      </span>
                      {selected.compartment && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-text-muted bg-bg-page border border-border-subtle px-2 py-0.5 rounded-md">
                          <Box size={10} /> Box {selected.compartment}
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelected(null)} 
                    className="p-1.5 bg-bg-page hover:bg-bg-hover border border-transparent hover:border-border-subtle text-text-muted rounded-lg transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 bg-bg-page border border-border-subtle p-3.5 rounded-xl">
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-text-muted mb-0.5 tracking-wider">Date</span>
                    <span className="text-sm font-semibold text-text-main">{formatDate(selected.dayDate)}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-text-muted mb-0.5 tracking-wider">Time</span>
                    <span className="text-sm font-semibold text-text-main">{formatTime(selected.scheduledTime)}</span>
                  </div>
                  <div className="col-span-2 pt-2.5 mt-1 border-t border-border-subtle flex items-center justify-between">
                    <span className="block text-[9px] uppercase font-bold text-text-muted tracking-wider">Status</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-bg-card border border-border-subtle shadow-sm">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selCfg.colour }} />
                      <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: selCfg.colour }}>{selCfg.label}</span>
                    </div>
                  </div>
                </div>

                {/* Action Area State Machine */}
                {(() => {
                  const isFuture = new Date(selected.scheduledTime) > new Date()
                  const stock = stockMap[selected.medicationId]
                  const isDepleted = stock != null && stock <= 0

                  if (isRecorded(selected.status)) {
                    return (
                      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-bg-page border border-border-subtle">
                        <div className="p-1.5 rounded-full mt-0.5 bg-bg-card shadow-sm" style={{ color: selCfg.colour }}>
                          <CheckCircle2 size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-main">Action Recorded</p>
                          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                            {isTaken(selected.status) 
                              ? `This dose was recorded as ${selCfg.label.toLowerCase()}.` 
                              : selected.status === 'missed' 
                                ? 'This dose was recorded as missed.' 
                                : 'This dose was skipped.'}
                          </p>
                        </div>
                      </div>
                    )
                  }

                  if (isFuture) {
                    return (
                      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-brand-primary/5 border border-brand-primary/20 text-brand-primary">
                        <CalendarClock size={16} className="shrink-0 mt-0.5" />
                        <p className="text-xs font-medium leading-relaxed">
                          This dose is scheduled for the future. Actions will unlock once the time arrives.
                        </p>
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-3">
                      {isDepleted && (
                        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/5 border border-red-500/20 text-red-500">
                          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                          <p className="text-[11px] font-medium leading-relaxed">
                            <strong>Inventory depleted.</strong> Please refill this medication before marking it as taken.
                          </p>
                        </div>
                      )}
                      
                      <div className="flex gap-2 sm:gap-3 pt-1">
                        <button
                          onClick={() => recordAdherence('taken')}
                          disabled={recording || isDepleted}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm shadow-emerald-500/20"
                        >
                          {recording ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                          Mark Taken
                        </button>
                        <button
                          onClick={() => recordAdherence('missed')}
                          disabled={recording}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-bg-page border border-border-subtle hover:border-red-500/50 hover:text-red-500 hover:bg-red-500/5 text-text-main text-[13px] font-bold rounded-xl transition-all disabled:opacity-50 active:scale-95"
                        >
                          {recording ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                          Mark Missed
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}