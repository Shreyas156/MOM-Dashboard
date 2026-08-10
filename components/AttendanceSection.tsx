'use client';

import React, { useState } from 'react';
import { QATaskEntry, QA } from '@/lib/types';
import { UserX, Plus, Trash2, ListOrdered, ChevronDown, ChevronUp, CheckCircle, Send, RefreshCw, UserCheck, ShieldAlert, RotateCcw } from 'lucide-react';

interface AttendanceSectionProps {
  qaTasks: QATaskEntry[];
  availableQAs: QA[];
  onUpdateQATask: (qaId: string, updated: Partial<QATaskEntry>) => void;
  onSubmitQATask: (qaId: string) => void;
  onAddQAToMOM: (qa: QA) => void;
  theme?: 'dark' | 'light';
}

export const AttendanceSection: React.FC<AttendanceSectionProps> = ({
  qaTasks,
  availableQAs,
  onUpdateQATask,
  onSubmitQATask,
  onAddQAToMOM,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [newTaskTexts, setNewTaskTexts] = useState<Record<string, string>>({});
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});

  const toggleCollapse = (qaId: string) => {
    setCollapsedCards((prev) => ({ ...prev, [qaId]: !prev[qaId] }));
  };

  const handleAddTaskBullet = (qaId: string) => {
    const text = (newTaskTexts[qaId] || '').trim();
    if (!text) return;

    const currentEntry = qaTasks.find((q) => q.qaId === qaId);
    if (!currentEntry) return;

    const updatedTasks = [...currentEntry.tasks, text];
    onUpdateQATask(qaId, { tasks: updatedTasks });
    setNewTaskTexts((prev) => ({ ...prev, [qaId]: '' }));
  };

  const handleRemoveTaskBullet = (qaId: string, index: number) => {
    const currentEntry = qaTasks.find((q) => q.qaId === qaId);
    if (!currentEntry) return;

    const updatedTasks = currentEntry.tasks.filter((_, i) => i !== index);
    onUpdateQATask(qaId, { tasks: updatedTasks });
  };

  const handleTaskTextChange = (qaId: string, index: number, newText: string) => {
    const currentEntry = qaTasks.find((q) => q.qaId === qaId);
    if (!currentEntry) return;

    const updatedTasks = [...currentEntry.tasks];
    updatedTasks[index] = newText;
    onUpdateQATask(qaId, { tasks: updatedTasks });
  };

  const handleSubmit = (qaId: string) => {
    // Automatically convert any pending text typed in the input box into a task bullet before submitting!
    const pendingText = (newTaskTexts[qaId] || '').trim();
    if (pendingText) {
      const currentEntry = qaTasks.find((q) => q.qaId === qaId);
      if (currentEntry) {
        const updatedTasks = [...currentEntry.tasks, pendingText];
        onUpdateQATask(qaId, { tasks: updatedTasks });
        setNewTaskTexts((prev) => ({ ...prev, [qaId]: '' }));
      }
    }
    onSubmitQATask(qaId);
  };

  // Separate Present vs On Leave QAs
  const presentQAs = qaTasks.filter((q) => !q.isOnLeave);
  const onLeaveQAs = qaTasks.filter((q) => q.isOnLeave);

  // Find QAs not yet in MOM list
  const unaddedQAs = availableQAs.filter(
    (aqa) =>
      aqa.name.toLowerCase() !== 'sukanya sharma' &&
      !qaTasks.some((entry) => entry.qaId === aqa.id || entry.qaName.toLowerCase() === aqa.name.toLowerCase())
  );

  return (
    <div className="space-y-6 mb-8">
      {/* SECTION 1: ASSIGNED TASKS (PRESENT QAS ONLY) */}
      <div className={`rounded-2xl p-5 border shadow-xl transition-colors ${
        isDark
          ? 'bg-slate-900/60 border-slate-800 text-white'
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b pb-4 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-emerald-500" />
              <h2 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Assigned Tasks & Daily Work (Present QAs)
              </h2>
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Only present QAs are listed below. Click <strong>"Submit My Task"</strong> to confirm work.
            </p>
          </div>

          {unaddedQAs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Add to Standup:</span>
              <select
                onChange={(e) => {
                  const found = availableQAs.find((q) => q.id === e.target.value);
                  if (found) onAddQAToMOM(found);
                  e.target.value = '';
                }}
                className={`text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 text-slate-200 border-slate-700'
                    : 'bg-slate-50 text-slate-800 border-slate-300'
                }`}
              >
                <option value="">+ Select QA Member...</option>
                {unaddedQAs.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name} ({q.role})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Grid of Present QA Cards */}
        {presentQAs.length === 0 ? (
          <div className="p-6 text-center text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-xl font-semibold">
            All QAs are currently marked On Leave. Click "Mark Present" in the Absence section below to activate a QA.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presentQAs.map((entry) => {
              const isCollapsed = collapsedCards[entry.qaId];
              const matchedQA = availableQAs.find((q) => q.id === entry.qaId);

              // Validation: Ensure QA has entered text in status, added task bullets, OR typed in input box
              const pendingTaskText = (newTaskTexts[entry.qaId] || '').trim();
              const hasEnteredText =
                (entry.status && entry.status.trim().length > 0) ||
                (entry.tasks && entry.tasks.length > 0 && entry.tasks.some((t) => t.trim().length > 0)) ||
                pendingTaskText.length > 0;

              return (
                <div
                  key={entry.qaId}
                  className={`transition-all rounded-xl border p-4 flex flex-col justify-between ${
                    entry.isSubmitted
                      ? isDark
                        ? 'bg-emerald-950/20 border-emerald-500/50 shadow-emerald-900/10'
                        : 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                      : isDark
                      ? 'bg-slate-800/50 border-slate-700/70 hover:border-slate-600'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div>
                    {/* Card Header: QA Name, Avatar, Mark On Leave Toggle */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shadow"
                          style={{ backgroundColor: matchedQA?.avatarColor || '#3b82f6' }}
                        >
                          {entry.qaName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .substring(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`font-bold text-sm leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {entry.qaName}
                            </h3>

                            {/* 24-HOUR TIME FORMAT SUBMISSION BADGE BESIDE QA NAME */}
                            {entry.isSubmitted && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <CheckCircle className="w-3 h-3" /> Submitted ({entry.submittedAt || ''})
                              </span>
                            )}
                          </div>
                          <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {matchedQA?.role || 'Quality Assurance'}
                          </p>
                        </div>
                      </div>

                      {/* ACTION BUTTONS: CLEAR CARD & MARK LEAVE */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setNewTaskTexts((prev) => ({ ...prev, [entry.qaId]: '' }));
                            onUpdateQATask(entry.qaId, {
                              status: '',
                              tasks: [],
                              isSubmitted: false,
                              submittedAt: undefined,
                            });
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                            isDark
                              ? 'bg-slate-800/80 hover:bg-rose-950/50 text-slate-300 hover:text-rose-300 border-slate-700/80 hover:border-rose-700/50'
                              : 'bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border-slate-300 hover:border-rose-300 shadow-xs'
                          }`}
                          title={`Clear tasks and status for ${entry.qaName}`}
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                          <span>Clear Card</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onUpdateQATask(entry.qaId, { isOnLeave: true })}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                            isDark
                              ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-400 border-amber-700/50'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                          title="Move to Absence / On Leave section"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Mark Leave</span>
                        </button>
                      </div>
                    </div>

                    {/* Status input */}
                    <div className="mb-3">
                      <label className={`block text-[11px] uppercase tracking-wider font-semibold mb-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Current Work / Focus:
                      </label>
                      <input
                        type="text"
                        value={entry.status}
                        onChange={(e) => onUpdateQATask(entry.qaId, { status: e.target.value })}
                        placeholder="e.g. Working on Launches."
                        className={`w-full text-xs border rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500 transition-colors ${
                          isDark
                            ? 'bg-slate-900/90 text-slate-200 border-slate-700/80'
                            : 'bg-white text-slate-900 border-slate-300 shadow-xs'
                        }`}
                      />
                    </div>

                    {/* Bullet tasks list */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={`block text-[11px] uppercase tracking-wider font-semibold ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          Tasks & Launch Items ({entry.tasks.length}):
                        </label>
                        {entry.tasks.length > 0 && (
                          <button
                            onClick={() => toggleCollapse(entry.qaId)}
                            className={`text-[11px] flex items-center gap-1 ${
                              isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                            {isCollapsed ? 'Show' : 'Hide'}
                          </button>
                        )}
                      </div>

                      {!isCollapsed && (
                        <div className="space-y-2">
                          {entry.tasks.map((task, idx) => (
                            <div key={idx} className={`flex items-start gap-2 p-2 rounded-lg border ${
                              isDark
                                ? 'bg-slate-900/50 border-slate-800 text-slate-200'
                                : 'bg-white border-slate-200 text-slate-900 shadow-xs'
                            }`}>
                              <span className="text-emerald-500 font-bold text-xs mt-1.5">•</span>
                              <textarea
                                value={task}
                                onChange={(e) => handleTaskTextChange(entry.qaId, idx, e.target.value)}
                                rows={2}
                                className={`flex-1 bg-transparent text-xs border-none focus:outline-none resize-y leading-relaxed ${
                                  isDark ? 'text-slate-200' : 'text-slate-900 font-medium'
                                }`}
                              />
                              <button
                                onClick={() => handleRemoveTaskBullet(entry.qaId, idx)}
                                className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}

                          {/* Add task input */}
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="text"
                              value={newTaskTexts[entry.qaId] || ''}
                              onChange={(e) =>
                                setNewTaskTexts((prev) => ({ ...prev, [entry.qaId]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddTaskBullet(entry.qaId);
                              }}
                              onBlur={() => {
                                const text = (newTaskTexts[entry.qaId] || '').trim();
                                if (text) handleAddTaskBullet(entry.qaId);
                              }}
                              placeholder="+ Type task / launch item here..."
                              className={`flex-1 text-xs border rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500 transition-colors ${
                                isDark
                                  ? 'bg-slate-900 text-slate-200 border-slate-700/80'
                                  : 'bg-white text-slate-900 border-slate-300 shadow-xs'
                              }`}
                            />
                            <button
                              onClick={() => handleAddTaskBullet(entry.qaId)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                (newTaskTexts[entry.qaId] || '').trim().length > 0
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer'
                                  : isDark
                                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Task
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SUBMIT BUTTON WITH COMPACT PASTEL LAVENDER DISABLED UI */}
                  <div className="pt-2.5 border-t border-slate-700/40 dark:border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {entry.isSubmitted ? `Submitted at ${entry.submittedAt || ''}` : 'Ready to submit work?'}
                    </span>

                    <div className="flex items-center gap-2">
                      {entry.isSubmitted ? (
                        <button
                          disabled={!hasEnteredText}
                          onClick={() => handleSubmit(entry.qaId)}
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                            hasEnteredText
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                              : 'bg-[#a5b4fc] text-white font-bold cursor-not-allowed opacity-80 shadow-xs'
                          }`}
                          title={
                            hasEnteredText
                              ? 'Click to submit updated tasks or metrics'
                              : 'Enter Current Work or add a Task bullet to enable Submit Again'
                          }
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-white" />
                          <span>Submit Again</span>
                        </button>
                      ) : (
                        <button
                          disabled={!hasEnteredText}
                          onClick={() => handleSubmit(entry.qaId)}
                          className={`flex items-center gap-1.5 px-5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                            hasEnteredText
                              ? 'bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                              : 'bg-[#a5b4fc] text-white font-bold cursor-not-allowed opacity-80 shadow-xs'
                          }`}
                          title={
                            hasEnteredText
                              ? 'Click to submit your daily standup tasks'
                              : 'Enter Current Work or add a Task bullet to enable Submit'
                          }
                        >
                          {hasEnteredText ? <Send className="w-3.5 h-3.5 fill-slate-950 text-slate-950" /> : null}
                          <span>Submit</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: ABSENCE / ON LEAVE TRACKER (DEDICATED SECTION BELOW ATTENDANCE) */}
      <div className={`rounded-2xl p-5 border shadow-lg transition-colors ${
        isDark
          ? 'bg-slate-900/40 border-amber-500/30 text-white'
          : 'bg-amber-50/40 border-amber-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between mb-4 border-b border-amber-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
              <UserX className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`font-extrabold text-sm ${isDark ? 'text-amber-400' : 'text-amber-900'}`}>
                Absence & On-Leave Tracker ({onLeaveQAs.length})
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-amber-800/80'}`}>
                QAs marked on leave are listed here and automatically excluded from the Assigned Tasks section.
              </p>
            </div>
          </div>
        </div>

        {onLeaveQAs.length === 0 ? (
          <div className={`text-xs font-semibold p-3.5 rounded-xl border flex items-center gap-2 ${
            isDark
              ? 'bg-slate-900/80 border-slate-800 text-slate-400'
              : 'bg-white border-slate-200 text-slate-600 shadow-xs'
          }`}>
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span>Nil – All active QAs are present today!</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {onLeaveQAs.map((leaveQA) => {
              const matchedQA = availableQAs.find((q) => q.id === leaveQA.qaId);

              return (
                <div
                  key={leaveQA.qaId}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                    isDark
                      ? 'bg-amber-950/40 border-amber-700/40 text-amber-300'
                      : 'bg-amber-100/80 border-amber-300 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow"
                      style={{ backgroundColor: matchedQA?.avatarColor || '#f59e0b' }}
                    >
                      {leaveQA.qaName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-bold text-xs leading-snug">{leaveQA.qaName}</p>
                      <span className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">On Leave</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onUpdateQATask(leaveQA.qaId, { isOnLeave: false })}
                    className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-sm cursor-pointer"
                    title="Mark Present and return to Assigned Tasks"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Mark Present</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
