import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  EyeOff, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  ArrowRight
} from 'lucide-react';
import { fetchDemandShadowGrid } from '../lib/api';
import { DemandShadowZone } from '../types';

interface DemandShadowMapProps {
  onSelectRegion: (geoId: string) => void;
  onOpenEvidence: (signalId: string) => void;
}

export const DemandShadowMap: React.FC<DemandShadowMapProps> = ({ onSelectRegion, onOpenEvidence }) => {
  const [zones, setZones] = useState<DemandShadowZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<DemandShadowZone | null>(null);

  useEffect(() => {
    fetchDemandShadowGrid()
      .then((res) => {
        setZones(res.zones);
        if (res.zones.length > 0) setSelectedZone(res.zones[0]);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
        <p className="text-sm font-semibold text-slate-300">Computing Dual-Layer Demand Shadow Matrix...</p>
      </div>
    );
  }

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
              Simultaneously fuses Layer A (Citizen Voice Density) against Layer B (Audited Infrastructure Deficit). 
              Regions in the upper-left quadrant exhibit severe infrastructure deficit despite negligible citizen complaints, exposing 
              <strong> Potential Silent Need Signals</strong> obscured by digital exclusion.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-purple-950/60 text-purple-300 border border-purple-800/50">
              DISCREPANCY ENGINE ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* 4 Quadrants Legend Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/40 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="font-bold text-red-200">CONFIRMED HOTSPOT</span>
          </div>
          <p className="text-[11px] text-slate-400">High Voice + High Need Deficit</p>
        </div>

        <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/40 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
            <span className="font-bold text-purple-200">POTENTIAL SILENT NEED</span>
          </div>
          <p className="text-[11px] text-slate-400">Low Voice + High Need Deficit</p>
        </div>

        <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="font-bold text-amber-200">REQUIRES VALIDATION</span>
          </div>
          <p className="text-[11px] text-slate-400">High Voice + Low Need Deficit</p>
        </div>

        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="font-bold text-emerald-200">STABILIZED BASELINE</span>
          </div>
          <p className="text-[11px] text-slate-400">Low Voice + Low Need Deficit</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive 2D Shadow Space (X: Voice, Y: Need) */}
        <div className="lg:col-span-8 glass-panel rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>Dual-Axis Discrepancy Matrix (Voice vs. Need)</span>
            </h3>
            <span className="text-xs text-slate-400">Click any node to inspect region</span>
          </div>

          <div className="relative w-full h-[420px] bg-[#070F1E] rounded-xl border border-[#1E3E62] p-8 flex flex-col justify-between">
            {/* Quadrant Watermarks */}
            <div className="absolute top-4 left-6 text-purple-400/20 font-bold text-lg select-none">
              POTENTIAL SILENT NEED QUADRANT
            </div>
            <div className="absolute top-4 right-6 text-red-400/20 font-bold text-lg select-none">
              CONFIRMED DEMAND HOTSPOT
            </div>
            <div className="absolute bottom-4 left-6 text-emerald-400/20 font-bold text-lg select-none">
              STABILIZED BASELINE
            </div>
            <div className="absolute bottom-4 right-6 text-amber-400/20 font-bold text-lg select-none">
              VOICE DISCREPANCY (SPAM / NIMBY)
            </div>

            {/* Threshold dividing lines */}
            <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-[#1E3E62]"></div>
            <div className="absolute inset-y-0 left-1/2 border-r border-dashed border-[#1E3E62]"></div>

            {/* Render Nodes */}
            <div className="relative w-full h-full">
              {zones.map((z) => {
                // X position: Voice Density (0 to 1 -> left to right)
                // Y position: Infra Need (0 to 1 -> bottom to top)
                const leftPct = Math.min(Math.max(z.layer_a_voice_density * 90 + 5, 5), 95);
                const bottomPct = Math.min(Math.max(z.layer_b_infra_need * 90 + 5, 5), 95);
                const isSelected = selectedZone?.geo_id === z.geo_id;

                return (
                  <button
                    key={z.geo_id}
                    onClick={() => setSelectedZone(z)}
                    style={{ left: `${leftPct}%`, bottom: `${bottomPct}%` }}
                    className={`absolute -translate-x-1/2 translate-y-1/2 group transition-all duration-200 z-10`}
                  >
                    <div className="relative flex items-center justify-center">
                      <div 
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg transition-transform ${
                          isSelected ? 'scale-150 ring-4 ring-white' : 'hover:scale-125'
                        }`}
                        style={{ backgroundColor: z.marker_color }}
                      >
                        {z.name.slice(0, 1)}
                      </div>
                      <span className="absolute -bottom-5 text-[10px] font-bold text-slate-200 whitespace-nowrap bg-black/60 px-1.5 py-0.5 rounded pointer-events-none">
                        {z.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Axis Labels */}
            <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono pt-4 border-t border-[#1E3E62]">
              <span>← Low Citizen Voice Reporting</span>
              <span className="font-bold text-slate-200 uppercase">LAYER A: CITIZEN VOICE INTENSITY</span>
              <span>High Citizen Voice Reporting →</span>
            </div>
          </div>
        </div>

        {/* Selected Zone Deep Dive Card */}
        <div className="lg:col-span-4 glass-panel rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Zone Discrepancy Profile
          </h3>

          {selectedZone ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#070F1E] rounded-lg border border-[#1E3E62]">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white">{selectedZone.name}</h4>
                  <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
                    {selectedZone.state}
                  </span>
                </div>
                <div className="mt-2 inline-block px-2.5 py-1 rounded text-xs font-bold" style={{
                  backgroundColor: `${selectedZone.marker_color}25`,
                  color: selectedZone.marker_color,
                  border: `1px solid ${selectedZone.marker_color}60`
                }}>
                  {selectedZone.quadrant.replace(/_/g, ' ')}
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between p-2.5 bg-[#0B192C] rounded border border-[#1E3E62]">
                  <span className="text-slate-400">Total Population:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {selectedZone.population.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between p-2.5 bg-[#0B192C] rounded border border-[#1E3E62]">
                  <span className="text-slate-400">Digital Penetration Index:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {Math.round(selectedZone.digital_connectivity * 100)}%
                  </span>
                </div>

                <div className="flex justify-between p-2.5 bg-[#0B192C] rounded border border-[#1E3E62]">
                  <span className="text-slate-400">Layer A: Voice Density:</span>
                  <span className="font-mono font-bold text-orange-400">
                    {selectedZone.layer_a_voice_density.toFixed(2)} ({selectedZone.total_requests} reports)
                  </span>
                </div>

                <div className="flex justify-between p-2.5 bg-[#0B192C] rounded border border-[#1E3E62]">
                  <span className="text-slate-400">Layer B: Audited Need Deficit:</span>
                  <span className="font-mono font-bold text-red-400">
                    {selectedZone.layer_b_infra_need.toFixed(2)} (Deficit)
                  </span>
                </div>

                <div className="flex justify-between p-2.5 bg-[#0B192C] rounded border border-purple-500/40">
                  <span className="text-purple-300 font-semibold">Mathematical Discrepancy:</span>
                  <span className="font-mono font-bold text-purple-300">
                    {selectedZone.discrepancy > 0 ? `+${selectedZone.discrepancy.toFixed(2)}` : selectedZone.discrepancy.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => onSelectRegion(selectedZone.geo_id)}
                  className="w-full py-2 px-3 rounded-lg bg-[#1E3E62] hover:bg-[#2b598d] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Open Full Civic Digital Twin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {selectedZone.quadrant === 'POTENTIAL_SILENT_NEED' && (
                  <button
                    type="button"
                    onClick={() => onOpenEvidence('SIG-SILENT-MH-001')}
                    className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-500/20"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Inspect Grounded Evidence Trail</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Select any region to view discrepancy metrics.</p>
          )}
        </div>
      </div>
    </div>
  );
};
