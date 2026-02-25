// src/features/auth/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, AlertCircle, Loader2, HeartPulse, HeartHandshake } from 'lucide-react';
import { motion } from 'framer-motion';
import { client } from '../../../shared/api/client';
import { useAuthStore } from '../../../shared/store/authStore';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '', role: 'patient'
  });

  // Inside src/features/auth/pages/RegisterPage.tsx

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      const { data } = await client.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role
      });

      if (data.success) {
        login(data.data.token, data.data.user);
        navigate('/app', { replace: true });
      }
    } catch (err: any) {
      console.error(err);
      
      // NEW ERROR HANDLING LOGIC
      const responseData = err.response?.data;
      
      // If the backend sent an array of specific validation errors
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        // Join all error messages together with a newline
        const errorMessages = responseData.errors.map((e: any) => e.msg).join('\n');
        setError(errorMessages);
      } 
      // Fallback to the standard message or a default string
      else {
        setError(responseData?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="w-full">
      <div className="mb-4 sm:mb-5 text-center">
        <h2 className="text-xl sm:text-2xl font-extrabold text-text-main tracking-tight">
          Create an account
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-text-muted">
          Already have?{' '}
          <Link to="/login" className="font-semibold text-brand-primary hover:text-brand-light transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      {/* Tighter vertical spacing: space-y-3.5 */}
      <form className="space-y-3.5" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 mb-1">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
              {/* Added whitespace-pre-line so \n breaks to a new line */}
              <h3 className="ml-2.5 text-xs font-medium text-red-500 leading-snug whitespace-pre-line">
                {error}
              </h3>
            </div>
          </div>
        )}

        {/* 1. Account Type Selection */}
        <div>
          <label className="block text-xs font-semibold text-text-main mb-1.5 ml-1">
            Register as
          </label>
          <div className="bg-bg-page p-1 rounded-lg border border-border-subtle flex relative h-10 shadow-sm">
            {['patient', 'caregiver'].map((role) => {
              const isSelected = formData.role === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setFormData({ ...formData, role })}
                  className={`relative flex-1 flex items-center justify-center gap-1.5 text-xs font-bold rounded-md transition-colors z-10 ${
                    isSelected ? 'text-white' : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {role === 'patient' ? <HeartPulse size={14} /> : <HeartHandshake size={14} />}
                  {role === 'patient' ? 'Patient' : 'Caregiver'}
                  {isSelected && (
                    <motion.div
                      layoutId="role-pill-prominent"
                      className="absolute inset-0 bg-brand-primary rounded-md -z-10 shadow-sm"
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="firstName" className="block text-xs font-medium text-text-main mb-1 ml-1">First Name</label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <User className="h-3.5 w-3.5 text-text-muted" />
              </div>
              <input
                id="firstName" name="firstName" type="text" required
                value={formData.firstName} onChange={handleChange}
                className="block w-full pl-8 pr-2.5 py-2 text-sm rounded-lg bg-bg-page border border-border-subtle text-text-main focus:ring-2 focus:ring-brand-primary outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label htmlFor="lastName" className="block text-xs font-medium text-text-main mb-1 ml-1">Last Name</label>
            <input
              id="lastName" name="lastName" type="text" required
              value={formData.lastName} onChange={handleChange}
              className="block w-full px-3 py-2 text-sm rounded-lg bg-bg-page border border-border-subtle text-text-main focus:ring-2 focus:ring-brand-primary outline-none transition-colors"
            />
          </div>
        </div>

        {/* 3. Email */}
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-text-main mb-1 ml-1">Email address</label>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Mail className="h-3.5 w-3.5 text-text-muted" />
            </div>
            <input
              id="email" name="email" type="email" required
              value={formData.email} onChange={handleChange}
              className="block w-full pl-8 pr-2.5 py-2 text-sm rounded-lg bg-bg-page border border-border-subtle text-text-main focus:ring-2 focus:ring-brand-primary outline-none transition-colors"
            />
          </div>
        </div>

        {/* 4. Passwords */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-text-main mb-1 ml-1">Password</label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Lock className="h-3.5 w-3.5 text-text-muted" />
              </div>
              <input
                id="password" name="password" type="password" required
                value={formData.password} onChange={handleChange}
                className="block w-full pl-8 pr-2.5 py-2 text-sm rounded-lg bg-bg-page border border-border-subtle text-text-main focus:ring-2 focus:ring-brand-primary outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-text-main mb-1 ml-1">Confirm Password</label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Lock className="h-3.5 w-3.5 text-text-muted" />
              </div>
              <input
                id="confirmPassword" name="confirmPassword" type="password" required
                value={formData.confirmPassword} onChange={handleChange}
                className="block w-full pl-8 pr-2.5 py-2 text-sm rounded-lg bg-bg-page border border-border-subtle text-text-main focus:ring-2 focus:ring-brand-primary outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center mt-5 py-2.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-brand-primary hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-bg-page disabled:opacity-50 transition-all"
        >
          {loading ? (
            <Loader2 className="animate-spin h-4 w-4" />
          ) : (
            <>
              Create Account
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
