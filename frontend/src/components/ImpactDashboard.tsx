import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Building2,
  Calendar,
  ThumbsUp,
  BarChart2
} from 'lucide-react';
import { fetchImpactEvaluations } from '../lib/api';
import { ImpactMetric } from '../types';

export const ImpactDashboard: React.FC = () => {
  const [evaluations, setEvaluations] = useState<ImpactMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImpactEvaluations()
      .then(setEvaluations)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel rounded-xl p-6 border-l-4 border-l-emerald-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Impact Engine — Closed-Loop Governance Telemetry
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Measures real-world outcomes following completed public interventions. Tracks the continuous trajectory from 
              unfiltered citizen complaints to capital project completion, subsequent complaint drop-off, and sentiment recovery.
            </p>
          </div>
          <span className="text-xs font-mono bg-emerald-950/60 text-emerald-300 px-3 py-1 rounded border border-emerald-800/40 font-semibold">
            AUDIT VERIFIED OUTCOMES
          </span>
        </div>
      </div>

      {/* The 7-Stage Closed Intelligence Loop Diagram */}
      <div className="glass-panel rounded-xl p-6">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-4">
          Closed-Loop Civic Intelligence Trajectory:
        </span>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2 text-center text-xs">
          {[
            { step: '1. LISTEN', label: 'Multilingual Voice', color: 'border-orange-500 text-orange-400' },
            { step: '2. FUSE', label: 'Gemini Clusters', color: 'border-purple-500 text-purple-400' },
            { step: '3. DISCOVER', label: 'Hotspot / Silent', color: 'border-red-500 text-red-400' },
            { step: '4. EXPLAIN', label: 'Grounded Evidence', color: 'border-blue-500 text-blue-400' },
            { step: '5. SIMULATE', label: 'Policy Sandbox', color: 'border-amber-500 text-amber-400' },
            { step: '6. EXECUTE', label: 'Public Project', color: 'border-cyan-500 text-cyan-400' },
            { step: '7. MEASURE', label: 'Impact Telemetry', color: 'border-emerald-500 text-emerald-400' },
          ].map((s, idx) => (
            <div key={idx} className={`p-3 bg-[#070F1E] rounded-lg border ${s.color}`}>
              <span className="font-mono font-bold block text-[11px] mb-1">{s.step}</span>
              <span className="text-slate-300 font-medium text-[11px]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Before / After Impact Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
            <p className="text-xs font-semibold text-slate-400">Loading Impact Evaluations...</p>
          </div>
        ) : (
          evaluations.map((ev) => (
            <div key={ev.impact_id} className="glass-panel rounded-xl p-6 border border-[#1E3E62] space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#1E3E62]/60 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">{ev.project_name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {ev.region_name} • Sector: <span className="font-semibold text-slate-200 capitalize">{ev.sector}</span> • ID: {ev.project_id}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    {ev.commenced_date} → {ev.evaluation_date}
                  </span>
                  {ev.is_verified && (
                    <span className="flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded border border-emerald-500/40 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Audit Verified</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Before vs After Dual Telemetry Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* BEFORE INTERVENTION */}
                <div className="p-4 bg-[#070F1E] rounded-xl border border-red-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-red-400 bg-red-950/50 px-2 py-0.5 rounded uppercase">
                      BASELINE (BEFORE INTERVENTION)
                    </span>
                    <span className="text-xs text-slate-500">{ev.commenced_date}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Accessibility Index</span>
                      <span className="text-2xl font-black text-white font-mono">
                        {ev.before_accessibility_pct}%
                      </span>
                      <span className="text-[10px] text-red-400 block">Acute service deficit</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Citizen Complaints</span>
                      <span className="text-2xl font-black text-red-300 font-mono">
                        {ev.before_monthly_requests.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Monthly average</span>
                    </div>
                  </div>
                </div>

                {/* AFTER INTERVENTION */}
                <div className="p-4 bg-[#070F1E] rounded-xl border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded uppercase">
                      OUTCOME (AFTER INTERVENTION)
                    </span>
                    <span className="text-xs text-slate-500">{ev.evaluation_date}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Accessibility Index</span>
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        {ev.after_accessibility_pct}%
                      </span>
                      <span className="text-[10px] text-emerald-300 font-bold block">
                        +{ev.accessibility_gain_pct}% Absolute Gain
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Citizen Complaints</span>
                      <span className="text-2xl font-black text-emerald-300 font-mono">
                        {ev.after_monthly_requests.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold block">
                        -{ev.request_reduction_pct}% Reporting Drop
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sentiment Recovery Footer */}
              <div className="p-3 bg-[#0B192C] rounded-lg border border-[#1E3E62] flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300 font-medium">
                    Measured Public Sentiment Recovery:
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
                    +{Math.round(ev.measured_sentiment_recovery * 100)}% positive turnaround
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Verified via JANSETU Follow-up Ingestion Stream
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
