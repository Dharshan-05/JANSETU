import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, CheckCircle2, AlertTriangle, Layers, MapPin, RefreshCw, BarChart3, FileText } from 'lucide-react';
import { apiClient } from '../lib/api';

export const DataFoundationView: React.FC = () => {
  const [dataStatus, setDataStatus] = useState<any>(null);
  const [qualityReport, setQualityReport] = useState<any>(null);
  const [selectedGeo, setSelectedGeo] = useState<any>(null);
  const [geoInput, setGeoInput] = useState<string>('IND_TN_DHM_HRR');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatusAndQuality = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusRes, qualityRes] = await Promise.all([
        apiClient.getDataStatus(),
        apiClient.getDataQuality()
      ]);
      setDataStatus(statusRes);
      setQualityReport(qualityRes.data);

      const geoRes = await apiClient.getGeographyById(geoInput);
      setSelectedGeo(geoRes.data);
    } catch (err: any) {
      console.error("Failed to load Data Foundation diagnostic telemetry:", err);
      setError(err?.error?.message || "Failed to connect to data layer diagnostics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndQuality();
  }, []);

  const handleLookupGeo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geoInput.trim()) return;
    try {
      const geoRes = await apiClient.getGeographyById(geoInput.trim());
      setSelectedGeo(geoRes.data);
    } catch (err: any) {
      alert(`Geography node '${geoInput}' not found.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-800/40 rounded-xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-600/30 text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-mono border border-blue-500/40">
                PHASE 2 — DATA ENGINEERING
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-mono border border-emerald-500/40 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Canonical BigQuery Warehouse
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">JANSETU Canonical Data Foundation</h1>
            <p className="text-slate-300 text-sm mt-1">
              Enterprise 12-table BigQuery data model, 5-level geographic hierarchy, SECC demographics, PMGSY/JJM reality baselines, and quality telemetry.
            </p>
          </div>
          <button
            onClick={fetchStatusAndQuality}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Audit
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-4 text-red-200 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>BIGQUERY CONNECTION</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {dataStatus?.bigquery_connected ? 'Connected' : 'Unavailable'}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              asia-south1
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono truncate">
            {dataStatus?.primary_dataset} / {dataStatus?.analytics_dataset}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>CANONICAL TABLES</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {dataStatus?.canonical_tables_count || 12}
            </span>
            <span className="text-xs text-slate-400">Target Tables Active</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Total Records: <strong className="text-slate-200">{dataStatus?.total_records || 0}</strong>
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>GEOGRAPHIC INTEGRITY</span>
            <MapPin className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${qualityReport?.geographic_hierarchy_valid ? 'text-emerald-400' : 'text-amber-400'}`}>
              {qualityReport?.geographic_hierarchy_valid ? 'Verified' : 'Review'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Missing Geo References: <strong className="text-slate-200">{qualityReport?.missing_geo_references || 0}</strong>
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>DATA QUALITY AUDIT</span>
            <BarChart3 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">
              {qualityReport?.status || 'HEALTHY'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Provenance Sources: <strong className="text-slate-200">{qualityReport?.provenance_sources?.length || 0} Active</strong>
          </p>
        </div>
      </div>

      {/* Canonical 12-Table BigQuery Matrix */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          Canonical 12-Table BigQuery Architecture
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Table Name</th>
                <th className="py-3 px-4">Purpose / Domain</th>
                <th className="py-3 px-4 text-center">Row Count</th>
                <th className="py-3 px-4 text-center">Null Rate</th>
                <th className="py-3 px-4 text-center">Duplicates</th>
                <th className="py-3 px-4 text-center">Synthetic vs Official</th>
                <th className="py-3 px-4">Sources / Provenance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {dataStatus?.table_counts && Object.entries(dataStatus.table_counts).map(([tbl, count]: [string, any]) => {
                const summary = qualityReport?.table_summaries?.[tbl];
                return (
                  <tr key={tbl} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-semibold text-blue-300">{tbl}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans">
                      {tbl === 'geography' && 'Administrative 5-level hierarchy (LGD, GIS)'}
                      {tbl === 'demographics' && 'Census & SECC vulnerability indices'}
                      {tbl === 'infrastructure' && 'Deficit baselines (PMGSY, JJM, TRAI, HMIS)'}
                      {tbl === 'investments' && 'Public schemes & capex works tracking'}
                      {tbl === 'citizen_requests' && 'Multilingual citizen request facts'}
                      {tbl === 'citizen_request_embeddings' && 'Vertex AI 768-dim vector embeddings'}
                      {tbl === 'demand_clusters' && 'Semantic citizen demand cluster storage'}
                      {tbl === 'hotspots' && 'Geospatial demand hotspot storage'}
                      {tbl === 'silent_need_signals' && 'High deficit / low reporting discrepancy signals'}
                      {tbl === 'evidence_records' && 'Grounded audit trail & source citations'}
                      {tbl === 'policy_scenarios' && 'Policy sandbox simulation records'}
                      {tbl === 'impact_metrics' && 'Closed-loop intervention verification'}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-white">{count}</td>
                    <td className="py-3 px-4 text-center text-slate-400">
                      {summary?.null_rate_percentage !== undefined ? `${summary.null_rate_percentage}%` : '0%'}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400">
                      {summary?.duplicate_count || 0}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex gap-1.5 items-center justify-center">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {summary?.official_count || 0} Official
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {summary?.synthetic_count || 0} Synth
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-sans truncate max-w-xs">
                      {summary?.sources?.join(', ') || 'OFFICIAL_LGD'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Geographic Hierarchy Inspector */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              Administrative Geography Inspector (LGD & ST_GEOGPOINT)
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Inspect any node across the Country → State → District → Block → Village hierarchy.
            </p>
          </div>
          <form onSubmit={handleLookupGeo} className="flex gap-2">
            <input
              type="text"
              value={geoInput}
              onChange={(e) => setGeoInput(e.target.value)}
              placeholder="e.g. IND_TN_DHM_HRR"
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium"
            >
              Lookup
            </button>
          </form>
        </div>

        {selectedGeo && (
          <div className="space-y-4">
            {/* Breadcrumb Hierarchy */}
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800 overflow-x-auto">
              <span className="text-slate-400 font-sans">Hierarchy Lineage:</span>
              {selectedGeo.hierarchy_path?.map((step: any, idx: number) => (
                <React.Fragment key={step.geo_id}>
                  {idx > 0 && <span className="text-slate-500">→</span>}
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-blue-300 font-medium">
                    {step.geo_name} ({step.geo_id})
                  </span>
                </React.Fragment>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800 text-xs space-y-2">
                <div className="font-semibold text-slate-200">Selected Node Metadata</div>
                <div className="grid grid-cols-2 gap-2 text-slate-400">
                  <div>Name: <span className="text-white font-mono">{selectedGeo.record?.geo_name}</span></div>
                  <div>Native Name: <span className="text-white">{selectedGeo.record?.native_name || 'N/A'}</span></div>
                  <div>Level: <span className="text-white font-mono">{selectedGeo.record?.geo_level}</span></div>
                  <div>LGD Code: <span className="text-white font-mono">{selectedGeo.record?.lgd_code}</span></div>
                  <div>Coordinates: <span className="text-white font-mono">{selectedGeo.record?.latitude}, {selectedGeo.record?.longitude}</span></div>
                  <div>Centroid GIS: <span className="text-emerald-400 font-mono">{selectedGeo.record?.centroid || 'POINT'}</span></div>
                </div>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800 text-xs space-y-2">
                <div className="font-semibold text-slate-200">
                  Child Subdivisions ({selectedGeo.subdivisions_count})
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {selectedGeo.subdivisions?.length > 0 ? (
                    selectedGeo.subdivisions.map((child: any) => (
                      <div key={child.geo_id} className="flex justify-between items-center py-1 px-2 rounded bg-slate-900/60">
                        <span className="text-slate-300">{child.geo_name}</span>
                        <span className="font-mono text-slate-400">{child.geo_id}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 italic">No further child subdivisions (Leaf Level).</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
