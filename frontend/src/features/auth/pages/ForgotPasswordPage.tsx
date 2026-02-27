// src/features/auth/pages/ForgotPasswordPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { client } from '../../../shared/api/client';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Assuming a forgot-password endpoint exists or will be added to your backend
      await client.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full text-center">
        <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20 shadow-sm">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-text-main tracking-tight">
          Check your email
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          We sent a password reset link to <br/>
          <span className="font-semibold text-text-main">{email}</span>
        </p>
        
        <Link
          to="/login"
          className="w-full flex justify-center items-center mt-6 py-2.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-brand-primary hover:bg-brand-light transition-all"
        >
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8 text-center">
        <h2 className="text-xl sm:text-2xl font-extrabold text-text-main tracking-tight">
          Reset password
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-text-muted">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 mb-1">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" aria-hidden="true" />
              <h3 className="ml-2.5 text-xs font-medium text-red-500 leading-snug">{error}</h3>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-xs font-medium text-text-main mb-1.5 ml-1">
            Email address
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Mail className="h-3.5 w-3.5 text-text-muted" />
            </div>
            <input
              id="email" type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-8 pr-2.5 py-2 text-sm rounded-lg bg-bg-page border border-border-subtle text-text-main focus:ring-2 focus:ring-brand-primary outline-none transition-colors"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full flex justify-center items-center mt-6 py-2.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-brand-primary hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 transition-all"
        >
          {loading ? (
            <Loader2 className="animate-spin h-4 w-4" />
          ) : (
            <>
              Send reset link
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </>
          )}
        </button>

        <div className="mt-4 text-center">
          <Link to="/login" className="inline-flex items-center text-xs sm:text-sm font-semibold text-text-muted hover:text-text-main transition-colors">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </form>
    </div>
  );
};
