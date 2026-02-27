// src/features/auth/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { client } from '../../../shared/api/client';
import { useAuthStore } from '../../../shared/store/authStore';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const from = location.state?.from?.pathname || '/app';

  // Inside src/features/auth/pages/LoginPage.tsx

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data } = await client.post('/auth/login', formData);
      if (data.success) {
        login(data.data.token, data.data.user);
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      console.error(err);
      
      // NEW ERROR HANDLING LOGIC
      const responseData = err.response?.data;
      
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        const errorMessages = responseData.errors.map((e: any) => e.msg).join('\n');
        setError(errorMessages);
      } else {
        setError(responseData?.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8 text-center">
        <h2 className="text-xl sm:text-2xl font-extrabold text-text-main tracking-tight">
          Welcome back
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          New to CareSync?{' '}
          <Link to="/register" className="font-semibold text-brand-primary hover:text-brand-light transition-colors">
            Create an account
          </Link>
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" aria-hidden="true" />
              <h3 className="ml-2.5 text-xs sm:text-sm font-medium text-red-500 leading-snug">{error}</h3>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-main mb-1.5 ml-1">
            Email address
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-text-muted" />
            </div>
            <input
              id="email" type="email" required
              value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="block w-full pl-9 pr-3 py-2.5 text-sm rounded-lg bg-bg-page border border-border-subtle text-text-main focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors outline-none"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5 ml-1 mr-1">
            <label htmlFor="password" className="block text-sm font-medium text-text-main">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs sm:text-sm font-medium text-brand-primary hover:text-brand-light transition-colors">
                Forgot password?
                </Link>
          </div>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-text-muted" />
            </div>
            <input
              id="password" type="password" required
              value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="block w-full pl-9 pr-3 py-2.5 text-sm rounded-lg bg-bg-page border border-border-subtle text-text-main focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors outline-none"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-brand-primary hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-bg-page disabled:opacity-50 transition-all mt-8"
        >
          {loading ? (
            <Loader2 className="animate-spin h-5 w-5" />
          ) : (
            <>
              Sign in
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
