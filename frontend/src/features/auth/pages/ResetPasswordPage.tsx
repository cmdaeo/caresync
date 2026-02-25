// src/features/auth/pages/ResetPasswordPage.tsx
import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { client } from '../../../shared/api/client';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // Gets ?token=... from URL

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Frontend validation: Match check
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      await client.post('/auth/reset-password', { 
        token, 
        newPassword: formData.password 
      });
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      
      // 2. Exact same error parsing logic as RegisterPage
      const responseData = err.response?.data;
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        const errorMessages = responseData.errors.map((e: any) => e.msg).join('\n');
        setError(errorMessages);
      } else {
        setError(responseData?.message || 'Failed to reset password. The link may have expired.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full text-center">
        <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20 shadow-sm">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="text-xl font-extrabold text-text-main tracking-tight">Invalid Link</h2>
        <p className="mt-2 text-sm text-text-muted">This password reset link is missing or invalid.</p>
        <Link to="/forgot-password" className="block mt-4 text-sm font-semibold text-brand-primary hover:text-brand-light">
          Request a new link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full text-center">
        <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20 shadow-sm">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
        </div>
        <h2 className="text-xl font-extrabold text-text-main tracking-tight">Password Reset!</h2>
        <p className="mt-2 text-sm text-text-muted">Your password has been successfully updated.</p>
        <button
          onClick={() => navigate('/login', { replace: true })}
          className="w-full flex justify-center items-center mt-6 py-2.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-brand-primary hover:bg-brand-light transition-all"
        >
          Sign in now
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-5 text-center">
        <h2 className="text-xl sm:text-2xl font-extrabold text-text-main tracking-tight">
          Create new password
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-text-muted">
          Your new password must be different from previously used passwords.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Exact same multiline error UI block as RegisterPage */}
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 mb-1">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
              <h3 className="ml-2.5 text-xs font-medium text-red-500 leading-snug whitespace-pre-line">
                {error}
              </h3>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="password" className="block text-xs font-medium text-text-main mb-1.5 ml-1">
            New Password
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Lock className="h-3.5 w-3.5 text-text-muted" />
            </div>
            {/* Removed minLength HTML attribute so the backend completely controls the validation error */}
            <input
              id="password" type="password" required
              value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="block w-full pl-8 pr-2.5 py-2 text-sm rounded-lg bg-bg-page border border-border-subtle text-text-main focus:ring-2 focus:ring-brand-primary outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-xs font-medium text-text-main mb-1.5 ml-1">
            Confirm New Password
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Lock className="h-3.5 w-3.5 text-text-muted" />
            </div>
            <input
              id="confirmPassword" type="password" required
              value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className="block w-full pl-8 pr-2.5 py-2 text-sm rounded-lg bg-bg-page border border-border-subtle text-text-main focus:ring-2 focus:ring-brand-primary outline-none transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !formData.password}
          className="w-full flex justify-center items-center mt-6 py-2.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-brand-primary hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 transition-all"
        >
          {loading ? (
            <Loader2 className="animate-spin h-4 w-4" />
          ) : (
            <>
              Reset Password
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
