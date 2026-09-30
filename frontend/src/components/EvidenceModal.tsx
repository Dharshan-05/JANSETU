import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileSearch, 
  ShieldCheck, 
  Sparkles, 
  Database, 
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { fetchEvidenceBrief } from '../lib/api';
import { GroundedEvidenceBrief } from '../types';

interface EvidenceModalProps {
  signalId: string | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ signalId, onClose }) => {
  const [brief, setBrief] = useState<GroundedEvidenceBrief | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (signalId) {
      setLoading(true);
      fetchEvidenceBrief(signalId)
        .then(setBrief)
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [signalId]);

  if (!signalId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0B192C] border border-[#1E3E62] rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E3E62] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
            <FileSearch className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono font-bold text-purple-300">
            AUDIT TRAIL • {signalId}
          </span>
        </div>

        <h3 className="text-xl font-black text-white mb-1">
          Why This Region? — Grounded Evidence Engine
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Every AI insight in JANSETU is traceable to official open government datasets, Census metrics, and citizen intake telemetry.
        </p>

        {loading ? (
          <div className="h-60 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
            <p className="text-xs font-semibold text-slate-400">Retrieving Grounded Audit Records...</p>
          </div>
        ) : brief ? (
          <div className="space-y-5">
            {/* Target & Confidence */}
            <div className="p-3 bg-[#070F1E] rounded-xl border border-[#1E3E62] flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Target Region</span>
                <span className="font-bold text-slate-100">{brief.target_region}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Confidence Rating</span>
                <span className="font-mono font-bold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                  {Math.round(brief.confidence_rating * 100)}% Verified
                </span>
              </div>
            </div>

            {/* Gemini Synthesized Brief */}
            <div className="p-4 bg-gradient-to-r from-purple-950/30 to-[#070F1E] rounded-xl border border-purple-500/40 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-purple-300 font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Gemini Controlled Context Briefing</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {brief.gemini_summary}
              </p>
            </div>

            {/* Grounded Evidence Items Table */}
            <div>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                Grounding Dataset References:
              </span>
              <div className="space-y-2">
                {brief.grounded_evidence_trail.map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#070F1E] rounded-lg border border-[#1E3E62] text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-bold text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded">
                        {item.evidence_type}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Database className="w-3 h-3 text-slate-500" />
                        {item.dataset_source}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-semibold text-slate-200">{item.metric}:</span>
                      <span className="font-mono font-bold text-orange-300">{item.observed_value}</span>
                    </div>
                    {item.benchmark && (
                      <div className="flex justify-between text-[11px] text-slate-400 mt-0.5">
                        <span>National Benchmark: {item.benchmark}</span>
                        {item.deficit_percentage && (
                          <span className="text-red-400 font-semibold">{item.deficit_percentage}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-[11px] text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Policy Safety Guardrail:</strong> {brief.disclaimer}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
