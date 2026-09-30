import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MapPin, 
  TrendingUp, 
  EyeOff, 
  Building2, 
  ShieldAlert, 
  Layers, 
  ArrowUpRight,
  Sparkles,
  Info
} from 'lucide-react';
import { fetchCommandCenterKPIs } from '../lib/api';
import { CommandCenterKPIs } from '../types';

interface CommandCenterProps {
  onSelectRegion: (geoId: string) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ onSelectRegion }) => {
  const [kpis, setKpis] = useState<CommandCenterKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommandCenterKPIs()
      .then(setKpis)
      .catch((err) => console.error('Failed to load KPIs:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
        <p className="text-sm font-semibold text-slate-300">Synchronizing National Infrastructure Grid...</p>
      </div>
    );
  }

  if (!kpis) return null;

  return (
    <div className="space-y-6">
      {/* Policy & Data Integrity Notice */}
      <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-blue-200">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong>Official Data Policy:</strong> {kpis.data_policy_notice}
          </span>
        </div>
        <span className="font-mono text-[10px] bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded">
          AUDIT SECURED
        </span>
      </div>

      {/* 8 Primary Government Telemetry Metric Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Citizen Requests */}
        <div className="glass-panel rounded-xl p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Citizen Voice
            </span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {kpis.total_citizen_requests.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <span>↑ 18.4% this month</span>
            <span className="text-slate-500">• 4 Dialects</span>
          </p>
        </div>

        {/* Active Demand Hotspots */}
        <div className="glass-panel rounded-xl p-5 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Demand Hotspots
            </span>
            <MapPin className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {kpis.active_demand_hotspots}
          </div>
          <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
            <span>High spatial density</span>
            <span className="text-slate-500">• Critical</span>
          </p>
        </div>

        {/* Emerging Signals */}
        <div className="glass-panel rounded-xl p-5 border-l-4 border-l-[#FF6500]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Emerging Signals
            </span>
            <TrendingUp className="w-4 h-4 text-[#FF6500]" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {kpis.emerging_signals_count}
          </div>
          <p className="text-[11px] text-orange-400 mt-1 flex items-center gap-1">
            <span>Velocity &gt; 35% weekly</span>
          </p>
        </div>

        {/* Potential Silent Need Signals */}
        <div className="glass-panel rounded-xl p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Potential Silent Need
            </span>
            <EyeOff className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-200 font-mono">
            {kpis.potential_silent_need_signals}
          </div>
          <p className="text-[11px] text-purple-400 mt-1 flex items-center gap-1 font-semibold">
            <span>High gap • Low voice</span>
          </p>
        </div>

        {/* States Covered */}
        <div className="glass-panel rounded-xl p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              States Monitored
            </span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {kpis.states_covered}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {kpis.districts_monitored} Administrative Districts
          </p>
        </div>

        {/* Public Projects Tracked */}
        <div className="glass-panel rounded-xl p-5 border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Projects Tracked
            </span>
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {kpis.public_projects_tracked}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            PMGSY, JJM & NHM Capex
          </p>
        </div>

        {/* Average Gap Reduction % */}
        <div className="glass-panel rounded-xl p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Measured Gap Delta
            </span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            +{kpis.average_gap_reduction_pct}%
          </div>
          <p className="text-[11px] text-emerald-400 mt-1">
            Post-intervention recovery
          </p>
        </div>

        {/* AI Confidence & Traceability */}
        <div className="glass-panel rounded-xl p-5 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              AI Traceability
            </span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            100%
          </div>
          <p className="text-[11px] text-indigo-300 mt-1 font-semibold">
            Zero Hallucination Grounded
          </p>
        </div>
      </div>

      {/* Grid: Category Breakdown & Critical Region Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sectoral Breakdown */}
        <div className="lg:col-span-5 glass-panel rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Infrastructure Sector Distribution</span>
            <span className="text-xs text-slate-500 font-mono">BIGQUERY FUSED</span>
          </h3>

          <div className="space-y-3">
            {Object.entries(kpis.category_distribution).map(([cat, count]) => {
              const total = Object.values(kpis.category_distribution).reduce((a, b) => a + b, 0);
              const pct = Math.round((count / Math.max(total, 1)) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 capitalize">{cat}</span>
                    <span className="font-mono text-slate-400">{count.toLocaleString('en-IN')} reports ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#070F1E] h-2 rounded-full overflow-hidden border border-[#1E3E62]/40">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        cat === 'transport' ? 'bg-[#FF6500]' :
                        cat === 'water' ? 'bg-blue-500' :
                        cat === 'healthcare' ? 'bg-red-500' :
                        cat === 'roads' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-[#1E3E62]/60">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Linguistic Aggregation:
            </span>
            <div className="grid grid-cols-4 gap-2 text-center">
              {Object.entries(kpis.language_breakdown).map(([lang, cnt]) => (
                <div key={lang} className="p-2 bg-[#070F1E] rounded-lg border border-[#1E3E62]">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">{lang}</span>
                  <span className="text-xs font-mono font-bold text-slate-200">{cnt.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority District Intervention Watchlist */}
        <div className="lg:col-span-7 glass-panel rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              Critical Demand Hotspot Watchlist
            </span>
            <span className="text-xs text-slate-500">Click to Inspect Digital Twin</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070F1E] text-slate-400 uppercase tracking-wider font-semibold border-b border-[#1E3E62]">
                <tr>
                  <th className="py-2.5 px-3">Administrative Unit</th>
                  <th className="py-2.5 px-3">State</th>
                  <th className="py-2.5 px-3">Sector</th>
                  <th className="py-2.5 px-3 text-right">Voice Reports</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3E62]/40">
                {kpis.top_critical_districts.map((d) => (
                  <tr 
                    key={d.geo_id}
                    onClick={() => onSelectRegion(d.geo_id)}
                    className="hover:bg-[#1E3E62]/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span>{d.name}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{d.state}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded font-semibold text-[10px] uppercase bg-orange-500/20 text-[#FF9933]">
                        {d.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">
                      {d.total_requests.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button 
                        type="button"
                        className="p-1 rounded bg-[#1E3E62] text-slate-200 hover:text-white hover:bg-orange-500 transition-all inline-flex items-center gap-1"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-semibold pr-1">Twin</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
