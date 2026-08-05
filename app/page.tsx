'use client';

import React, { useState, useEffect } from 'react';
import { DailyMOM, QATaskEntry, SmokeExecutionRow, QA, ModuleItem } from '@/lib/types';
import {
  getStoredMOM,
  saveStoredMOM,
  getStoredQAs,
  saveStoredQAs,
  getStoredModules,
  saveStoredModules,
  formatDateString,
} from '@/lib/storage';
import { INITIAL_MOM_DATA } from '@/lib/defaultData';
import { Navbar } from '@/components/Navbar';
import { StatsSummary } from '@/components/StatsSummary';
import { AttendanceSection } from '@/components/AttendanceSection';
import { SmokeExecutionTable } from '@/components/SmokeExecutionTable';
import { EmailModal } from '@/components/EmailModal';
import { RosterModal } from '@/components/RosterModal';
import { DeploymentGuideModal } from '@/components/DeploymentGuideModal';
import { Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState<string>('2026-08-05');
  const [momData, setMomData] = useState<DailyMOM>(INITIAL_MOM_DATA);
  const [qas, setQas] = useState<QA[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  // Modals state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  // Initialize storage & theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('mom_dashboard_theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
    }

    const loadedQAs = getStoredQAs();
    const loadedModules = getStoredModules();
    setQas(loadedQAs);
    setModules(loadedModules);

    const loadedMOM = getStoredMOM(currentDate);
    setMomData(loadedMOM);
  }, [currentDate]);

  // Real-time polling across QAs (fetches shared data every 3s, safely skipping if user is typing)
  useEffect(() => {
    const fetchSharedMOM = async () => {
      // Do not overwrite state if user is actively typing in an input or textarea
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      try {
        const res = await fetch(`/api/mom?date=${currentDate}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.qaTasks) {
            setMomData((prev) => {
              const isDifferent =
                json.data.updatedAt !== prev.updatedAt ||
                JSON.stringify(json.data.qaTasks) !== JSON.stringify(prev.qaTasks) ||
                JSON.stringify(json.data.smokeRows) !== JSON.stringify(prev.smokeRows);

              if (isDifferent) {
                return json.data;
              }
              return prev;
            });
          }
        }
      } catch (e) {
        // Fallback active
      }
    };

    fetchSharedMOM();
    const interval = setInterval(fetchSharedMOM, 3000);
    return () => clearInterval(interval);
  }, [currentDate]);

  useEffect(() => {
    if (theme === 'dark') {
      document.body.className = 'dark-theme';
    } else {
      document.body.className = 'light-theme';
    }
  }, [theme]);

  const handleSetTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('mom_dashboard_theme', newTheme);
  };

  // Save MOM data whenever changed
  const updateMOM = (updatedMOM: DailyMOM) => {
    // Purge Sukanya from any updates
    updatedMOM.qaTasks = updatedMOM.qaTasks.filter(
      (q) => q.qaId !== '1' && q.qaName.toLowerCase() !== 'sukanya sharma'
    );
    updatedMOM.attendees = updatedMOM.attendees.filter(
      (name) => name.toLowerCase() !== 'sukanya sharma'
    );
    updatedMOM.updatedAt = new Date().toISOString();

    setMomData(updatedMOM);
    saveStoredMOM(updatedMOM);
    setIsSaved(true);

    // Save to API route asynchronously for live team sync
    fetch('/api/mom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedMOM),
    }).catch(() => {
      // Local fallback active
    });
  };

  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
    const loaded = getStoredMOM(newDate);
    loaded.id = newDate;
    loaded.dateFormatted = formatDateString(newDate);
    setMomData(loaded);
  };

  // Update QA Task / Attendance
  const handleUpdateQATask = (qaId: string, updated: Partial<QATaskEntry>) => {
    const updatedTasks = momData.qaTasks.map((entry) => {
      if (entry.qaId === qaId) {
        return { ...entry, ...updated };
      }
      return entry;
    });

    const newAttendees = updatedTasks.filter((q) => !q.isOnLeave).map((q) => q.qaName);

    const newMOM = {
      ...momData,
      qaTasks: updatedTasks,
      attendees: newAttendees,
    };
    updateMOM(newMOM);
  };

  // Explicit QA Submit / Resubmit Handler (Uses 24-hour time format: HH:mm)
  const handleSubmitQATask = (qaId: string) => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const time24Str = `${hours}:${minutes}`;

    const updatedTasks = momData.qaTasks.map((entry) => {
      if (entry.qaId === qaId) {
        return {
          ...entry,
          isSubmitted: true,
          submittedAt: time24Str,
        };
      }
      return entry;
    });

    const newAttendees = updatedTasks.filter((q) => !q.isOnLeave).map((q) => q.qaName);

    updateMOM({
      ...momData,
      qaTasks: updatedTasks,
      attendees: newAttendees,
    });
  };

  const handleAddQAToMOM = (qa: QA) => {
    if (qa.name.toLowerCase() === 'sukanya sharma' || qa.id === '1') return;
    const exists = momData.qaTasks.some((entry) => entry.qaId === qa.id);
    if (exists) return;

    const newEntry: QATaskEntry = {
      qaId: qa.id,
      qaName: qa.name,
      isOnLeave: false,
      isSubmitted: false,
      status: 'Working on Launch.',
      tasks: [],
    };

    const updatedTasks = [...momData.qaTasks, newEntry];
    const newAttendees = updatedTasks.filter((q) => !q.isOnLeave).map((q) => q.qaName);

    updateMOM({
      ...momData,
      qaTasks: updatedTasks,
      attendees: newAttendees,
    });
  };

  // Smoke Execution Table handlers
  const handleUpdateSmokeRow = (rowId: string, updated: Partial<SmokeExecutionRow>) => {
    const updatedRows = momData.smokeRows.map((row) => {
      if (row.id === rowId) {
        return { ...row, ...updated };
      }
      return row;
    });
    updateMOM({ ...momData, smokeRows: updatedRows });
  };

  const handleAddSmokeRow = () => {
    const newRow: SmokeExecutionRow = {
      id: 'sr_' + Date.now(),
      module: 'New Module',
      qa: qas[0]?.name.split(' ')[0] || 'QA',
      desktopTotal: 0,
      desktopPass: 0,
      desktopFail: 0,
      desktopReport: 'Link',
      desktopBugTicketId: '-',
      msiteTotal: 0,
      msitePass: 0,
      msiteFail: 0,
      msiteReport: 'Link',
      msiteBugTicketId: '-',
    };
    updateMOM({ ...momData, smokeRows: [...momData.smokeRows, newRow] });
  };

  const handleDeleteSmokeRow = (rowId: string) => {
    const updatedRows = momData.smokeRows.filter((r) => r.id !== rowId);
    updateMOM({ ...momData, smokeRows: updatedRows });
  };

  const handleResetData = () => {
    if (confirm('Reset dashboard data to initial state?')) {
      updateMOM(INITIAL_MOM_DATA);
    }
  };

  const handleSaveQAs = (newQAs: QA[]) => {
    const cleanQAs = newQAs.filter((q) => q.id !== '1' && q.name.toLowerCase() !== 'sukanya sharma');
    setQas(cleanQAs);
    saveStoredQAs(cleanQAs);
  };

  const handleSaveModules = (newModules: ModuleItem[]) => {
    setModules(newModules);
    saveStoredModules(newModules);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    } selection:bg-emerald-500 selection:text-slate-950`}>
      {/* Top Navbar */}
      <Navbar
        currentDate={currentDate}
        onDateChange={handleDateChange}
        onOpenEmailModal={() => setIsEmailModalOpen(true)}
        onOpenRosterModal={() => setIsRosterModalOpen(true)}
        onResetData={handleResetData}
        isSaved={isSaved}
        theme={theme}
        onSetTheme={handleSetTheme}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Banner strip */}
        <div className={`border rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg transition-colors ${
          isDark
            ? 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border-emerald-500/30'
            : 'bg-white border-emerald-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Dynamic Live QA Standup & Smoke Center – {momData.dateFormatted}
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Share this dashboard link with your QA team. Each QA fills their work and clicks <strong>"Submit My Task"</strong> below their card to save live!
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="flex items-center gap-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-500/20 self-end md:self-auto cursor-pointer"
          >
            <span>Preview & Send MOM Report</span>
          </button>
        </div>

        {/* Quick Stats & Team Submission Tracker */}
        <StatsSummary mom={momData} theme={theme} />

        {/* Attendance & Daily Tasks Section */}
        <AttendanceSection
          qaTasks={momData.qaTasks}
          availableQAs={qas}
          onUpdateQATask={handleUpdateQATask}
          onSubmitQATask={handleSubmitQATask}
          onAddQAToMOM={handleAddQAToMOM}
          theme={theme}
        />

        {/* Daily Smoke Test Execution Table */}
        <SmokeExecutionTable
          rows={momData.smokeRows}
          availableQAs={qas}
          availableModules={modules}
          onUpdateRow={handleUpdateSmokeRow}
          onAddRow={handleAddSmokeRow}
          onDeleteRow={handleDeleteSmokeRow}
          theme={theme}
        />
      </main>

      {/* Footer */}
      <footer className={`border-t py-6 text-center text-xs ${
        isDark ? 'border-slate-900 text-slate-500' : 'border-slate-200 text-slate-400'
      }`}>
        <p>QA MOM & Daily Standup Management System • IndiaMART Quality Assurance</p>
      </footer>

      {/* Modals */}
      <EmailModal
        mom={momData}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onUpdateMOM={(updated) => updateMOM({ ...momData, ...updated })}
        theme={theme}
      />

      <RosterModal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        qas={qas}
        modules={modules}
        onSaveQAs={handleSaveQAs}
        onSaveModules={handleSaveModules}
      />

      <DeploymentGuideModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
      />
    </div>
  );
}
