// src/features/dashboard/pages/PatientDashboard.tsx
// Real data dashboard — consumes medication + adherence APIs, renders recharts.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { client } from '../../../shared/api/client'
import {
  Pill,
  Activity,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MedSummary {
  id: string
  name: string
  dosage: number | string
  dosageUnit: string
  compartment: number | null
  frequency: string
}

interface AdherenceStats {
  rate: number
  total: number
  taken: number
  missed: number
  skipped: number
  period: string
}

interface DailyAdherence {
  date: string
  rate: number
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const PatientDashboard = () => {
  const [meds, setMeds] = useState<MedSummary[]>([])
  const [totalMeds, setTotalMeds] = useState(0)
  const [stats, setStats] = useState<AdherenceStats | null>(null)
  const [dailyData, setDailyData] = useState<DailyAdherence[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        // Fire all requests in parallel
        const [medsRes, statsRes, scheduleRes] = await Promise.allSettled([
          client.get('/medications', { params: { limit: 5, status: 'active' } }),
          client.get('/medications/adherence/stats', { params: { period: 'week' } }),
          client.get('/medications/schedule', {
            params: {
              startDate: new Date(Date.now() - 6 * 86400000).toISOString(),
              endDate: new Date().toISOString(),
            },
          }),
        ])

        // Medications
        if (medsRes.status === 'fulfilled') {
          setMeds(medsRes.value.data?.data ?? [])
          setTotalMeds(medsRes.value.data?.pagination?.totalItems ?? medsRes.value.data?.data?.length ?? 0)
        }

        // Adherence stats
        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data?.data ?? null)
        }

        // Build daily adherence from schedule for bar chart
        if (scheduleRes.status === 'fulfilled') {
          const calendar: { date: string; medications: { status: string }[] }[] =
            scheduleRes.value.data?.data?.calendar ?? []
          const daily = calendar.map((day) => {
            const total = day.medications.length
            const taken = day.medications.filter(
              (m) => m.status === 'taken' || m.status === 'early' || m.status === 'late'
            ).length
            return {
              date: new Date(day.date).toLocaleDateString('en', { weekday: 'short' }),
              rate: total > 0 ? Math.round((taken / total) * 100) : 0,
            }
          })
          setDailyData(daily)
        }
      } catch {
        // Individual failures handled by allSettled
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  /* ---------------------------------------------------------------- */
  /*  Bar colour helper                                                */
  /* ---------------------------------------------------------------- */
  const barColour = (rate: number) =>
    rate >= 90 ? '#22c55e' : rate >= 70 ? '#eab308' : '#ef4444'

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Activity className="animate-spin text-text-muted" size={28} />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ---- Metric cards row ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Pill size={18} />}
          iconBg="bg-brand-primary/10 text-brand-primary"
          label="Active Medications"
          value={totalMeds}
        />
        <MetricCard
          icon={<TrendingUp size={18} />}
          iconBg="bg-green-500/10 text-green-500"
          label="Adherence Rate"
          value={stats ? `${stats.rate}%` : '–'}
        />
        <MetricCard
          icon={<CheckCircle2 size={18} />}
          iconBg="bg-emerald-500/10 text-emerald-500"
          label="Doses Taken"
          value={stats?.taken ?? '–'}
        />
        <MetricCard
          icon={<XCircle size={18} />}
          iconBg="bg-red-500/10 text-red-500"
          label="Doses Missed"
          value={stats?.missed ?? '–'}
        />
      </div>

      {/* ---- Two-column cards ---- */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Medications */}
        <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Pill className="text-brand-primary w-5 h-5" />
              <h2 className="font-semibold text-lg">Upcoming Doses</h2>
            </div>
            <Link
              to="/app/medications"
              className="text-xs text-brand-primary hover:underline flex items-center gap-0.5"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {meds.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-text-muted">
              <Pill size={28} className="opacity-30 mb-2" />
              <p className="text-sm">No active medications.</p>
              <Link to="/app/medications/add" className="text-xs text-brand-primary hover:underline mt-1">
                Add your first medication
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {meds.map((med) => (
                <div
                  key={med.id}
                  className="flex justify-between items-center p-3.5 bg-bg-page rounded-xl border border-border-subtle"
                >
                  <div>
                    <div className="font-semibold text-text-main">{med.name}</div>
                    <div className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                      <Clock size={10} />
                      {med.dosage} {med.dosageUnit}
                      {med.frequency ? ` \u2022 ${med.frequency}` : ''}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-sm">
                    {med.compartment ?? '–'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Adherence Chart */}
        <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="text-green-500 w-5 h-5" />
            <h2 className="font-semibold text-lg">Weekly Adherence</h2>
          </div>

          {dailyData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-text-muted">
              <Activity size={28} className="opacity-30 mb-2" />
              <p className="text-sm">No adherence data yet.</p>
              <p className="text-xs opacity-60 mt-0.5">Record doses to see your chart.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={192}>
              <BarChart data={dailyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle, #e5e7eb)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted, #9ca3af)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted, #9ca3af)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  width={40}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Adherence']}
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-card, #fff)',
                    border: '1px solid var(--color-border-subtle, #e5e7eb)',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                  }}
                />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {dailyData.map((entry, i) => (
                    <Cell key={i} fill={barColour(entry.rate)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Small metric card sub-component                                    */
/* ------------------------------------------------------------------ */

function MetricCard({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string | number
}) {
  return (
    <div className="bg-bg-card p-4 rounded-xl border border-border-subtle shadow-sm flex items-center gap-3">
      <div className={`p-2 rounded-lg shrink-0 ${iconBg}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-text-muted truncate">{label}</p>
        <p className="text-lg font-bold text-text-main leading-tight">{value}</p>
      </div>
    </div>
  )
}
