import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  TrendingUp, 
  Users, 
  Layers, 
  ArrowUpRight, 
  Filter,
  Flame,
  CheckCircle2,
  Info,
  X,
  ShieldAlert,
  BarChart3
} from 'lucide-react';
import { fetchHotspots } from '../lib/api';
import { Hotspot } from '../types';

interface HotspotsViewProps {
  onSelectRegion: (geoId: string) => void;
}

export const HotspotsView: React.FC<HotspotsViewProps> = ({ onSelectRegion }) => {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [activeExplanation, setActiveExplanation] = useState<Hotspot | null>(null);

  useEffect(() => {
    fetchHotspots({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      hotspot_level: selectedLevel === 'all' ? undefined : selectedLevel
    })
      .then(setHotspots)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedCategory, selectedLevel]);

  const categories = ['all', 'transport', 'water', 'healthcare', 'roads', 'sanitation', 'electricity', 'education'];
  const levels = ['all', 'CRITICAL', 'HIGH', 'MODERATE'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel rounded-xl p-6 border-l-4 border-l-red-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-400" />
              Geospatial Expressed Demand Hotspots
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Identifies acute citizen demand concentrations where multiple citizens have independently reported infrastructure deficits.
              Synthesized via normalized voice intensity (<span className="font-mono text-xs text-sky-300">Vvoice</span>), population exposure, temporal velocity, and sector concentration.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="px-2.5 py-1 rounded bg-red-950/60 text-red-300 border border-red-800/50 text-[11px] font-mono uppercase tracking-wider">
              DISCOVER ENGINE v5.0
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Deterministic Hotspot Scoring
            </span>
          </div>
        </div>

        {/* Mandatory Policy Disclaimer Notice */}
        <div className="mt-4 pt-3 border-t border-[#1E3E62]/40 flex items-center gap-2 text-xs text-amber-300/90 bg-amber-950/20 px-3 py-2 rounded-lg border border-amber-800/30">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>AI-Derived Analytical Signal — Not Official Policy:</strong> Hotspot prioritizations represent localized citizen demand analytics for administrative review, not funding commitments or construction directives.
          </span>
        </div>

        {/* Filters Bar */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#1E3E62]/30">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-xl">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Sector:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                    : 'bg-[#1E3E62]/40 text-slate-300 hover:bg-[#1E3E62]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1">Level:</span>
            {levels.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${
                  selectedLevel === lvl
                    ? 'bg-amber-500 text-slate-900 font-bold shadow-md'
                    : 'bg-[#1E3E62]/40 text-slate-300 hover:bg-[#1E3E62]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hotspots Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 rounded-full border-4 border-red-500 border-t-transparent animate-spin"></div>
          <p className="text-xs font-semibold text-slate-400">Computing Hotspot Spatial & Temporal Metrics...</p>
        </div>
      ) : hotspots.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center text-slate-400 space-y-3">
          <MapPin className="w-10 h-10 mx-auto text-slate-500 opacity-60" />
          <p className="text-sm font-semibold">No demand hotspots found matching the selected filters.</p>
          <p className="text-xs text-slate-500">Try changing sector or severity filters to view wider regional signals.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotspots.map((h) => (
            <div 
              key={h.hotspot_id} 
              className="glass-panel rounded-xl p-5 border border-[#1E3E62] hover:border-red-500/50 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                      h.hotspot_level === 'CRITICAL' 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                        : h.hotspot_level === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}>
                      {h.hotspot_level}
                    </span>
                    {h.hotspot_score !== undefined && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px] font-mono border border-slate-700">
                        Score: {h.hotspot_score.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs text-slate-400 uppercase">
                    {h.category}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1">
                  {h.region_name}
                </h3>
                <p className="text-xs text-slate-400 mb-3">
                  {h.state_name} • GeoID: <span className="font-mono">{h.geo_id}</span>
                </p>

                <p className="text-xs text-slate-200 font-medium bg-[#070F1E] p-3 rounded-lg border border-[#1E3E62]/60 mb-4 line-clamp-2">
                  "{h.top_issue}"
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="p-2 bg-[#0B192C] rounded border border-[#1E3E62]">
                    <span className="text-slate-400 text-[10px] uppercase block">Citizen Requests</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {h.total_requests.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-2 bg-[#0B192C] rounded border border-[#1E3E62]">
                    <span className="text-slate-400 text-[10px] uppercase block">Population Impacted</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {h.estimated_population_impacted.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 mb-4 font-mono">
                  <span>Demand Velocity:</span>
                  <span className={`font-bold flex items-center gap-1 ${
                    h.growth_trend.includes('RAPID') || h.growth_trend.includes('CRITICAL')
                      ? 'text-red-400'
                      : h.growth_trend.includes('INCREASING') || h.growth_trend.includes('NEW')
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}>
                    <TrendingUp className="w-3.5 h-3.5" />
                    {h.growth_trend.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#1E3E62]/40">
                <button
                  type="button"
                  onClick={() => setActiveExplanation(h)}
                  className="w-full py-1.5 px-3 rounded-lg bg-[#0F223A] hover:bg-[#1A385C] text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-all border border-[#1E3E62]"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Explain Analytical Signal</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectRegion(h.geo_id)}
                  className="w-full py-2 px-3 rounded-lg bg-[#1E3E62] hover:bg-red-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <span>Drill Down into Civic Digital Twin</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytical Explainability Modal */}
      {activeExplanation && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 border border-[#1E3E62] max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-[#1E3E62]">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                    activeExplanation.hotspot_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}>
                    {activeExplanation.hotspot_level}
                  </span>
                  <span className="font-mono text-xs text-slate-400">{activeExplanation.category.toUpperCase()}</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{activeExplanation.region_name} — Demand Hotspot Analysis</h3>
                <p className="text-xs text-slate-400 font-mono">ID: {activeExplanation.hotspot_id} • GeoID: {activeExplanation.geo_id}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveExplanation(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation Summary */}
            <div className="mt-4 p-4 rounded-xl bg-[#070F1E] border border-[#1E3E62]/60 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-sky-400" />
                Analytical Synthesis Summary
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed">
                {activeExplanation.explanation?.summary || `Recorded ${activeExplanation.total_requests} citizen requests for ${activeExplanation.category} in ${activeExplanation.region_name}. Evaluated with deterministic multi-factor scoring.`}
              </p>
            </div>

            {/* 4 Deterministic Components */}
            <div className="mt-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Deterministic Scoring Components</h4>
              
              {/* Component 1: Voice Intensity */}
              <div className="p-3 rounded-lg bg-[#0B192C] border border-[#1E3E62] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">1. Citizen Voice Intensity (Vvoice)</span>
                  <span className="text-[11px] text-slate-400">
                    {activeExplanation.explanation?.requests_per_1000 ? `${activeExplanation.explanation.requests_per_1000} requests per 1,000 population` : `Derived from citizen intake volume`}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-bold text-sky-400 block">{activeExplanation.voice_intensity_score.toFixed(3)}</span>
                  <span className="text-[10px] text-slate-500">Weight: 40%</span>
                </div>
              </div>

              {/* Component 2: Population Exposure */}
              <div className="p-3 rounded-lg bg-[#0B192C] border border-[#1E3E62] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">2. Population Exposure</span>
                  <span className="text-[11px] text-slate-400">
                    {activeExplanation.estimated_population_impacted.toLocaleString('en-IN')} citizens in catchment area
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-bold text-sky-400 block">
                    {Math.min(1.0, activeExplanation.estimated_population_impacted / 100000).toFixed(3)}
                  </span>
                  <span className="text-[10px] text-slate-500">Weight: 25%</span>
                </div>
              </div>

              {/* Component 3: Demand Velocity */}
              <div className="p-3 rounded-lg bg-[#0B192C] border border-[#1E3E62] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">3. Demand Velocity & Trend</span>
                  <span className="text-[11px] text-slate-400">
                    Trend: {activeExplanation.growth_trend.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-bold text-sky-400 block">
                    {activeExplanation.velocity_score !== undefined ? activeExplanation.velocity_score.toFixed(2) : '0.00'}
                  </span>
                  <span className="text-[10px] text-slate-500">Weight: 20%</span>
                </div>
              </div>

              {/* Component 4: Category Concentration */}
              <div className="p-3 rounded-lg bg-[#0B192C] border border-[#1E3E62] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">4. Sector Concentration Ratio</span>
                  <span className="text-[11px] text-slate-400">
                    Proportion of local citizen concerns concentrated in {activeExplanation.category}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-bold text-sky-400 block">
                    {activeExplanation.concentration_ratio !== undefined ? activeExplanation.concentration_ratio.toFixed(2) : '0.50'}
                  </span>
                  <span className="text-[10px] text-slate-500">Weight: 15%</span>
                </div>
              </div>
            </div>

            {/* Disclaimer in Modal */}
            <div className="mt-5 p-3 rounded-lg bg-amber-950/20 border border-amber-800/30 text-[11px] text-amber-300/80 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                <strong>Policy Notice:</strong> {activeExplanation.disclaimer || "AI-Derived Analytical Signal — Not Official Policy. Provided strictly for administrative prioritization and operational verification."}
              </span>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveExplanation(null)}
                className="px-4 py-2 rounded-lg bg-[#1E3E62] hover:bg-[#2A5485] text-white text-xs font-semibold"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
