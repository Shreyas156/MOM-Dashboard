'use client';

import React from 'react';
import { X, Cloud, ExternalLink, ShieldCheck, Database, Rocket, Copy, Check } from 'lucide-react';

interface DeploymentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeploymentGuideModal: React.FC<DeploymentGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedEnv, setCopiedEnv] = React.useState(false);

  if (!isOpen) return null;

  const envSample = `# Optional Cloud Database Connection (Supabase / Neon Postgres)
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres`;

  const copyEnv = () => {
    navigator.clipboard.writeText(envSample);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Shareable Link & Free Cloud Setup Guide</h2>
              <p className="text-xs text-slate-400">Deploy live for free so all QAs can access via web link</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {/* Option 1: Vercel 1-Click Free Deploy */}
          <div className="bg-gradient-to-r from-slate-950 to-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Step 1: Deploy Web Dashboard to Vercel / Render (100% Free)</h3>
            </div>
            <p className="leading-relaxed">
              This Next.js app is ready to deploy live to Vercel or Render. Once deployed, you get a free public HTTPS web link (e.g. <code className="bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded">https://mom-dashboard-qa.vercel.app</code>) to share with all QAs in your team!
            </p>
            <ol className="list-decimal list-inside space-y-1.5 font-mono text-[11px] text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <li>Push this project folder to GitHub / GitLab.</li>
              <li>Go to <a href="https://vercel.com/new" target="_blank" className="text-emerald-400 underline">Vercel.com/new</a> or Render.com.</li>
              <li>Select your repository and click <strong>Deploy</strong>.</li>
              <li>Copy the live deployed web link and send to your QA team!</li>
            </ol>
          </div>

          {/* Option 2: Shared Database */}
          <div className="bg-gradient-to-r from-slate-950 to-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm text-white">Step 2: Free Shared Cloud Database (Supabase / Neon)</h3>
              </div>
              <button
                onClick={copyEnv}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded text-[11px]"
              >
                {copiedEnv ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedEnv ? 'Copied!' : 'Copy .env snippet'}</span>
              </button>
            </div>
            <p className="leading-relaxed">
              By default, data saves in local storage and JSON files. For real-time multi-user cloud sync across all QAs, create a free database on <a href="https://supabase.com" target="_blank" className="text-purple-400 underline">Supabase.com</a> or <a href="https://neon.tech" target="_blank" className="text-purple-400 underline">Neon.tech</a> and set your environment variables:
            </p>
            <pre className="bg-slate-950 text-purple-300 p-3 rounded-lg text-[11px] font-mono border border-slate-800 overflow-x-auto">
              {envSample}
            </pre>
          </div>

          {/* Features highlight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-xs mb-1">Zero-Cost Infrastructure</h4>
                <p className="text-[11px] text-slate-400">Vercel and Supabase both offer 100% free tiers that cover team usage forever without a credit card.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-start gap-2.5">
              <ExternalLink className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-xs mb-1">Instant Share Link</h4>
                <p className="text-[11px] text-slate-400">Share your Vercel URL in your QA Slack channel or WhatsApp group for instant daily access.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
