import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { client } from '../../../shared/api/client';
import { FileCheck, ShieldAlert, Loader2, Calendar, FileText, Hash, ShieldCheck, Lock, Clock } from 'lucide-react';

const formatDate = (isoString: string) => {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(isoString));
};

export const VerifyPage = () => {
  const [searchParams] = useSearchParams();
  const docId = searchParams.get('docId');

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docId) {
      setError('No Document ID provided in URL.');
      setLoading(false);
      return;
    }

    const verifyDocument = async () => {
      try {
        const res = await client.get('/reports/verify', { params: { docId } });
        setResult(res.data.document);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Verification failed. Document may be invalid, expired, or tampered with.');
      } finally {
        setLoading(false);
      }
    };

    verifyDocument();
  }, [docId]);

  return (
    <div className="min-h-screen bg-bg-page flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full bg-bg-card border border-border-subtle rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="bg-brand-primary/5 border-b border-border-subtle p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm mb-4">
            <FileCheck size={32} className="text-brand-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-main">Document Verification</h1>
          <p className="text-sm text-text-muted mt-2">CareSync Authenticity Portal</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="animate-spin text-brand-primary" size={40} />
              <p className="text-text-muted animate-pulse">Verifying cryptographic hash...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <ShieldAlert className="mx-auto text-red-500 mb-4" size={56} />
              <h2 className="text-xl font-bold text-red-600 mb-2">Verification Failed</h2>
              <p className="text-text-muted px-4">{error}</p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 py-3 rounded-xl border border-emerald-100">
                <ShieldCheck size={24} />
                <span className="font-bold">Authentic & Verified</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-bg-main rounded-lg text-text-muted"><FileText size={18} /></div>
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Document Type</p>
                    <p className="font-medium text-text-main">{result.documentType.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-bg-main rounded-lg text-text-muted"><Hash size={18} /></div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">SHA-256 Checksum</p>
                    <p className="font-mono text-xs text-text-main truncate" title={result.documentHash}>
                      {result.documentHash}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-bg-main rounded-lg text-text-muted"><Calendar size={18} /></div>
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Generated On</p>
                    <p className="font-medium text-text-main">
                      {formatDate(result.generationTimestamp)}
                    </p>
                  </div>
                </div>

                {result.expirationDate && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 bg-bg-main rounded-lg text-text-muted"><Clock size={18} /></div>
                    <div>
                      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Expires On</p>
                      <p className="font-medium text-text-main">
                        {formatDate(result.expirationDate)}
                      </p>
                    </div>
                  </div>
                )}

                {result.passwordProtected && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 bg-bg-main rounded-lg text-amber-500"><Lock size={18} /></div>
                    <div>
                      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Security</p>
                      <p className="font-medium text-text-main">Encrypted (Password Required)</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-bg-main p-4 text-center border-t border-border-subtle">
          <Link to="/" className="text-sm font-semibold text-brand-primary hover:underline">
            Return to CareSync
          </Link>
        </div>
      </div>
    </div>
  );
};
