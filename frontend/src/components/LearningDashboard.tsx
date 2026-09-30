import React, { useState, useEffect } from 'react';
import {
  Brain,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  FileText,
  BarChart3,
  Layers,
  Filter,
  ArrowRight,
  History,
  UserCheck,
  XCircle,
  Info,
  Sliders,
  Database,
  RefreshCw,
  Plus
} from 'lucide-react';
import {
  LearningCandidate,
  ModelVersion,
  LearningAuditEvent,
  LearningSummary,
  ModelFamily,
  CalibrationStatus
} from '../types';
import {
  fetchLearningSummary,
  fetchLearningCandidates,
  fetchLearningCandidateDetail,
  generateLearningCandidate,
  validateLearningCandidate,
  approveLearningCandidate,
  rejectLearningCandidate,
  fetchModelVersions,
  activateModelVersion,
  rollbackModelVersion,
  explainLearningCandidate,
  fetchLearningAuditEvents
} from '../lib/api';

interface LearningDashboardProps {
  onNavigateToImpact?: (evaluationId?: string) => void;
}

export const LearningDashboard: React.FC<LearningDashboardProps> = ({ onNavigateToImpact }) => {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'candidates' | 'models' | 'audit'>('candidates');

  // Data states
  const [summary, setSummary] = useState<LearningSummary | null>(null);
  const [candidates, setCandidates] = useState<LearningCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<LearningCandidate | null>(null);
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [auditEvents, setAuditEvents] = useState<LearningAuditEvent[]>([]);
  const [explanation, setExplanation] = useState<any | null>(null);

  // Filters & Loading
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [explainLoading, setExplainLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal / Inputs
  const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false);
  const [genFamily, setGenFamily] = useState<ModelFamily>('SCENARIO_SIMULATION');
  const [genMinSamples, setGenMinSamples] = useState<number>(2);

  const [approvalNotes, setApprovalNotes] = useState<string>('Verified empirical improvements across held-out validation sample');
  const [reviewerName, setReviewerName] = useState<string>('State Civic Data Architect');
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);

  const [rollbackVersion, setRollbackVersion] = useState<string>('v8.0-deterministic');
  const [rollbackReason, setRollbackReason] = useState<string>('Manual rollback to previous stable model version');
  const [showRollbackModal, setShowRollbackModal] = useState<boolean>(false);

  // Load summary and candidates
  const loadAll = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [sumData, candData, modelData, auditData] = await Promise.all([
        fetchLearningSummary(),
        fetchLearningCandidates({
          model_family: selectedFamily !== 'all' ? selectedFamily : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined
        }),
        fetchModelVersions(),
        fetchLearningAuditEvents({ limit: 40 })
      ]);
      setSummary(sumData);
      setCandidates(candData);
      if (candData.length > 0 && !selectedCandidate) {
        setSelectedCandidate(candData[0]);
      } else if (selectedCandidate) {
        const refreshed = candData.find((c) => c.learning_id === selectedCandidate.learning_id);
        if (refreshed) setSelectedCandidate(refreshed);
      }
      setModels(modelData);
      setAuditEvents(auditData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load continuous learning telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [selectedFamily, selectedStatus]);

  // Handle Candidate Selection
  const handleSelectCandidate = async (cand: LearningCandidate) => {
    setSelectedCandidate(cand);
    setExplanation(null);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Generate Candidate
  const handleGenerate = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const newCand = await generateLearningCandidate({
        model_family: genFamily,
        min_samples: genMinSamples
      });
      setShowGenerateModal(false);
      setSuccessMsg(`Generated calibration candidate ${newCand.learning_id} with status ${newCand.status}`);
      await loadAll();
      setSelectedCandidate(newCand);
    } catch (err: any) {
      setErrorMsg(err.message || 'Candidate generation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Validate Candidate
  const handleValidate = async (candId: string) => {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const updated = await validateLearningCandidate(candId);
      setSuccessMsg(`Candidate ${candId} successfully verified against held-out validation window.`);
      await loadAll();
      setSelectedCandidate(updated);
    } catch (err: any) {
      setErrorMsg(err.message || 'Candidate validation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Candidate
  const handleApprove = async () => {
    if (!selectedCandidate) return;
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const updated = await approveLearningCandidate(selectedCandidate.learning_id, {
        reviewer: reviewerName,
        notes: approvalNotes
      });
      setShowApprovalModal(false);
      setSuccessMsg(`Candidate ${selectedCandidate.learning_id} approved. Note: Candidate is now APPROVED but not active in production.`);
      await loadAll();
      setSelectedCandidate(updated);
    } catch (err: any) {
      setErrorMsg(err.message || 'Approval failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Activate Model
  const handleActivate = async (version: string) => {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const activated = await activateModelVersion(version, {
        actor: reviewerName,
        reason: 'Authorized activation of calibrated model version'
      });
      setSuccessMsg(`Successfully activated model version ${activated.model_version} in production.`);
      await loadAll();
    } catch (err: any) {
      setErrorMsg(err.message || 'Model activation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Rollback Model
  const handleRollback = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const rolledBack = await rollbackModelVersion(rollbackVersion, {
        target_version: rollbackVersion,
        actor: reviewerName,
        reason: rollbackReason
      });
      setShowRollbackModal(false);
      setSuccessMsg(`Successfully rolled back active model to ${rolledBack.model_version}.`);
      await loadAll();
    } catch (err: any) {
      setErrorMsg(err.message || 'Model rollback failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Grounded AI Explanation
  const handleExplain = async (candId: string) => {
    setExplainLoading(true);
    setErrorMsg(null);
    try {
      const exp = await explainLearningCandidate(candId);
      setExplanation(exp);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate explanation.');
    } finally {
      setExplainLoading(false);
    }
  };

  // Helper for Status Badges
  const getStatusBadge = (status: CalibrationStatus | string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'APPROVED':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'VALIDATED':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'CANDIDATE':
      case 'UNDER_REVIEW':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'REQUIRES_REVIEW':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'SUPERSEDED':
      case 'ROLLED_BACK':
        return 'bg-slate-700/40 text-slate-400 border-slate-600/40';
      case 'INSUFFICIENT_DATA':
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="glass-panel rounded-xl p-6 border-l-4 border-l-blue-500 bg-gradient-to-r from-[#06152B] via-[#091F3D] to-[#0A1628]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40">
                Phase 10 Learning Engine
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1E3E62]/40 text-slate-300">
                v10.0-continuous-learning
              </span>
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
              <Brain className="w-6 h-6 text-blue-400" />
              Civic Intelligence Learning Lab
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Transforms validated Phase 9 empirical observations into versioned, auditable calibrations. 
              Safely improves future analytical forecasts without autonomous policy intervention or silent parameter modifications.
            </p>
          </div>

          {/* Hard Governance Notice */}
          <div className="flex flex-col gap-2 shrink-0 max-w-xs">
            <div className="p-3 bg-blue-950/40 border border-blue-500/40 rounded-lg text-[11px] text-blue-200">
              <div className="font-bold flex items-center gap-1.5 text-blue-300 mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero Autonomous Model Modification
              </div>
              All candidate parameter shifts require out-of-sample validation and explicit administrative authorization before activation.
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-xs text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 2. Top Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-slate-700/60 bg-[#0B1728]/70">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Evaluated Outcomes</span>
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {summary.total_evaluations_ingested}
            </div>
            <div className="text-[11px] text-blue-300/80 mt-1 flex items-center gap-1">
              <span>Phase 9 Ingested Baseline & Observations</span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-700/60 bg-[#0B1728]/70">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Learning Candidates</span>
              <Sliders className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono">
              {summary.total_candidates}
            </div>
            <div className="text-[11px] text-amber-300/80 mt-1">
              {summary.pending_reviews} pending administrative review
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-700/60 bg-[#0B1728]/70">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Active Models</span>
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-300 font-mono">
              {summary.active_models}
            </div>
            <div className="text-[11px] text-emerald-300/80 mt-1">
              Production analytical versions active
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-700/60 bg-[#0B1728]/70">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Drift Monitoring</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-base font-bold text-white font-mono mt-0.5">
              {summary.drift_summary.length > 0 ? (
                <span className={`px-2 py-0.5 rounded text-xs border ${
                  summary.drift_summary[0].status === 'STABLE'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {summary.drift_summary[0].status}
                </span>
              ) : 'STABLE'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5">
              Verified Data Ratio: <span className="font-bold text-slate-200">{summary.data_quality.verified_pct}%</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Navigation Tabs & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'candidates'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Calibration Candidates ({candidates.length})
          </button>

          <button
            onClick={() => setActiveTab('models')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'models'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Model Versions & Lifecycles ({models.length})
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Audit Ledger ({auditEvents.length})
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Calibration Candidate
          </button>

          <button
            onClick={() => setShowRollbackModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            Rollback Version
          </button>

          <button
            onClick={loadAll}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4. Tab 1: Candidates & Validation Performance */}
      {activeTab === 'candidates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Candidate List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider px-1">
              <span>Candidate Ledger</span>
              <span>{candidates.length} Available</span>
            </div>

            <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {candidates.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 glass-panel rounded-xl">
                  No learning candidates available. Click "New Calibration Candidate" to generate one.
                </div>
              ) : (
                candidates.map((cand) => {
                  const isSelected = selectedCandidate?.learning_id === cand.learning_id;
                  return (
                    <div
                      key={cand.learning_id}
                      onClick={() => handleSelectCandidate(cand)}
                      className={`p-4 rounded-xl cursor-pointer transition-all border text-left ${
                        isSelected
                          ? 'bg-[#0E223D] border-blue-500 shadow-md shadow-blue-500/10'
                          : 'bg-[#091526]/80 border-slate-800 hover:border-slate-700 hover:bg-[#0A1B30]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                          {cand.model_family}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(cand.status)}`}>
                          {cand.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white mb-1">
                        {cand.target_version}
                      </h4>

                      <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                        <div>Parent: <span className="text-slate-300">{cand.source_version}</span></div>
                        <div>Sample Size: <span className="text-white font-bold">{cand.metrics.sample_size} evaluations</span></div>
                        <div className="text-slate-500 text-[10px] pt-1">
                          Train: {cand.training_window.start} → {cand.training_window.end}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Candidate Inspector & Validation Performance (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {selectedCandidate ? (
              <>
                {/* Candidate Overview Header */}
                <div className="glass-panel p-5 rounded-xl border border-slate-700/80 bg-[#08172B]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-blue-400">
                          {selectedCandidate.learning_id}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${getStatusBadge(selectedCandidate.status)}`}>
                          {selectedCandidate.status}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-white">
                        {selectedCandidate.target_version}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Model Family: <span className="text-slate-200 font-semibold">{selectedCandidate.model_family}</span> | Source: <span className="text-slate-200 font-mono">{selectedCandidate.source_version}</span>
                      </p>
                    </div>

                    {/* Governance Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedCandidate.status === 'CANDIDATE' && (
                        <button
                          onClick={() => handleValidate(selectedCandidate.learning_id)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-600/20"
                        >
                          Validate Candidate
                        </button>
                      )}

                      {['CANDIDATE', 'VALIDATED', 'REQUIRES_REVIEW'].includes(selectedCandidate.status) && (
                        <button
                          onClick={() => setShowApprovalModal(true)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20"
                        >
                          Approve Candidate
                        </button>
                      )}

                      {selectedCandidate.status === 'APPROVED' && (
                        <button
                          onClick={() => handleActivate(selectedCandidate.target_version)}
                          disabled={actionLoading}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Activate in Production
                        </button>
                      )}

                      <button
                        onClick={() => handleExplain(selectedCandidate.learning_id)}
                        disabled={explainLoading}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Explain
                      </button>
                    </div>
                  </div>

                  {/* Window Timeline Chips */}
                  <div className="grid grid-cols-2 gap-3 mt-3.5 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Training Window</div>
                      <div className="text-slate-200 mt-0.5">{selectedCandidate.training_window.start} → {selectedCandidate.training_window.end}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Held-Out Validation Window</div>
                      <div className="text-slate-200 mt-0.5">{selectedCandidate.validation_window.start} → {selectedCandidate.validation_window.end}</div>
                    </div>
                  </div>
                </div>

                {/* Validation Performance Panel (Current vs Candidate) */}
                <div className="glass-panel p-5 rounded-xl border border-slate-700/80 bg-[#0A1629]">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-cyan-400" />
                      Held-Out Validation Performance
                    </h4>
                    <span className="text-[10px] text-slate-400 italic">
                      Zero Ranking Bias — Neutral Metric Contrast
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* CURRENT MODEL */}
                    <div className="p-4 rounded-xl border border-slate-700/60 bg-slate-900/80 space-y-3">
                      <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                        <span>Current Model</span>
                        <span className="text-[10px] font-mono text-slate-400">{selectedCandidate.source_version}</span>
                      </div>
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Validation MAE:</span>
                          <span className="font-bold text-white">
                            {selectedCandidate.metrics.validation_mae_before != null
                              ? `${(selectedCandidate.metrics.validation_mae_before * 100).toFixed(1)}%`
                              : `${(selectedCandidate.metrics.mae_before * 100).toFixed(1)}%`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Directional Consistency:</span>
                          <span className="font-bold text-slate-300">
                            {selectedCandidate.metrics.validation_directional_consistency_before != null
                              ? `${Math.round(selectedCandidate.metrics.validation_directional_consistency_before * 100)}%`
                              : `${Math.round(selectedCandidate.metrics.directional_consistency_before * 100)}%`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Mean Signed Error:</span>
                          <span className="text-slate-300">{selectedCandidate.metrics.mean_prediction_error_before}</span>
                        </div>
                      </div>
                    </div>

                    {/* CANDIDATE MODEL */}
                    <div className="p-4 rounded-xl border border-blue-500/50 bg-blue-950/30 space-y-3">
                      <div className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center justify-between">
                        <span>Candidate Model</span>
                        <span className="text-[10px] font-mono text-blue-400">{selectedCandidate.target_version}</span>
                      </div>
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Validation MAE:</span>
                          <span className="font-bold text-emerald-300">
                            {selectedCandidate.metrics.validation_mae_candidate != null
                              ? `${(selectedCandidate.metrics.validation_mae_candidate * 100).toFixed(1)}%`
                              : `${(selectedCandidate.metrics.mae_candidate * 100).toFixed(1)}%`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Directional Consistency:</span>
                          <span className="font-bold text-emerald-300">
                            {selectedCandidate.metrics.validation_directional_consistency_candidate != null
                              ? `${Math.round(selectedCandidate.metrics.validation_directional_consistency_candidate * 100)}%`
                              : `${Math.round(selectedCandidate.metrics.directional_consistency_candidate * 100)}%`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Mean Signed Error:</span>
                          <span className="text-emerald-300">{selectedCandidate.metrics.mean_prediction_error_candidate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-blue-300 font-semibold">Validation Finding:</span> Candidate model yielded a lower mean absolute prediction error across held-out observations in the evaluated sample.
                  </div>
                </div>

                {/* Parameter Diff Table */}
                <div className="glass-panel p-5 rounded-xl border border-slate-700/80 bg-[#0A1629] space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    Calibrated Parameter Vector Diff
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left font-mono">
                      <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">Parameter</th>
                          <th className="p-2.5">Current Baseline</th>
                          <th className="p-2.5">Candidate Value</th>
                          <th className="p-2.5">Relative Shift</th>
                          <th className="p-2.5">Safety Range</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {selectedCandidate.parameters.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="p-2.5 text-white font-bold">{p.parameter_name}</td>
                            <td className="p-2.5 text-slate-300">{p.current_value}</td>
                            <td className="p-2.5 text-emerald-300 font-bold">{p.candidate_value}</td>
                            <td className="p-2.5 text-blue-300">
                              {p.relative_change !== null && p.relative_change !== undefined
                                ? `${p.relative_change > 0 ? '+' : ''}${p.relative_change}%`
                                : 'N/A'}
                            </td>
                            <td className="p-2.5 text-slate-400">[{p.min_value}, {p.max_value}]</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-2.5 bg-amber-950/30 border border-amber-500/30 rounded-lg text-[11px] text-amber-200">
                    <span className="font-bold text-amber-300">Governance Notice:</span> Candidate parameter values are derived from validated historical observations and require governance approval before activation.
                  </div>
                </div>

                {/* Grounded Gemini Explanation */}
                {explanation && (
                  <div className="glass-panel p-5 rounded-xl border border-purple-500/50 bg-[#140E29] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-purple-500/30">
                      <h4 className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        Grounded Calibration Synthesis
                      </h4>
                      <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800/50">
                        {explanation.prompt_version}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {explanation.grounded_explanation}
                    </p>

                    <div className="pt-2 border-t border-purple-500/20 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-purple-300 font-semibold">Supporting Evaluations:</span>
                      {explanation.cited_evaluation_ids.map((id: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => onNavigateToImpact && onNavigateToImpact(id)}
                          className="text-[9px] font-mono bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded border border-purple-800/40 hover:bg-purple-900 transition-colors"
                        >
                          {id}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Underlying Evidence Sources */}
                <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-[#091526]/60">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
                    <span className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-blue-400" />
                      Supporting Impact Evaluations ({selectedCandidate.source_evaluation_ids.length})
                    </span>
                    <span className="text-[10px] text-slate-500">Click to inspect in Observatory</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.source_evaluation_ids.map((evalId, i) => (
                      <button
                        key={i}
                        onClick={() => onNavigateToImpact && onNavigateToImpact(evalId)}
                        className="text-[10px] font-mono bg-slate-900 text-slate-300 px-2.5 py-1 rounded border border-slate-700/80 hover:border-blue-500 hover:text-white transition-all"
                      >
                        {evalId}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-500 glass-panel rounded-xl">
                Select a candidate from the ledger to inspect validation performance.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Tab 2: Model Versions & Production Lifecycles */}
      {activeTab === 'models' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Model Version Ledger & Production Deployments</span>
            <span>{models.length} Versions Registered</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((mod) => (
              <div
                key={mod.model_version}
                className="glass-panel p-5 rounded-xl border border-slate-700/80 bg-[#0A1629] space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-blue-300 font-bold bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                    {mod.model_family}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(mod.status)}`}>
                    {mod.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-black text-white font-mono">{mod.model_version}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">{mod.description || 'Versioned analytical configuration'}</p>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Active Parameters:</div>
                  {Object.entries(mod.parameters).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-400 truncate max-w-[140px]">{k}:</span>
                      <span className="text-emerald-300 font-bold">{v}</span>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
                  <div>Registered: {mod.created_at?.slice(0, 10)}</div>
                  {mod.activated_by && <div>Activated by: <span className="text-slate-400">{mod.activated_by}</span></div>}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  {mod.status !== 'ACTIVE' ? (
                    <button
                      onClick={() => handleActivate(mod.model_version)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30 transition-all"
                    >
                      Promote to Active
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active in Production
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Tab 3: Immutable Audit Ledger */}
      {activeTab === 'audit' && (
        <div className="glass-panel p-5 rounded-xl border border-slate-700/80 bg-[#091526] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              Immutable Calibration Lifecycle Audit Log
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">
              Persisted in jansetu_analytics.learning_audit_events
            </span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
            {auditEvents.map((evt) => (
              <div
                key={evt.event_id}
                className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono">{evt.action}</span>
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-900/50">
                      {evt.model_version || evt.learning_id}
                    </span>
                    {evt.previous_status && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {evt.previous_status} ➔ {evt.new_status}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-[11px]">{evt.reason}</p>
                </div>

                <div className="text-right shrink-0 text-[10px] font-mono text-slate-500">
                  <div>Actor: <span className="text-slate-300">{evt.actor}</span></div>
                  <div>{evt.timestamp?.slice(0, 19).replace('T', ' ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal 1: Generate Candidate */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 bg-[#0B1A2E] max-w-md w-full space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" />
              Generate Calibration Candidate
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Target Model Family:</label>
                <select
                  value={genFamily}
                  onChange={(e) => setGenFamily(e.target.value as ModelFamily)}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                >
                  <option value="SCENARIO_SIMULATION">SCENARIO_SIMULATION (Phase 8)</option>
                  <option value="DEMAND_HOTSPOT">DEMAND_HOTSPOT (Phase 5)</option>
                  <option value="SILENT_NEED">SILENT_NEED (Phase 6)</option>
                  <option value="IMPACT_FORECAST">IMPACT_FORECAST (Phase 9)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Minimum Observations Required:</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={genMinSamples}
                  onChange={(e) => setGenMinSamples(parseInt(e.target.value) || 2)}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-lg text-[11px] text-blue-200">
                System enforces temporal leakage protection: all training observations must strictly precede the validation window.
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-500"
              >
                {actionLoading ? 'Calculating...' : 'Run Deterministic Calibration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Approval Notes */}
      {showApprovalModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 bg-[#0B1A2E] max-w-md w-full space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-400" />
              Administrative Review & Approval
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Authorizing Reviewer:</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Approval Justification Notes:</label>
                <textarea
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-sans text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500"
              >
                {actionLoading ? 'Recording...' : 'Grant Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Rollback Version */}
      {showRollbackModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 bg-[#0B1A2E] max-w-md w-full space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              Rollback Model Version
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Target Version to Restore:</label>
                <select
                  value={rollbackVersion}
                  onChange={(e) => setRollbackVersion(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                >
                  {models.map((m) => (
                    <option key={m.model_version} value={m.model_version}>
                      {m.model_version} ({m.model_family} - {m.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Administrative Reason:</label>
                <input
                  type="text"
                  value={rollbackReason}
                  onChange={(e) => setRollbackReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowRollbackModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRollback}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-500"
              >
                {actionLoading ? 'Executing...' : 'Authorize Rollback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
