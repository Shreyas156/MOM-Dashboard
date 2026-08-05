'use client';

import React, { useState } from 'react';
import { QA, ModuleItem } from '@/lib/types';
import { X, Plus, Trash2, Users, Layers, Check } from 'lucide-react';

interface RosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  qas: QA[];
  modules: ModuleItem[];
  onSaveQAs: (qas: QA[]) => void;
  onSaveModules: (modules: ModuleItem[]) => void;
}

export const RosterModal: React.FC<RosterModalProps> = ({
  isOpen,
  onClose,
  qas,
  modules,
  onSaveQAs,
  onSaveModules,
}) => {
  const [activeTab, setActiveTab] = useState<'qas' | 'modules'>('qas');
  const [newQaName, setNewQaName] = useState('');
  const [newQaRole, setNewQaRole] = useState('Quality Assurance');
  const [newQaEmail, setNewQaEmail] = useState('');

  const [newModuleName, setNewModuleName] = useState('');

  if (!isOpen) return null;

  const handleAddQA = () => {
    if (!newQaName.trim()) return;
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#6366f1', '#14b8a6', '#ef4444'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newQA: QA = {
      id: Date.now().toString(),
      name: newQaName.trim(),
      role: newQaRole.trim() || 'Quality Assurance',
      email: newQaEmail.trim(),
      avatarColor: randomColor,
    };

    onSaveQAs([...qas, newQA]);
    setNewQaName('');
    setNewQaEmail('');
  };

  const handleDeleteQA = (id: string) => {
    onSaveQAs(qas.filter((q) => q.id !== id));
  };

  const handleAddModule = () => {
    if (!newModuleName.trim()) return;
    const newMod: ModuleItem = {
      id: 'm_' + Date.now(),
      name: newModuleName.trim(),
    };

    onSaveModules([...modules, newMod]);
    setNewModuleName('');
  };

  const handleDeleteModule = (id: string) => {
    onSaveModules(modules.filter((m) => m.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-base text-white">Manage Roster & Modules</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="bg-slate-950 px-6 py-2.5 border-b border-slate-800 flex items-center gap-4">
          <button
            onClick={() => setActiveTab('qas')}
            className={`flex items-center gap-2 text-xs font-bold py-1.5 px-3 rounded-lg transition-colors ${
              activeTab === 'qas'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>QA Team Roster ({qas.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('modules')}
            className={`flex items-center gap-2 text-xs font-bold py-1.5 px-3 rounded-lg transition-colors ${
              activeTab === 'modules'
                ? 'bg-teal-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Modules List ({modules.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'qas' ? (
            <div>
              {/* Add QA Form */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Add New QA Member</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newQaName}
                    onChange={(e) => setNewQaName(e.target.value)}
                    placeholder="Full Name (e.g. Sukanya)"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={newQaRole}
                    onChange={(e) => setNewQaRole(e.target.value)}
                    placeholder="Role (e.g. Quality Assurance)"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="email"
                    value={newQaEmail}
                    onChange={(e) => setNewQaEmail(e.target.value)}
                    placeholder="Email Address"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleAddQA}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add QA Member
                  </button>
                </div>
              </div>

              {/* QA List */}
              <div className="space-y-2">
                {qas.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs"
                        style={{ backgroundColor: q.avatarColor || '#3b82f6' }}
                      >
                        {q.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-white">{q.name}</p>
                        <p className="text-[11px] text-slate-400">{q.role} {q.email ? `• ${q.email}` : ''}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteQA(q.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {/* Add Module Form */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Add New Module</h3>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    placeholder="Module Name (e.g. Buyer MY + IM Home)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                  <button
                    onClick={handleAddModule}
                    className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs px-4 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-950" /> Add Module
                  </button>
                </div>
              </div>

              {/* Modules List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {modules.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800"
                  >
                    <span className="font-bold text-xs text-slate-200">{m.name}</span>
                    <button
                      onClick={() => handleDeleteModule(m.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
