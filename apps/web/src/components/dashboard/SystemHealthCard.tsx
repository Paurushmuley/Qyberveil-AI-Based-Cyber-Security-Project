import React from 'react';
import { Database, Server, Clock, Cpu } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

export const SystemHealthCard: React.FC = () => {
  const { data: health, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: api.getHealth,
    refetchInterval: 10000,
  });

  const dbConnected = health?.services?.database?.status === 'connected';
  const redisConnected = health?.services?.redis?.status === 'connected';

  return (
    <div className="p-6 rounded-xl border border-cyber-border bg-cyber-850/50 backdrop-blur space-y-4">
      <div className="flex items-center justify-between border-b border-cyber-border pb-3">
        <div className="flex items-center space-x-2">
          <Server className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
            Platform Infrastructure
          </h2>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          Node {health?.environment ?? 'development'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Database Node */}
        <div className="p-3 rounded-lg border border-cyber-border bg-cyber-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-md ${dbConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <Database className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-200">PostgreSQL DB</p>
              <p className="text-[11px] text-slate-400 font-mono">
                {isLoading ? 'Checking...' : dbConnected ? `${health?.services.database.latencyMs ?? 1}ms latency` : 'Standby / Inactive'}
              </p>
            </div>
          </div>
          <span className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-500'}`} />
        </div>

        {/* Redis / Queue Node */}
        <div className="p-3 rounded-lg border border-cyber-border bg-cyber-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-md ${redisConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-200">Redis & BullMQ</p>
              <p className="text-[11px] text-slate-400 font-mono">
                {isLoading ? 'Checking...' : redisConnected ? `${health?.services.redis.latencyMs ?? 1}ms latency` : 'Standby (Docker)'}
              </p>
            </div>
          </div>
          <span className={`w-2 h-2 rounded-full ${redisConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        </div>

        {/* Core API Server */}
        <div className="p-3 rounded-lg border border-cyber-border bg-cyber-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-md bg-cyan-500/10 text-cyan-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-200">API Uptime</p>
              <p className="text-[11px] text-slate-400 font-mono">
                {health?.uptimeSeconds ? `${health.uptimeSeconds}s active` : 'Active'}
              </p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
        </div>
      </div>
    </div>
  );
};
