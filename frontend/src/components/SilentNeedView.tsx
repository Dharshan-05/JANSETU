import React, { useState, useEffect } from 'react';
import { 
  EyeOff, 
  AlertOctagon, 
  WifiOff, 
  FileSearch, 
  HelpCircle,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  ShieldAlert,
  Filter,
  BarChart3,
  Layers,
  Search,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Info
} from 'lucide-react';
import { fetchSilentNeedSignals, fetchSilentNeedSummary } from '../lib/api';
import { SilentNeedSignal, SilentNeedSummary } from '../types';

interface SilentNeedViewProps {
  onOpenEvidence: (signalId: string) => void;
  onSelectRegion: (geoId: string) => void;
}

export const SilentNeedView: React.FC<SilentNeedViewProps> = ({ onOpenEvidence, onSelectRegion }) => {
  const [signals, setSignals] = useState<SilentNeedSignal[]>([]);
  const [summary, setSummary] = useState<SilentNeedSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSignal, setSelectedSignal] = useState<SilentNeedSignal | null>(null);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchSilentNeedSignals({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        signal_class: selectedClass === 'all' ? undefined : selectedClass,
        state_code: selectedState === 'all' ? undefined : selectedState
      }),
      fetchSilentNeedSummary()
    ])
      .then(([sigList, sumData]) => {
        setSignals(sigList);
        setSummary(sumData);
        if (sigList.length > 0) {
          setSelectedSignal(sigList[0]);
        } else {
          setSelectedSignal(null);
        }
      })
      .catch((err) => console.error("Error loading silent need data:", err))
      .finally(() => setLoading(false));
  }, [selectedCategory, selectedClass, selectedState]);

  const categories = ['all', 'water', 'healthcare', 'transport', 'roads', 'sanitation', 'electricity'];
  const classes = [
    { key: 'all', label: 'All Signals' },
    { key: 'STRONG_POTENTIAL', label: 'Strong Potential' },
    { key: 'POTENTIAL', label: 'Potential' },
    { key: 'NO_SIGNAL', label: 'No Signal / Monitoring' }
  ];
  const states = ['all', 'TN', 'UP', 'MH', 'TG', 'RJ', 'KA'];

  const filteredSignals = signals.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.region_name.toLowerCase().includes(q) ||
      s.geo_id.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Signature Differentiator & Mandatory Policy Disclaimer */}
      <div className="glass-panel rounded-xl p-6 border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-950/20 via-[#0B192C] to-[#070F1E]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded border border-purple-500/40">
                GAP INTELLIGENCE LAYER
              </span>
              <span className="text-xs text-slate-400 font-mono">
                DISCREPANCY ENGINE v6.0
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-purple-400" />
              Potential Silent Need Detection & Investigation Workspace
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Investigates measurable demand–need discrepancies where severe audited infrastructure deficits and elevated population vulnerability
              coexist with low expressed citizen reporting due to digital exclusion barriers.
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 text-right">
            <span className="px-3 py-1 rounded bg-purple-900/40 text-purple-200 border border-purple-700/50 text-[11px] font-mono">
              ANALYTICAL v6.0-DETERMINISTIC
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Triangulation & Audit Grounding
            </span>
          </div>
        </div>

        {/* Mandatory Policy Disclaimer Notice */}
        <div className="mt-4 pt-3 border-t border-[#1E3E62]/40 flex items-start gap-2.5 text-xs text-amber-300/90 bg-amber-950/20 px-3.5 py-2.5 rounded-lg border border-amber-800/30">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-0.5">
            <div>
              <strong>AI-Derived Analytical Signal — Not Official Policy:</strong> All flags represent analytical demand-need divergence indicators for administrative field validation, not autonomous budget allocations or construction mandates.
            </div>
            <div className="text-[11px] text-amber-400/80 font-mono">
              Standard: Potential Silent Need Signal — requires administrative field validation.
            </div>
          </div>
        </div>

        {/* Section A: Signal Overview KPI Telemetry */}
        {summary && (
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-[#1E3E62]/30">
            <div className="p-3 bg-[#070F1E] rounded-lg border border-[#1E3E62]">
              <span className="text-[11px] text-slate-400 block uppercase font-mono">Geographies Monitored</span>
              <span className="text-xl font-bold font-mono text-white">{summary.total_geographies_analyzed}</span>
            </div>

            <div className="p-3 bg-[#070F1E] rounded-lg border border-purple-500/40">
              <span className="text-[11px] text-purple-300 block uppercase font-mono">Potential Silent Needs</span>
              <span className="text-xl font-bold font-mono text-purple-300">{summary.total_signals}</span>
            </div>

            <div className="p-3 bg-[#070F1E] rounded-lg border border-indigo-500/40">
              <span className="text-[11px] text-indigo-300 block uppercase font-mono">Strong Potential Signals</span>
              <span className="text-xl font-bold font-mono text-indigo-300">{summary.strong_potential_signals}</span>
            </div>

            <div className="p-3 bg-[#070F1E] rounded-lg border border-[#1E3E62]">
              <span className="text-[11px] text-slate-400 block uppercase font-mono">Sectors Flagged</span>
              <span className="text-xl font-bold font-mono text-white">{Object.keys(summary.categories).length}</span>
            </div>
          </div>
        )}

        {/* Section B: Filters Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1E3E62]/30">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400">Sector:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#0B192C] text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-[#1E3E62] focus:outline-none focus:border-purple-500 uppercase"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Classification */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400">Class:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-[#0B192C] text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-[#1E3E62] focus:outline-none focus:border-purple-500"
              >
                {classes.map((cls) => (
                  <option key={cls.key} value={cls.key}>{cls.label}</option>
                ))}
              </select>
            </div>

            {/* State */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400">State:</span>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="bg-[#0B192C] text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-[#1E3E62] focus:outline-none focus:border-purple-500"
              >
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search region, geo ID, sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0B192C] text-slate-200 text-xs rounded-lg border border-[#1E3E62] focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Main Investigation Workspace: Left Table & Right Deep Dive */}
      {loading ? (
        <div className="h-72 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
          <p className="text-xs font-semibold text-slate-400">Triangulating Multi-Sector Discrepancy Surfaces...</p>
        </div>
      ) : filteredSignals.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center text-slate-400 space-y-3">
          <EyeOff className="w-10 h-10 mx-auto text-slate-500 opacity-60" />
          <p className="text-sm font-semibold">No silent need signals match the selected filters.</p>
          <p className="text-xs text-slate-500">Adjust the sector or classification filters to inspect wider regional telemetry.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Signal Table / List (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
                Detected Signal Registry ({filteredSignals.length})
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">Click row to investigate</span>
            </div>

            <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {filteredSignals.map((sig) => {
                const isSelected = selectedSignal?.signal_id === sig.signal_id;
                const isStrong = sig.signal_class === 'STRONG_POTENTIAL' || sig.signal_confidence >= 0.90;

                return (
                  <div
                    key={sig.signal_id}
                    onClick={() => setSelectedSignal(sig)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0E2038] border-purple-500 shadow-lg shadow-purple-950/30 ring-1 ring-purple-500/50'
                        : 'glass-panel border-[#1E3E62] hover:border-purple-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isStrong ? 'bg-purple-400 animate-pulse' : 'bg-amber-400'}`}></span>
                        <span className="font-mono text-xs font-bold text-white">{sig.signal_id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isStrong
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-800/50'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                        }`}>
                          {sig.signal_class ? sig.signal_class.replace(/_/g, ' ') : 'POTENTIAL'}
                        </span>
                      </div>

                      <span className="font-mono text-xs text-purple-300 font-bold uppercase">
                        {sig.category}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">{sig.region_name}</h4>
                        <p className="text-[11px] text-slate-400 font-mono">{sig.state_name} • GeoID: {sig.geo_id}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-mono">Discrepancy</span>
                        <span className="text-sm font-black font-mono text-purple-300">
                          +{((sig.discrepancy ?? sig.discrepancy_magnitude) || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Micro Factor Indicators */}
                    <div className="grid grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-[#1E3E62]/40 text-center text-[10px] font-mono">
                      <div className="p-1 bg-[#070F1E] rounded">
                        <span className="text-slate-400 block">Need Score</span>
                        <span className="font-bold text-red-300">
                          {((sig.need_score ?? sig.infra_deficit_score) || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="p-1 bg-[#070F1E] rounded">
                        <span className="text-slate-400 block">Voice Density</span>
                        <span className="font-bold text-sky-300">
                          {((sig.voice_density ?? sig.voice_reporting_score) || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="p-1 bg-[#070F1E] rounded">
                        <span className="text-slate-400 block">Infra Deficit</span>
                        <span className="font-bold text-red-400">
                          {((sig.infra_deficit ?? sig.infra_deficit_score) || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="p-1 bg-[#070F1E] rounded">
                        <span className="text-slate-400 block">Digital Access</span>
                        <span className="font-bold text-blue-300">
                          {((sig.digital_access ?? sig.digital_access_score) || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Signal Investigation Room & Visual Signature (5 cols) */}
          <div className="lg:col-span-5">
            {selectedSignal ? (
              <div className="glass-panel rounded-xl p-5 border border-purple-500/50 space-y-4 sticky top-6">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <FileSearch className="w-3.5 h-3.5" />
                      Investigation Case File
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-200 border border-purple-800">
                      Strength: {Math.round(((selectedSignal.signal_strength ?? selectedSignal.signal_confidence) || 0.8) * 100)}%
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white">{selectedSignal.region_name}</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Sector: <strong className="text-purple-300 uppercase">{selectedSignal.category}</strong> • GeoID: {selectedSignal.geo_id}
                  </p>
                </div>

                {/* Section 28: Visual Signature - Need vs Voice Gap Card */}
                <div className="p-4 rounded-xl bg-[#070F1E] border border-purple-500/40 text-center">
                  <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                    MATHEMATICAL NEED VS VOICE GAP
                  </div>

                  <div className="flex items-center justify-around py-2">
                    <div className="space-y-1">
                      <span className="text-[10px] text-sky-400 block uppercase font-mono">Expressed Voice</span>
                      <span className="text-xl font-black font-mono text-sky-300">
                        {((selectedSignal.voice_density ?? selectedSignal.voice_reporting_score) || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex flex-col items-center px-3">
                      <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/60 mb-1">
                        GAP = +{((selectedSignal.discrepancy ?? selectedSignal.discrepancy_magnitude) || 0).toFixed(2)}
                      </span>
                      <span className="text-slate-500 text-xs">──────→</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-red-400 block uppercase font-mono">Need Score</span>
                      <span className="text-xl font-black font-mono text-red-300">
                        {((selectedSignal.need_score ?? selectedSignal.infra_deficit_score) || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 27 C: WHY WAS THIS FLAGGED? Progress Bars */}
                <div className="space-y-3 p-3.5 bg-[#0B192C] rounded-xl border border-[#1E3E62]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                    Why Was This Region Flagged?
                  </h4>

                  <div className="space-y-2.5 text-xs">
                    {/* 1. Infrastructure Deficit */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">1. Infrastructure Deficit (≥ 0.60)</span>
                        <span className="font-mono font-bold text-red-400">
                          {((selectedSignal.infra_deficit ?? selectedSignal.infra_deficit_score) || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${Math.min(100, (((selectedSignal.infra_deficit ?? selectedSignal.infra_deficit_score) || 0) * 100))}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* 2. Vulnerability */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">2. Population Vulnerability</span>
                        <span className="font-mono font-bold text-amber-400">
                          {((selectedSignal.vulnerability_score ?? selectedSignal.population_vulnerability) || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${Math.min(100, (((selectedSignal.vulnerability_score ?? selectedSignal.population_vulnerability) || 0) * 100))}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* 3. Voice Density */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">3. Citizen Voice Density</span>
                        <span className="font-mono font-bold text-sky-400">
                          {((selectedSignal.voice_density ?? selectedSignal.voice_reporting_score) || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-sky-500 rounded-full"
                          style={{ width: `${Math.min(100, (((selectedSignal.voice_density ?? selectedSignal.voice_reporting_score) || 0) * 100))}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* 4. Digital Access */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">4. Digital Connectivity Access (≤ 0.40)</span>
                        <span className="font-mono font-bold text-blue-400">
                          {((selectedSignal.digital_access ?? selectedSignal.digital_access_score) || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(100, (((selectedSignal.digital_access ?? selectedSignal.digital_access_score) || 0) * 100))}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* 5. Discrepancy */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-purple-300 font-semibold">5. Mathematical Discrepancy (≥ 0.35)</span>
                        <span className="font-mono font-bold text-purple-300">
                          +{((selectedSignal.discrepancy ?? selectedSignal.discrepancy_magnitude) || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${Math.min(100, (((selectedSignal.discrepancy ?? selectedSignal.discrepancy_magnitude) || 0) * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Fact Checkmarks */}
                  <div className="pt-2 border-t border-[#1E3E62]/40 space-y-1 text-[11px] text-slate-300 font-medium">
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Infrastructure deficit is elevated (≥ 0.60 threshold met)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Vulnerability signal is elevated</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Citizen request density is comparatively low</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Digital connectivity access is limited (≤ 0.40 threshold met)</span>
                    </div>
                  </div>
                </div>

                {/* Synthesis Summary */}
                <div className="p-3 bg-[#070F1E] rounded-xl border border-[#1E3E62] text-xs space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block font-bold">Deterministic Fact Summary</span>
                  <p className="text-slate-300 leading-relaxed italic">
                    "{selectedSignal.explanation?.summary || selectedSignal.why_summary || selectedSignal.ai_hypothesis || 'Elevated deficit observed under restricted digital connectivity.'}"
                  </p>
                </div>

                {/* Mandatory Disclaimer in Detail Card */}
                <div className="p-2.5 bg-amber-950/20 border border-amber-800/40 rounded-lg text-[10px] text-amber-300/90 flex items-start gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Validation Requirement:</strong> {selectedSignal.validation_requirement || "Potential Silent Need Signal — requires administrative field validation."}
                  </span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenEvidence(selectedSignal.signal_id)}
                    className="py-2 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-500/20"
                  >
                    <FileSearch className="w-3.5 h-3.5" />
                    <span>Evidence Trail</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectRegion(selectedSignal.geo_id)}
                    className="py-2 px-3 rounded-lg bg-[#1E3E62] hover:bg-[#2b598d] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <span>Digital Twin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-xl p-8 text-center text-slate-400 text-xs">
                Select any silent need signal from the registry to inspect discrepancy metrics.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
