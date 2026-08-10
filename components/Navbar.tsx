'use client';

import React from 'react';
import { Calendar, Users, Send, CheckCircle2, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  onOpenEmailModal: () => void;
  onOpenRosterModal: () => void;
  onResetData?: () => void;
  onToggleTheme?: () => void;
  isSaved: boolean;
  theme?: 'dark' | 'light';
  allQAsSubmitted?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDate,
  onDateChange,
  onOpenEmailModal,
  onOpenRosterModal,
  onToggleTheme,
  isSaved,
  theme = 'light',
  allQAsSubmitted = false,
}) => {
  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-200 ${
      isDark
        ? 'bg-slate-900/90 border-b border-slate-800 text-white'
        : 'bg-white/95 border-b border-slate-200 text-slate-900'
    } backdrop-blur-md px-4 lg:px-8 py-3.5 shadow-md`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 font-bold text-slate-950 text-xl tracking-tight">
            QA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`font-extrabold text-lg md:text-xl tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                MOM & Standup Dashboard
              </h1>
              {isSaved && (
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                  isDark
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  <CheckCircle2 className="w-3 h-3" /> Saved
                </span>
              )}
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              IndiaMART Daily Work Logging & Smoke Execution Engine
            </p>
          </div>
        </div>

        {/* Middle Date Picker */}
        <div className={`flex items-center gap-2 p-1.5 rounded-xl border ${
          isDark
            ? 'bg-slate-800/80 border-slate-700/60 text-slate-200'
            : 'bg-slate-100 border-slate-300 text-slate-800'
        } shadow-inner`}>
          <Calendar className="w-4 h-4 text-emerald-500 ml-2" />
          <input
            type="date"
            value={currentDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-transparent text-sm focus:outline-none cursor-pointer font-semibold px-1"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center flex-wrap gap-2">
          {/* SLEEK COOL THEME TOGGLE */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-750 text-amber-300 border-slate-700/80 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-indigo-700 border-slate-300 shadow-xs'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onOpenRosterModal}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition-all ${
              isDark
                ? 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Manage QAs & Modules"
          >
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span>Roster</span>
          </button>

          {/* SEND REPORT BUTTON - DISABLED UNTIL ALL QAS SUBMIT */}
          <button
            disabled={!allQAsSubmitted}
            onClick={onOpenEmailModal}
            className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all duration-200 ${
              allQAsSubmitted
                ? 'text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                : 'bg-[#a5b4fc] text-white opacity-80 cursor-not-allowed shadow-xs'
            }`}
            title={
              allQAsSubmitted
                ? 'Preview & Send MOM Email'
                : 'Disabled until all present QAs submit their daily standup tasks'
            }
          >
            <Send className={`w-4 h-4 ${allQAsSubmitted ? 'fill-slate-950 text-slate-950' : 'text-white'}`} />
            <span>Send Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
