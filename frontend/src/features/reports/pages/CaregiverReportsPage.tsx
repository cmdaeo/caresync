import { useState, useEffect } from 'react';
import { client } from '../../../shared/api/client';
import { FileBarChart, Download, Loader2, AlertCircle, CheckCircle2, Users } from 'lucide-react';

const defaultStart = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};
const defaultEnd = () => new Date().toISOString().slice(0, 10);

interface Patient {
  id: string; // Relationship ID
  patientId: string;
  patient: {
    firstName: string;
    lastName: string;
    email: string;
  };
  permissions: {
    canViewAdherence: boolean;
  };
}

export const CaregiverReportsPage = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [includeCharts, setIncludeCharts] = useState(true);
  
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await client.get('/patients');
        const pts = res.data?.data?.patients || res.data?.data || [];
        const activePts = Array.isArray(pts) ? pts.filter(p => p.status === 'Active' && p.permissions?.canViewAdherence) : [];
        setPatients(activePts);
        if (activePts.length > 0) {
          setSelectedPatientId(activePts[0].patientId);
        }
      } catch (err) {
        console.error('Failed to load patients', err);
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchPatients();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setError('Please select a patient');
      return;
    }

    setGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await client.get('/reports/report/pdf', {
        params: {
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          includeCharts,
          patientId: selectedPatientId,
        },
        responseType: 'blob',
      });

      const disposition = res.headers['content-disposition'] as string | undefined;
      const patient = patients.find(p => p.patientId === selectedPatientId);
      const name = patient ? `${patient.patient.firstName}_${patient.patient.lastName}` : 'Patient';
      let filename = `CareSync_${name}_Report_${startDate}_to_${endDate}.pdf`;
      
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess(true);
    } catch (err: any) {
      let msg = 'Failed to generate report. Please try again.';
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const json = JSON.parse(text);
          if (json.message) msg = json.message;
        } catch { /* ignore */ }
      }
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-main flex items-center gap-2">
          <FileBarChart size={28} className="text-brand-primary" />
          Patient Reports
        </h1>
        <p className="text-text-muted mt-1">Generate and download official PDF adherence reports for your managed patients.</p>
      </div>

      <div className="bg-bg-card border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border-subtle bg-bg-main/30">
          <h2 className="text-xl font-semibold text-text-main">Generate PDF Report</h2>
        </div>

        <form onSubmit={handleGenerate} className="p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-3 p-4 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
              <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium">Report generated and downloaded successfully!</p>
            </div>
          )}

          {loadingPatients ? (
            <div className="flex justify-center p-4">
              <Loader2 size={24} className="animate-spin text-brand-primary" />
            </div>
          ) : patients.length === 0 ? (
            <div className="text-sm text-amber-500 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 flex items-center gap-2">
              <AlertCircle size={18} />
              You do not have any patients with Adherence monitoring permissions enabled.
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">Select Patient</label>
                  <select
                    value={selectedPatientId}
                    onChange={e => setSelectedPatientId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-main border border-border-subtle rounded-xl text-text-main focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                    required
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.patientId}>
                        {p.patient.firstName} {p.patient.lastName} ({p.patient.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-bg-main border border-border-subtle rounded-xl text-text-main focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-bg-main border border-border-subtle rounded-xl text-text-main focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border-subtle space-y-4">
                <h3 className="text-sm font-semibold text-text-main mb-3 uppercase tracking-wider opacity-80">Report Options</h3>
                <label className="flex items-center gap-3 cursor-pointer group w-fit">
                  <input
                    type="checkbox"
                    checked={includeCharts}
                    onChange={(e) => setIncludeCharts(e.target.checked)}
                    className="w-4 h-4 rounded border-border-subtle text-brand-primary focus:ring-brand-primary/20"
                  />
                  <span className="text-sm text-text-main group-hover:text-brand-primary transition-colors">Include adherence charts and graphs</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={generating || patients.length === 0}
                className="w-full mt-6 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20"
              >
                {generating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Generate & Download Report
                  </>
                )}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
