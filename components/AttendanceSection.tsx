'use client';

import React, { useState } from 'react';
import { QATaskEntry, QA } from '@/lib/types';
import { UserX, Plus, Trash2, ListOrdered, ChevronDown, ChevronUp, CheckCircle, Send, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

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
  theme = 'dark',
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
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.7 },
    });
    onSubmitQATask(qaId);
  };

  // Find QAs not yet in MOM list
  const unaddedQAs = availableQAs.filter(
    (aqa) =>
      aqa.name.toLowerCase() !== 'sukanya sharma' &&
      !qaTasks.some((entry) => entry.qaId === aqa.id || entry.qaName.toLowerCase() === aqa.name.toLowerCase())
  );

  return (
    <div className={`rounded-2xl p-5 mb-8 border shadow-xl transition-colors ${
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
              QA Team Daily Tasks & Attendance
            </h2>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Enter text in Current Work or Tasks field to enable submission. Click <strong>"Submit Again"</strong> to update anytime.
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

      {/* Grid of QA Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {qaTasks.map((entry) => {
          const isCollapsed = collapsedCards[entry.qaId];
          const matchedQA = availableQAs.find((q) => q.id === entry.qaId);

          // Validation: Ensure QA has entered text in status OR added task bullets
          const hasEnteredText =
            (entry.status && entry.status.trim().length > 0) ||
            (entry.tasks && entry.tasks.length > 0 && entry.tasks.some((t) => t.trim().length > 0));

          return (
            <div
              key={entry.qaId}
              className={`transition-all rounded-xl border p-4 flex flex-col justify-between ${
                entry.isOnLeave
                  ? isDark
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-amber-50/60 border-amber-300'
                  : entry.isSubmitted
                  ? isDark
                    ? 'bg-emerald-950/20 border-emerald-500/50 shadow-emerald-900/10'
                    : 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                  : isDark
                  ? 'bg-slate-800/50 border-slate-700/70 hover:border-slate-600'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              {/* Card Header: QA Name, Avatar, Leave Toggle Switch */}
              <div>
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
                        {entry.isSubmitted && !entry.isOnLeave && (
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

                  {/* LEAVE TOGGLE SWITCH */}
                  <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${
                    isDark ? 'bg-slate-900/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${
                      entry.isOnLeave ? 'text-amber-500' : (isDark ? 'text-slate-400' : 'text-slate-500')
                    }`}>
                      {entry.isOnLeave ? 'On Leave' : 'Present'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQATask(entry.qaId, { isOnLeave: !entry.isOnLeave })}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        entry.isOnLeave ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      title={entry.isOnLeave ? 'Click to mark Present' : 'Click to mark On Leave'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          entry.isOnLeave ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Card Content based on Leave status */}
                {entry.isOnLeave ? (
                  <div className={`border rounded-lg p-3 my-2 flex items-center gap-2.5 text-xs font-medium ${
                    isDark
                      ? 'bg-amber-900/30 border-amber-700/40 text-amber-300'
                      : 'bg-amber-100/80 border-amber-300 text-amber-900'
                  }`}>
                    <UserX className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span>QA is marked ON LEAVE for today. (Automatically included as absent in MOM)</span>
                  </div>
                ) : (
                  <div>
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
                              placeholder="+ Add new task bullet point..."
                              className={`flex-1 text-xs border rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500 ${
                                isDark
                                  ? 'bg-slate-900 text-slate-200 border-slate-700/80'
                                  : 'bg-white text-slate-900 border-slate-300 shadow-xs'
                              }`}
                            />
                            <button
                              onClick={() => handleAddTaskBullet(entry.qaId)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                                isDark
                                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" /> Add
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* COMPACT & NEAT PASTEL DISABLED BUTTON UI MATCHING USER SCREENSHOT */}
              {!entry.isOnLeave && (
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
