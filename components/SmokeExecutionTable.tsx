'use client';

import React, { useState } from 'react';
import { SmokeExecutionRow, QA, ModuleItem } from '@/lib/types';
import { Table, Plus, Trash2, Link as LinkIcon, X, Check, Save } from 'lucide-react';

interface SmokeExecutionTableProps {
  rows: SmokeExecutionRow[];
  availableQAs: QA[];
  availableModules: ModuleItem[];
  onUpdateRow: (rowId: string, updated: Partial<SmokeExecutionRow>) => void;
  onAddRow: () => void;
  onDeleteRow: (rowId: string) => void;
  onSaveTable?: () => void;
  theme?: 'dark' | 'light';
}

export const SmokeExecutionTable: React.FC<SmokeExecutionTableProps> = ({
  rows,
  availableQAs,
  availableModules,
  onUpdateRow,
  onAddRow,
  onDeleteRow,
  onSaveTable,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveClick = () => {
    if (onSaveTable) {
      onSaveTable();
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const [editingUrlRow, setEditingUrlRow] = useState<{
    rowId: string;
    field: 'desktopReportUrl' | 'desktopBugTicketUrl' | 'msiteReportUrl' | 'msiteBugTicketUrl';
    title: string;
    currentUrl: string;
  } | null>(null);

  const [urlInputValue, setUrlInputValue] = useState('');

  const openUrlModal = (
    rowId: string,
    field: 'desktopReportUrl' | 'desktopBugTicketUrl' | 'msiteReportUrl' | 'msiteBugTicketUrl',
    title: string,
    currentUrl?: string
  ) => {
    setEditingUrlRow({ rowId, field, title, currentUrl: currentUrl || '' });
    setUrlInputValue(currentUrl || 'https://');
  };

  const saveUrlModal = () => {
    if (!editingUrlRow) return;
    onUpdateRow(editingUrlRow.rowId, { [editingUrlRow.field]: urlInputValue });
    setEditingUrlRow(null);
  };

  // Totals calculations
  let desktopTotalSum = 0;
  let desktopPassSum = 0;
  let desktopFailSum = 0;
  let msiteTotalSum = 0;
  let msitePassSum = 0;
  let msiteFailSum = 0;

  rows.forEach((r) => {
    if (r.desktopTotal) desktopTotalSum += r.desktopTotal;
    if (r.desktopPass) desktopPassSum += r.desktopPass;
    if (r.desktopFail) desktopFailSum += r.desktopFail;
    if (r.msiteTotal) msiteTotalSum += r.msiteTotal;
    if (r.msitePass) msitePassSum += r.msitePass;
    if (r.msiteFail) msiteFailSum += r.msiteFail;
  });

  return (
    <div className={`rounded-2xl p-5 mb-8 border shadow-xl transition-colors ${
      isDark
        ? 'bg-slate-900/60 border-slate-800 text-white'
        : 'bg-white border-slate-200 text-slate-900'
    }`}>
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b pb-4 ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-teal-500" />
            <h2 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Daily Smoke Report Execution Summary
            </h2>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Fill desktop & msite execution metrics, pass/fail counts, and ticket links.
          </p>
        </div>

        <button
          onClick={onAddRow}
          className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 px-3.5 py-2 rounded-xl transition-all shadow-md shadow-teal-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Module Row</span>
        </button>
      </div>

      {/* Table Container */}
      <div className={`overflow-x-auto rounded-xl border shadow-xl ${
        isDark ? 'border-slate-700/80' : 'border-slate-300'
      }`}>
        <table className="w-full text-xs text-left border-collapse">
          {/* Table Header matching spreadsheet format */}
          <thead>
            <tr className="bg-amber-100 text-amber-950 font-black text-center text-xs tracking-wide border-b border-amber-300">
              <th colSpan={13} className="py-2.5 px-3 uppercase">
                Daily Smoke Report Execution
              </th>
            </tr>

            <tr className="bg-emerald-800 text-emerald-100 font-bold text-center border-b border-emerald-900">
              <th rowSpan={2} className="p-2.5 border-r border-emerald-700/60 w-32">Module</th>
              <th rowSpan={2} className="p-2.5 border-r border-emerald-700/60 w-24">QA</th>
              <th colSpan={3} className="p-2.5 border-r border-emerald-700/60 bg-emerald-900/80">
                Count of Desktop Test Cases
              </th>
              <th className="p-2.5 border-r border-emerald-700/60 bg-emerald-900/60">Desktop</th>
              <th className="p-2.5 border-r border-emerald-700/60 bg-emerald-900/60">Bug Ticket ID</th>
              <th colSpan={3} className="p-2.5 border-r border-emerald-700/60 bg-teal-900/80">
                Count of Msite Test Cases
              </th>
              <th className="p-2.5 border-r border-emerald-700/60 bg-teal-900/60">Msite</th>
              <th className="p-2.5 border-r border-emerald-700/60 bg-teal-900/60">Bug Ticket ID</th>
              <th rowSpan={2} className="p-2 w-10"></th>
            </tr>

            <tr className="bg-emerald-900 text-emerald-100 font-semibold text-center border-b border-emerald-950">
              <th className="p-2 border-r border-emerald-800 w-16">Total</th>
              <th className="p-2 border-r border-emerald-800 w-16">Pass</th>
              <th className="p-2 border-r border-emerald-800 w-16 text-rose-300">Fail</th>
              <th className="p-2 border-r border-emerald-800 w-32">Report</th>
              <th className="p-2 border-r border-emerald-800 w-36 min-w-[110px]">Ticket</th>
              <th className="p-2 border-r border-emerald-800 w-16">Total</th>
              <th className="p-2 border-r border-emerald-800 w-16">Pass</th>
              <th className="p-2 border-r border-emerald-800 w-16 text-rose-300">Fail</th>
              <th className="p-2 border-r border-emerald-800 w-32">Report</th>
              <th className="p-2 border-r border-emerald-800 w-36 min-w-[110px]">Ticket</th>
            </tr>
          </thead>

          <tbody className={`divide-y ${
            isDark ? 'divide-slate-800 bg-slate-900/80 text-slate-200' : 'divide-slate-200 bg-white text-slate-900'
          }`}>
            {rows.map((row) => {
              const isDesktopNA = row.desktopReport === 'NA';
              const isMsiteNA = row.msiteReport === 'NA';
              const borderCellClass = isDark ? 'border-r border-slate-800' : 'border-r border-slate-200';

              return (
                <tr key={row.id} className={isDark ? 'hover:bg-slate-800/40 transition-colors' : 'hover:bg-slate-50 transition-colors'}>
                  {/* Module Name */}
                  <td className={`p-2 ${borderCellClass}`}>
                    <input
                      type="text"
                      value={row.module}
                      onChange={(e) => onUpdateRow(row.id, { module: e.target.value })}
                      className={`w-full bg-transparent font-bold text-xs focus:outline-none rounded px-1 ${
                        isDark ? 'text-white focus:bg-slate-800' : 'text-slate-900 focus:bg-slate-100'
                      }`}
                    />
                  </td>

                  {/* QA Name */}
                  <td className={`p-2 ${borderCellClass}`}>
                    <input
                      type="text"
                      value={row.qa}
                      onChange={(e) => onUpdateRow(row.id, { qa: e.target.value })}
                      className={`w-full bg-transparent text-center font-semibold text-xs focus:outline-none rounded px-1 ${
                        isDark ? 'text-slate-200 focus:bg-slate-800' : 'text-slate-800 focus:bg-slate-100'
                      }`}
                    />
                  </td>

                  {/* Desktop Total */}
                  <td className={`p-2 ${borderCellClass} text-center`}>
                    {isDesktopNA ? (
                      <span className="text-slate-400 font-semibold">NA</span>
                    ) : (
                      <input
                        type="number"
                        value={row.desktopTotal ?? ''}
                        onChange={(e) =>
                          onUpdateRow(row.id, {
                            desktopTotal: e.target.value ? parseInt(e.target.value) : null,
                          })
                        }
                        className={`w-full bg-transparent text-center focus:outline-none font-semibold rounded ${
                          isDark ? 'text-slate-200 focus:bg-slate-800' : 'text-slate-900 focus:bg-slate-100'
                        }`}
                      />
                    )}
                  </td>

                  {/* Desktop Pass */}
                  <td className={`p-2 ${borderCellClass} text-center`}>
                    {isDesktopNA ? (
                      <span className="text-slate-400 font-semibold">NA</span>
                    ) : (
                      <input
                        type="number"
                        value={row.desktopPass ?? ''}
                        onChange={(e) =>
                          onUpdateRow(row.id, {
                            desktopPass: e.target.value ? parseInt(e.target.value) : null,
                          })
                        }
                        className={`w-full bg-transparent text-center text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none rounded ${
                          isDark ? 'focus:bg-slate-800' : 'focus:bg-slate-100'
                        }`}
                      />
                    )}
                  </td>

                  {/* Desktop Fail */}
                  <td className={`p-2 ${borderCellClass} text-center`}>
                    {isDesktopNA ? (
                      <span className="text-slate-400 font-semibold">NA</span>
                    ) : (
                      <input
                        type="number"
                        value={row.desktopFail ?? ''}
                        onChange={(e) =>
                          onUpdateRow(row.id, {
                            desktopFail: e.target.value ? parseInt(e.target.value) : null,
                          })
                        }
                        className={`w-full bg-transparent text-center font-bold focus:outline-none rounded ${
                          row.desktopFail && row.desktopFail > 0
                            ? 'text-rose-600 dark:text-rose-400 font-extrabold bg-rose-100 dark:bg-rose-950/40'
                            : isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      />
                    )}
                  </td>

                  {/* Desktop Report */}
                  <td className={`p-2 ${borderCellClass} text-center`}>
                    <div className="flex items-center justify-between gap-1">
                      <select
                        value={row.desktopReport}
                        onChange={(e) => onUpdateRow(row.id, { desktopReport: e.target.value })}
                        className={`font-semibold text-xs rounded border px-1 py-0.5 focus:outline-none ${
                          isDark
                            ? 'bg-slate-900 text-blue-400 border-slate-700'
                            : 'bg-white text-blue-600 border-slate-300 shadow-xs'
                        }`}
                      >
                        <option value="Link">Link</option>
                        <option value="Automation report sent">Automation report sent</option>
                        <option value="NA">NA</option>
                      </select>
                      {row.desktopReport === 'Link' && (
                        <button
                          onClick={() =>
                            openUrlModal(
                              row.id,
                              'desktopReportUrl',
                              `Desktop Report Link (${row.module})`,
                              row.desktopReportUrl
                            )
                          }
                          className="text-blue-500 hover:text-blue-600 p-0.5"
                          title="Edit URL link"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Desktop Bug Ticket */}
                  <td className={`p-2 ${borderCellClass} text-center`}>
                    <div className="flex items-center justify-between gap-1">
                      <input
                        type="text"
                        value={row.desktopBugTicketId}
                        onChange={(e) => onUpdateRow(row.id, { desktopBugTicketId: e.target.value })}
                        placeholder="e.g. 680379, 680380"
                        className={`w-full bg-transparent text-center font-semibold text-xs focus:outline-none rounded ${
                          isDark ? 'text-blue-400 focus:bg-slate-800' : 'text-blue-600 focus:bg-slate-100'
                        }`}
                      />
                      <button
                        onClick={() =>
                          openUrlModal(
                            row.id,
                            'desktopBugTicketUrl',
                            `Desktop Bug Ticket Link (${row.module})`,
                            row.desktopBugTicketUrl
                          )
                        }
                        className="text-slate-400 hover:text-blue-500 p-0.5"
                        title="Edit Bug Ticket URL"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  {/* Msite Total */}
                  <td className={`p-2 ${borderCellClass} text-center`}>
                    {isMsiteNA ? (
                      <span className="text-slate-400 font-semibold">NA</span>
                    ) : (
                      <input
                        type="number"
                        value={row.msiteTotal ?? ''}
                        onChange={(e) =>
                          onUpdateRow(row.id, {
                            msiteTotal: e.target.value ? parseInt(e.target.value) : null,
                          })
                        }
                        className={`w-full bg-transparent text-center focus:outline-none font-semibold rounded ${
                          isDark ? 'text-slate-200 focus:bg-slate-800' : 'text-slate-900 focus:bg-slate-100'
                        }`}
                      />
                    )}
                  </td>

                  {/* Msite Pass */}
                  <td className={`p-2 ${borderCellClass} text-center`}>
                    {isMsiteNA ? (
                      <span className="text-slate-400 font-semibold">NA</span>
                    ) : (
                      <input
                        type="number"
                        value={row.msitePass ?? ''}
                        onChange={(e) =>
                          onUpdateRow(row.id, {
                            msitePass: e.target.value ? parseInt(e.target.value) : null,
                          })
                        }
                        className={`w-full bg-transparent text-center text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none rounded ${
                          isDark ? 'focus:bg-slate-800' : 'focus:bg-slate-100'
                        }`}
                      />
                    )}
                  </td>

                  {/* Msite Fail */}
                  <td className={`p-2 ${borderCellClass} text-center`}>
                    {isMsiteNA ? (
                      <span className="text-slate-400 font-semibold">NA</span>
                    ) : (
                      <input
                        type="number"
                        value={row.msiteFail ?? ''}
                        onChange={(e) =>
                          onUpdateRow(row.id, {
                            msiteFail: e.target.value ? parseInt(e.target.value) : null,
                          })
                        }
                        className={`w-full bg-transparent text-center font-bold focus:outline-none rounded ${
                          row.msiteFail && row.msiteFail > 0
                            ? 'text-rose-600 dark:text-rose-400 font-extrabold bg-rose-100 dark:bg-rose-950/40'
                            : isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      />
                    )}
                  </td>

                  {/* Msite Report */}
                  <td className={`p-2 ${borderCellClass} text-center`}>
                    <div className="flex items-center justify-between gap-1">
                      <select
                        value={row.msiteReport}
                        onChange={(e) => onUpdateRow(row.id, { msiteReport: e.target.value })}
                        className={`font-semibold text-xs rounded border px-1 py-0.5 focus:outline-none ${
                          isDark
                            ? 'bg-slate-900 text-blue-400 border-slate-700'
                            : 'bg-white text-blue-600 border-slate-300 shadow-xs'
                        }`}
                      >
                        <option value="Link">Link</option>
                        <option value="Automation report sent">Automation report sent</option>
                        <option value="NA">NA</option>
                      </select>
                      {row.msiteReport === 'Link' && (
                        <button
                          onClick={() =>
                            openUrlModal(
                              row.id,
                              'msiteReportUrl',
                              `Msite Report Link (${row.module})`,
                              row.msiteReportUrl
                            )
                          }
                          className="text-blue-500 hover:text-blue-600 p-0.5"
                          title="Edit URL link"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Msite Bug Ticket */}
                  <td className={`p-2 ${borderCellClass} text-center`}>
                    <div className="flex items-center justify-between gap-1">
                      <input
                        type="text"
                        value={row.msiteBugTicketId}
                        onChange={(e) => onUpdateRow(row.id, { msiteBugTicketId: e.target.value })}
                        placeholder="e.g. 680379, 680380"
                        className={`w-full bg-transparent text-center font-semibold text-xs focus:outline-none rounded ${
                          isDark ? 'text-blue-400 focus:bg-slate-800' : 'text-blue-600 focus:bg-slate-100'
                        }`}
                      />
                      <button
                        onClick={() =>
                          openUrlModal(
                            row.id,
                            'msiteBugTicketUrl',
                            `Msite Bug Ticket Link (${row.module})`,
                            row.msiteBugTicketUrl
                          )
                        }
                        className="text-slate-400 hover:text-blue-500 p-0.5"
                        title="Edit Bug Ticket URL"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  {/* Delete Action */}
                  <td className="p-2 text-center">
                    <button
                      onClick={() => onDeleteRow(row.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                      title="Delete module row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Footer Total Summary Row */}
          <tfoot>
            <tr className={`font-extrabold text-center border-t-2 ${
              isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-100 text-slate-900 border-slate-300'
            }`}>
              <td className="p-2.5 text-left text-emerald-600 dark:text-emerald-400 uppercase">Totals</td>
              <td className="p-2.5 text-slate-400">-</td>
              <td className="p-2.5">{desktopTotalSum}</td>
              <td className="p-2.5 text-emerald-600 dark:text-emerald-400">{desktopPassSum}</td>
              <td className="p-2.5 text-rose-600 dark:text-rose-400">{desktopFailSum}</td>
              <td colSpan={2} className="p-2.5 text-slate-400">-</td>
              <td className="p-2.5">{msiteTotalSum}</td>
              <td className="p-2.5 text-emerald-600 dark:text-emerald-400">{msitePassSum}</td>
              <td className="p-2.5 text-rose-600 dark:text-rose-400">{msiteFailSum}</td>
              <td colSpan={3} className="p-2.5 text-slate-400">-</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Save Button & Persistence Status Bar */}
      <div className={`mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border shadow-lg ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-2.5 text-xs">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
          </span>
          <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-600 font-medium'}>
            Enter single or multiple Bug Ticket IDs (e.g. <code className="text-teal-400 font-bold px-1.5 py-0.5 bg-slate-800/80 rounded border border-slate-700">680379, 680380</code>). Click save to persist permanently.
          </span>
        </div>

        <button
          type="button"
          onClick={handleSaveClick}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
            saveSuccess
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 scale-[1.02]'
              : 'bg-teal-400 hover:bg-teal-300 text-slate-950 shadow-teal-500/20 active:scale-95'
          }`}
        >
          {saveSuccess ? (
            <>
              <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>Execution Summary Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>Save Execution Summary</span>
            </>
          )}
        </button>
      </div>

      {/* URL Link Editor Modal */}
      {editingUrlRow && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between mb-4 border-b pb-3 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-blue-500" />
                <h3 className="font-bold text-sm">{editingUrlRow.title}</h3>
              </div>
              <button
                onClick={() => setEditingUrlRow(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Target URL (e.g. Jira ticket / Report URL):
                </label>
                <input
                  type="url"
                  value={urlInputValue}
                  onChange={(e) => setUrlInputValue(e.target.value)}
                  placeholder="https://jira.company.com/browse/TICKET-123"
                  className={`w-full text-sm border rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 ${
                    isDark ? 'bg-slate-950 text-slate-200 border-slate-700' : 'bg-slate-50 text-slate-900 border-slate-300'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditingUrlRow(null)}
                  className={`px-3.5 py-1.5 text-xs ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={saveUrlModal}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Save Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
