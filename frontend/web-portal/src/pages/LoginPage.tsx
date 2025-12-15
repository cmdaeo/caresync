import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as apiLogin } from '../api/auth';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/useAuthStore';
import { motion, fadeIn, PageTransition } from '../animations';

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth); // Changed from 'login' to 'setAuth'

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiLogin(formData.email, formData.password);
      
      if (response.success) {
        // Store auth data using setAuth
        setAuth(response.data.user, response.data.token);
        navigate('/dashboard');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8"
        >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-teal-700 mb-2">CareSync</h1>
          <p className="text-gray-600">{t('sign_in_to_account')}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('email')}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('password')}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder={t('enter_password')}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('signing_in') : t('sign_in')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {t('no_account')}{' '}
            <Link to="/register" className="text-teal-600 hover:text-teal-700 font-medium">
              {t('sign_up')}
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← {t('back_to_home')}
          </Link>
        </div>
      </motion.div>
      </div>
    </PageTransition>
  );
};

export default LoginPage;
