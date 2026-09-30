import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Server, 
  Database, 
  Radio, 
  HardDrive, 
  Lock, 
  UserCheck, 
  LogOut, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSystemInfo, getHealthStatus, getReadinessStatus, getApiV1Status, SystemInfo, ReadinessStatus, ApiV1Status } from '../lib/api';

export const Phase1FoundationShell: React.FC = () => {
  const { currentUser, signIn, signOut, getIdToken } = useAuth();
  
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [health, setHealth] = useState<{ status: string } | null>(null);
  const [readiness, setReadiness] = useState<ReadinessStatus | null>(null);
  const [apiV1, setApiV1] = useState<ApiV1Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');
  const [testOutput, setTestOutput] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const [sys, h, r, v1] = await Promise.all([
        getSystemInfo().catch(e => ({ name: 'JANSETU', service: 'Error', version: '0.1.0', status: 'error' })),
        getHealthStatus().catch(e => ({ status: 'unreachable' })),
        getReadinessStatus().catch(e => ({ status: 'not_ready' as const, services: { bigquery: 'error' as const, pubsub: 'error' as const, storage: 'error' as const } })),
        getApiV1Status().catch(e => ({ version: 'v1', status: 'error', phase: 'Unknown', modules: [] }))
      ]);
      setSystemInfo(sys);
      setHealth(h);
      setReadiness(r);
      setApiV1(v1);
      setLastCheckTime(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const handleTestProbe = async (type: 'healthz' | 'readyz' | 'version') => {
    if (type === 'healthz') {
      const res = await getHealthStatus();
      setTestOutput(JSON.stringify(res, null, 2));
    } else if (type === 'readyz') {
      const res = await getReadinessStatus();
      setTestOutput(JSON.stringify(res, null, 2));
    } else {
      const res = await getApiV1Status();
      setTestOutput(JSON.stringify(res, null, 2));
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Foundation Header Card */}
      <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-orange-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded border border-orange-500/30">
                PHASE 1 FOUNDATION
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                REGION: ASIA-SOUTH1 (MUMBAI)
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-[#FF6500]" />
              JANSETU
            </h1>
            <p className="text-sm font-semibold text-slate-300">
              AI Civic Infrastructure Intelligence Grid
            </p>
            <p className="text-xs text-slate-400 italic mt-0.5">
              “Every Voice. Every Gap. One Intelligence Layer.”
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E3E62] hover:bg-[#2b588c] text-white text-xs font-semibold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Status Dashboard (Acceptance Criteria 13) */}
      <div className="glass-panel rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#1E3E62]/60 pb-3">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            System Status & Dependency Readiness
          </h2>
          <span className="text-[11px] font-mono text-slate-400">
            Last Checked: {lastCheckTime || 'Initializing...'}
          </span>
        </div>

        {/* 3 Core Status Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Backend Connectivity */}
          <div className="p-4 bg-[#070F1E] rounded-xl border border-[#1E3E62] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Backend Liveness
              </span>
              <span className="text-sm font-bold text-white mt-0.5 block">
                FastAPI Engine
              </span>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded ${
                health?.status === 'ok' 
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40' 
                  : 'bg-red-950/60 text-red-300 border border-red-800/40'
              }`}>
                <span className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                {health?.status === 'ok' ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Authentication State */}
          <div className="p-4 bg-[#070F1E] rounded-xl border border-[#1E3E62] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Authentication
              </span>
              <span className="text-sm font-bold text-white mt-0.5 block">
                Firebase Identity
              </span>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                <Lock className="w-3 h-3 text-purple-400" />
                Ready
              </span>
            </div>
          </div>

          {/* Cloud Readiness */}
          <div className="p-4 bg-[#070F1E] rounded-xl border border-[#1E3E62] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Cloud Services
              </span>
              <span className="text-sm font-bold text-white mt-0.5 block">
                GCP Dependencies
              </span>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded ${
                readiness?.status === 'ready'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                  : 'bg-yellow-950/60 text-yellow-300 border border-yellow-800/40'
              }`}>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {readiness?.status === 'ready' ? 'Configured' : 'Degraded'}
              </span>
            </div>
          </div>
        </div>

        {/* Granular Cloud Services Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* BigQuery */}
          <div className="p-3.5 bg-[#0B192C] rounded-lg border border-[#1E3E62] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-xs font-bold text-white block">BigQuery Warehouse</span>
                <span className="text-[10px] text-slate-400 font-mono">Dataset: jansetu_intel</span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/40">
              {readiness?.services.bigquery === 'ok' ? 'OK' : 'ERROR'}
            </span>
          </div>

          {/* Pub/Sub */}
          <div className="p-3.5 bg-[#0B192C] rounded-lg border border-[#1E3E62] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Radio className="w-4 h-4 text-orange-400" />
              <div>
                <span className="text-xs font-bold text-white block">Cloud Pub/Sub</span>
                <span className="text-[10px] text-slate-400 font-mono">citizen-requests-raw</span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-orange-950/60 text-orange-300 px-2 py-0.5 rounded border border-orange-800/40">
              {readiness?.services.pubsub === 'ok' ? 'OK' : 'ERROR'}
            </span>
          </div>

          {/* Cloud Storage */}
          <div className="p-3.5 bg-[#0B192C] rounded-lg border border-[#1E3E62] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-white block">Cloud Storage</span>
                <span className="text-[10px] text-slate-400 font-mono">jansetu-citizen-audio</span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/40">
              {readiness?.services.storage === 'ok' ? 'OK' : 'ERROR'}
            </span>
          </div>
        </div>
      </div>

      {/* Authentication State & Role Switching Panel (Acceptance Criteria 14) */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E3E62]/60 pb-3">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-purple-400" />
            Firebase Authentication State
          </h2>
          <span className="text-[11px] font-mono text-purple-300 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-800/40">
            ZERO TRUST ID TOKEN ATTACHED
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-[#070F1E] rounded-xl border border-[#1E3E62]">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Active Identity</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-bold text-white">
                {currentUser ? currentUser.displayName : 'Guest User (Unauthenticated)'}
              </span>
              {currentUser && (
                <span className="text-[10px] font-mono uppercase font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                  ROLE: {currentUser.role}
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {currentUser ? currentUser.email : 'No bearer token attached to API requests'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!currentUser ? (
              <>
                <button
                  onClick={() => signIn('citizen')}
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition-all"
                >
                  Citizen
                </button>
                <button
                  onClick={() => signIn('analyst')}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-all"
                >
                  Policy Analyst
                </button>
                <button
                  onClick={() => signIn('administrator')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all"
                >
                  Admin
                </button>
              </>
            ) : (
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800/50 text-red-200 text-xs font-semibold transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Infrastructure Probe Tester */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Live Endpoint Diagnostics Probe
        </h2>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleTestProbe('healthz')}
            className="px-3 py-1.5 rounded-lg bg-[#070F1E] border border-[#1E3E62] hover:border-emerald-500 text-slate-200 text-xs font-mono font-semibold transition-all"
          >
            Probe /healthz
          </button>
          <button
            onClick={() => handleTestProbe('readyz')}
            className="px-3 py-1.5 rounded-lg bg-[#070F1E] border border-[#1E3E62] hover:border-cyan-500 text-slate-200 text-xs font-mono font-semibold transition-all"
          >
            Probe /readyz
          </button>
          <button
            onClick={() => handleTestProbe('version')}
            className="px-3 py-1.5 rounded-lg bg-[#070F1E] border border-[#1E3E62] hover:border-purple-500 text-slate-200 text-xs font-mono font-semibold transition-all"
          >
            Probe /api/v1/version
          </button>
        </div>

        {testOutput && (
          <div className="p-4 bg-[#070F1E] rounded-xl border border-[#1E3E62] font-mono text-xs text-emerald-300">
            <span className="text-[10px] text-slate-500 block mb-1 uppercase font-semibold">Live Probe Response Payload:</span>
            <pre className="overflow-x-auto">{testOutput}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
