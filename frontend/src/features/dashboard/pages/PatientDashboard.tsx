// src/features/dashboard/pages/PatientDashboard.tsx
// Extracted from DashboardHome — the outer shell (bg, header, logout) now lives in DashboardLayout.
import { useEffect, useState } from 'react'
import { client } from '../../../shared/api/client'
import { Pill, Activity } from 'lucide-react'

interface Medication {
  id: string
  name: string
  dosage: string
  time: string
  compartment: number
}

export const PatientDashboard = () => {
  const [meds, setMeds] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMeds = async () => {
      try {
        const res = await client.get('/medications?limit=5').catch(() => null)
        if (res && res.data?.data?.length > 0) {
          setMeds(res.data.data)
        } else {
          // Mock fallback while medication CRUD doesn't exist yet
          setMeds([
            { id: '1', name: 'Lisinopril', dosage: '10 mg', time: '08:00 AM', compartment: 1 },
            { id: '2', name: 'Metformin',  dosage: '500 mg', time: '08:00 AM', compartment: 2 },
          ])
        }
      } catch {
        // Silently fall back to empty list
      } finally {
        setLoading(false)
      }
    }
    fetchMeds()
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* --- Cards grid --- */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Medications Card */}
        <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle shadow-sm transition-colors duration-200">
          <div className="flex items-center gap-2 mb-5">
            <Pill className="text-brand-primary w-5 h-5" />
            <h2 className="font-semibold text-lg">Upcoming Doses</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Activity className="animate-spin text-text-muted" />
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
                    <div className="text-xs text-text-muted mt-0.5">
                      {med.dosage} &bull; {med.time}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-sm">
                    {med.compartment}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Adherence Stats Card */}
        <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle shadow-sm transition-colors duration-200">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="text-green-500 w-5 h-5" />
            <h2 className="font-semibold text-lg">Weekly Adherence</h2>
          </div>

          <div className="h-40 flex items-end justify-between px-2 pt-4">
            {[90, 85, 100, 100, 95, 80, 100].map((h, i) => (
              <div
                key={i}
                className="w-8 bg-green-500/20 rounded-t-md relative"
                style={{ height: `${h}%` }}
              >
                <div
                  className="w-full bg-green-500 rounded-t-md absolute bottom-0 transition-all duration-1000"
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
