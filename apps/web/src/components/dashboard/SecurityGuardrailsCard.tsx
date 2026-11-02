import React from 'react';
import { Shield, Lock, Eye, AlertOctagon } from 'lucide-react';

export const SecurityGuardrailsCard: React.FC = () => {
  return (
    <div className="p-6 rounded-xl border border-cyber-border bg-gradient-to-br from-cyber-850/60 to-cyber-900/60 backdrop-blur space-y-4">
      <div className="flex items-center space-x-2 border-b border-cyber-border pb-3">
        <Shield className="w-4 h-4 text-emerald-400" />
        <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
          Security Guardrails & Ethical Compliance
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="space-y-1.5 p-3 rounded-lg bg-cyber-900/40 border border-cyber-border">
          <div className="flex items-center space-x-1.5 text-slate-200 font-semibold font-mono">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Strict Scope Boundaries</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Requests outside verified target domains and declared paths are blocked automatically. Uncontrolled crawl redirect destinations are rejected.
          </p>
        </div>

        <div className="space-y-1.5 p-3 rounded-lg bg-cyber-900/40 border border-cyber-border">
          <div className="flex items-center space-x-1.5 text-slate-200 font-semibold font-mono">
            <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
            <span>SSRF & Cloud Defense</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Localhost, private IPv4/IPv6 RFC subnets, and cloud instance metadata (169.254.169.254) are forbidden targets by default.
          </p>
        </div>

        <div className="space-y-1.5 p-3 rounded-lg bg-cyber-900/40 border border-cyber-border">
          <div className="flex items-center space-x-1.5 text-slate-200 font-semibold font-mono">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>Evidence-Backed AI</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            The platform strictly distinguishes scanner evidence from AI interpretation. AI reasoning never fabricates unverified vulnerabilities.
          </p>
        </div>
      </div>
    </div>
  );
};
