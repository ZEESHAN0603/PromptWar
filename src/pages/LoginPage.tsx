import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithSupabase } = useAppStore();

  const [email, setEmail] = useState('aditi.planner@eventpilot.example.com');
  const [password, setPassword] = useState('celebration2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError(null);
    setIsLoading(true);

    const result = await loginWithSupabase(email, password);
    setIsLoading(false);

    if (result.success) {
      navigate('/app/dashboard');
    } else {
      setError(result.error || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-2 cursor-pointer mb-6"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            EventPilot <span className="text-indigo-600 dark:text-indigo-400">AI</span>
          </span>
        </div>

        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Sign in to your event workspace
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
          Demo authentication pre-filled for immediate testing
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-sm border border-slate-200 dark:border-slate-800 rounded-xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 pr-10 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Remember this session</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setEmail('demo.organizer@eventpilot.example.com');
                  setPassword('celebration2026');
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Reset Demo Pass
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-2xs"
            >
              {isLoading ? (
                <span>Entering Workspace...</span>
              ) : (
                <>
                  <span>Sign In & Continue Planning</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                Create new account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
