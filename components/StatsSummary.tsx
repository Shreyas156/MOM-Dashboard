'use client';

import React from 'react';
import { Users, UserCheck, UserX, CheckCircle2, Bug, Clock, Check } from 'lucide-react';
import { DailyMOM } from '@/lib/types';

interface StatsSummaryProps {
  mom: DailyMOM;
  theme?: 'dark' | 'light';
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({ mom, theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const totalQAs = mom.qaTasks.length;
  const onLeaveCount = mom.qaTasks.filter((q) => q.isOnLeave).length;
  const presentCount = totalQAs - onLeaveCount;

  const submittedCount = mom.qaTasks.filter((q) => q.isSubmitted || q.isOnLeave).length;
  const submissionPercent = totalQAs > 0 ? Math.round((submittedCount / totalQAs) * 100) : 0;

  // Calculate totals from smokeRows
  let totalDesktop = 0;
  let passDesktop = 0;
  let failDesktop = 0;
  let totalMsite = 0;
  let passMsite = 0;
  let failMsite = 0;
  let bugTicketsCount = 0;

  mom.smokeRows.forEach((row) => {
    if (row.desktopTotal) totalDesktop += row.desktopTotal;
    if (row.desktopPass) passDesktop += row.desktopPass;
    if (row.desktopFail) failDesktop += row.desktopFail;

    if (row.msiteTotal) totalMsite += row.msiteTotal;
    if (row.msitePass) passMsite += row.msitePass;
    if (row.msiteFail) failMsite += row.msiteFail;

    if (row.desktopBugTicketId && row.desktopBugTicketId !== '-') bugTicketsCount++;
    if (row.msiteBugTicketId && row.msiteBugTicketId !== '-') bugTicketsCount++;
  });

  const totalExecuted = totalDesktop + totalMsite;
  const totalPassed = passDesktop + passMsite;
  const totalFailed = failDesktop + failMsite;

  const passRate = totalExecuted > 0 ? Math.round((totalPassed / totalExecuted) * 100) : 100;

  const cardBaseClass = isDark
    ? 'bg-slate-800/60 border-slate-700/60 text-white'
    : 'bg-white border-slate-200 text-slate-900 shadow-md';

  return (
    <div className="space-y-4 mb-6">
      {/* Real-time Team Submission Status Banner */}
      <div className={`p-4 rounded-2xl border transition-all ${
        submittedCount === totalQAs && totalQAs > 0
          ? isDark
            ? 'bg-gradient-to-r from-emerald-950/80 to-slate-900 border-emerald-500/50'
            : 'bg-emerald-50 border-emerald-300'
          : isDark
          ? 'bg-slate-900/80 border-slate-800'
          : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
              submittedCount === totalQAs && totalQAs > 0
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {submittedCount === totalQAs && totalQAs > 0 ? <Check className="w-5 h-5 stroke-[3]" /> : <Clock className="w-4 h-4 text-blue-500" />}
            </div>
            <div>
              <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {submittedCount === totalQAs && totalQAs > 0
                  ? '🎉 All QAs Have Submitted Today’s Tasks!'
                  : `Team Submission Status: ${submittedCount} of ${totalQAs} QAs Submitted`}
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {submittedCount === totalQAs && totalQAs > 0
                  ? 'All team members have completed their standup. Ready to send final MOM!'
                  : 'QAs submit their task cards below. Anyone can click Send Report once ready.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs font-extrabold text-emerald-500">{submissionPercent}% Complete</span>
          </div>
        </div>

        {/* Individual QA Status Badges */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800/40">
          {mom.qaTasks.map((qa) => {
            const isDone = qa.isSubmitted || qa.isOnLeave;
            return (
              <div
                key={qa.qaId}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  qa.isOnLeave
                    ? isDark
                      ? 'bg-amber-950/40 border-amber-500/40 text-amber-400'
                      : 'bg-amber-50 border-amber-300 text-amber-800'
                    : isDone
                    ? isDark
                      ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-400'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : isDark
                    ? 'bg-slate-800/80 border-slate-700 text-slate-400'
                    : 'bg-slate-100 border-slate-300 text-slate-600'
                }`}
              >
                {qa.isOnLeave ? (
                  <span>🌴 {qa.qaName.split(' ')[0]} (On Leave)</span>
                ) : isDone ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{qa.qaName.split(' ')[0]}</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{qa.qaName.split(' ')[0]} (Pending)</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid of 6 Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Team */}
        <div className={`${cardBaseClass} border rounded-xl p-3.5 flex flex-col justify-between`}>
          <div className={`flex items-center justify-between mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className="text-xs font-semibold uppercase tracking-wider">QA Roster</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalQAs}</span>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total QAs</span>
          </div>
        </div>

        {/* Present QAs */}
        <div className={`${isDark ? 'bg-slate-800/60 border-emerald-500/30' : 'bg-white border-emerald-200 shadow-md'} border rounded-xl p-3.5 flex flex-col justify-between`}>
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Present</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{presentCount}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400/80 font-medium">Active Today</span>
          </div>
        </div>

        {/* On Leave QAs */}
        <div className={`${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white border-slate-200 shadow-md'} ${onLeaveCount > 0 ? (isDark ? 'border-amber-500/50 bg-amber-950/20' : 'border-amber-300 bg-amber-50/50') : ''} border rounded-xl p-3.5 flex flex-col justify-between`}>
          <div className="flex items-center justify-between text-amber-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">On Leave</span>
            <UserX className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-black ${onLeaveCount > 0 ? 'text-amber-500' : (isDark ? 'text-slate-400' : 'text-slate-400')}`}>
              {onLeaveCount}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-500/80 font-medium">
              {onLeaveCount === 1 ? '1 QA Absent' : `${onLeaveCount} QAs Absent`}
            </span>
          </div>
        </div>

        {/* Total Executed */}
        <div className={`${cardBaseClass} border rounded-xl p-3.5 flex flex-col justify-between`}>
          <div className={`flex items-center justify-between mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className="text-xs font-semibold uppercase tracking-wider">Total Tests</span>
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalExecuted}</span>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Desktop + Msite</span>
          </div>
        </div>

        {/* Pass Rate % */}
        <div className={`${cardBaseClass} border rounded-xl p-3.5 flex flex-col justify-between`}>
          <div className={`flex items-center justify-between mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className="text-xs font-semibold uppercase tracking-wider">Pass Rate</span>
            <span className="text-xs font-bold text-emerald-500">{passRate}%</span>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-2xl font-black text-emerald-500">{totalPassed}</span>
              <span className="text-xs text-rose-500 font-semibold">{totalFailed} Failed</span>
            </div>
            <div className={`w-full rounded-full h-1.5 overflow-hidden flex ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
              <div className="bg-emerald-500 h-full" style={{ width: `${passRate}%` }} />
              <div className="bg-rose-500 h-full" style={{ width: `${100 - passRate}%` }} />
            </div>
          </div>
        </div>

        {/* Bugs Logged */}
        <div className={`${cardBaseClass} border rounded-xl p-3.5 flex flex-col justify-between`}>
          <div className="flex items-center justify-between text-rose-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Bugs Logged</span>
            <Bug className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-500">{bugTicketsCount}</span>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tickets Link</span>
          </div>
        </div>
      </div>
    </div>
  );
};
