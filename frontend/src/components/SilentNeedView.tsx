import React, { useState, useEffect } from 'react';
import { 
  EyeOff, 
  AlertOctagon, 
  WifiOff, 
  FileSearch, 
  HelpCircle,
  ShieldCheck,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { fetchSilentNeedSignals } from '../lib/api';
import { SilentNeedSignal } from '../types';

interface SilentNeedViewProps {
  onOpenEvidence: (signalId: string) => void;
  onSelectRegion: (geoId: string) => void;
}

export const SilentNeedView: React.FC<SilentNeedViewProps> = ({ onOpenEvidence, onSelectRegion }) => {
  const [signals, setSignals] = useState<SilentNeedSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSilentNeedSignals()
      .then(setSignals)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Signature Differentiator Banner */}
      <div className="glass-panel rounded-xl p-6 border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-950/20 via-[#0B192C] to-[#070F1E]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded border border-purple-500/40">
                SIGNATURE DIFFERENTIATOR
              </span>
              <span className="text-xs text-slate-400 font-mono">
                MATHEMATICAL DISCREPANCY PARADIGM
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-purple-400" />
              Potential Silent Need Detection Engine
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Traditional governance portals assume <em>more complaints = more need</em>. JANSETU investigates the counter-hypothesis: 
              pockets of acute infrastructural deficit and high population vulnerability with near-zero citizen complaints caused by 
              cellular shadows and digital exclusion.
            </p>
          </div>
          <div className="p-3 bg-[#070F1E] rounded-lg border border-purple-800/40 text-xs text-purple-200 font-medium max-w-xs">
            <span className="font-bold block text-purple-300 mb-0.5">⚠️ Governance Principle:</span>
            Signals are flagged as <em>"Potential Silent Need Signal — requires administrative field validation"</em> rather than autonomous budget mandates.
          </div>
        </div>
      </div>

      {/* Signal Cards */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
          <p className="text-xs font-semibold text-slate-400">Scanning National Discrepancy Surfaces...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {signals.map((sig) => (
            <div 
              key={sig.signal_id}
              className="glass-panel rounded-xl p-6 border border-purple-500/40 hover:border-purple-500 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse"></span>
                    <span className="text-xs font-mono font-bold text-purple-300">
                      {sig.signal_id}
                    </span>
                  </div>
                  <span className="text-[11px] bg-purple-950/80 text-purple-200 px-2.5 py-0.5 rounded font-mono border border-purple-800/40 font-semibold">
                    Confidence: {Math.round(sig.signal_confidence * 100)}%
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-0.5">
                  {sig.region_name}
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  {sig.state_name} • Sector: <span className="font-bold text-purple-300 uppercase">{sig.category}</span>
                </p>

                {/* 4 Factor Discrepancy Breakdown */}
                <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                  <div className="p-2 bg-[#070F1E] rounded-lg border border-red-500/30">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Infra Deficit</span>
                    <span className="text-sm font-mono font-black text-red-400">
                      {Math.round(sig.infra_deficit_score * 100)}%
                    </span>
                  </div>

                  <div className="p-2 bg-[#070F1E] rounded-lg border border-yellow-500/30">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Reporting Voice</span>
                    <span className="text-sm font-mono font-black text-yellow-400">
                      {Math.round(sig.voice_reporting_score * 100)}%
                    </span>
                  </div>

                  <div className="p-2 bg-[#070F1E] rounded-lg border border-blue-500/30">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Digital Access</span>
                    <span className="text-sm font-mono font-black text-blue-400">
                      {Math.round(sig.digital_access_score * 100)}%
                    </span>
                  </div>

                  <div className="p-2 bg-[#070F1E] rounded-lg border border-purple-500/50 bg-purple-950/20">
                    <span className="text-[10px] text-purple-300 block uppercase font-bold">Discrepancy</span>
                    <span className="text-sm font-mono font-black text-purple-300">
                      +{sig.discrepancy_magnitude.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* AI Grounded Hypothesis */}
                <div className="p-4 bg-[#070F1E] rounded-lg border border-[#1E3E62] mb-4 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-purple-300 font-semibold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Gemini Evidence-Backed Perception Hypothesis</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed italic">
                    "{sig.ai_hypothesis}"
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenEvidence(sig.signal_id)}
                  className="py-2.5 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-500/20"
                >
                  <FileSearch className="w-4 h-4" />
                  <span>Why This Region? (Evidence)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectRegion(sig.geo_id)}
                  className="py-2.5 px-3 rounded-lg bg-[#1E3E62] hover:bg-[#2b598d] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Open Digital Twin</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
