import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  EyeOff, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  ArrowRight,
  ShieldAlert,
  Filter,
  BarChart2
} from 'lucide-react';
import { fetchDemandShadowMatrix, fetchDemandShadowGrid } from '../lib/api';
import { DemandShadowMatrixItem, DemandShadowMatrixResponse } from '../types';

interface DemandShadowMapProps {
  onSelectRegion: (geoId: string) => void;
  onOpenEvidence: (signalId: string) => void;
}

export const DemandShadowMap: React.FC<DemandShadowMapProps> = ({ onSelectRegion, onOpenEvidence }) => {
  const [matrixItems, setMatrixItems] = useState<DemandShadowMatrixItem[]>([]);
  const [summary, setSummary] = useState<DemandShadowMatrixResponse['summary'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<DemandShadowMatrixItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedQuadrant, setSelectedQuadrant] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    fetchDemandShadowMatrix({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      state_code: selectedState === 'all' ? undefined : selectedState,
      quadrant: selectedQuadrant === 'all' ? undefined : selectedQuadrant
    })
      .then((res) => {
        if (res && res.matrix) {
          setMatrixItems(res.matrix);
          setSummary(res.summary);
          if (res.matrix.length > 0) {
            setSelectedItem(res.matrix[0]);
          } else {
            setSelectedItem(null);
          }
        }
      })
      .catch((err) => {
        console.warn("fetchDemandShadowMatrix fallback to fetchDemandShadowGrid:", err);
        // Fallback to legacy grid if endpoint fails
        fetchDemandShadowGrid()
          .then((legacy) => {
            const mapped: DemandShadowMatrixItem[] = (legacy.zones || []).map((z) => ({
              geo_id: z.geo_id,
              region_name: z.name,
              state_code: z.state,
              geo_level: 'district',
              latitude: z.latitude,
              longitude: z.longitude,
              population: z.population,
              digital_access_score: z.digital_connectivity,
              voice_intensity: z.layer_a_voice_density,
              infrastructure_need: z.layer_b_infra_need,
              discrepancy_magnitude: z.discrepancy,
              raw_request_count: z.total_requests || 0,
              quadrant: z.quadrant === 'CONFIRMED_DEMAND_HOTSPOT' ? 'HIGH_VOICE_HIGH_NEED'
                : z.quadrant === 'POTENTIAL_SILENT_NEED' ? 'LOW_VOICE_HIGH_NEED'
                : z.quadrant === 'REQUIRES_VALIDATION' ? 'HIGH_VOICE_LOW_NEED'
                : 'LOW_VOICE_LOW_NEED',
              quadrant_label: z.quadrant.replace(/_/g, ' '),
              quadrant_description: 'Dual-layer analytical comparison between citizen voice density and audited infrastructure deficit.',
              action_guidance: 'Administrative verification recommended.',
              status_color: z.marker_color || '#EF4444',
              category: 'ALL',
              time_window_days: 14,
              analytical_version: 'v5.0-deterministic',
              disclaimer: 'AI-Derived Analytical Signal — Not Official Policy'
            }));
            setMatrixItems(mapped);
            if (mapped.length > 0) setSelectedItem(mapped[0]);
          })
          .catch((e) => console.error("Demand shadow load error:", e));
      })
      .finally(() => setLoading(false));
  }, [selectedCategory, selectedState, selectedQuadrant]);

  const categories = ['all', 'transport', 'water', 'healthcare', 'roads', 'sanitation', 'electricity'];
  const states = ['all', 'TN', 'UP', 'MH', 'TG', 'RJ', 'KA'];
  const quadrants = [
    { key: 'all', label: 'All Quadrants' },
    { key: 'HIGH_VOICE_HIGH_NEED', label: 'Demand Hotspots (High Voice / High Need)' },
    { key: 'LOW_VOICE_HIGH_NEED', label: 'Potential Discrepancies (Low Voice / High Need)' },
    { key: 'HIGH_VOICE_LOW_NEED', label: 'Expressed Demand (High Voice / Low Need)' },
    { key: 'LOW_VOICE_LOW_NEED', label: 'Low Current Signal (Low Voice / Low Need)' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-xl p-6 border-l-4 border-l-purple-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              Dual-Layer Demand Shadow Intelligence Grid
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Fuses <strong>Citizen Voice Intensity (Axis X)</strong> against <strong>Infrastructure Need Deficit (Axis Y)</strong> to map spatial demand divergence.
              Identifies geographic zones where infrastructure deficits diverge from citizen reporting patterns.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="px-2.5 py-1 rounded bg-purple-950/60 text-purple-300 border border-purple-800/50 text-[11px] font-mono uppercase tracking-wider">
              SHADOW ENGINE v5.0
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              2D Analytical Matrix
            </span>
          </div>
        </div>

        {/* Mandatory Policy Disclaimer */}
        <div className="mt-4 pt-3 border-t border-[#1E3E62]/40 flex items-center gap-2 text-xs text-amber-300/90 bg-amber-950/20 px-3 py-2 rounded-lg border border-amber-800/30">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>AI-Derived Analytical Signal — Not Official Policy:</strong> Quadrant classifications represent comparative analytical indicators between citizen reporting volume and public baseline data. They do not constitute official policy, funding, or construction directives.
          </span>
        </div>

        {/* Filters */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#1E3E62]/30">
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

            {/* Quadrant */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400">Quadrant:</span>
              <select
                value={selectedQuadrant}
                onChange={(e) => setSelectedQuadrant(e.target.value)}
                className="bg-[#0B192C] text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-[#1E3E62] focus:outline-none focus:border-purple-500"
              >
                {quadrants.map((q) => (
                  <option key={q.key} value={q.key}>{q.label}</option>
                ))}
              </select>
            </div>
          </div>

          {summary && (
            <div className="text-xs font-mono text-slate-400 flex items-center gap-3">
              <span>Geographies Analyzed: <strong className="text-white">{summary.total_geographies_analyzed}</strong></span>
              <span>Avg Voice: <strong className="text-sky-300">{summary.average_voice_intensity}</strong></span>
              <span>Avg Need: <strong className="text-red-300">{summary.average_need_deficit}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* 4 Neutral Quadrants Legend Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/40 text-xs">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="font-bold text-red-200 uppercase tracking-wide">Demand Hotspot</span>
            </div>
            {summary?.quadrant_counts?.HIGH_VOICE_HIGH_NEED !== undefined && (
              <span className="font-mono text-xs text-red-300 font-bold">{summary.quadrant_counts.HIGH_VOICE_HIGH_NEED}</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">High Voice (≥ 0.40) + High Need (≥ 0.50)</p>
        </div>

        <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/40 text-xs">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              <span className="font-bold text-purple-200 uppercase tracking-wide">Potential Discrepancy</span>
            </div>
            {summary?.quadrant_counts?.LOW_VOICE_HIGH_NEED !== undefined && (
              <span className="font-mono text-xs text-purple-300 font-bold">{summary.quadrant_counts.LOW_VOICE_HIGH_NEED}</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">Low Voice (&lt; 0.40) + High Need (≥ 0.50)</p>
        </div>

        <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="font-bold text-amber-200 uppercase tracking-wide">Expressed Demand</span>
            </div>
            {summary?.quadrant_counts?.HIGH_VOICE_LOW_NEED !== undefined && (
              <span className="font-mono text-xs text-amber-300 font-bold">{summary.quadrant_counts.HIGH_VOICE_LOW_NEED}</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">High Voice (≥ 0.40) + Lower Need (&lt; 0.50)</p>
        </div>

        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="font-bold text-emerald-200 uppercase tracking-wide">Low Current Signal</span>
            </div>
            {summary?.quadrant_counts?.LOW_VOICE_LOW_NEED !== undefined && (
              <span className="font-mono text-xs text-emerald-300 font-bold">{summary.quadrant_counts.LOW_VOICE_LOW_NEED}</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">Low Voice (&lt; 0.40) + Lower Need (&lt; 0.50)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive 2D Matrix (X: Voice, Y: Need) */}
        <div className="lg:col-span-8 glass-panel rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>2D Demand Shadow Matrix (X: Voice Intensity vs. Y: Infrastructure Deficit)</span>
            </h3>
            <span className="text-xs text-slate-400">Click any point to inspect region</span>
          </div>

          <div className="relative w-full h-[440px] bg-[#070F1E] rounded-xl border border-[#1E3E62] p-8 flex flex-col justify-between overflow-hidden">
            {/* Quadrant Watermarks - Strictly Neutral Analytical Framing */}
            <div className="absolute top-4 left-6 text-purple-400/20 font-bold text-sm md:text-base select-none">
              POTENTIAL DEMAND-NEED DISCREPANCY
            </div>
            <div className="absolute top-4 right-6 text-red-400/20 font-bold text-sm md:text-base select-none">
              DEMAND HOTSPOT
            </div>
            <div className="absolute bottom-12 left-6 text-emerald-400/20 font-bold text-sm md:text-base select-none">
              LOW CURRENT SIGNAL
            </div>
            <div className="absolute bottom-12 right-6 text-amber-400/20 font-bold text-sm md:text-base select-none">
              EXPRESSED DEMAND / LOWER DEFICIT
            </div>

            {/* Threshold dividing lines at X=0.40 and Y=0.50 */}
            <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-[#1E3E62]/80"></div>
            <div className="absolute inset-y-0 left-[40%] border-r border-dashed border-[#1E3E62]/80"></div>

            {/* Render Nodes */}
            <div className="relative w-full h-full">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
                </div>
              ) : matrixItems.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No geographies match the selected filter criteria.
                </div>
              ) : (
                matrixItems.map((item) => {
                  const leftPct = Math.min(Math.max(item.voice_intensity * 90 + 5, 5), 95);
                  const bottomPct = Math.min(Math.max(item.infrastructure_need * 90 + 5, 5), 95);
                  const isSelected = selectedItem?.geo_id === item.geo_id;

                  return (
                    <button
                      key={item.geo_id}
                      onClick={() => setSelectedItem(item)}
                      style={{ left: `${leftPct}%`, bottom: `${bottomPct}%` }}
                      className="absolute -translate-x-1/2 translate-y-1/2 group transition-all duration-200 z-10"
                      title={`${item.region_name} (${item.state_code}): Voice=${item.voice_intensity}, Need=${item.infrastructure_need}`}
                    >
                      <div className="relative flex items-center justify-center">
                        <div 
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg transition-transform ${
                            isSelected ? 'scale-150 ring-4 ring-white' : 'hover:scale-125'
                          }`}
                          style={{ backgroundColor: item.status_color }}
                        >
                          {item.region_name.slice(0, 1)}
                        </div>
                        <span className="absolute -bottom-5 text-[10px] font-bold text-slate-200 whitespace-nowrap bg-black/70 px-1.5 py-0.5 rounded pointer-events-none">
                          {item.region_name}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Axis Labels */}
            <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono pt-3 border-t border-[#1E3E62] z-20 bg-[#070F1E]">
              <span>← Low Citizen Voice (Vvoice &lt; 0.40)</span>
              <span className="font-bold text-slate-200 uppercase tracking-wider">AXIS X: CITIZEN VOICE INTENSITY (Vvoice)</span>
              <span>High Citizen Voice (Vvoice ≥ 0.40) →</span>
            </div>
          </div>
        </div>

        {/* Selected Zone Deep Dive Card */}
        <div className="lg:col-span-4 glass-panel rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-400" />
            Geographic Profile & Analysis
          </h3>

          {selectedItem ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#070F1E] rounded-lg border border-[#1E3E62]">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white">{selectedItem.region_name}</h4>
                  <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
                    {selectedItem.state_code} • {selectedItem.geo_id}
                  </span>
                </div>
                <div className="mt-2 inline-block px-2.5 py-1 rounded text-xs font-bold" style={{
                  backgroundColor: `${selectedItem.status_color}25`,
                  color: selectedItem.status_color,
                  border: `1px solid ${selectedItem.status_color}60`
                }}>
                  {selectedItem.quadrant_label}
                </div>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                  {selectedItem.quadrant_description}
                </p>
              </div>

              {/* Metrics */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 bg-[#0B192C] rounded border border-[#1E3E62]">
                  <span className="text-slate-400">Total Population:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {selectedItem.population.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between p-2.5 bg-[#0B192C] rounded border border-[#1E3E62]">
                  <span className="text-slate-400">Digital Access Score:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {(selectedItem.digital_access_score * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="flex justify-between p-2.5 bg-[#0B192C] rounded border border-[#1E3E62]">
                  <span className="text-slate-400">Citizen Voice Intensity (X):</span>
                  <span className="font-mono font-bold text-orange-400">
                    {selectedItem.voice_intensity.toFixed(3)} ({selectedItem.raw_request_count} requests)
                  </span>
                </div>

                <div className="flex justify-between p-2.5 bg-[#0B192C] rounded border border-[#1E3E62]">
                  <span className="text-slate-400">Infrastructure Need Deficit (Y):</span>
                  <span className="font-mono font-bold text-red-400">
                    {selectedItem.infrastructure_need.toFixed(3)}
                  </span>
                </div>

                <div className="flex justify-between p-2.5 bg-[#0B192C] rounded border border-purple-500/40">
                  <span className="text-purple-300 font-semibold">Mathematical Discrepancy (Y - X):</span>
                  <span className="font-mono font-bold text-purple-300">
                    {selectedItem.discrepancy_magnitude > 0 ? `+${selectedItem.discrepancy_magnitude.toFixed(3)}` : selectedItem.discrepancy_magnitude.toFixed(3)}
                  </span>
                </div>
              </div>

              {/* Action Guidance */}
              <div className="p-3 rounded-lg bg-[#070F1E] border border-[#1E3E62]/60 text-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Analytical Guidance</span>
                <p className="text-slate-300">{selectedItem.action_guidance}</p>
              </div>

              {/* Data Provenance Notice */}
              <div className="text-[10px] text-slate-500 font-mono">
                Data: Public Datasets (Census, PMGSY, JJM) + Synthesized Citizen Voices.
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => onSelectRegion(selectedItem.geo_id)}
                  className="w-full py-2 px-3 rounded-lg bg-[#1E3E62] hover:bg-[#2b598d] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <span>Open Full Civic Digital Twin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Select any region in the matrix to view discrepancy telemetry.</p>
          )}
        </div>
      </div>
    </div>
  );
};
