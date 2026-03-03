// src/features/dashboard/pages/CaregiverDashboard.tsx
// Stub — will be fleshed out in Sprint 2 (ToDo 12).
import { Users, Activity } from 'lucide-react'

export const CaregiverDashboard = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Patients overview card */}
      <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Users className="text-brand-primary w-5 h-5" />
          <h2 className="font-semibold text-lg">Your Patients</h2>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-text-muted">
          <Activity size={32} className="mb-3 opacity-40" />
          <p className="text-sm font-medium">No patients assigned yet.</p>
          <p className="text-xs mt-1 opacity-60">Patient management will be available soon.</p>
        </div>
      </div>
    </div>
  )
}
