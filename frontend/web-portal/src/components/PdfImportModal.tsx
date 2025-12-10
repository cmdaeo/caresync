import React, { useMemo, useState } from 'react';
import { parseSnsPdf, addMedication } from '../api/services';
import { ParsedMedication } from '../types/sns';
import { X, Upload, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

type EditableMedication = {
  name: string;
  dosage: string;
  dosageUnit: string;
  frequency: string;
  timesPerDay: number;
  totalQuantity: number;
  startDate: string;
  instructions?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onImported?: () => void;
  onFallbackToManual?: () => void;
};

const todayIso = () => new Date().toISOString().split('T')[0];

function normalizeToEditable(med: ParsedMedication): EditableMedication {
  const dosageValue =
    med.dose_mg ??
    (Array.isArray(med.doses_mg) && med.doses_mg.length ? med.doses_mg[0] : '') ??
    '';
  const timesPerDay = med.times_per_day ?? 1;

  return {
    name: (med.drug_name || med.raw_title || '').trim(),
    dosage: dosageValue?.toString() || '',
    dosageUnit: med.form || 'mg',
    frequency: med.times_per_day ? `${med.times_per_day}x daily` : '1x daily',
    timesPerDay,
    totalQuantity: med.quantity_prescribed ?? med.units_in_box ?? 30,
    startDate: todayIso(),
    instructions: med.raw_notes || '',
  };
}

const PdfImportModal = ({ open, onClose, onImported, onFallbackToManual }: Props) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedMeds, setParsedMeds] = useState<EditableMedication[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please choose a PDF file.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await parseSnsPdf(selectedFile);
      const medsArray: ParsedMedication[] = Array.isArray(response) ? response : response?.data || [];
      if (!medsArray.length) {
        setError('No medications detected in this PDF.');
        setLoading(false);
        return;
      }
      setParsedMeds(medsArray.map(normalizeToEditable));
      setStep('review');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to parse PDF.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      for (const med of parsedMeds) {
        await addMedication({
          name: med.name,
          dosage: med.dosage,
          dosageUnit: med.dosageUnit,
          frequency: med.frequency,
          timesPerDay: med.timesPerDay,
          totalQuantity: med.totalQuantity,
          startDate: med.startDate,
          instructions: med.instructions,
        });
      }
      setSuccessMsg('Medications imported successfully.');
      onImported?.();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save medications.');
    } finally {
      setSaving(false);
    }
  };

  const headerTitle = useMemo(() => (step === 'upload' ? 'Import from SNS PDF' : 'Review medications'), [step]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{headerTitle}</h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded-lg mb-4">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 'upload' && (
          <form className="space-y-4" onSubmit={handleUpload}>
            <div>
              <label className="block text-sm font-medium mb-2">SNS Prescription PDF</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full border rounded p-2"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-800 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                {loading ? 'Parsing...' : 'Upload & Parse'}
              </button>
              <button
                type="button"
                onClick={onFallbackToManual}
                className="text-sm text-teal-700 hover:underline"
              >
                Switch to manual entry
              </button>
            </div>
          </form>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Review the detected medications and adjust before saving.
            </p>
            <div className="space-y-4">
              {parsedMeds.map((med, idx) => (
                <div key={idx} className="border rounded-lg p-4 bg-gray-50 space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium">Name</label>
                      <input
                        className="w-full border rounded p-2"
                        value={med.name}
                        onChange={(e) =>
                          setParsedMeds((prev) =>
                            prev.map((m, i) => (i === idx ? { ...m, name: e.target.value } : m))
                          )
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium">Dosage</label>
                        <input
                          className="w-full border rounded p-2"
                          value={med.dosage}
                          onChange={(e) =>
                            setParsedMeds((prev) =>
                              prev.map((m, i) => (i === idx ? { ...m, dosage: e.target.value } : m))
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Unit</label>
                        <input
                          className="w-full border rounded p-2"
                          value={med.dosageUnit}
                          onChange={(e) =>
                            setParsedMeds((prev) =>
                              prev.map((m, i) => (i === idx ? { ...m, dosageUnit: e.target.value } : m))
                            )
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Frequency (label)</label>
                      <input
                        className="w-full border rounded p-2"
                        value={med.frequency}
                        onChange={(e) =>
                          setParsedMeds((prev) =>
                            prev.map((m, i) => (i === idx ? { ...m, frequency: e.target.value } : m))
                          )
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium">Times per day</label>
                        <input
                          type="number"
                          min={1}
                          className="w-full border rounded p-2"
                          value={med.timesPerDay}
                          onChange={(e) =>
                            setParsedMeds((prev) =>
                              prev.map((m, i) => (i === idx ? { ...m, timesPerDay: Number(e.target.value) } : m))
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Total quantity</label>
                        <input
                          type="number"
                          className="w-full border rounded p-2"
                          value={med.totalQuantity}
                          onChange={(e) =>
                            setParsedMeds((prev) =>
                              prev.map((m, i) => (i === idx ? { ...m, totalQuantity: Number(e.target.value) } : m))
                            )
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Start date</label>
                      <input
                        type="date"
                        className="w-full border rounded p-2"
                        value={med.startDate}
                        onChange={(e) =>
                          setParsedMeds((prev) =>
                            prev.map((m, i) => (i === idx ? { ...m, startDate: e.target.value } : m))
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Notes</label>
                      <textarea
                        className="w-full border rounded p-2"
                        value={med.instructions}
                        onChange={(e) =>
                          setParsedMeds((prev) =>
                            prev.map((m, i) => (i === idx ? { ...m, instructions: e.target.value } : m))
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border"
                onClick={() => setStep('upload')}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-800 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : null}
                {saving ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfImportModal;
