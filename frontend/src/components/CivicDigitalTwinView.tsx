import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Users, 
  Building2, 
  Layers, 
  MapPin, 
  TrendingUp, 
  ShieldAlert, 
  AlertTriangle,
  Sparkles,
  Compass
} from 'lucide-react';
import { fetchDigitalTwin } from '../lib/api';
import { CivicDigitalTwin } from '../types';

interface CivicDigitalTwinViewProps {
  selectedGeoId: string;
  onSelectGeoId: (geoId: string) => void;
  onOpenEvidence: (signalId: string) => void;
}

export const CivicDigitalTwinView: React.FC<CivicDigitalTwinViewProps> = ({ 
  selectedGeoId, 
  onSelectGeoId,
  onOpenEvidence 
}) => {
  const [twin, setTwin] = useState<CivicDigitalTwin | null>(null);
  const [loading, setLoading] = useState(true);

  const availableRegions = [
    { id: 'IND_TN_DHM_HRR', name: 'Harur Block (Dharmapuri, Tamil Nadu)' },
    { id: 'IND_TN_DHM_PNG', name: 'Pennagaram Block (Dharmapuri, Tamil Nadu)' },
    { id: 'IND_UP_VAR_PND', name: 'Pindra Block (Varanasi, Uttar Pradesh)' },
    { id: 'IND_UP_VAR_SVP', name: 'Sevapuri Block (Varanasi, Uttar Pradesh)' },
    { id: 'IND_TG_MBN_JDC', name: 'Jadcherla Block (Mahabubnagar, Telangana)' },
    { id: 'IND_MH_GDC_AHR', name: 'Aheri Tribal Block (Gadchiroli, Maharashtra)' },
  ];

  useEffect(() => {
    setLoading(true);
    fetchDigitalTwin(selectedGeoId || 'IND_TN_DHM_HRR')
      .then(setTwin)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedGeoId]);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"></div>
        <p className="text-sm font-semibold text-slate-300">Synchronizing Regional Civic Digital Twin...</p>
      </div>
    );
  }

  if (!twin) return null;

  return (
    <div className="space-y-6">
      {/* Header & Region Switcher */}
      <div className="glass-panel rounded-xl p-6 border-l-4 border-l-cyan-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/40">
                LGD: {twin.geo_id}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ADMIN LEVEL {twin.admin_level} (BLOCK / TALUK)
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">
              Civic Digital Twin: {twin.admin_name}
            </h2>
            <p className="text-xs text-slate-300">
              {twin.state_name} • Coordinates: {twin.latitude.toFixed(4)}° N, {twin.longitude.toFixed(4)}° E
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-semibold uppercase">Switch Region:</label>
            <select
              value={selectedGeoId}
              onChange={(e) => onSelectGeoId(e.target.value)}
              className="bg-[#070F1E] border border-[#1E3E62] text-xs text-slate-100 rounded-lg p-2 focus:outline-none focus:border-cyan-500 font-semibold"
            >
              {availableRegions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 5-Factor Digital Twin Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="p-3 bg-[#0B192C] rounded-lg border border-[#1E3E62] text-center">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Population Exposure</span>
          <span className={`text-xs font-mono font-bold mt-1 block ${
            twin.intelligence_summary.population_exposure === 'HIGH' ? 'text-red-400' : 'text-slate-200'
          }`}>
            {twin.intelligence_summary.population_exposure}
          </span>
        </div>

        <div className="p-3 bg-[#0B192C] rounded-lg border border-[#1E3E62] text-center">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Citizen Voice Level</span>
          <span className="text-xs font-mono font-bold mt-1 block text-orange-400">
            {twin.intelligence_summary.citizen_demand_level}
          </span>
        </div>

        <div className="p-3 bg-[#0B192C] rounded-lg border border-[#1E3E62] text-center">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Infrastructure Gap</span>
          <span className={`text-xs font-mono font-bold mt-1 block ${
            twin.intelligence_summary.infrastructure_gap === 'HIGH' ? 'text-red-400' : 'text-slate-200'
          }`}>
            {twin.intelligence_summary.infrastructure_gap}
          </span>
        </div>

        <div className="p-3 bg-[#0B192C] rounded-lg border border-[#1E3E62] text-center">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Digital Access</span>
          <span className={`text-xs font-mono font-bold mt-1 block ${
            twin.intelligence_summary.digital_access === 'LOW' ? 'text-purple-400' : 'text-slate-200'
          }`}>
            {twin.intelligence_summary.digital_access}
          </span>
        </div>

        <div className="p-3 bg-[#0B192C] rounded-lg border border-[#1E3E62] text-center">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Capex Coverage</span>
          <span className="text-xs font-mono font-bold mt-1 block text-emerald-400">
            {twin.intelligence_summary.investment_coverage}
          </span>
        </div>

        <div className="p-3 bg-[#0B192C] rounded-lg border border-purple-500/40 text-center bg-purple-950/20">
          <span className="text-[10px] text-purple-300 uppercase font-bold block">Silent Need Zones</span>
          <span className="text-xs font-mono font-black mt-1 block text-purple-300">
            {twin.silent_need_count} Potential
          </span>
        </div>
      </div>

      {/* Feature 7: Cross-Signal Discovery Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-950/40 via-[#0B192C] to-[#070F1E] rounded-xl border border-blue-500/40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider block">
              Feature 7 • AI Cross-Signal Discovery
            </span>
            <p className="text-xs text-slate-200 font-medium">
              Triangulating <strong>Ambulance Delay Reports</strong> + <strong>Arterial Road Defects</strong> + <strong>High Vulnerability ({Math.round(twin.population_metrics.vulnerability_percentage * 100)}%)</strong> → Inferred Critical Healthcare Access Hazard.
            </p>
          </div>
        </div>
        <span className="text-[10px] text-slate-400 font-mono italic shrink-0">
          Inferred Multi-Source Signal
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 6-Axis Civic Health Indicators */}
        <div className="lg:col-span-6 glass-panel rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Civic Health Indicators (0.0 to 1.0)</span>
            <span className="text-xs text-slate-500 font-mono">AUDITED REALITY</span>
          </h3>

          <div className="space-y-4">
            {[
              { name: 'Transport Accessibility', val: twin.civic_health_radar.transport_access, color: 'bg-orange-500' },
              { name: 'Potable Water Security', val: twin.civic_health_radar.water_security, color: 'bg-blue-500' },
              { name: 'Healthcare Proximity', val: twin.civic_health_radar.healthcare_proximity, color: 'bg-red-500' },
              { name: 'Education Infrastructure', val: twin.civic_health_radar.education_quality, color: 'bg-emerald-500' },
              { name: 'Power Grid Reliability', val: twin.civic_health_radar.power_reliability, color: 'bg-yellow-500' },
              { name: 'Sanitation & Solid Waste', val: twin.civic_health_radar.sanitation_index, color: 'bg-cyan-500' },
            ].map((idx) => (
              <div key={idx.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">{idx.name}</span>
                  <span className="font-mono font-bold text-slate-100">
                    {(idx.val * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-[#070F1E] h-2.5 rounded-full overflow-hidden border border-[#1E3E62]/40">
                  <div 
                    className={`h-full ${idx.color} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.round(idx.val * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Demographics Summary */}
          <div className="mt-6 pt-4 border-t border-[#1E3E62]/60">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Demographic & Vulnerability Baseline:
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-[#070F1E] rounded-lg border border-[#1E3E62]">
                <span className="text-[10px] text-slate-400 block uppercase">Total Population</span>
                <span className="font-mono font-bold text-slate-100">
                  {twin.population_metrics.total_population.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-2.5 bg-[#070F1E] rounded-lg border border-[#1E3E62]">
                <span className="text-[10px] text-slate-400 block uppercase">Vulnerability</span>
                <span className="font-mono font-bold text-red-400">
                  {Math.round(twin.population_metrics.vulnerability_percentage * 100)}% SECC
                </span>
              </div>

              <div className="p-2.5 bg-[#070F1E] rounded-lg border border-[#1E3E62]">
                <span className="text-[10px] text-slate-400 block uppercase">Digital Connectivity</span>
                <span className="font-mono font-bold text-blue-400">
                  {Math.round(twin.population_metrics.digital_penetration_index * 100)}%
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Primary Livelihood: <span className="text-slate-200 font-semibold">{twin.population_metrics.primary_livelihood}</span>
            </p>
          </div>
        </div>

        {/* Right: Active Semantic Clusters & Capex Projects */}
        <div className="lg:col-span-6 space-y-4">
          {/* Active Demand Clusters */}
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Active Semantic Demand Clusters</span>
              <span className="text-xs text-orange-400 font-mono font-bold">
                {twin.active_clusters.length} CLUSTERS
              </span>
            </h3>

            {twin.active_clusters.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No active demand clusters recorded for this region.</p>
            ) : (
              <div className="space-y-3">
                {twin.active_clusters.map((c) => (
                  <div key={c.cluster_id} className="p-3.5 bg-[#070F1E] rounded-lg border border-[#1E3E62]">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-white capitalize">{c.title}</span>
                      <span className="font-mono text-[10px] bg-orange-500/20 text-[#FF9933] px-2 py-0.5 rounded font-bold">
                        {c.request_count} REPORTS
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <span>Sector: <span className="text-slate-200 capitalize font-medium">{c.category}</span></span>
                      <span>Avg Severity: <span className="text-red-400 font-bold">{c.severity_score} / 5</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Capital Expenditure Pipeline */}
          <div className="glass-panel rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Active Public Capex Pipeline
              </h3>
              <span className="text-xs text-emerald-400 font-mono font-bold">
                ₹{(twin.allocated_capex_inr / 10000000).toFixed(2)} Cr Allocated
              </span>
            </div>

            <div className="p-3 bg-[#070F1E] rounded-lg border border-[#1E3E62] text-xs space-y-1">
              <span className="font-semibold text-slate-200 block">
                PMGSY-III Rural Road Widening & Blacktopping
              </span>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Status: <strong className="text-yellow-400">In Progress (72% Spent)</strong></span>
                <span>Target: Dec 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
