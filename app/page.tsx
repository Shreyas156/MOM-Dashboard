'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DailyMOM, QATaskEntry, SmokeExecutionRow, QA, ModuleItem } from '@/lib/types';
import {
  getStoredMOM,
  saveStoredMOM,
  getStoredQAs,
  saveStoredQAs,
  getStoredModules,
  saveStoredModules,
  getStoredSmokeRows,
  saveStoredSmokeRows,
  formatDateString,
  getTodayDateString,
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
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString());
  const [momData, setMomData] = useState<DailyMOM>(INITIAL_MOM_DATA);
  const [qas, setQas] = useState<QA[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const theme: 'dark' | 'light' = 'light';

  // Modals state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  // Track timestamp of recent user manual edit
  const lastLocalEditTime = useRef<number>(0);

  // Initialize storage
  useEffect(() => {
    localStorage.removeItem('mom_dashboard_theme');
    document.body.className = 'light-theme';

    const loadedQAs = getStoredQAs();
    const loadedModules = getStoredModules();
    setQas(loadedQAs);
    setModules(loadedModules);

    const loadedMOM = getStoredMOM(currentDate);
    setMomData(loadedMOM);
  }, [currentDate]);

  // Helper to merge incoming server data into local React state smoothly without breaking active user typing
  const applyServerData = (serverMOM: DailyMOM) => {
    if (!serverMOM || !serverMOM.qaTasks) return;

    setMomData((prev) => {
      const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
      const isUserTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      const serverQaMap = new Map<string, QATaskEntry>();
      serverMOM.qaTasks.forEach((q) => serverQaMap.set(q.qaId, q));

      const mergedQATasks = prev.qaTasks.map((localQA) => {
        const serverQA = serverQaMap.get(localQA.qaId);
        if (!serverQA) return localQA;

        // If user is currently typing in this specific card, preserve local typing text but update status & submitted badge
        if (isUserTyping) {
          return {
            ...serverQA,
            tasks: (localQA.tasks && localQA.tasks.length > 0) ? localQA.tasks : serverQA.tasks,
          };
        }

        return serverQA;
      });

      serverMOM.qaTasks.forEach((serverQA) => {
        if (!mergedQATasks.some((q) => q.qaId === serverQA.qaId)) {
          mergedQATasks.push(serverQA);
        }
      });

      let mergedSmokeRows = [...prev.smokeRows];
      if (Array.isArray(serverMOM.smokeRows) && serverMOM.smokeRows.length > 0) {
        const serverSmokeMap = new Map<string, SmokeExecutionRow>();
        serverMOM.smokeRows.forEach((sr) => serverSmokeMap.set(sr.id, sr));

        mergedSmokeRows = prev.smokeRows.map((localRow) => {
          const serverRow = serverSmokeMap.get(localRow.id);
          if (!serverRow) return localRow;
          if (isUserTyping) return localRow;

          return {
            ...serverRow,
            module: localRow.module || serverRow.module,
            qa: localRow.qa || serverRow.qa,
            desktopTotal: localRow.desktopTotal ?? serverRow.desktopTotal,
            desktopPass: localRow.desktopPass ?? serverRow.desktopPass,
            desktopFail: localRow.desktopFail ?? serverRow.desktopFail,
            desktopReport: localRow.desktopReport || serverRow.desktopReport,
            desktopReportUrl: localRow.desktopReportUrl || serverRow.desktopReportUrl,
            desktopBugTicketId: (localRow.desktopBugTicketId && localRow.desktopBugTicketId !== '-') ? localRow.desktopBugTicketId : serverRow.desktopBugTicketId,
            desktopBugTicketUrl: localRow.desktopBugTicketUrl || serverRow.desktopBugTicketUrl,
            msiteTotal: localRow.msiteTotal ?? serverRow.msiteTotal,
            msitePass: localRow.msitePass ?? serverRow.msitePass,
            msiteFail: localRow.msiteFail ?? serverRow.msiteFail,
            msiteReport: localRow.msiteReport || serverRow.msiteReport,
            msiteReportUrl: localRow.msiteReportUrl || serverRow.msiteReportUrl,
            msiteBugTicketId: (localRow.msiteBugTicketId && localRow.msiteBugTicketId !== '-') ? localRow.msiteBugTicketId : serverRow.msiteBugTicketId,
            msiteBugTicketUrl: localRow.msiteBugTicketUrl || serverRow.msiteBugTicketUrl,
          };
        });

        serverMOM.smokeRows.forEach((serverRow) => {
          if (!prev.smokeRows.some((r) => r.id === serverRow.id)) {
            mergedSmokeRows.push(serverRow);
          }
        });
      }

      const isDifferent =
        serverMOM.updatedAt !== prev.updatedAt ||
        JSON.stringify(mergedQATasks) !== JSON.stringify(prev.qaTasks) ||
        JSON.stringify(mergedSmokeRows) !== JSON.stringify(prev.smokeRows);

      if (isDifferent) {
        return {
          ...serverMOM,
          qaTasks: mergedQATasks,
          smokeRows: mergedSmokeRows,
        };
      }
      return prev;
    });
  };

  // 1. Cross-tab instant synchronization via BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const bc = new BroadcastChannel('mom_live_sync');
    bc.onmessage = (event) => {
      if (event.data && event.data.type === 'MOM_UPDATED' && event.data.data) {
        applyServerData(event.data.data);
      }
    };
    return () => {
      bc.close();
    };
  }, [currentDate]);


  // 3. Fast 1.5s background polling fallback
  useEffect(() => {
    const fetchSharedMOM = async () => {
      try {
        const res = await fetch(`/api/mom?date=${currentDate}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.qaTasks) {
            applyServerData(json.data);
          }
        }
      } catch (e) {}
    };

    fetchSharedMOM();
    const interval = setInterval(fetchSharedMOM, 1500);
    return () => clearInterval(interval);
  }, [currentDate]);

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
    if (updatedMOM.smokeRows) {
      saveStoredSmokeRows(updatedMOM.smokeRows);
    }
    setIsSaved(true);

    // Broadcast immediately across local tabs
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('mom_live_sync');
        bc.postMessage({ type: 'MOM_UPDATED', data: updatedMOM });
        bc.close();
      } catch (e) {}
    }

    // Save to API route asynchronously for live team sync
    fetch('/api/mom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedMOM),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          applyServerData(data.data);
        }
      })
      .catch(() => {});
  };

  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
    const loaded = getStoredMOM(newDate);
    loaded.id = newDate;
    loaded.dateFormatted = formatDateString(newDate);
    // Ensure persistent master smokeRows are always used across dates
    const masterRows = getStoredSmokeRows();
    if (masterRows && masterRows.length > 0) {
      loaded.smokeRows = masterRows;
    }
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

  // Explicit QA Submit / Resubmit Handler (Uses 12-hour AM/PM time format)
  const handleSubmitQATask = (qaId: string) => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    const hoursStr = String(hours).padStart(2, '0');
    const time12Str = `${hoursStr}:${minutes} ${ampm}`;

    const updatedTasks = momData.qaTasks.map((entry) => {
      if (entry.qaId === qaId) {
        return {
          ...entry,
          isSubmitted: true,
          submittedAt: time12Str,
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
    lastLocalEditTime.current = Date.now();
    const updatedRows = momData.smokeRows.map((row) => {
      if (row.id === rowId) {
        return { ...row, ...updated };
      }
      return row;
    });
    saveStoredSmokeRows(updatedRows);
    updateMOM({ ...momData, smokeRows: updatedRows });

    fetch('/api/smoke-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smokeRows: updatedRows }),
    }).catch(() => {});
  };

  const handleAddSmokeRow = () => {
    lastLocalEditTime.current = Date.now();
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
    const updatedRows = [...momData.smokeRows, newRow];
    saveStoredSmokeRows(updatedRows);
    updateMOM({ ...momData, smokeRows: updatedRows });

    fetch('/api/smoke-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smokeRows: updatedRows }),
    }).catch(() => {});
  };

  const handleDeleteSmokeRow = (rowId: string) => {
    lastLocalEditTime.current = Date.now();
    const updatedRows = momData.smokeRows.filter((r) => r.id !== rowId);
    saveStoredSmokeRows(updatedRows);
    updateMOM({ ...momData, smokeRows: updatedRows });

    fetch('/api/smoke-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smokeRows: updatedRows }),
    }).catch(() => {});
  };

  const handleSaveSmokeRows = () => {
    lastLocalEditTime.current = Date.now();
    const rowsToSave = momData.smokeRows;
    saveStoredSmokeRows(rowsToSave);

    const updatedMOM = {
      ...momData,
      smokeRows: rowsToSave,
      updatedAt: new Date().toISOString(),
    };

    setMomData(updatedMOM);
    saveStoredMOM(updatedMOM);
    setIsSaved(true);

    fetch('/api/smoke-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smokeRows: rowsToSave }),
    }).catch(() => {});

    fetch('/api/mom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedMOM),
    }).catch(() => {});
  };

  // CLEAR FORM ONLY CLEARS QA TASKS, PRESERVING THE SMOKE EXECUTION TABLE DATA!
  const handleResetData = () => {
    if (confirm('Clear daily QA tasks for fresh entry? (Daily Smoke Report Execution Summary table data will be preserved)')) {
      const clearedTasks = momData.qaTasks.map((entry) => ({
        ...entry,
        status: '',
        tasks: [],
        isSubmitted: false,
        submittedAt: undefined,
      }));

      const currentSmokeRows = momData.smokeRows.length > 0 ? momData.smokeRows : getStoredSmokeRows();
      saveStoredSmokeRows(currentSmokeRows);

      updateMOM({
        ...momData,
        qaTasks: clearedTasks,
        smokeRows: currentSmokeRows,
      });
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

  // Check if ALL QAs have submitted
  const totalQAs = momData.qaTasks.length;
  const submittedCount = momData.qaTasks.filter((q) => q.isSubmitted || q.isOnLeave).length;
  const allQAsSubmitted = totalQAs > 0 && submittedCount === totalQAs;

  const isDark = false;

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
        allQAsSubmitted={allQAsSubmitted}
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
            disabled={!allQAsSubmitted}
            onClick={() => setIsEmailModalOpen(true)}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all self-end md:self-auto flex items-center gap-2 ${
              allQAsSubmitted
                ? 'text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-500/20 cursor-pointer'
                : 'bg-[#a5b4fc] text-white opacity-80 cursor-not-allowed shadow-xs'
            }`}
            title={
              allQAsSubmitted
                ? 'Preview & Send MOM Report'
                : 'Disabled until all present QAs submit their standup tasks'
            }
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
          onSaveTable={handleSaveSmokeRows}
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
