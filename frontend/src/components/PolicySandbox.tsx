import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Sparkles, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Coins,
  ArrowRight,
  ShieldAlert,
  Scale,
  FileText,
  Layers,
  Info,
  ExternalLink,
  History,
  BarChart2,
  RefreshCw,
  BookmarkCheck,
  Calendar,
  Building2,
  HelpCircle,
  Check,
  Archive
} from 'lucide-react';
import { 
  simulateScenario, 
  fetchScenarios, 
  compareScenarios, 
  explainScenario, 
  archiveScenario 
} from '../lib/api';
import { 
  ScenarioInput, 
  ScenarioResult, 
  ScenarioComparisonResponse, 
  ScenarioExplanationResponse,
  InterventionType
} from '../types';

export const PolicySandbox: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'simulator' | 'compare' | 'history'>('simulator');

  // Simulator Form State
  const [selectedGeo, setSelectedGeo] = useState('IND_TN_DHM_HRR');
  const [sector, setSector] = useState('water_security');
  const [interventionType, setInterventionType] = useState<InterventionType>('SERVICE_COVERAGE_INCREASE');
  const [coveragePct, setCoveragePct] = useState<number>(25);
  const [targetPopPct, setTargetPopPct] = useState<number>(50);
  const [hypotheticalBudget, setHypotheticalBudget] = useState<string>('5000000');
  const [timelineMonths, setTimelineMonths] = useState<number>(12);
  const [notes, setNotes] = useState<string>('');

  // Execution & Results State
  const [loading, setLoading] = useState(false);
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Grounded Explanation State
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explanation, setExplanation] = useState<ScenarioExplanationResponse | null>(null);

  // History & Comparison State
  const [scenariosList, setScenariosList] = useState<ScenarioResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ScenarioComparisonResponse | null>(null);

  // Canonical regions
  const regions = [
    { id: 'IND_TN_DHM_HRR', name: 'Harur Block', district: 'Dharmapuri', state: 'Tamil Nadu' },
    { id: 'IND_UP_VAR_PND', name: 'Pindra Block', district: 'Varanasi', state: 'Uttar Pradesh' },
    { id: 'IND_TG_MBN_JDC', name: 'Jadcherla Block', district: 'Mahabubnagar', state: 'Telangana' },
    { id: 'IND_MH_GDC_AHR', name: 'Aheri Tribal Block', district: 'Gadchiroli', state: 'Maharashtra' },
    { id: 'IND_BR_MBN_001', name: 'Madhubani Rural', district: 'Madhubani', state: 'Bihar' },
    { id: 'IND_RJ_JSM_001', name: 'Pokhran Desert Sector', district: 'Jaisalmer', state: 'Rajasthan' },
  ];

  // Controlled Sectors
  const sectors = [
    { id: 'water_security', label: 'Water Security & Potable Supply' },
    { id: 'road_transport', label: 'Road & Transit Connectivity' },
    { id: 'healthcare_access', label: 'Healthcare & Primary Centers' },
    { id: 'electricity_supply', label: 'Electricity & Grid Stability' },
    { id: 'sanitation_waste', label: 'Sanitation & Solid Waste' },
    { id: 'education_infrastructure', label: 'School & Digital Infra' },
  ];

  // Controlled Intervention Types
  const interventionTypes: { id: InterventionType; label: string; desc: string }[] = [
    { 
      id: 'SERVICE_COVERAGE_INCREASE', 
      label: 'Service Coverage Expansion', 
      desc: 'Extends municipal service delivery reach across currently unserved habitations.' 
    },
    { 
      id: 'INFRASTRUCTURE_CAPACITY_INCREASE', 
      label: 'Infrastructure Capacity Expansion', 
      desc: 'Increases processing or throughput volume of existing physical facilities.' 
    },
    { 
      id: 'ACCESS_IMPROVEMENT', 
      label: 'Last-Mile Access Improvement', 
      desc: 'Removes spatial and transport friction connecting remote settlements.' 
    },
    { 
      id: 'DEFICIT_REDUCTION', 
      label: 'Targeted Deficit Reduction', 
      desc: 'Directly targets identified deficit vectors with concentrated resource dispatch.' 
    },
    { 
      id: 'CUSTOM_HYPOTHETICAL_INTERVENTION', 
      label: 'Custom Policy Model', 
      desc: 'Hypothetical combination policy for exploratory planning simulations.' 
    },
  ];

  // Presets
  const applyPreset = (cov: number, pop: number, budget: string, tl: number) => {
    setCoveragePct(cov);
    setTargetPopPct(pop);
    setHypotheticalBudget(budget);
    setTimelineMonths(tl);
  };

  // Load scenarios history
  const loadScenarios = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetchScenarios({ limit: 20 });
      setScenariosList(res.scenarios || []);
    } catch (err) {
      console.error('Failed to load scenarios history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, []);

  // Run Simulation
  const handleSimulate = async () => {
    setLoading(true);
    setError(null);
    setExplanation(null);
    try {
      const budgetNum = hypotheticalBudget.trim() ? parseFloat(hypotheticalBudget) : undefined;
      const payload: ScenarioInput = {
        geo_id: selectedGeo,
        sector,
        intervention_type: interventionType,
        coverage_improvement_pct: coveragePct,
        target_population_pct: targetPopPct,
        hypothetical_budget_inr: budgetNum && !isNaN(budgetNum) ? budgetNum : undefined,
        implementation_timeline_months: timelineMonths,
        notes: notes.trim() || undefined,
      };

      const result = await simulateScenario(payload);
      setScenarioResult(result);
      // Refresh scenarios list
      loadScenarios();
    } catch (err: any) {
      console.error('Simulation error:', err);
      setError(err?.message || 'Failed to execute counterfactual scenario simulation.');
    } finally {
      setLoading(false);
    }
  };

  // Request Grounded AI Explanation
  const handleExplain = async () => {
    if (!scenarioResult) return;
    setExplanationLoading(true);
    try {
      const exp = await explainScenario(scenarioResult.scenario_id);
      setExplanation(exp);
    } catch (err) {
      console.error('Failed to fetch explanation:', err);
    } finally {
      setExplanationLoading(false);
    }
  };

  // Toggle selection for comparison
  const toggleCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter((item) => item !== id));
    } else {
      if (selectedForCompare.length >= 4) {
        alert('You can compare a maximum of 4 scenarios simultaneously.');
        return;
      }
      setSelectedForCompare([...selectedForCompare, id]);
    }
  };

  // Run Comparison
  const handleCompare = async () => {
    if (selectedForCompare.length < 2) {
      alert('Please select at least 2 scenarios to compare.');
      return;
    }
    setComparisonLoading(true);
    try {
      const res = await compareScenarios(selectedForCompare);
      setComparisonResult(res);
      setActiveTab('compare');
    } catch (err) {
      console.error('Comparison error:', err);
    } finally {
      setComparisonLoading(false);
    }
  };

  // Archive Scenario
  const handleArchive = async (scenarioId: string) => {
    try {
      await archiveScenario(scenarioId);
      loadScenarios();
      if (scenarioResult?.scenario_id === scenarioId) {
        setScenarioResult(null);
      }
    } catch (err) {
      console.error('Failed to archive scenario:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Flight Simulator Header Banner */}
      <div className="glass-panel rounded-xl p-6 border-l-4 border-l-amber-500 bg-gradient-to-r from-[#0B192C] via-[#0D2039] to-[#070F1E]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Phase 8 Policy Sandbox
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1E3E62]/40 text-slate-300">
                v8.0-deterministic
              </span>
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
              <Sliders className="w-6 h-6 text-amber-400" />
              Civic Policy Flight Simulator
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Explore hypothetical counterfactual interventions across infrastructure deficit zones. 
              Models population impact, gap reduction, and residual unaddressed needs through verified baselines and pure deterministic calculations.
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0 max-w-xs">
            {/* Hard Governance Notice */}
            <div className="p-3 bg-red-950/30 border border-red-500/40 rounded-lg text-[11px] text-red-200">
              <div className="font-bold flex items-center gap-1.5 text-red-300 mb-0.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                MANDATORY GOVERNANCE NOTICE
              </div>
              ⚠ HYPOTHETICAL SCENARIO — MODEL ESTIMATE, NOT OFFICIAL POLICY. AI-Derived Analytical Signal — Not Official Policy.
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[#1E3E62]/60">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'simulator'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                : 'bg-[#070F1E]/80 text-slate-400 hover:text-slate-200 border border-[#1E3E62]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Flight Simulator
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'compare'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-[#070F1E]/80 text-slate-400 hover:text-slate-200 border border-[#1E3E62]'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            Neutral Comparison Mode {selectedForCompare.length > 0 && `(${selectedForCompare.length})`}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'bg-[#070F1E]/80 text-slate-400 hover:text-slate-200 border border-[#1E3E62]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Saved Scenarios ({scenariosList.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FLIGHT SIMULATOR (Single Scenario Definition & 3-Card View) */}
      {/* ========================================================================= */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Parameter Studio */}
          <div className="lg:col-span-5 glass-panel rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E3E62]">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                Scenario Parameter Studio
              </h3>
              <span className="text-[10px] text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                MODEL ASSUMPTION INPUTS
              </span>
            </div>

            {/* Target Region */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
                <span>Target Geographic Area:</span>
                <span className="text-[10px] text-slate-400 font-mono">Retrieved from Warehouse</span>
              </label>
              <select
                value={selectedGeo}
                onChange={(e) => setSelectedGeo(e.target.value)}
                className="w-full bg-[#070F1E] border border-[#1E3E62] text-xs text-slate-100 rounded-lg p-2.5 focus:outline-none focus:border-amber-500 transition-colors"
              >
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.district}, {r.state} ({r.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Sector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Infrastructure Domain:
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full bg-[#070F1E] border border-[#1E3E62] text-xs text-slate-100 rounded-lg p-2.5 focus:outline-none focus:border-amber-500 transition-colors"
              >
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Intervention Type */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Intervention Strategy:
              </label>
              <select
                value={interventionType}
                onChange={(e) => setInterventionType(e.target.value as InterventionType)}
                className="w-full bg-[#070F1E] border border-[#1E3E62] text-xs text-slate-100 rounded-lg p-2.5 focus:outline-none focus:border-amber-500 transition-colors"
              >
                {interventionTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1 italic">
                {interventionTypes.find((t) => t.id === interventionType)?.desc}
              </p>
            </div>

            {/* Quick Presets */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Quick Simulation Presets:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset(15, 30, '2500000', 6)}
                  className="p-1.5 bg-[#070F1E] hover:bg-[#1E3E62] text-[10px] text-slate-300 border border-[#1E3E62] rounded text-center transition-colors"
                >
                  Quick-Win Blitz (15%)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(30, 60, '6000000', 12)}
                  className="p-1.5 bg-[#070F1E] hover:bg-[#1E3E62] text-[10px] text-slate-300 border border-[#1E3E62] rounded text-center transition-colors"
                >
                  Standard Plan (30%)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(50, 85, '12000000', 24)}
                  className="p-1.5 bg-[#070F1E] hover:bg-[#1E3E62] text-[10px] text-slate-300 border border-[#1E3E62] rounded text-center transition-colors"
                >
                  Universal Push (50%)
                </button>
              </div>
            </div>

            {/* Sliders Box */}
            <div className="p-4 bg-[#070F1E] rounded-xl border border-[#1E3E62] space-y-4">
              {/* Coverage Improvement Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200">Coverage Improvement:</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">+{coveragePct}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={coveragePct}
                  onChange={(e) => setCoveragePct(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1% (Minimal)</span>
                  <span>100% (Complete Deficit Eradication)</span>
                </div>
              </div>

              {/* Target Population % Slider */}
              <div className="space-y-1.5 pt-2 border-t border-[#1E3E62]/40">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200">Target Population Reach:</span>
                  <span className="font-mono font-bold text-blue-400 text-sm">{targetPopPct}% of Block Pop</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={targetPopPct}
                  onChange={(e) => setTargetPopPct(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>5% (Isolated clusters)</span>
                  <span>100% (Universal block coverage)</span>
                </div>
              </div>

              {/* Hypothetical Budget Input */}
              <div className="space-y-1.5 pt-2 border-t border-[#1E3E62]/40">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-400" />
                    Hypothetical Budget (INR):
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    MODEL ASSUMPTION — USER PROVIDED
                  </span>
                </div>
                <input
                  type="number"
                  placeholder="e.g. 5000000 (Leave empty if cost unavailable)"
                  value={hypotheticalBudget}
                  onChange={(e) => setHypotheticalBudget(e.target.value)}
                  className="w-full bg-[#0B192C] border border-[#1E3E62] text-xs text-slate-100 rounded-lg p-2.5 focus:outline-none focus:border-amber-500 font-mono"
                />
                <p className="text-[10px] text-slate-400">
                  {hypotheticalBudget.trim() 
                    ? `Input: ₹${(parseFloat(hypotheticalBudget) / 100000).toFixed(2)} Lakhs (Used strictly for simulated cost-per-beneficiary)`
                    : '⚠ Left blank: Cost status will be marked UNAVAILABLE without guessing or fabrication.'}
                </p>
              </div>

              {/* Timeline Input */}
              <div className="space-y-1.5 pt-2 border-t border-[#1E3E62]/40">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    Implementation Horizon:
                  </span>
                  <span className="font-mono text-xs text-purple-300 font-bold">{timelineMonths} Months</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={60}
                  value={timelineMonths}
                  onChange={(e) => setTimelineMonths(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              {/* Simulation Notes */}
              <div className="space-y-1.5 pt-2 border-t border-[#1E3E62]/40">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  Scenario Label / Justification Note:
                </label>
                <input
                  type="text"
                  placeholder="e.g. FY27 Rural Deep Well Priority Scheme"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0B192C] border border-[#1E3E62] text-xs text-slate-100 rounded-lg p-2 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg text-xs text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Execute Button */}
            <button
              type="button"
              onClick={handleSimulate}
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Computing Deterministic Simulation...</span>
                </>
              ) : (
                <>
                  <Sliders className="w-4 h-4" />
                  <span>Run Deterministic Simulation</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Three-Card Architecture Results */}
          <div className="lg:col-span-7 space-y-6">
            {!scenarioResult && !loading && (
              <div className="glass-panel rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3">
                <Sliders className="w-14 h-14 text-slate-600" />
                <h4 className="text-base font-bold text-slate-300">Ready to Simulate</h4>
                <p className="text-xs text-slate-400 max-w-md">
                  Select parameters on the left and run the deterministic simulation. 
                  Results will display strict category boundaries: Historical Baseline, Model Assumptions, and Scenario Estimates.
                </p>
              </div>
            )}

            {scenarioResult && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Result Meta Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#070F1E] rounded-xl border border-[#1E3E62]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/30">
                      {scenarioResult.scenario_id}
                    </span>
                    <span className="text-xs text-slate-300 font-medium">
                      {scenarioResult.region_name} • {scenarioResult.sector}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExplain}
                      disabled={explanationLoading}
                      className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {explanationLoading ? 'Synthesizing...' : 'Why this estimate?'}
                    </button>
                    <button
                      onClick={() => toggleCompare(scenarioResult.scenario_id)}
                      className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        selectedForCompare.includes(scenarioResult.scenario_id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#1E3E62] text-slate-200 hover:bg-[#254d7a]'
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5" />
                      {selectedForCompare.includes(scenarioResult.scenario_id) ? 'Selected for Compare' : 'Add to Compare'}
                    </button>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* THREE-CARD STRICT SEPARATION VIEW */}
                {/* ========================================================================= */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* CARD 1: HISTORICAL BASELINE (Blue) */}
                  <div className="p-4 bg-[#0B1E36] rounded-xl border-2 border-cyan-500/50 shadow-md shadow-cyan-950/40 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-cyan-500/30">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          HISTORICAL FACT
                        </span>
                        <span className="text-[10px] text-cyan-400 font-mono">Phase 2/6/7</span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-2 mb-2">Ground Truth Baseline</h4>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Baseline Deficit:</span>
                          <span className="font-mono font-bold text-cyan-300">
                            {scenarioResult.baseline.infra_deficit_score.formatted_value}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Total Population:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {scenarioResult.baseline.population.formatted_value}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Vulnerability Score:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {scenarioResult.baseline.vulnerability_score.formatted_value}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Digital Access:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {scenarioResult.baseline.digital_access_score.formatted_value}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Existing Projects:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {scenarioResult.baseline.active_projects_count.formatted_value}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-cyan-500/20">
                      <span className="text-[10px] text-slate-400 block mb-1">Evidence Trail:</span>
                      <div className="flex flex-wrap gap-1">
                        {scenarioResult.baseline.infra_deficit_score.evidence_ids.slice(0, 2).map((ev, i) => (
                          <span key={i} className="text-[9px] font-mono bg-cyan-950/60 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/40">
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: MODEL ASSUMPTION (Amber) */}
                  <div className="p-4 bg-[#261808] rounded-xl border-2 border-amber-500/50 shadow-md shadow-amber-950/40 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          MODEL ASSUMPTION
                        </span>
                        <span className="text-[10px] text-amber-400 font-mono">User Configured</span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-2 mb-2">Simulation Parameters</h4>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Coverage Goal:</span>
                          <span className="font-mono font-bold text-amber-300">
                            +{scenarioResult.assumptions.coverage_improvement_pct}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Target Pop %:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {scenarioResult.assumptions.target_population_pct}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Budget Input:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {scenarioResult.assumptions.hypothetical_budget_inr
                              ? `₹${(scenarioResult.assumptions.hypothetical_budget_inr / 100000).toFixed(1)}L`
                              : 'UNAVAILABLE'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Timeline:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {scenarioResult.assumptions.implementation_timeline_months || 12} Mos
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Cost Status:</span>
                          <span className="text-[10px] font-bold text-amber-300 font-mono">
                            {scenarioResult.assumptions.cost_status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-amber-500/20 text-[10px] text-amber-200/80 italic">
                      Parameters are purely hypothetical inputs.
                    </div>
                  </div>

                  {/* CARD 3: SCENARIO ESTIMATE (Emerald) */}
                  <div className="p-4 bg-[#092419] rounded-xl border-2 border-emerald-500/50 shadow-md shadow-emerald-950/40 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          SCENARIO ESTIMATE
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">Deterministic Math</span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-2 mb-2">Simulated Outcome</h4>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Deficit After:</span>
                          <span className="font-mono font-bold text-emerald-300">
                            {scenarioResult.estimates.estimated_infrastructure_deficit_after.toFixed(3)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Gap Reduction:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            -{scenarioResult.estimates.estimated_gap_reduction_pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Beneficiaries:</span>
                          <span className="font-mono font-bold text-white">
                            {scenarioResult.estimates.estimated_affected_population.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Cost/Citizen:</span>
                          <span className="font-mono font-bold text-emerald-200">
                            {scenarioResult.estimates.cost_per_beneficiary_inr !== undefined && scenarioResult.estimates.cost_per_beneficiary_inr !== null
                              ? `₹${scenarioResult.estimates.cost_per_beneficiary_inr.toFixed(2)}`
                              : 'UNAVAILABLE'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Confidence:</span>
                          <span className="font-mono font-bold text-emerald-300">
                            {scenarioResult.estimates.confidence_level}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-emerald-500/20 text-[10px] text-emerald-300/80 font-mono">
                      Sensitivity: [{scenarioResult.estimates.sensitivity_range.lower_gap_reduction.toFixed(3)} - {scenarioResult.estimates.sensitivity_range.upper_gap_reduction.toFixed(3)}]
                    </div>
                  </div>
                </div>

                {/* Visual Before/After Deficit Comparison */}
                <div className="p-5 bg-[#070F1E] rounded-xl border border-[#1E3E62] space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                    <span>Before / After Deficit Vector Comparison</span>
                    <span className="text-emerald-400 font-mono font-bold text-sm">
                      -{scenarioResult.estimates.estimated_gap_reduction_pct.toFixed(1)}% Estimated Reduction
                    </span>
                  </h4>

                  {/* Progress Bars */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>Baseline Infrastructure Deficit:</span>
                        <span className="font-mono font-bold text-red-400">
                          {scenarioResult.baseline.infra_deficit_score.formatted_value}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-red-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (scenarioResult.baseline.infra_deficit_score.value || 0.8) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>Simulated Counterfactual Deficit:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {scenarioResult.estimates.estimated_infrastructure_deficit_after.toFixed(3)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, scenarioResult.estimates.estimated_infrastructure_deficit_after * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grounded AI Explanation View */}
                {explanation && (
                  <div className="p-5 bg-[#170E28] rounded-xl border border-purple-500/40 space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-2 border-b border-purple-500/30">
                      <h4 className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        Grounded AI Scenario Explanation
                      </h4>
                      <span className="text-[10px] font-mono text-purple-300 bg-purple-900/50 px-2 py-0.5 rounded border border-purple-700/40">
                        {explanation.prompt_version}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {explanation.grounded_explanation}
                    </p>

                    {explanation.key_hypotheses.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-purple-300 block">Key Hypotheses:</span>
                        <ul className="space-y-1 text-xs text-slate-300">
                          {explanation.key_hypotheses.map((hyp, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-purple-400">•</span>
                              <span>{hyp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="pt-2 border-t border-purple-500/20 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] text-purple-300 font-semibold">Attributed Evidence:</span>
                      {explanation.cited_evidence_ids.map((ev, i) => (
                        <span key={i} className="text-[9px] font-mono bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded border border-purple-800/40">
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data Limitations & Caveats */}
                <div className="p-4 bg-[#070F1E] rounded-xl border border-amber-800/40 space-y-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Model Limitations & Analytical Assumptions:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {scenarioResult.limitations.map((lim, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400">•</span>
                        <span>{lim}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 border-t border-[#1E3E62]/40 text-[11px] text-slate-400 italic">
                    {scenarioResult.disclaimer}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: NEUTRAL COMPARISON MODE (Multi-Scenario Side-by-Side) */}
      {/* ========================================================================= */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-5 border border-[#1E3E62]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-blue-400" />
                  Multi-Scenario Neutral Trade-Off Analysis
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Evaluates scenarios side-by-side without declaring winners or ranking policies. 
                  Strictly presents tradeoffs, estimated impacts, and unaddressed dimensions.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCompare}
                  disabled={comparisonLoading || selectedForCompare.length < 2}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
                >
                  {comparisonLoading ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>Building Matrix...</span>
                    </>
                  ) : (
                    <>
                      <Scale className="w-3.5 h-3.5" />
                      <span>Compare Selected ({selectedForCompare.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Selection Chips */}
            <div className="mt-4 pt-3 border-t border-[#1E3E62]/60 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Available Scenarios to Select:</span>
              {scenariosList.map((scn) => {
                const isSelected = selectedForCompare.includes(scn.scenario_id);
                return (
                  <button
                    key={scn.scenario_id}
                    onClick={() => toggleCompare(scn.scenario_id)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-[#070F1E] text-slate-400 border border-[#1E3E62] hover:text-slate-200'
                    }`}
                  >
                    <span>{scn.scenario_id}</span>
                    <span className="text-[10px] text-slate-300">({scn.region_name})</span>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comparison Output */}
          {comparisonResult && (
            <div className="glass-panel rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E3E62]">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Comparative Assessment Table (Zero Ranking Policy)
                </h4>
                <span className="text-[10px] font-mono text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded border border-blue-500/30">
                  {comparisonResult.comparative_notice}
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#070F1E] text-slate-300 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 border-b border-[#1E3E62]">Metric / Dimension</th>
                      <th className="p-3 border-b border-[#1E3E62]">Data Classification</th>
                      {comparisonResult.scenario_ids.map((id) => (
                        <th key={id} className="p-3 border-b border-[#1E3E62] font-mono text-amber-300">
                          {id}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E3E62]/40 font-mono">
                    {comparisonResult.comparison_table.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#070F1E]/50">
                        <td className="p-3 font-sans font-semibold text-slate-200">
                          {row.metric}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border ${
                              row.classification === 'HISTORICAL_FACT'
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                : row.classification === 'MODEL_ASSUMPTION'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {row.classification}
                          </span>
                        </td>
                        {comparisonResult.scenario_ids.map((id) => (
                          <td key={id} className="p-3 text-slate-200">
                            {row.values[id] !== undefined ? String(row.values[id]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Neutral Trade-Offs Cards */}
              <div className="pt-4 border-t border-[#1E3E62]">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Neutral Trade-Off Profiles (No Winner Declared)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {comparisonResult.neutral_tradeoffs.map((item) => (
                    <div key={item.scenario_id} className="p-4 bg-[#070F1E] rounded-xl border border-[#1E3E62] space-y-2">
                      <div className="font-mono font-bold text-xs text-blue-300">
                        {item.scenario_id}
                      </div>
                      <p className="text-xs text-slate-300">{item.description}</p>
                      
                      {item.trade_offs.length > 0 && (
                        <div className="pt-2 border-t border-[#1E3E62]/40">
                          <span className="text-[10px] font-semibold text-amber-400 block mb-1">Trade-Offs:</span>
                          <ul className="text-[11px] text-slate-400 space-y-1">
                            {item.trade_offs.map((to, i) => (
                              <li key={i}>• {to}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.unaddressed_dimensions.length > 0 && (
                        <div className="pt-2 border-t border-[#1E3E62]/40">
                          <span className="text-[10px] font-semibold text-red-400 block mb-1">Unaddressed Dimensions:</span>
                          <ul className="text-[11px] text-slate-400 space-y-1">
                            {item.unaddressed_dimensions.map((ud, i) => (
                              <li key={i}>• {ud}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Comparative Disclaimer */}
              <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-lg text-xs text-amber-200">
                <strong>Comparative Disclaimer:</strong> {comparisonResult.disclaimer}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SAVED SCENARIOS / HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="glass-panel rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E3E62]">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" />
              Saved Policy Simulation Runs
            </h3>
            <button
              onClick={loadScenarios}
              disabled={historyLoading}
              className="p-1.5 bg-[#070F1E] hover:bg-[#1E3E62] text-slate-300 border border-[#1E3E62] rounded text-xs flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {scenariosList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No saved scenarios found. Run a simulation in the Flight Simulator tab to generate records.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenariosList.map((scn) => (
                <div key={scn.scenario_id} className="p-4 bg-[#070F1E] rounded-xl border border-[#1E3E62] flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[#1E3E62]/60">
                      <span className="font-mono text-xs font-bold text-amber-300">
                        {scn.scenario_id}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(scn.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white mt-2">
                      {scn.region_name}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Sector: {scn.sector} • {scn.intervention_type}
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2 bg-[#0B192C] rounded">
                        <span className="text-[10px] text-slate-400 block font-sans">Coverage Delta</span>
                        <span className="text-amber-400 font-bold">+{scn.assumptions.coverage_improvement_pct}%</span>
                      </div>
                      <div className="p-2 bg-[#0B192C] rounded">
                        <span className="text-[10px] text-slate-400 block font-sans">Gap Reduction</span>
                        <span className="text-emerald-400 font-bold">-{scn.estimates.estimated_gap_reduction_pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1E3E62]/40 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setScenarioResult(scn);
                        setActiveTab('simulator');
                      }}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      Load into Simulator <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleArchive(scn.scenario_id)}
                      className="text-xs text-slate-500 hover:text-red-400 transition-colors p-1"
                      title="Archive Scenario"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
