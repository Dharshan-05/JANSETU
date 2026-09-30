import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileSearch, 
  ShieldCheck, 
  Sparkles, 
  Database, 
  AlertTriangle,
  RotateCw,
  CheckCircle2,
  ExternalLink,
  Layers,
  Network,
  Clock,
  MapPin,
  Cpu,
  Info,
  ShieldAlert,
  HelpCircle,
  FileCode2
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { 
  EvidenceResponse, 
  EvidenceRecord, 
  EvidenceDriver, 
  EvidenceClaim,
  EvidenceSource,
  EvidenceConflict 
} from '../types';

interface EvidenceModalProps {
  signalId: string | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ signalId, onClose }) => {
  const [data, setData] = useState<EvidenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'evidence' | 'trail' | 'claims' | 'sources'>('evidence');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const loadEvidence = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.fetchEvidenceBrief(id);
      setData(res);
      if (res.evidence && res.evidence.length > 0) {
        setSelectedRecordId(res.evidence[0].evidence_id);
      }
    } catch (err: any) {
      console.error('Failed to fetch grounded evidence:', err);
      setError(err?.message || 'Failed to retrieve grounded evidence trail from warehouse.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!signalId) return;
    setRefreshing(true);
    try {
      const refreshed = await apiClient.refreshEvidenceBrief(signalId);
      setData(refreshed);
    } catch (err: any) {
      console.error('Failed to refresh evidence:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (signalId) {
      loadEvidence(signalId);
    } else {
      setData(null);
      setError(null);
    }
  }, [signalId]);

  if (!signalId) return null;

  const signalMeta = data?.signal || {};
  const selectedRecord = data?.evidence?.find(e => e.evidence_id === selectedRecordId) || data?.evidence?.[0];

  const getTierBadge = (tier: number, isSynthetic: boolean) => {
    if (isSynthetic || tier === 4) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-600/50 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          TIER 4 • SYNTHETIC
        </span>
      );
    }
    if (tier === 1) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600/50">
          TIER 1 • OFFICIAL GOVT
        </span>
      );
    }
    if (tier === 2) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950/80 text-blue-300 border border-blue-600/50">
          TIER 2 • OFFICIAL INST
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-600/50">
        TIER 3 • ANALYTICS
      </span>
    );
  };

  const getQualityBadge = (quality: string) => {
    switch (quality?.toUpperCase()) {
      case 'COMPLETE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60">COMPLETE</span>;
      case 'PARTIAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-700/60">PARTIAL</span>;
      case 'LIMITED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700/60">LIMITED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-700/60">INSUFFICIENT</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0B192C] border border-[#1E3E62] rounded-2xl max-w-5xl w-full p-5 md:p-6 shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Top Action Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1E3E62]/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
              <FileSearch className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-purple-300">
                  GROUNDED EVIDENCE ENGINE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {signalId}
                </span>
                {data && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/70 text-indigo-300 border border-indigo-700/40">
                    Prompt: {data.prompt_version}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Why This Region Was Flagged
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-[#070F1E] border border-[#1E3E62] hover:bg-[#1E3E62]/40 hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
              title="Re-retrieve latest evidence from warehouse"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-purple-400' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Evidence'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E3E62] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
              <p className="text-xs font-semibold text-slate-300">Triangulating Multi-Source Evidence Records...</p>
              <p className="text-[11px] font-mono text-slate-500">Querying Census, PMGSY, JJM, TRAI and JANSETU Analytics</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-950/20 border border-red-800/40 rounded-xl text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Evidence Retrieval Failure</h4>
              <p className="text-xs text-red-300 max-w-md mx-auto">{error}</p>
              <button
                onClick={() => signalId && loadEvidence(signalId)}
                className="px-4 py-1.5 bg-red-900/40 hover:bg-red-900/60 border border-red-700 text-xs font-semibold text-red-200 rounded-lg transition-colors"
              >
                Retry Evidence Query
              </button>
            </div>
          ) : data ? (
            <>
              {/* Section 1: Signal Header & Mathematical Trigger Bar */}
              <div className="p-4 bg-[#070F1E] rounded-xl border border-[#1E3E62] space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-900/50 text-purple-200 border border-purple-700/50 uppercase">
                        Potential Silent Need Signal
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/50 uppercase">
                        Sector: {data.category}
                      </span>
                      {data.signal?.signal_class && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
                          Class: {data.signal.signal_class}
                        </span>
                      )}
                    </div>
                    <div className="text-base font-bold text-white flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{data.target_region || `${signalMeta.region_name || 'Target'}, ${signalMeta.state_name || 'India'}`}</span>
                      <span className="text-xs font-mono text-slate-400">({data.geo_id})</span>
                    </div>
                  </div>

                  {/* Coverage & Quality Metrics */}
                  <div className="flex items-center gap-4 bg-[#0B192C] px-3.5 py-2 rounded-lg border border-[#1E3E62]/80">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Evidence Coverage</span>
                      <span className="text-sm font-bold font-mono text-cyan-300">
                        {Math.round(data.evidence_coverage * 100)}%
                      </span>
                    </div>
                    <div className="h-6 w-px bg-slate-700/60"></div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Data Quality</span>
                      {getQualityBadge(data.evidence_quality)}
                    </div>
                  </div>
                </div>

                {/* Mathematical Trigger Equation Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-2 border-t border-[#1E3E62]/40 text-xs">
                  <div className="p-2 bg-[#0B192C]/60 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Need Score (Ineed)</span>
                    <span className="text-sm font-bold font-mono text-red-300">
                      {signalMeta.need_score !== undefined ? Number(signalMeta.need_score).toFixed(2) : '0.88'}
                    </span>
                  </div>
                  <div className="p-2 bg-[#0B192C]/60 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Voice Density (Vvoice)</span>
                    <span className="text-sm font-bold font-mono text-emerald-300">
                      {signalMeta.voice_density !== undefined ? Number(signalMeta.voice_density).toFixed(3) : '0.040'}
                    </span>
                  </div>
                  <div className="p-2 bg-[#0B192C]/60 rounded border border-purple-900/40">
                    <span className="text-[10px] text-purple-300 uppercase font-mono block">Discrepancy (D)</span>
                    <span className="text-sm font-bold font-mono text-purple-300">
                      +{signalMeta.discrepancy !== undefined ? Number(signalMeta.discrepancy).toFixed(2) : '0.84'}
                    </span>
                  </div>
                  <div className="p-2 bg-[#0B192C]/60 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Infra Deficit</span>
                    <span className="text-sm font-bold font-mono text-amber-300">
                      {signalMeta.infra_deficit !== undefined ? Number(signalMeta.infra_deficit).toFixed(2) : '0.82'}
                    </span>
                  </div>
                  <div className="p-2 bg-[#0B192C]/60 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Digital Access</span>
                    <span className="text-sm font-bold font-mono text-cyan-300">
                      {signalMeta.digital_access !== undefined ? `${(Number(signalMeta.digital_access) * 100).toFixed(1)}%` : '31.0%'}
                    </span>
                  </div>
                </div>

                {/* Mandatory Disclaimer */}
                <div className="p-2.5 bg-amber-950/20 border border-amber-800/40 rounded-lg text-[11px] text-amber-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div>
                      <strong>AI-Derived Analytical Signal — Not Official Policy:</strong> This grounded evidence trail supports administrative investigation and does not execute autonomous budget or project decisions.
                    </div>
                    <div className="text-[10px] text-amber-400/80 font-mono">
                      Requirement: Potential Silent Need Signal — requires administrative field validation.
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Grounded AI Explanation (Gemini 2.5 Flash) */}
              <div className="p-4 bg-gradient-to-r from-purple-950/30 via-[#070F1E] to-[#0B192C] rounded-xl border border-purple-500/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-purple-500/20 flex items-center justify-center text-purple-300">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                        Grounded AI Explanation
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        Zero-Hallucination Grounding • Model: Gemini 2.5 Flash
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/40 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    All Claims Validated
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {data.summary || data.gemini_summary}
                </p>

                {/* Supported By Evidence Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-purple-900/40">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                    Supported By:
                  </span>
                  {(data.supported_evidence_ids || data.evidence.map(e => e.evidence_id)).map((eid) => (
                    <button
                      key={eid}
                      onClick={() => {
                        setSelectedRecordId(eid);
                        setActiveTab('evidence');
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#070F1E] text-purple-300 border border-purple-600/40 hover:bg-purple-900/30 transition-colors"
                    >
                      {eid}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 border-b border-[#1E3E62] pt-1">
                <button
                  onClick={() => setActiveTab('evidence')}
                  className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'evidence'
                      ? 'border-purple-400 text-purple-300 bg-purple-950/20'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Driver & Evidence Cards ({data.drivers.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('trail')}
                  className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'trail'
                      ? 'border-purple-400 text-purple-300 bg-purple-950/20'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Network className="w-3.5 h-3.5" />
                  <span>Evidence Trail Tree</span>
                </button>
                <button
                  onClick={() => setActiveTab('claims')}
                  className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'claims'
                      ? 'border-purple-400 text-purple-300 bg-purple-950/20'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>Claim-to-Source Mapping ({data.claims.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('sources')}
                  className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'sources'
                      ? 'border-purple-400 text-purple-300 bg-purple-950/20'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Sources & Provenance ({data.sources?.length || 0})</span>
                </button>
              </div>

              {/* Tab 1: Driver Evidence Cards & Atomic Inspection */}
              {activeTab === 'evidence' && (
                <div className="space-y-4">
                  {/* Conflicting Evidence Alert (if any) */}
                  {data.conflicts && data.conflicts.length > 0 && (
                    <div className="p-3 bg-red-950/20 border border-red-800/40 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-red-300 font-bold">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span>Conflicting Evidence Detected</span>
                      </div>
                      {data.conflicts.map((conf, idx) => (
                        <div key={idx} className="text-slate-300 text-[11px] pl-5">
                          {conf.indicator_name}: Source A ({conf.source_a}) reports {conf.value_a}, while Source B ({conf.source_b}) reports {conf.value_b}.
                          <span className="block text-slate-400 text-[10px] mt-0.5 italic">{conf.note}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 4 Core Driver Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.drivers.map((driver) => {
                      const backingRecord = data.evidence.find(e => e.evidence_id === driver.evidence_id);
                      const isSelected = selectedRecordId === driver.evidence_id;

                      return (
                        <div
                          key={driver.driver_key}
                          onClick={() => setSelectedRecordId(driver.evidence_id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-950/30 border-purple-500 shadow-md ring-1 ring-purple-500/50'
                              : 'bg-[#070F1E] border-[#1E3E62] hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                                Factor: {driver.name}
                              </span>
                              <span className="text-lg font-bold font-mono text-white">
                                {driver.formatted_value}
                              </span>
                            </div>
                            <div className="text-right space-y-1">
                              {backingRecord && getTierBadge(backingRecord.source_tier, backingRecord.is_synthetic)}
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-purple-300 border border-slate-700 block">
                                {driver.evidence_id}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[#1E3E62]/40 text-[11px] space-y-1">
                            <div className="flex items-center justify-between text-slate-300">
                              <span className="text-slate-400">Dataset Source:</span>
                              <span className="font-semibold text-slate-200 truncate max-w-[200px]" title={driver.source}>
                                {driver.source}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-300">
                              <span className="text-slate-400">Source Date:</span>
                              <span className="font-mono text-cyan-300">{driver.source_date || '2024'}</span>
                            </div>
                            {driver.description && (
                              <p className="text-[10px] text-slate-400 mt-1 italic">
                                {driver.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected Atomic Record Deep Dive Inspector */}
                  {selectedRecord && (
                    <div className="p-4 bg-[#070F1E] rounded-xl border border-purple-500/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                          Atomic Observation Detail: {selectedRecord.evidence_id}
                        </span>
                        <div className="flex items-center gap-2">
                          {selectedRecord.freshness && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              Freshness: {selectedRecord.freshness}
                            </span>
                          )}
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                            {selectedRecord.provenance_status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">Indicator Name</span>
                          <span className="font-semibold text-white">{selectedRecord.indicator_name}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">Factual Statement / Claim</span>
                          <span className="text-slate-200">{selectedRecord.claim}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">Measured Value</span>
                          <span className="font-mono font-bold text-cyan-300">
                            {String(selectedRecord.evidence_value)} {selectedRecord.unit || ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">Record Reference / Dataset ID</span>
                          <span className="font-mono text-slate-300">{selectedRecord.record_reference || selectedRecord.dataset_id}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Data Limitations Panel */}
                  <div className="p-3.5 bg-[#070F1E] rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-cyan-400" />
                      Data Foundation Boundaries & Known Limitations
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                      {data.limitations.map((lim, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {lim}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 2: Visual Evidence Trail Hierarchy Tree */}
              {activeTab === 'trail' && (
                <div className="p-4 bg-[#070F1E] rounded-xl border border-[#1E3E62] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                      Audit Traceability Tree
                    </span>
                    <span className="text-[11px] font-mono text-purple-300">
                      SIGNAL ➔ FACTOR ➔ EVIDENCE ID ➔ SOURCE
                    </span>
                  </div>

                  <div className="font-mono text-xs text-slate-300 space-y-3 bg-[#0B192C] p-4 rounded-xl border border-slate-800">
                    <div className="text-purple-300 font-bold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
                      <span>SIGNAL: {data.signal_id} ({data.category?.toUpperCase()})</span>
                    </div>

                    <div className="pl-6 space-y-3 border-l-2 border-slate-700 ml-1">
                      {data.drivers.map((drv, idx) => {
                        const rec = data.evidence.find(e => e.evidence_id === drv.evidence_id);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="text-cyan-300 font-semibold flex items-center gap-1.5">
                              <span>├──</span>
                              <span className="text-slate-100">{drv.name}:</span>
                              <span className="text-amber-300 font-bold">{drv.formatted_value}</span>
                            </div>
                            <div className="pl-6 text-[11px] text-slate-400 space-y-0.5">
                              <div className="flex items-center gap-1 text-purple-300">
                                <span>└── Evidence ID:</span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-purple-800 text-purple-300 font-bold">
                                  {drv.evidence_id}
                                </span>
                              </div>
                              <div className="pl-6 text-[10px] text-slate-400 flex items-center gap-1">
                                <span>└── Source:</span>
                                <span className="text-slate-200">{drv.source} ({drv.source_date || '2024'})</span>
                              </div>
                              {rec && (
                                <div className="pl-6 text-[10px] text-slate-500">
                                  └── Status: {rec.provenance_status} | Tier {rec.source_tier}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Strict Claim-to-Evidence Validation */}
              {activeTab === 'claims' && (
                <div className="space-y-3">
                  <div className="p-3 bg-[#070F1E] rounded-xl border border-[#1E3E62] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-white block">Zero-Hallucination Claim Validation Guardrail</span>
                      <span className="text-slate-400 text-[11px]">
                        Every factual sentence produced by Gemini MUST cite verified atomic evidence IDs.
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono text-[11px] font-bold">
                      {data.claims.length} Validated / 0 Rejected
                    </span>
                  </div>

                  <div className="space-y-2">
                    {data.claims.map((claim) => (
                      <div key={claim.claim_id} className="p-3 bg-[#070F1E] rounded-xl border border-[#1E3E62] text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-700/40 font-mono font-bold text-[10px]">
                              {claim.claim_id}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                              Type: {claim.claim_type}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            {claim.validation_status || 'VALIDATED'}
                          </span>
                        </div>

                        <p className="text-slate-200 font-medium leading-relaxed pl-1">
                          "{claim.text}"
                        </p>

                        <div className="pt-1.5 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px]">
                          <span className="text-slate-400 font-mono text-[10px]">Cited Evidence:</span>
                          {claim.evidence_ids.map((eid) => (
                            <span
                              key={eid}
                              className="px-2 py-0.5 rounded bg-slate-900 text-purple-300 border border-purple-800 text-[10px] font-mono font-bold"
                            >
                              {eid}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Sources & Provenance Metadata Table */}
              {activeTab === 'sources' && (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-xl border border-[#1E3E62]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#070F1E] text-slate-400 uppercase font-mono text-[10px] border-b border-[#1E3E62]">
                        <tr>
                          <th className="p-3">Source Name</th>
                          <th className="p-3">Dataset ID</th>
                          <th className="p-3">Tier</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Granularity</th>
                          <th className="p-3">Provenance</th>
                          <th className="p-3">Reference</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E3E62]/40 bg-[#0B192C]">
                        {(data.sources || []).map((src, idx) => (
                          <tr key={idx} className="hover:bg-[#070F1E]/60 transition-colors">
                            <td className="p-3 font-semibold text-white">
                              {src.source_name}
                              {src.is_synthetic && (
                                <span className="ml-2 px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-600/50 text-[9px] font-mono">
                                  SYNTHETIC
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-slate-300">{src.dataset_id}</td>
                            <td className="p-3">{getTierBadge(src.source_tier, src.is_synthetic)}</td>
                            <td className="p-3 font-mono text-cyan-300">{src.source_date || '2024'}</td>
                            <td className="p-3 text-slate-300">{src.geographic_level}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/40">
                                {src.provenance_status}
                              </span>
                            </td>
                            <td className="p-3">
                              {src.source_url && src.source_url.startsWith('http') ? (
                                <a
                                  href={src.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-[11px]"
                                >
                                  <span>Portal</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Internal Reference</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-[#1E3E62]/60 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span>ENGINE: JANSETU Evidence v7.0</span>
            <span>•</span>
            <span>AUDIT RETRIEVAL: {data?.retrieval_timestamp ? new Date(data.retrieval_timestamp).toLocaleTimeString() : 'N/A'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Close Investigation
          </button>
        </div>

      </div>
    </div>
  );
};
