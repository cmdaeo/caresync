// src/features/medications/pages/EditMedicationPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useMedicationStore, MedicationFormData } from '../../../shared/store/medicationStore'
import { client } from '../../../shared/api/client'
import { ArrowLeft, Loader2, AlertCircle, Activity } from 'lucide-react'

const DOSAGE_UNITS = ['mg', 'ml', 'g', 'mcg', 'IU', 'drops', 'puffs', 'units']
const FREQUENCIES = ['Once daily', 'Twice daily', '3 times daily', 'Every 8 hours', 'Every 12 hours', 'Weekly', 'As needed']

export const EditMedicationPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { updateMedication } = useMedicationStore()

  const [form, setForm] = useState<MedicationFormData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* Fetch existing medication */
  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const res = await client.get(`/medications/${id}`)
        const med = res.data.data
        setForm({
          name: med.name ?? '',
          dosage: String(med.dosage ?? ''),
          dosageUnit: med.dosageUnit ?? 'mg',
          frequency: med.frequency ?? 'Once daily',
          timesPerDay: med.timesPerDay ?? 1,
          route: med.route ?? '',
          instructions: med.instructions ?? '',
          startDate: med.startDate ? med.startDate.slice(0, 10) : '',
          endDate: med.endDate ? med.endDate.slice(0, 10) : '',
          totalQuantity: med.totalQuantity ?? undefined,
          compartment: med.compartment ?? undefined,
          refillReminder: med.refillReminder ?? true,
        })
      } catch (err: any) {
        setLoadError(err.response?.data?.message ?? 'Medication not found')
      }
    }
    load()
  }, [id])

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          to="/app/medications"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Medications
        </Link>
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-500">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p>{loadError}</p>
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center py-24">
        <Activity className="animate-spin text-text-muted" size={28} />
      </div>
    )
  }

  const set = (field: keyof MedicationFormData, value: any) =>
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !form) return
    setError(null)
    setSubmitting(true)
    try {
      await updateMedication(id, {
        ...form,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      })
      navigate('/app/medications')
    } catch (err: any) {
      setError(err.message ?? 'Failed to update medication')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    'w-full px-3.5 py-2.5 text-sm rounded-lg bg-bg-page border border-border-subtle text-text-main focus:ring-2 focus:ring-brand-primary outline-none transition-colors'
  const labelCls = 'block text-xs font-medium text-text-main mb-1.5 ml-0.5'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        to="/app/medications"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main transition-colors"
      >
        <ArrowLeft size={15} />
        Back to Medications
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Medication</h1>
        <p className="text-sm text-text-muted mt-1">Update the fields and save your changes.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-500">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-bg-card border border-border-subtle rounded-2xl p-5 sm:p-6 space-y-5">
        {/* Name */}
        <div>
          <label className={labelCls}>
            Medication Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Dosage + Unit */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              Dosage <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.dosage}
              onChange={(e) => set('dosage', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>
              Unit <span className="text-red-400">*</span>
            </label>
            <select
              value={form.dosageUnit}
              onChange={(e) => set('dosageUnit', e.target.value)}
              className={inputCls}
            >
              {DOSAGE_UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Frequency + Times per day */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Frequency</label>
            <select
              value={form.frequency}
              onChange={(e) => set('frequency', e.target.value)}
              className={inputCls}
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Times per Day</label>
            <input
              type="number"
              min={1}
              max={24}
              value={form.timesPerDay ?? 1}
              onChange={(e) => set('timesPerDay', parseInt(e.target.value) || 1)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Start / End dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Start Date</label>
            <input
              type="date"
              value={form.startDate ?? ''}
              onChange={(e) => set('startDate', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>End Date (optional)</label>
            <input
              type="date"
              value={form.endDate ?? ''}
              onChange={(e) => set('endDate', e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Compartment + Total Quantity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Dispenser Compartment (1-12)</label>
            <input
              type="number"
              min={1}
              max={12}
              value={form.compartment ?? ''}
              onChange={(e) => set('compartment', e.target.value ? parseInt(e.target.value) : undefined)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Total Quantity</label>
            <input
              type="number"
              min={0}
              value={form.totalQuantity ?? ''}
              onChange={(e) => set('totalQuantity', e.target.value ? parseInt(e.target.value) : undefined)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Route */}
        <div>
          <label className={labelCls}>Route of Administration</label>
          <input
            type="text"
            value={form.route ?? ''}
            onChange={(e) => set('route', e.target.value)}
            placeholder="e.g. Oral, Topical, Intravenous"
            className={inputCls}
          />
        </div>

        {/* Instructions */}
        <div>
          <label className={labelCls}>Instructions / Notes</label>
          <textarea
            rows={3}
            value={form.instructions ?? ''}
            onChange={(e) => set('instructions', e.target.value)}
            className={inputCls + ' resize-none'}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/app/medications"
            className="px-4 py-2.5 text-sm font-medium text-text-muted hover:text-text-main transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-light text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}
