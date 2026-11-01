import React, { useState } from 'react';
import {
  Settings,
  User,
  Moon,
  Sun,
  Coins,
  Bell,
  RotateCcw,
  LogOut,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { CurrencyCode } from '../types';

export const SettingsPage: React.FC = () => {
  const {
    user,
    updateUserProfile,
    theme,
    setTheme,
    currency,
    setCurrency,
    notificationsEnabled,
    setNotificationsEnabled,
    resetToDemoData,
    logout,
  } = useAppStore();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [role, setRole] = useState(user?.role || 'Event Organizer');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ name, email, role, phoneNumber });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all event data, tasks, and budgets back to default demonstration records?')) {
      resetToDemoData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* 1. HEADER */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Preferences & Controls
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-0.5">
          Workspace Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Customize your profile, currency formats, appearance themes, and demonstration datasets.
        </p>
      </div>

      {/* 2. PROFILE SETTINGS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-600" />
          <span>Profile Information</span>
        </h3>

        {savedSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profile information updated successfully.</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Organizer Role / Title
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors shadow-2xs"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* 3. APPLICATION PREFERENCES */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs space-y-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-600" />
          <span>Regional & Display Preferences</span>
        </h3>

        {/* Currency selection */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">Active Currency</div>
            <div className="text-slate-500">Default financial denomination across budgets</div>
          </div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-semibold"
          >
            <option value="INR">INR (₹ - Indian Rupee / Default)</option>
            <option value="USD">USD ($ - US Dollar)</option>
            <option value="EUR">EUR (€ - Euro)</option>
            <option value="GBP">GBP (£ - British Pound)</option>
          </select>
        </div>

        {/* Theme Mode */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">Appearance Theme</div>
            <div className="text-slate-500">Switch between light and dark visual modes</div>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setTheme('light')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 font-semibold transition-colors ${theme === 'light' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 font-semibold transition-colors ${theme === 'dark' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-500'
                }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">Deadline Alerts & Notifications</div>
            <div className="text-slate-500">Show high-urgency milestone alerts</div>
          </div>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 4. DEMONSTRATION CONTROLS & RESET */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-amber-500" />
          <span>Demonstration Data Controls</span>
        </h3>
        <p className="text-xs text-slate-500">
          Restore the original Challenge 5 wedding demonstration scenario (₹8,00,000 budget, 200 guests, 4-month timeline) if you wish to reset all modifications.
        </p>

        {resetSuccess && (
          <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span>Demonstration data reset to initial baseline successfully!</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleResetData}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
            <span>Reset to Default Demo State</span>
          </button>

          <button
            onClick={logout}
            className="px-4 py-2 border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
