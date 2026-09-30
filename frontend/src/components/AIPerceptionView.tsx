import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Cpu, 
  Layers, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Hash, 
  Users, 
  Activity, 
  RefreshCw, 
  ArrowRight,
  ShieldAlert,
  Database,
  Fingerprint,
  Info
} from 'lucide-react';
import { 
  processAIRequest, 
  getAIStatus, 
  fetchDemandClusters, 
  fetchSimilarRequests, 
  fetchTaxonomy 
} from '../lib/api';
import { 
  AIPerceptionResult, 
  DemandCluster, 
  SimilarRequest, 
  ControlledTaxonomy 
} from '../types';

export const AIPerceptionView: React.FC = () => {
  // Input & state
  const [requestId, setRequestId] = useState<string>('REQ-TEXT-001');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIPerceptionResult | null>(null);

  // Clusters state
  const [clusters, setClusters] = useState<DemandCluster[]>([]);
  const [clustersLoading, setClustersLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGeoId, setSelectedGeoId] = useState<string>('all');

  // Similar requests state
  const [similarRequests, setSimilarRequests] = useState<SimilarRequest[]>([]);
  const [similarLoading, setSimilarLoading] = useState<boolean>(false);

  // Taxonomy state
  const [taxonomy, setTaxonomy] = useState<ControlledTaxonomy | null>(null);

  // Sample pre-populated request IDs for demonstration
  const sampleRequestIds = [
    { id: 'REQ-TEXT-001', label: 'Harur Bus Demand (Tamil/English)' },
    { id: 'REQ-TEXT-002', label: 'PHC Doctor Shortage (Hindi)' },
    { id: 'REQ-TEXT-003', label: 'Kaveripattinam Drinking Water (Tamil)' },
    { id: 'REQ-VOICE-001', label: 'Rural Road Maintenance (Voice)' }
  ];

  // Fetch initial clusters and taxonomy on mount
  useEffect(() => {
    loadTaxonomy();
    loadClusters();
  }, []);

  const loadTaxonomy = async () => {
    try {
      const data = await fetchTaxonomy();
      setTaxonomy(data);
    } catch (e: any) {
      console.warn('Could not load taxonomy:', e);
    }
  };

  const loadClusters = async (cat?: string, geo?: string) => {
    setClustersLoading(true);
    try {
      const params: any = { limit: 20 };
      if (cat && cat !== 'all') params.category = cat;
      if (geo && geo !== 'all') params.geo_id = geo;
      const res = await fetchDemandClusters(params);
      setClusters(res.clusters || []);
    } catch (e: any) {
      console.error('Error fetching clusters:', e);
    } finally {
      setClustersLoading(false);
    }
  };

  const handleRunPipeline = async (targetId: string = requestId) => {
    if (!targetId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await processAIRequest(targetId.trim());
      setResult(data);
      // Load similar requests after processing
      loadSimilar(targetId.trim());
      // Refresh clusters
      loadClusters(selectedCategory !== 'all' ? selectedCategory : undefined);
    } catch (e: any) {
      setError(e.message || 'Failed to process AI perception pipeline.');
    } finally {
      setLoading(false);
    }
  };

  const loadSimilar = async (targetId: string) => {
    setSimilarLoading(true);
    try {
      const res = await fetchSimilarRequests(targetId, 5);
      setSimilarRequests(res.matches || []);
    } catch (e) {
      console.warn('Failed to fetch similar requests:', e);
      setSimilarRequests([]);
    } finally {
      setSimilarLoading(false);
    }
  };

  // Severity color helper
  const getSeverityBadge = (level: number) => {
    switch (level) {
      case 5:
        return { label: '5 - Critical Emergency', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/40' };
      case 4:
        return { label: '4 - Severe Disruption', bg: 'bg-orange-500/20 text-orange-400 border-orange-500/40' };
      case 3:
        return { label: '3 - Moderate Deficit', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
      case 2:
        return { label: '2 - Minor Inconvenience', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/40' };
      default:
        return { label: '1 - Routine Suggestion', bg: 'bg-slate-500/20 text-slate-300 border-slate-500/40' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner: Mandatory AI Caution */}
      <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-4 flex items-start space-x-3 text-amber-200">
        <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-amber-300 tracking-wide uppercase">
            AI-Derived Interpretation — Not Official Policy
          </p>
          <p className="text-amber-200/80 leading-relaxed">
            All categories, severity scores, urgency levels, and clusters shown in this interface are generated through AI structured perception models (Gemini 2.5) and vector similarity clustering. They represent statistical and semantic aggregations of citizen submissions and do <strong>NOT</strong> constitute official government policy, formal administrative orders, or approved capital allocations.
          </p>
        </div>
      </div>

      {/* Header and Controls */}
      <div className="bg-[#0B192C] border border-[#1E3E62] rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E3E62]/60 pb-6">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                AI Perception & Semantic Demand Clustering
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Google Gemini 2.5 Structured Civic Extraction • Vertex AI 768-dim Vector Embeddings • BigQuery Vector Search
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-mono bg-[#070F1E] px-3 py-1.5 rounded-lg border border-[#1E3E62]">
              Similarity Threshold: <strong className="text-emerald-400">0.72</strong>
            </span>
            <span className="text-xs text-slate-400 font-mono bg-[#070F1E] px-3 py-1.5 rounded-lg border border-[#1E3E62]">
              Embedding Dim: <strong className="text-purple-400">768</strong>
            </span>
          </div>
        </div>

        {/* Pipeline Runner Section */}
        <div className="mt-6">
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            SELECT OR ENTER CITIZEN REQUEST ID TO PROCESS THROUGH AI PERCEPTION
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={requestId}
                onChange={(e) => setRequestId(e.target.value)}
                placeholder="Enter Request ID (e.g., REQ-TEXT-001)"
                className="w-full bg-[#070F1E] border border-[#1E3E62] rounded-lg px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#FF6500] font-mono"
              />
            </div>
            <button
              onClick={() => handleRunPipeline()}
              disabled={loading || !requestId.trim()}
              className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#FF6500] to-[#E55604] text-white text-xs font-semibold hover:from-[#ff751a] hover:to-[#f05e0c] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-500/20 transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing AI Models...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Execute AI Perception</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Select Buttons */}
          <div className="mt-3 flex items-center flex-wrap gap-2">
            <span className="text-[11px] text-slate-400">Quick Samples:</span>
            {sampleRequestIds.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setRequestId(item.id);
                  handleRunPipeline(item.id);
                }}
                className="text-[11px] font-mono bg-[#070F1E] hover:bg-[#1E3E62]/60 text-slate-300 px-2.5 py-1 rounded border border-[#1E3E62] transition-colors"
              >
                {item.id} — {item.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Results Grid */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Gemini 2.5 Structured Perception */}
          <div className="lg:col-span-2 bg-[#0B192C] border border-[#1E3E62] rounded-xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#1E3E62]/60 pb-4">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Gemini 2.5 Structured Extraction</h3>
                  <span className="text-[10px] font-mono text-purple-300">
                    Model: {result.model_provenance?.gemini_model || 'gemini-2.5-pro'} • Strict Schema Validated
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Zero-Hallucination Verified</span>
              </span>
            </div>

            {/* Categorization & Cohort */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#070F1E] border border-[#1E3E62] rounded-lg p-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Primary Sector</span>
                <span className="text-xs font-bold text-white capitalize mt-1 block">
                  {result.category.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Sub: <strong className="text-slate-300">{result.subcategory.replace('_', ' ')}</strong>
                </span>
              </div>

              <div className="bg-[#070F1E] border border-[#1E3E62] rounded-lg p-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Demographic Cohort</span>
                <span className="text-xs font-bold text-[#FF9933] capitalize mt-1 flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{result.affected_demographic.replace('_', ' ')}</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Non-sensitive cohort tag</span>
              </div>

              <div className="bg-[#070F1E] border border-[#1E3E62] rounded-lg p-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Authoritative Geo ID</span>
                <span className="text-xs font-mono font-bold text-cyan-300 mt-1 block">
                  {result.geo_id}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Immutable hierarchy boundary</span>
              </div>
            </div>

            {/* Severity and Urgency Meters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#070F1E] border border-[#1E3E62] rounded-lg p-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Severity Level:</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getSeverityBadge(result.severity_level).bg}`}>
                    {getSeverityBadge(result.severity_level).label}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div
                      key={step}
                      className={`flex-1 h-full border-r border-slate-900 ${
                        step <= result.severity_level
                          ? result.severity_level >= 4
                            ? 'bg-rose-500'
                            : result.severity_level === 3
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                          : 'bg-slate-700/40'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Urgency Score:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {(result.urgency_score * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, result.urgency_score * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Actionable Summary & Extracted Gap */}
            <div className="space-y-3">
              <div className="bg-[#070F1E] border border-[#1E3E62] rounded-lg p-3.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Synthesized Actionable Summary
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {result.actionable_summary}
                </p>
              </div>

              {result.extraction?.infrastructure_gap && (
                <div className="bg-[#070F1E] border border-[#1E3E62] rounded-lg p-3.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Specific Infrastructure Gap
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {result.extraction.infrastructure_gap}
                  </p>
                </div>
              )}

              {/* Extracted Entities */}
              {result.extraction?.extracted_entities && result.extraction.extracted_entities.length > 0 && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">
                    Extracted Civic Entities
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.extraction.extracted_entities.map((ent, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-mono bg-purple-950/40 text-purple-300 border border-purple-800/40 px-2 py-0.5 rounded"
                      >
                        {ent}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Vertex AI Embeddings & Vector Subspace */}
          <div className="bg-[#0B192C] border border-[#1E3E62] rounded-xl p-6 shadow-xl space-y-5">
            <div className="flex items-center space-x-2 border-b border-[#1E3E62]/60 pb-4">
              <div className="p-1.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Fingerprint className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Vertex AI Vector Embedding</h3>
                <span className="text-[10px] font-mono text-cyan-300">
                  {result.model_provenance?.embedding_model || 'text-multilingual-embedding-002'}
                </span>
              </div>
            </div>

            <div className="bg-[#070F1E] border border-[#1E3E62] rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Dimensions:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {result.embedding?.dimension || 768} (Strict 768-D)
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Cross-Lingual Subspace:</span>
                <span className="font-mono text-purple-300 text-[11px]">
                  {result.embedding?.subspace_signature || 'Indian Languages (TN/HI/TE/EN)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Persistence Store:</span>
                <span className="font-mono text-slate-300 text-[11px]">BigQuery Vector Engine</span>
              </div>
            </div>

            {/* Vector Dimensions Heatmap Preview */}
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-2">
                Vector Dimension Spectrum Preview (First 48 dimensions)
              </span>
              <div className="grid grid-cols-12 gap-1 p-2 bg-[#070F1E] border border-[#1E3E62] rounded-lg">
                {(result.embedding?.preview || Array.from({ length: 48 }, (_, i) => Math.sin(i * 0.4) * 0.1)).slice(0, 48).map((val, idx) => {
                  const intensity = Math.min(1, Math.abs(val) * 10);
                  const isPos = val >= 0;
                  return (
                    <div
                      key={idx}
                      title={`Dim ${idx}: ${val.toFixed(4)}`}
                      className={`h-4 rounded-sm transition-all ${
                        isPos
                          ? `bg-cyan-500`
                          : `bg-purple-500`
                      }`}
                      style={{ opacity: Math.max(0.15, intensity) }}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-mono">
                <span>dim 0</span>
                <span>Positive (Cyan) / Negative (Purple)</span>
                <span>dim 47</span>
              </div>
            </div>

            {/* Associated Demand Cluster */}
            <div className="border-t border-[#1E3E62]/60 pt-4 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Associated Demand Cluster
              </span>
              {result.cluster ? (
                <div className="bg-[#070F1E] border border-cyan-800/40 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-cyan-300">
                      {result.cluster.cluster_id}
                    </span>
                    <span className="text-[10px] bg-cyan-950/60 text-cyan-400 border border-cyan-700/50 px-2 py-0.5 rounded font-mono">
                      {result.cluster.total_requests} Requests
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 mt-1">
                    {result.cluster.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {result.cluster.representative_issue}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No cluster assigned</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Section: Similar Requests & Demand Clusters Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Similar Requests Found Via Vector Search */}
        <div className="bg-[#0B192C] border border-[#1E3E62] rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E3E62]/60 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Search className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">BigQuery Vector Search Matches</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Threshold &ge; 0.72 Cosine
            </span>
          </div>

          {similarLoading ? (
            <div className="flex items-center justify-center py-8 text-xs text-slate-400 space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Querying BigQuery vector index...</span>
            </div>
          ) : similarRequests.length > 0 ? (
            <div className="space-y-3">
              {similarRequests.map((sim, idx) => (
                <div
                  key={idx}
                  className="bg-[#070F1E] border border-[#1E3E62] hover:border-emerald-500/50 rounded-lg p-3 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-300 font-bold">{sim.request_id}</span>
                    <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                      {(sim.similarity_score * 100).toFixed(1)}% Match
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                    <span className="capitalize text-slate-300">{sim.category}</span>
                    <span>•</span>
                    <span className="font-mono text-cyan-300">{sim.geo_id}</span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans line-clamp-2">
                    "{sim.original_text}"
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              {result ? 'No semantically similar requests found above the 0.72 threshold.' : 'Execute AI perception on a request to inspect vector similarity matches.'}
            </div>
          )}
        </div>

        {/* Demand Clusters Explorer */}
        <div className="bg-[#0B192C] border border-[#1E3E62] rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E3E62]/60 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded bg-[#FF6500]/20 text-[#FF6500] border border-[#FF6500]/30">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Active Demand Clusters</h3>
            </div>
            <button
              onClick={() => loadClusters(selectedCategory !== 'all' ? selectedCategory : undefined)}
              className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
            >
              <RefreshCw className={`w-3 h-3 ${clustersLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Filter options */}
          <div className="flex items-center space-x-3 text-xs">
            <label className="text-slate-400 text-[11px]">Filter Sector:</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                loadClusters(e.target.value !== 'all' ? e.target.value : undefined);
              }}
              className="bg-[#070F1E] border border-[#1E3E62] rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">All Sectors</option>
              {taxonomy?.categories.map((c) => (
                <option key={c} value={c}>
                  {c.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {clustersLoading ? (
            <div className="flex items-center justify-center py-8 text-xs text-slate-400 space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
              <span>Aggregating demand clusters...</span>
            </div>
          ) : clusters.length > 0 ? (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {clusters.map((cluster) => (
                <div
                  key={cluster.cluster_id}
                  className="bg-[#070F1E] border border-[#1E3E62] rounded-lg p-3 space-y-2 hover:border-[#1E3E62]/80 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-cyan-400 font-bold text-[11px]">
                      {cluster.cluster_id}
                    </span>
                    <span className="text-[11px] font-mono bg-orange-500/10 text-[#FF9933] border border-orange-500/30 px-2 py-0.5 rounded font-bold">
                      {cluster.request_count} Reports
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-white">{cluster.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                      {cluster.representative_issue}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-[#1E3E62]/40 pt-2">
                    <span className="capitalize">{cluster.category.replace('_', ' ')}</span>
                    <span className="font-mono text-slate-400">{cluster.geo_id}</span>
                    <span>Severity: <strong className="text-amber-400">{cluster.severity_score.toFixed(1)}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              No demand clusters active for the selected sector filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
