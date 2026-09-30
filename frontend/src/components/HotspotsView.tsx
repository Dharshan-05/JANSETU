import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  TrendingUp, 
  Users, 
  Layers, 
  ArrowUpRight, 
  Filter,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { fetchHotspots } from '../lib/api';
import { Hotspot } from '../types';

interface HotspotsViewProps {
  onSelectRegion: (geoId: string) => void;
}

export const HotspotsView: React.FC<HotspotsViewProps> = ({ onSelectRegion }) => {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotspots(selectedCategory === 'all' ? undefined : selectedCategory)
      .then(setHotspots)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  const categories = ['all', 'transport', 'water', 'healthcare', 'roads'];

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
              Identifies acute demand concentrations where multiple citizens have independently reported critical infrastructure gaps, 
              aggregated via 768-dimensional multilingual semantic clustering and geospatial boundary indexing.
            </p>
          </div>
          {/* Sector Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                  selectedCategory === cat
                    ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                    : 'bg-[#1E3E62]/40 text-slate-300 hover:bg-[#1E3E62]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hotspots Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 rounded-full border-4 border-red-500 border-t-transparent animate-spin"></div>
          <p className="text-xs font-semibold text-slate-400">Loading Hotspot Spatial Coordinates...</p>
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
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                    h.hotspot_level === 'CRITICAL' 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                  }`}>
                    {h.hotspot_level}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    {h.category.toUpperCase()}
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
                    <span className="text-slate-400 text-[10px] uppercase block">Citizen Reports</span>
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
                  <span>Growth Velocity:</span>
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {h.growth_trend.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectRegion(h.geo_id)}
                className="w-full py-2 px-3 rounded-lg bg-[#1E3E62] hover:bg-red-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <span>Drill Down into Civic Digital Twin</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
