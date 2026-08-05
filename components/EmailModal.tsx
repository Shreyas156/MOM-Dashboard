'use client';

import React, { useState } from 'react';
import { DailyMOM, EmailSettings } from '@/lib/types';
import { generateHTMLEmail, generatePlainTextEmail } from '@/lib/emailGenerator';
import { X, Copy, Check, Send, Sparkles, FileText, Code, Mail, Settings2, Key, AlertCircle, ExternalLink } from 'lucide-react';
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

  // Email Configuration state
  const [showConfig, setShowConfig] = useState(true);
  const [toEmails, setToEmails] = useState(mom.emailSettings?.toEmails || 'sukanya@company.com');
  const [ccEmails, setCcEmails] = useState(mom.emailSettings?.ccEmails || 'qa-team@company.com');
  const [bccEmails, setBccEmails] = useState(mom.emailSettings?.bccEmails || '');
  const [fromEmail, setFromEmail] = useState(mom.emailSettings?.fromEmail || 'rakhi.das@company.com');
  const [smtpUser, setSmtpUser] = useState(mom.emailSettings?.smtpUser || '');
  const [smtpPass, setSmtpPass] = useState(mom.emailSettings?.smtpPass || '');

  // Direct sending state
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const htmlContent = generateHTMLEmail(mom);
  const plainTextContent = generatePlainTextEmail(mom);
  const subjectLine = `MOM of QA Stand up on ${mom.dateFormatted}`;

  const saveSettings = () => {
    const newSettings: EmailSettings = {
      toEmails,
      ccEmails,
      bccEmails,
      fromEmail,
      smtpUser,
      smtpPass,
    };
    onUpdateMOM({ emailSettings: newSettings });
  };

  const handleCopyRichHTML = async () => {
    saveSettings();
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

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (err) {
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

  // Open Gmail Compose with To, CC, Subject prefilled
  const handleOpenGmailCompose = () => {
    saveSettings();
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      toEmails
    )}&cc=${encodeURIComponent(ccEmails)}&bcc=${encodeURIComponent(bccEmails)}&su=${encodeURIComponent(
      subjectLine
    )}&body=${encodeURIComponent(plainTextContent)}`;

    window.open(gmailUrl, '_blank');
  };

  // Direct Send via server SMTP
  const handleDirectSend = async () => {
    saveSettings();
    setIsSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toEmails,
          cc: ccEmails,
          bcc: bccEmails,
          subject: subjectLine,
          htmlText: htmlContent,
          plainText: plainTextContent,
          smtpUser: smtpUser || fromEmail,
          smtpPass,
        }),
      });

      const json = await res.json();
      setIsSending(false);

      if (json.success) {
        setSendResult({ success: true, message: json.message });
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        setSendResult({ success: false, message: json.error || 'Failed to send email' });
      }
    } catch (err) {
      setIsSending(false);
      setSendResult({ success: false, message: (err as Error).message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">MOM Email Dispatcher & Recipient Config</h2>
              <p className="text-xs text-slate-400">{subjectLine}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                showConfig ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{showConfig ? 'Hide Recipients Panel' : 'Edit Recipients (To/CC)'}</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Recipient & Sender Account Configuration Panel */}
        {showConfig && (
          <div className="bg-slate-950 p-4 border-b border-slate-800 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Configure Recipients & Sender Account
              </span>
              <span className="text-[11px] text-slate-400">Values are saved automatically</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">To Email(s):</label>
                <input
                  type="text"
                  value={toEmails}
                  onChange={(e) => setToEmails(e.target.value)}
                  placeholder="sukanya@company.com, manager@company.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">CC Email(s):</label>
                <input
                  type="text"
                  value={ccEmails}
                  onChange={(e) => setCcEmails(e.target.value)}
                  placeholder="qa-team@company.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">BCC Email(s):</label>
                <input
                  type="text"
                  value={bccEmails}
                  onChange={(e) => setBccEmails(e.target.value)}
                  placeholder="archive@company.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 border-t border-slate-800/60">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">From Account (Sender Name):</label>
                <input
                  type="text"
                  value={mom.senderName || ''}
                  onChange={(e) => onUpdateMOM({ senderName: e.target.value })}
                  placeholder="RAKHI DAS"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Sender Email / Username:</label>
                <input
                  type="email"
                  value={smtpUser || fromEmail}
                  onChange={(e) => {
                    setSmtpUser(e.target.value);
                    setFromEmail(e.target.value);
                  }}
                  placeholder="rakhi.das@company.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Gmail App Password (For Direct Send):</span>
                  <Key className="w-3 h-3 text-amber-400" />
                </label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="16-character App Password"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab Switchers */}
        <div className="bg-slate-950 px-6 py-2 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">View Format:</span>
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
                <span>HTML Code</span>
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

          <div className="text-xs text-slate-400 flex items-center gap-1">
            <span>To: <strong className="text-emerald-400">{toEmails || 'Not set'}</strong></span>
            {ccEmails && <span className="ml-2">CC: <strong className="text-slate-300">{ccEmails}</strong></span>}
          </div>
        </div>

        {/* Modal Body / Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {sendResult && (
            <div className={`p-3 rounded-xl mb-4 border flex items-center gap-2 text-xs font-semibold ${
              sendResult.success
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{sendResult.message}</span>
            </div>
          )}

          {activeTab === 'visual' && (
            <div className="bg-white text-slate-900 rounded-xl p-6 shadow-inner min-h-[400px]">
              <div className="border-b border-slate-200 pb-3 mb-4 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900 text-base">{subjectLine}</p>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full">
                    Gmail Styled
                  </span>
                </div>
                <div className="text-xs text-slate-500 space-y-0.5 font-mono">
                  <p><strong>To:</strong> {toEmails}</p>
                  {ccEmails && <p><strong>CC:</strong> {ccEmails}</p>}
                  {bccEmails && <p><strong>BCC:</strong> {bccEmails}</p>}
                </div>
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
            <span>Choose how you want to send the email below:</span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleCopyPlainText}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Copied Text!' : 'Copy Slack Text'}</span>
            </button>

            {/* Method 1: Open in Gmail Compose Window */}
            <button
              onClick={handleOpenGmailCompose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              title="Opens Gmail in your browser with To, CC, Subject pre-filled"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in Gmail Compose</span>
            </button>

            {/* Method 2: Copy Rich HTML */}
            <button
              onClick={handleCopyRichHTML}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              {copiedHtml ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
              <span>{copiedHtml ? 'Copied HTML!' : 'Copy Rich HTML'}</span>
            </button>

            {/* Method 3: Direct Server Send */}
            <button
              onClick={handleDirectSend}
              disabled={isSending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Sending...' : 'Direct Send Email'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
