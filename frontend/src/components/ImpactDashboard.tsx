import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Building2,
  Calendar,
  BarChart2,
  Sliders,
  Sparkles,
  AlertCircle,
  Filter,
  Info,
  ExternalLink,
  Layers,
  Scale,
  RefreshCw,
  Clock,
  Target,
  ShieldAlert,
  Check,
  PlusCircle,
  FileCheck
} from 'lucide-react';
import { 
  fetchImpactEvaluations, 
  recordImpactObservation, 
  explainImpactEvaluation, 
  fetchModelValidation,
  fetchControlledIndicators,
  createImpactEvaluation 
} from '../lib/api';
import { 
  ImpactEvaluation, 
  ModelValidationSummary, 
  ImpactExplanationResponse,
  IndicatorDefinition,
  ObservationInput
} from '../types';

export const ImpactDashboard: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'evaluations' | 'validation' | 'record'>('evaluations');

  // Evaluations state
  const [evaluations, setEvaluations] = useState<ImpactEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedQuality, setSelectedQuality] = useState<string>('all');

  // Grounded Explanation state
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, ImpactExplanationResponse>>({});

  // Model Validation state
  const [validationSummary, setValidationSummary] = useState<ModelValidationSummary | null>(null);
  const [validationLoading, setValidationLoading] = useState(false);

  // New Observation recording state
  const [indicators, setIndicators] = useState<IndicatorDefinition[]>([]);
  const [recordTargetEvalId, setRecordTargetEvalId] = useState<string>('');
  const [obsValue, setObsValue] = useState<string>('');
  const [obsUnit, setObsUnit] = useState<string>('percentage');
  const [obsDate, setObsDate] = useState<string>('2026-03-31');
  const [obsSource, setObsSource] = useState<string>('Independent State Audit Team');
  const [recordingLoading, setRecordingLoading] = useState(false);
  const [recordSuccess, setRecordSuccess] = useState<string | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);

  // Load evaluations
  const loadEvaluations = async () => {
    setLoading(true);
    try {
      const data = await fetchImpactEvaluations({
        sector: selectedSector !== 'all' ? selectedSector : undefined,
        data_quality: selectedQuality !== 'all' ? selectedQuality : undefined
      });
      setEvaluations(data);
    } catch (err) {
      console.error('Failed to load impact evaluations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Model Validation Telemetry
  const loadValidation = async () => {
    setValidationLoading(true);
    try {
      const summary = await fetchModelValidation();
      setValidationSummary(summary);
    } catch (err) {
      console.error('Failed to load model validation:', err);
    } finally {
      setValidationLoading(false);
    }
  };

  // Load Controlled Indicators
  const loadIndicators = async () => {
    try {
      const indList = await fetchControlledIndicators();
      setIndicators(indList);
    } catch (err) {
      console.error('Failed to load indicators:', err);
    }
  };

  useEffect(() => {
    loadEvaluations();
    loadIndicators();
  }, [selectedSector, selectedQuality]);

  useEffect(() => {
    if (activeTab === 'validation') {
      loadValidation();
    }
  }, [activeTab]);

  // Request Grounded AI Explanation
  const handleExplain = async (evalId: string) => {
    setExplainingId(evalId);
    try {
      const exp = await explainImpactEvaluation(evalId);
      setExplanations((prev) => ({ ...prev, [evalId]: exp }));
    } catch (err) {
      console.error('Failed to explain evaluation:', err);
    } finally {
      setExplainingId(null);
    }
  };

  // Submit Observation
  const handleRecordObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordTargetEvalId) {
      setRecordError('Please select a target evaluation.');
      return;
    }
    const valNum = parseFloat(obsValue);
    if (isNaN(valNum)) {
      setRecordError('Please provide a valid numeric measurement.');
      return;
    }

    setRecordingLoading(true);
    setRecordError(null);
    setRecordSuccess(null);

    try {
      const payload: ObservationInput = {
        value: valNum,
        unit: obsUnit,
        observation_date: obsDate,
        source: obsSource,
        source_type: 'OFFICIAL_FIELD_AUDIT',
        provenance: 'VERIFIED',
        quality_status: 'VERIFIED'
      };
      await recordImpactObservation(recordTargetEvalId, payload);
      setRecordSuccess(`Successfully recorded verified outcome and recalculated impact for ${recordTargetEvalId}.`);
      loadEvaluations();
      setTimeout(() => {
        setActiveTab('evaluations');
        setRecordSuccess(null);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to record observation:', err);
      setRecordError(err?.message || 'Failed to submit post-intervention observation.');
    } finally {
      setRecordingLoading(false);
    }
  };

  // KPI Calculations
  const totalEvals = evaluations.length;
  const verifiedCount = evaluations.filter((e) => e.is_verified || e.data_quality === 'HIGH').length;
  const withScenarioCount = evaluations.filter((e) => e.scenario_comparison).length;
  const observedCount = evaluations.filter((e) => e.observation).length;

  return (
    <div className="space-y-6">
      {/* Top Banner: Civic Impact Observatory */}
      <div className="glass-panel rounded-xl p-6 border-l-4 border-l-emerald-500 bg-gradient-to-r from-[#071F17] via-[#0B2C24] to-[#070F1E]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Phase 9 Impact Observatory
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1E3E62]/40 text-slate-300">
                v9.0-impact-evaluation
              </span>
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              Civic Impact Observatory
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Measures closed-loop real-world governance outcomes following public interventions. 
              Tracks verified post-intervention indicators against documented historical baselines and Phase 8 simulation forecasts.
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0 max-w-xs">
            {/* Hard Governance Notice */}
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-[11px] text-emerald-200">
              <div className="font-bold flex items-center gap-1.5 text-emerald-300 mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                GOVERNANCE EVALUATION PROTOCOL
              </div>
              OBSERVED OUTCOME — MEASURED DATA. Causality is descriptive unless explicitly validated through controlled methodology.
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[#1E3E62]/60">
          <button
            onClick={() => setActiveTab('evaluations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'evaluations'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-[#070F1E]/80 text-slate-400 hover:text-slate-200 border border-[#1E3E62]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Evaluations Observatory ({evaluations.length})
          </button>

          <button
            onClick={() => setActiveTab('validation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'validation'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-[#070F1E]/80 text-slate-400 hover:text-slate-200 border border-[#1E3E62]'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            Model Validation Telemetry (Phase 8 vs 9)
          </button>

          <button
            onClick={() => setActiveTab('record')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'record'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                : 'bg-[#070F1E]/80 text-slate-400 hover:text-slate-200 border border-[#1E3E62]'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Record Field Observation
          </button>
        </div>
      </div>

      {/* KPI Tiles Banner (Zero Single Performance Score) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-[#070F1E] rounded-xl border border-[#1E3E62] flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total Evaluations
          </span>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {totalEvals}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">Monitored public schemes</span>
        </div>

        <div className="p-4 bg-[#070F1E] rounded-xl border border-[#1E3E62] flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Verified Field Outcomes
          </span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {verifiedCount}
          </div>
          <span className="text-[10px] text-emerald-300 mt-0.5">Audit-certified measurements</span>
        </div>

        <div className="p-4 bg-[#070F1E] rounded-xl border border-[#1E3E62] flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Observed Indicators
          </span>
          <div className="text-2xl font-black text-blue-400 font-mono mt-1">
            {observedCount}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">Post-intervention observations</span>
        </div>

        <div className="p-4 bg-[#070F1E] rounded-xl border border-[#1E3E62] flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Scenario Comparisons
          </span>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            {withScenarioCount}
          </div>
          <span className="text-[10px] text-amber-300 mt-0.5">Phase 8 forecast validation</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EVALUATIONS OBSERVATORY (Three-Card Architecture View) */}
      {/* ========================================================================= */}
      {activeTab === 'evaluations' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass-panel rounded-xl border border-[#1E3E62]">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Filter Evaluations:
              </span>

              {/* Sector Filter */}
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="bg-[#070F1E] border border-[#1E3E62] text-xs text-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Sectors</option>
                <option value="water_security">Water Security</option>
                <option value="road_transport">Road Transport</option>
                <option value="healthcare_access">Healthcare</option>
                <option value="electricity_supply">Electricity</option>
                <option value="sanitation_waste">Sanitation</option>
                <option value="education_infrastructure">Education</option>
              </select>

              {/* Data Quality Filter */}
              <select
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value)}
                className="bg-[#070F1E] border border-[#1E3E62] text-xs text-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Data Quality</option>
                <option value="HIGH">High Quality</option>
                <option value="MEDIUM">Medium Quality</option>
                <option value="LOW">Low Quality</option>
                <option value="INSUFFICIENT">Insufficient Data</option>
              </select>
            </div>

            <button
              onClick={loadEvaluations}
              disabled={loading}
              className="p-2 bg-[#070F1E] hover:bg-[#1E3E62] text-slate-300 border border-[#1E3E62] rounded-lg text-xs flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Evaluations
            </button>
          </div>

          {/* Evaluations List */}
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
              <p className="text-xs font-semibold text-slate-400">Loading Impact Evaluations...</p>
            </div>
          ) : evaluations.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs glass-panel rounded-xl">
              No impact evaluations found matching the selected filters.
            </div>
          ) : (
            evaluations.map((ev) => {
              const exp = explanations[ev.evaluation_id];
              return (
                <div key={ev.evaluation_id} className="glass-panel rounded-xl p-6 border border-[#1E3E62] space-y-6">
                  {/* Evaluation Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#1E3E62]/60 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800/40">
                          {ev.evaluation_id}
                        </span>
                        <h3 className="text-base font-bold text-white">{ev.project_name}</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {ev.region_name} ({ev.state_name}) • Sector: <span className="font-semibold text-slate-200 capitalize">{ev.sector}</span> • Scheme ID: {ev.intervention_id}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#070F1E] border border-[#1E3E62] text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        {ev.baseline_period} → {ev.observation_period}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {ev.data_quality} QUALITY
                      </span>
                      <button
                        onClick={() => handleExplain(ev.evaluation_id)}
                        disabled={explainingId === ev.evaluation_id}
                        className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {explainingId === ev.evaluation_id ? 'Synthesizing...' : 'Explain Outcome'}
                      </button>
                    </div>
                  </div>

                  {/* Impact Timeline (Section 28) */}
                  <div className="p-3 bg-[#070F1E] rounded-xl border border-[#1E3E62] flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                      <span className="text-slate-400">BASELINE:</span>
                      <span className="font-mono font-bold text-white">{ev.baseline_period}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 hidden md:block" />
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                      <span className="text-slate-400">INTERVENTION:</span>
                      <span className="font-mono font-bold text-amber-300">{ev.commenced_date || ev.baseline_period}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 hidden md:block" />
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                      <span className="text-slate-400">OBSERVATION:</span>
                      <span className="font-mono font-bold text-emerald-300">{ev.observation_period}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 hidden md:block" />
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">MEASURED OUTCOME:</span>
                      <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                        {ev.calculation?.percentage_change !== undefined && ev.calculation?.percentage_change !== null
                          ? `${ev.calculation.percentage_change > 0 ? '+' : ''}${ev.calculation.percentage_change}%`
                          : `${ev.calculation?.absolute_change || 0} ${ev.indicator.unit}`}
                      </span>
                    </div>
                  </div>

                  {/* ========================================================================= */}
                  {/* THREE-CARD EVALUATION ARCHITECTURE (Section 26) */}
                  {/* ========================================================================= */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* CARD 1 — BASELINE (Cyan/Blue) */}
                    <div className="p-4 bg-[#0B1E36] rounded-xl border-2 border-cyan-500/50 shadow-md shadow-cyan-950/40 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-cyan-500/30">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            HISTORICAL FACT
                          </span>
                          <span className="text-[10px] text-cyan-400 font-mono">Documented Baseline</span>
                        </div>
                        <h4 className="text-xs font-bold text-white mt-2 mb-1">{ev.indicator.name}</h4>
                        <p className="text-[11px] text-slate-300 font-mono">
                          Value: <span className="font-bold text-cyan-300 text-sm">{ev.baseline_snapshot.value} {ev.indicator.unit}</span>
                        </p>
                        <div className="text-[10px] text-slate-400 mt-2 space-y-1">
                          <div>Date: <span className="text-slate-200">{ev.baseline_snapshot.source_date}</span></div>
                          <div>Source: <span className="text-slate-200">{ev.baseline_snapshot.source}</span></div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-cyan-500/20">
                        <span className="text-[10px] text-slate-400 block mb-1">Evidence Trail:</span>
                        <div className="flex flex-wrap gap-1">
                          {ev.baseline_snapshot.evidence_ids.map((evId, i) => (
                            <span key={i} className="text-[9px] font-mono bg-cyan-950/60 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/40">
                              {evId}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* CARD 2 — OBSERVED OUTCOME (Amber/Orange) */}
                    <div className="p-4 bg-[#261808] rounded-xl border-2 border-amber-500/50 shadow-md shadow-amber-950/40 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            OBSERVED OUTCOME
                          </span>
                          <span className="text-[10px] text-amber-400 font-mono">Audit Measured</span>
                        </div>
                        <h4 className="text-xs font-bold text-white mt-2 mb-1">{ev.indicator.name}</h4>
                        {ev.observation ? (
                          <>
                            <p className="text-[11px] text-slate-300 font-mono">
                              Value: <span className="font-bold text-amber-300 text-sm">{ev.observation.value} {ev.indicator.unit}</span>
                            </p>
                            <div className="text-[10px] text-slate-400 mt-2 space-y-1">
                              <div>Obs Date: <span className="text-slate-200">{ev.observation.observation_date}</span></div>
                              <div>Source: <span className="text-slate-200">{ev.observation.source}</span></div>
                              <div>Quality: <span className="text-amber-300 font-bold">{ev.observation.quality_status}</span></div>
                            </div>
                          </>
                        ) : (
                          <div className="py-4 text-center text-[11px] text-amber-300/80 italic">
                            ⚠ BASELINE OR OUTCOME DATA UNAVAILABLE. Awaiting field observation.
                          </div>
                        )}
                      </div>

                      {ev.observation && (
                        <div className="pt-2 border-t border-amber-500/20">
                          <span className="text-[10px] text-slate-400 block mb-1">Evidence Trail:</span>
                          <div className="flex flex-wrap gap-1">
                            {ev.observation.evidence_ids.map((evId, i) => (
                              <span key={i} className="text-[9px] font-mono bg-amber-950/60 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/40">
                                {evId}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CARD 3 — CALCULATED IMPACT (Emerald/Green) */}
                    <div className="p-4 bg-[#092419] rounded-xl border-2 border-emerald-500/50 shadow-md shadow-emerald-950/40 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            CALCULATED IMPACT
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono">Deterministic</span>
                        </div>
                        <h4 className="text-xs font-bold text-white mt-2 mb-1">Outcome Delta</h4>
                        {ev.calculation ? (
                          <div className="space-y-1.5 text-xs font-mono">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Absolute Change:</span>
                              <span className="font-bold text-emerald-300">
                                {ev.calculation.absolute_change > 0 ? '+' : ''}{ev.calculation.absolute_change} {ev.indicator.unit}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Percentage Shift:</span>
                              <span className="font-bold text-emerald-400">
                                {typeof ev.calculation.percentage_change === 'number' ? `${ev.calculation.percentage_change > 0 ? '+' : ''}${ev.calculation.percentage_change}%` : 'N/A'}
                              </span>
                            </div>
                            {ev.calculation.target_gap !== null && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Target Gap:</span>
                                <span className="font-bold text-white">{ev.calculation.target_gap}</span>
                              </div>
                            )}
                            <div className="pt-1 text-[10px] text-emerald-300">
                              Evaluation Type: <span className="font-bold">{ev.evaluation_type}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-4 text-center text-[11px] text-emerald-300/80 italic">
                            Awaiting observation calculation.
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-emerald-500/20 text-[10px] text-emerald-300/80">
                        Attribution: <span className="font-bold">{ev.attribution_level}</span>
                      </div>
                    </div>
                  </div>

                  {/* Scenario vs Outcome Comparison View (Section 27) */}
                  {ev.scenario_comparison && (
                    <div className="p-4 bg-[#070F1E] rounded-xl border border-amber-500/40 space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b border-[#1E3E62]/40">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-amber-400" />
                          Phase 8 Scenario Forecast vs Phase 9 Verified Outcome
                        </span>
                        <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          {ev.scenario_comparison.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono pt-2">
                        <div className="p-2.5 bg-[#0B192C] rounded-lg">
                          <span className="text-[10px] text-slate-400 block font-sans">Phase 8 Scenario Estimate</span>
                          <span className="text-amber-300 font-bold text-sm">
                            {ev.scenario_comparison.scenario_estimate} {ev.indicator.unit}
                          </span>
                        </div>

                        <div className="p-2.5 bg-[#0B192C] rounded-lg">
                          <span className="text-[10px] text-slate-400 block font-sans">Phase 9 Actual Outcome</span>
                          <span className="text-emerald-400 font-bold text-sm">
                            {ev.scenario_comparison.observed_outcome} {ev.indicator.unit}
                          </span>
                        </div>

                        <div className="p-2.5 bg-[#0B192C] rounded-lg">
                          <span className="text-[10px] text-slate-400 block font-sans">Scenario-to-Outcome Difference</span>
                          <span className="text-white font-bold text-sm">
                            {ev.scenario_comparison.scenario_outcome_difference > 0 ? '+' : ''}
                            {ev.scenario_comparison.scenario_outcome_difference} {ev.indicator.unit}
                          </span>
                        </div>

                        <div className="p-2.5 bg-[#0B192C] rounded-lg">
                          <span className="text-[10px] text-slate-400 block font-sans">Directional Consistency</span>
                          <span className={`font-bold text-sm ${ev.scenario_comparison.directional_consistency ? 'text-emerald-400' : 'text-orange-400'}`}>
                            {ev.scenario_comparison.directional_consistency ? '✓ Consistent Forecast' : '⚠ Divergent Trend'}
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 italic pt-1">
                        {ev.scenario_comparison.disclaimer}
                      </div>
                    </div>
                  )}

                  {/* Attribution Statement & Confounders */}
                  <div className="p-4 bg-[#070F1E] rounded-xl border border-[#1E3E62] space-y-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Attribution Statement & Contextual Factors:
                    </span>
                    <p className="text-xs text-slate-200 font-medium leading-relaxed">
                      {ev.attribution_statement}
                    </p>

                    {ev.confounders.length > 0 && (
                      <div className="pt-2 border-t border-[#1E3E62]/40">
                        <span className="text-[10px] text-amber-400 font-semibold block mb-1">
                          Documented Contextual Factors (Confounders):
                        </span>
                        <ul className="text-[11px] text-slate-300 space-y-1">
                          {ev.confounders.map((c, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-amber-400">•</span>
                              <span className="font-semibold uppercase text-[10px] text-slate-400">[{c.factor_type}]:</span>
                              <span>{c.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Grounded Gemini Explanation Panel */}
                  {exp && (
                    <div className="p-5 bg-[#170E28] rounded-xl border border-purple-500/40 space-y-3 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between pb-2 border-b border-purple-500/30">
                        <h4 className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          Grounded Outcome Synthesis
                        </h4>
                        <span className="text-[10px] font-mono text-purple-300 bg-purple-900/50 px-2 py-0.5 rounded border border-purple-700/40">
                          {exp.prompt_version}
                        </span>
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed font-sans">
                        {exp.grounded_explanation}
                      </p>

                      <div className="pt-2 border-t border-purple-500/20 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] text-purple-300 font-semibold">Attributed Evidence:</span>
                        {exp.cited_evidence_ids.map((evId, i) => (
                          <span key={i} className="text-[9px] font-mono bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded border border-purple-800/40">
                            {evId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Limitations & Disclaimers */}
                  <div className="text-[11px] text-slate-400 italic pt-1 border-t border-[#1E3E62]/40 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>{ev.disclaimer}</div>
                    <div className="font-mono text-[10px] text-slate-500">{ev.governance_notice}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MODEL VALIDATION TELEMETRY (Phase 8 vs 9 Learning Loop) */}
      {/* ========================================================================= */}
      {activeTab === 'validation' && (
        <div className="glass-panel rounded-xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1E3E62]">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-400" />
                Phase 8 Simulation vs Phase 9 Outcome Validation
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Establishes an empirical learning loop. Compares Phase 8 hypothetical scenario projections 
                against Phase 9 verified outcomes to evaluate directional consistency and forecast deviation without altering historical data.
              </p>
            </div>

            <button
              onClick={loadValidation}
              disabled={validationLoading}
              className="p-2 bg-[#070F1E] hover:bg-[#1E3E62] text-slate-300 border border-[#1E3E62] rounded-lg text-xs flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${validationLoading ? 'animate-spin' : ''}`} />
              Refresh Validation
            </button>
          </div>

          {validationLoading ? (
            <div className="h-48 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
              <p className="text-xs text-slate-400">Computing Model Validation Telemetry...</p>
            </div>
          ) : validationSummary ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[#070F1E] rounded-xl border border-[#1E3E62]">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Scenarios Evaluated</span>
                  <div className="text-2xl font-black text-white font-mono mt-1">
                    {validationSummary.total_scenarios_evaluated}
                  </div>
                  <span className="text-[10px] text-slate-400">With verified outcomes</span>
                </div>

                <div className="p-4 bg-[#070F1E] rounded-xl border border-[#1E3E62]">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Directional Consistency</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                    {validationSummary.directional_consistency_rate !== null ? `${validationSummary.directional_consistency_rate}%` : 'N/A'}
                  </div>
                  <span className="text-[10px] text-emerald-300">Predicted trend accuracy</span>
                </div>

                <div className="p-4 bg-[#070F1E] rounded-xl border border-[#1E3E62]">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Mean Abs Prediction Error</span>
                  <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                    {validationSummary.mean_absolute_prediction_error !== null ? validationSummary.mean_absolute_prediction_error : 'N/A'}
                  </div>
                  <span className="text-[10px] text-amber-300">Average indicator delta</span>
                </div>

                <div className="p-4 bg-[#070F1E] rounded-xl border border-[#1E3E62]">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Model Version</span>
                  <div className="text-base font-bold text-blue-300 font-mono mt-2">
                    {validationSummary.model_version}
                  </div>
                  <span className="text-[10px] text-slate-400">Calibration active</span>
                </div>
              </div>

              {/* Learning Loop Callout */}
              <div className="p-4 bg-[#0B1E36] rounded-xl border border-cyan-500/40 space-y-2 text-xs">
                <span className="font-bold text-cyan-300 uppercase tracking-wider block">
                  Learning Loop Architecture Notice:
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Phase 9 empirically validates Phase 8 simulation formulas against verified field measurements. 
                  Historical records are never overwritten. When sufficient observations are gathered across pilot corridors, 
                  model calibration parameters will be versioned into future analytical releases.
                </p>
                <div className="text-[10px] text-cyan-400/80 font-mono pt-1">
                  {validationSummary.disclaimer}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              No validation telemetry currently available.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RECORD FIELD OBSERVATION (Post-Intervention Audit Intake) */}
      {/* ========================================================================= */}
      {activeTab === 'record' && (
        <div className="glass-panel rounded-xl p-6 max-w-2xl mx-auto space-y-6">
          <div className="border-b border-[#1E3E62] pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-amber-400" />
              Record Post-Intervention Field Observation
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Submit verified post-intervention audit measurements to trigger deterministic impact calculation.
            </p>
          </div>

          <form onSubmit={handleRecordObservation} className="space-y-4 text-xs">
            {/* Target Evaluation Selector */}
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Select Target Impact Evaluation:
              </label>
              <select
                value={recordTargetEvalId}
                onChange={(e) => {
                  setRecordTargetEvalId(e.target.value);
                  const selected = evaluations.find((item) => item.evaluation_id === e.target.value);
                  if (selected) {
                    setObsUnit(selected.indicator.unit);
                  }
                }}
                className="w-full bg-[#070F1E] border border-[#1E3E62] text-slate-100 rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Choose Evaluation --</option>
                {evaluations.map((ev) => (
                  <option key={ev.evaluation_id} value={ev.evaluation_id}>
                    {ev.evaluation_id} — {ev.region_name} ({ev.project_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Observation Value & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Measured Value:
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 74.5"
                  value={obsValue}
                  onChange={(e) => setObsValue(e.target.value)}
                  className="w-full bg-[#070F1E] border border-[#1E3E62] text-slate-100 rounded-lg p-2.5 focus:outline-none focus:border-amber-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Unit (Must match indicator):
                </label>
                <input
                  type="text"
                  value={obsUnit}
                  onChange={(e) => setObsUnit(e.target.value)}
                  className="w-full bg-[#070F1E] border border-[#1E3E62] text-slate-300 rounded-lg p-2.5 font-mono bg-slate-900/50"
                  readOnly
                />
              </div>
            </div>

            {/* Date & Source */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Observation Date:
                </label>
                <input
                  type="date"
                  value={obsDate}
                  onChange={(e) => setObsDate(e.target.value)}
                  className="w-full bg-[#070F1E] border border-[#1E3E62] text-slate-100 rounded-lg p-2.5 focus:outline-none focus:border-amber-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Audit / Field Source:
                </label>
                <input
                  type="text"
                  value={obsSource}
                  onChange={(e) => setObsSource(e.target.value)}
                  className="w-full bg-[#070F1E] border border-[#1E3E62] text-slate-100 rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            {/* Messages */}
            {recordError && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{recordError}</span>
              </div>
            )}

            {recordSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-emerald-200 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{recordSuccess}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={recordingLoading}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              {recordingLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting Observation & Calculating Impact...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Record Verified Observation</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
