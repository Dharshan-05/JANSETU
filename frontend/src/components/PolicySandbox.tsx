import React, { useState } from 'react';
import { 
  Sliders, 
  Sparkles, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Coins,
  ArrowRight
} from 'lucide-react';
import { simulatePolicyScenario } from '../lib/api';
import { SimulationResult } from '../types';

export const PolicySandbox: React.FC = () => {
  const [selectedGeo, setSelectedGeo] = useState('IND_TN_DHM_HRR');
  const [sector, setSector] = useState<'transport' | 'water' | 'healthcare'>('transport');
  const [units, setUnits] = useState(6);
  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);

  const regions = [
    { id: 'IND_TN_DHM_HRR', name: 'Harur Block (Dharmapuri, Tamil Nadu)' },
    { id: 'IND_UP_VAR_PND', name: 'Pindra Block (Varanasi, Uttar Pradesh)' },
    { id: 'IND_TG_MBN_JDC', name: 'Jadcherla Block (Mahabubnagar, Telangana)' },
    { id: 'IND_MH_GDC_AHR', name: 'Aheri Tribal Block (Gadchiroli, Maharashtra)' },
  ];

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await simulatePolicyScenario({
        geo_id: selectedGeo,
        sector: sector,
        intervention_type: sector === 'transport' ? 'ADD_BUS_ROUTES' : sector === 'water' ? 'INSTALL_SOLAR_BOREWELLS' : 'DISPATCH_MOBILE_HEALTH_UNITS',
        parameters: {
          additional_evening_routes: units,
          units: units,
          estimated_budget_inr: sector === 'transport' ? units * 800000 : sector === 'water' ? units * 450000 : units * 3200000
        }
      });
      setSimulation(res);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="glass-panel rounded-xl p-6 border-l-4 border-l-amber-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              Policy Sandbox — Counterfactual Intervention Modeling
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Simulates hypothetical public infrastructure interventions against the demographic gravity model. 
              Estimates potential population coverage, accessibility gains, and residual unaddressed needs prior to budget sanction.
            </p>
          </div>
          <div className="p-3 bg-[#070F1E] rounded-lg border border-amber-800/40 text-[11px] text-amber-200 max-w-xs">
            <strong>Mandatory Governance Guardrail:</strong> Outputs represent calibrated scenario models — not autonomous spending mandates.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scenario Parameter Studio */}
        <div className="lg:col-span-5 glass-panel rounded-xl p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Intervention Parameters
          </h3>

          {/* Region */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Target Geographic Unit:</label>
            <select
              value={selectedGeo}
              onChange={(e) => setSelectedGeo(e.target.value)}
              className="w-full bg-[#070F1E] border border-[#1E3E62] text-xs text-slate-100 rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
            >
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Sector */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Infrastructure Sector:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['transport', 'water', 'healthcare'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSector(s)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold uppercase transition-all ${
                    sector === s
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                      : 'bg-[#070F1E] text-slate-300 border border-[#1E3E62] hover:bg-[#1E3E62]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Parameter Slider */}
          <div className="p-4 bg-[#070F1E] rounded-xl border border-[#1E3E62] space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">
                {sector === 'transport' ? 'Additional Evening Bus Routes:' : sector === 'water' ? 'New Solar Deep Borewells:' : 'Mobile Medical Health Units:'}
              </span>
              <span className="font-mono font-bold text-amber-400 text-base">
                +{units} Units
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={20}
              value={units}
              onChange={(e) => setUnits(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Min: +1</span>
              <span>Max: +20 Units</span>
            </div>

            <div className="pt-2 border-t border-[#1E3E62]/40 flex justify-between text-xs">
              <span className="text-slate-400">Estimated Capex Requirement:</span>
              <span className="font-mono font-bold text-emerald-400">
                ₹{(units * (sector === 'transport' ? 8 : sector === 'water' ? 4.5 : 32)).toFixed(1)} Lakhs
              </span>
            </div>
          </div>

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
                <span>Running Gravity Model Simulation...</span>
              </>
            ) : (
              <>
                <Sliders className="w-4 h-4" />
                <span>Execute Scenario Simulation</span>
              </>
            )}
          </button>
        </div>

        {/* Counterfactual Simulation Results */}
        <div className="lg:col-span-7 glass-panel rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Modeled Counterfactual Projections</span>
            {simulation && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                {simulation.simulation_id}
              </span>
            )}
          </h3>

          {!simulation && !loading && (
            <div className="h-80 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Sliders className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-400">No Active Simulation</p>
              <p className="text-xs max-w-sm mt-1">
                Configure intervention units on the left and click "Execute Scenario Simulation".
              </p>
            </div>
          )}

          {simulation && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Primary Impact Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 bg-[#070F1E] rounded-lg border border-[#1E3E62]">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Benefited Population</span>
                  <div className="text-xl font-black text-white font-mono mt-1">
                    +{simulation.estimated_population_benefited.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">Demographically verified</span>
                </div>

                <div className="p-3 bg-[#070F1E] rounded-lg border border-[#1E3E62]">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Accessibility Gain</span>
                  <div className="text-xl font-black text-amber-400 font-mono mt-1">
                    {Math.round(simulation.current_accessibility_index * 100)}% → {Math.round(simulation.projected_accessibility_index * 100)}%
                  </div>
                  <span className="text-[10px] text-amber-300 block mt-0.5">+{simulation.absolute_gain_pct}% delta</span>
                </div>

                <div className="p-3 bg-[#070F1E] rounded-lg border border-[#1E3E62]">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Clusters Mitigated</span>
                  <div className="text-xl font-black text-purple-300 font-mono mt-1">
                    {simulation.addressed_clusters_count} / {simulation.total_clusters_in_sector}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Citizen demand addressed</span>
                </div>
              </div>

              {/* Residual Unaddressed Needs */}
              <div className="p-4 bg-[#070F1E] rounded-xl border border-[#1E3E62] space-y-2">
                <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider block">
                  Remaining Residual Demand Signals (Unaddressed by this policy):
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {simulation.unaddressed_residual_needs.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Financial Efficiency & Confidence */}
              <div className="p-3 bg-[#0B192C] rounded-lg border border-[#1E3E62] flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400">Cost-per-Citizen ROI:</span>
                  <span className="font-mono font-bold text-emerald-400 ml-1.5">
                    ₹{simulation.roi_cost_per_beneficiary_inr.toFixed(2)} / person
                  </span>
                </div>
                <div className="font-mono text-slate-400 text-[11px]">
                  Gain Range: [+{simulation.confidence_interval.lower_bound_gain * 100}% to +{simulation.confidence_interval.upper_bound_gain * 100}%]
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-lg text-[11px] text-amber-200">
                <strong>Disclaimer:</strong> {simulation.disclaimer}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
