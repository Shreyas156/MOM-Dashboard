'use client';

import React, { useState } from 'react';
import { DailyMOM } from '@/lib/types';
import { generateHTMLEmail, generatePlainTextEmail } from '@/lib/emailGenerator';
import { X, Copy, Check, Send, Sparkles, FileText, Code, Mail } from 'lucide-react';
import confetti from 'canvas-confetti';

interface EmailModalProps {
  mom: DailyMOM;
  isOpen: boolean;
  onClose: () => void;
  onUpdateMOM: (updated: Partial<DailyMOM>) => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  mom,
  isOpen,
  onClose,
  onUpdateMOM,
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'text'>('visual');
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const htmlContent = generateHTMLEmail(mom);
  const plainTextContent = generatePlainTextEmail(mom);

  const subjectLine = `MOM of QA Stand up on ${mom.dateFormatted}`;

  const handleCopyRichHTML = async () => {
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const typeHtml = 'text/html';
        const typeText = 'text/plain';
        const blobHtml = new Blob([htmlContent], { type: typeHtml });
        const blobText = new Blob([plainTextContent], { type: typeText });
        const data = [new ClipboardItem({ [typeHtml]: blobHtml, [typeText]: blobText })];
        await navigator.clipboard.write(data);
      } else {
        await navigator.clipboard.writeText(htmlContent);
      }
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2500);

      // Trigger soft celebratory confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (err) {
      console.error('Failed to copy rich text:', err);
      // Fallback
      navigator.clipboard.writeText(htmlContent);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2500);
    }
  };

  const handleCopyPlainText = async () => {
    await navigator.clipboard.writeText(plainTextContent);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleOpenMailto = () => {
    const presentAttendees = mom.qaTasks
      .filter((q) => !q.isOnLeave)
      .map((q) => q.qaName)
      .join(', ');
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(plainTextContent)}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleMarkSent = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    alert(`🎉 MOM Report for ${mom.dateFormatted} marked as SENT!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">MOM Email Report Compiler</h2>
              <p className="text-xs text-slate-400">{subjectLine}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sender customization strip */}
        <div className="bg-slate-950/70 border-b border-slate-800/80 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sender Name:</span>
            <input
              type="text"
              value={mom.senderName || ''}
              onChange={(e) => onUpdateMOM({ senderName: e.target.value })}
              placeholder="e.g. RAKHI DAS"
              className="bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Title / Signature:</span>
            <input
              type="text"
              value={mom.senderTitle || ''}
              onChange={(e) => onUpdateMOM({ senderTitle: e.target.value })}
              placeholder="Executive || Quality Assurance"
              className="bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500 w-64"
            />
          </div>

          {/* Tab Switchers */}
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('visual')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium text-xs transition-colors ${
                activeTab === 'visual'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Gmail Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium text-xs transition-colors ${
                activeTab === 'code'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>HTML</span>
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium text-xs transition-colors ${
                activeTab === 'text'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Plain Text</span>
            </button>
          </div>
        </div>

        {/* Modal Body / Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {activeTab === 'visual' && (
            <div className="bg-white text-slate-900 rounded-xl p-6 shadow-inner min-h-[400px]">
              <div className="border-b border-slate-200 pb-3 mb-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Subject</span>
                  <p className="font-bold text-slate-900 text-base">{subjectLine}</p>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full">
                  Gmail Ready
                </span>
              </div>

              {/* Rendered HTML */}
              <div
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                className="prose prose-sm max-w-none text-slate-900"
              />
            </div>
          )}

          {activeTab === 'code' && (
            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed max-h-[450px]">
              {htmlContent}
            </pre>
          )}

          {activeTab === 'text' && (
            <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap overflow-x-auto border border-slate-800 leading-relaxed max-h-[450px]">
              {plainTextContent}
            </pre>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Click <strong>Copy Rich HTML</strong> then paste directly into Gmail compose window!</span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleCopyPlainText}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Copied Text!' : 'Copy Slack Text'}</span>
            </button>

            <button
              onClick={handleOpenMailto}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-900/40 hover:bg-blue-900/60 text-blue-300 border border-blue-700/50 transition-all"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Open Mail Client</span>
            </button>

            <button
              onClick={handleCopyRichHTML}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all"
            >
              {copiedHtml ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
              <span>{copiedHtml ? 'Copied to Clipboard!' : 'Copy Rich HTML (For Gmail)'}</span>
            </button>

            <button
              onClick={handleMarkSent}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              <span>Mark Sent</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
