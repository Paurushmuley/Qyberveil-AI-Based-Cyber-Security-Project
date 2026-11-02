import React from 'react';
import { PlusCircle, Sliders, Radar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const QuickActionsCard: React.FC = () => {
  return (
    <div className="p-6 rounded-xl border border-cyber-border bg-cyber-850/50 backdrop-blur space-y-4">
      <div className="flex items-center justify-between border-b border-cyber-border pb-3">
        <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
          Security Operations
        </h2>
        <span className="text-xs text-slate-400">Quick Access</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          to="/projects"
          className="group p-4 rounded-lg border border-cyber-border hover:border-cyan-500/50 bg-cyber-900/40 hover:bg-cyber-900/80 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <PlusCircle className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-white">Register Target</p>
            <p className="text-xs text-slate-400 mt-0.5">Authorize web app or REST API</p>
          </div>
        </Link>

        <Link
          to="/scans"
          className="group p-4 rounded-lg border border-cyber-border hover:border-cyan-500/50 bg-cyber-900/40 hover:bg-cyber-900/80 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <Radar className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 transition-colors" />
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-white">Launch Scan</p>
            <p className="text-xs text-slate-400 mt-0.5">Run baseline or API assessment</p>
          </div>
        </Link>

        <Link
          to="/settings/ai"
          className="group p-4 rounded-lg border border-cyber-border hover:border-cyan-500/50 bg-cyber-900/40 hover:bg-cyber-900/80 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <Sliders className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-white">Configure AI</p>
            <p className="text-xs text-slate-400 mt-0.5">OpenAI, Gemini, Grok or Ollama</p>
          </div>
        </Link>
      </div>
    </div>
  );
};
