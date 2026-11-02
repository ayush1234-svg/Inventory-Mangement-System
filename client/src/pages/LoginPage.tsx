import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, Smartphone } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { useAuth } from '../context/AuthContext.js';
import { useSettings } from '../context/SettingsContext.js';

export const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect to billing screen first
  if (user) {
    return <Navigate to="/billing" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate here as well as using required inputs so the handler handles empty values consistently.
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    // Keep the submit button in a loading state until authentication settles.
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/billing');
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-md mb-3">
          <Smartphone className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {/* Use the configured store name when available, otherwise show the default brand. */}
          {settings?.shopName || 'WTL Mobile Shop'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Store Inventory & Point of Sale Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                {error}
              </div>
            )}

            <Input
              label="Manager Email Address"
              type="email"
              placeholder="admin@yourstore.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              prefixIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              prefixIcon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full font-semibold shadow-xs mt-2"
            >
              Sign In to Store
            </Button>
          </form>

        </div>

        <div className="text-center mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Secure Session • Authorized Store Staff Only</span>
        </div>
      </div>
    </div>
  );
};
