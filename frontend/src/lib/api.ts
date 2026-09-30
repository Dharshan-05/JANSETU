import {
  IntakeResponse,
  CommandCenterKPIs,
  DemandShadowZone,
  Hotspot,
  SilentNeedSignal,
  GroundedEvidenceBrief,
  CivicDigitalTwin,
  SimulationResult,
  ImpactMetric,
  SupportedLanguagesResponse,
  CitizenRequestStatus,
  AIPerceptionResult,
  DemandCluster,
  SimilarRequest,
  ControlledTaxonomy,
  HotspotSummary,
  DemandShadowMatrixResponse,
  DemandShadowMatrixItem,
  SilentNeedSummary,
  SilentNeedExplanation,
  SilentNeedDriver,
  EvidenceResponse,
  EvidenceRecord,
  EvidenceSummary,
  ScenarioInput,
  ScenarioResult,
  ScenarioComparisonResponse,
  ScenarioExplanationResponse,
  ImpactEvaluation,
  EvaluationCreateInput,
  ObservationInput,
  ModelValidationSummary,
  ImpactExplanationResponse,
  IndicatorDefinition,
  LearningCandidate,
  ModelVersion,
  LearningAuditEvent,
  LearningSummary,
  GenerateCandidateRequest,
  ValidateCandidateRequest,
  ApproveCandidateRequest,
  RejectCandidateRequest,
  ActivateModelRequest,
  RollbackModelRequest,
  LearningExplanationResponse
} from '../types';

export interface SystemInfo {
  name: string;
  service: string;
  version: string;
  status: string;
}

export interface HealthStatus {
  status: string;
}

export interface ReadinessStatus {
  status: 'ready' | 'not_ready';
  services: {
    bigquery: 'ok' | 'error';
    pubsub: 'ok' | 'error';
    storage: 'ok' | 'error';
  };
}

export interface ApiV1Status {
  version: string;
  status: string;
  phase: string;
  modules: string[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

class ApiClient {
  private baseUrl: string;
  private tokenProvider: (() => Promise<string | null>) | null = null;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  public setTokenProvider(provider: () => Promise<string | null>) {
    this.tokenProvider = provider;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    // Inject Firebase ID Token if available
    if (this.tokenProvider) {
      try {
        const token = await this.tokenProvider();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (err) {
        console.warn("Failed to obtain auth token:", err);
      }
    }

    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      let errorData: ApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          error: {
            code: `HTTP_${response.status}`,
            message: response.statusText || 'An error occurred during API request'
          }
        };
      }
      throw errorData;
    }

    return await response.json();
  }

  // =========================================================================
  // PHASE 1: FOUNDATION HEALTH & READINESS ENDPOINTS
  // =========================================================================

  public async getSystemInfo(): Promise<SystemInfo> {
    return this.request<SystemInfo>('/');
  }

  public async getHealthStatus(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/healthz');
  }

  public async getReadinessStatus(): Promise<ReadinessStatus> {
    return this.request<ReadinessStatus>('/readyz');
  }

  public async getApiV1Status(): Promise<ApiV1Status> {
    return this.request<ApiV1Status>('/api/v1/version');
  }

  // =========================================================================
  // APPLICATION & INTELLIGENCE DATA ENDPOINTS
  // =========================================================================

  public async submitTextRequest(payload: {
    text: string;
    detected_language?: string;
    declared_state?: string;
    declared_district?: string;
  }): Promise<IntakeResponse> {
    const res = await this.request<{ success: boolean; data: IntakeResponse }>('/api/v1/intake/text', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  }

  public async submitVoiceRequest(formData: FormData): Promise<IntakeResponse> {
    const res = await this.request<{ success: boolean; data: IntakeResponse }>('/api/v1/intake/voice', {
      method: 'POST',
      body: formData
    });
    return res.data;
  }

  public async getSupportedLanguages(): Promise<SupportedLanguagesResponse> {
    return this.request<SupportedLanguagesResponse>('/api/v1/intake/languages');
  }

  public async getRequestStatus(requestId: string): Promise<CitizenRequestStatus> {
    const res = await this.request<{ success: boolean; data: CitizenRequestStatus }>(`/api/v1/intake/${requestId}`);
    return res.data;
  }

  public async fetchCommandCenterKPIs(): Promise<CommandCenterKPIs> {
    const res = await this.request<{ success: boolean; data: CommandCenterKPIs }>('/api/v1/analytics/command-center');
    return res.data;
  }

  public async fetchDemandShadowGrid(): Promise<{ total_zones: number; zones: DemandShadowZone[] }> {
    return this.request<{ total_zones: number; zones: DemandShadowZone[] }>('/api/v1/analytics/demand-shadow');
  }

  public async fetchHotspots(params?: {
    category?: string;
    hotspot_level?: string;
    state_code?: string;
    min_score?: number;
    limit?: number;
  } | string): Promise<Hotspot[]> {
    let url = '/api/v1/hotspots';
    if (typeof params === 'string') {
      url += `?category=${params}`;
    } else if (params) {
      const searchParams = new URLSearchParams();
      if (params.category && params.category !== 'all') searchParams.append('category', params.category);
      if (params.hotspot_level && params.hotspot_level !== 'all') searchParams.append('hotspot_level', params.hotspot_level);
      if (params.state_code) searchParams.append('state_code', params.state_code);
      if (params.min_score !== undefined) searchParams.append('min_score', params.min_score.toString());
      if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
      const queryString = searchParams.toString();
      if (queryString) url += `?${queryString}`;
    }
    const res = await this.request<{ success: boolean; data: Hotspot[] }>(url);
    return res.data;
  }

  public async fetchHotspotDetail(hotspotId: string): Promise<Hotspot> {
    const res = await this.request<{ success: boolean; data: Hotspot }>(`/api/v1/hotspots/${hotspotId}`);
    return res.data;
  }

  public async fetchHotspotsSummary(): Promise<HotspotSummary> {
    const res = await this.request<{ success: boolean; data: HotspotSummary }>('/api/v1/hotspots/summary');
    return res.data;
  }

  public async fetchDemandShadowMatrix(params?: {
    geo_id?: string;
    geo_level?: string;
    category?: string;
    state_code?: string;
    time_window?: number;
    min_voice?: number;
    min_need?: number;
    quadrant?: string;
  }): Promise<DemandShadowMatrixResponse> {
    let url = '/api/v1/demand-shadow';
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.geo_id) searchParams.append('geo_id', params.geo_id);
      if (params.geo_level) searchParams.append('geo_level', params.geo_level);
      if (params.category && params.category !== 'all') searchParams.append('category', params.category);
      if (params.state_code && params.state_code !== 'all') searchParams.append('state_code', params.state_code);
      if (params.time_window) searchParams.append('time_window', params.time_window.toString());
      if (params.min_voice !== undefined) searchParams.append('min_voice', params.min_voice.toString());
      if (params.min_need !== undefined) searchParams.append('min_need', params.min_need.toString());
      if (params.quadrant && params.quadrant !== 'all') searchParams.append('quadrant', params.quadrant);
      const queryString = searchParams.toString();
      if (queryString) url += `?${queryString}`;
    }
    const res = await this.request<{ success: boolean; data: DemandShadowMatrixResponse }>(url);
    return res.data;
  }

  public async fetchSilentNeedSignals(params?: {
    geo_id?: string;
    geo_level?: string;
    category?: string;
    state_code?: string;
    district?: string;
    block?: string;
    min_signal_strength?: number;
    signal_class?: string;
    triggered?: boolean;
    min_discrepancy?: number;
    min_infra_deficit?: number;
    max_digital_access?: number;
    limit?: number;
  } | string): Promise<SilentNeedSignal[]> {
    let url = '/api/v1/silent-need';
    if (typeof params === 'string') {
      url += `?category=${params}`;
    } else if (params) {
      const searchParams = new URLSearchParams();
      if (params.geo_id) searchParams.append('geo_id', params.geo_id);
      if (params.geo_level) searchParams.append('geo_level', params.geo_level);
      if (params.category && params.category !== 'all') searchParams.append('category', params.category);
      if (params.state_code && params.state_code !== 'all') searchParams.append('state_code', params.state_code);
      if (params.district) searchParams.append('district', params.district);
      if (params.block) searchParams.append('block', params.block);
      if (params.min_signal_strength !== undefined) searchParams.append('min_signal_strength', params.min_signal_strength.toString());
      if (params.signal_class && params.signal_class !== 'all') searchParams.append('signal_class', params.signal_class);
      if (params.triggered !== undefined) searchParams.append('triggered', params.triggered.toString());
      if (params.min_discrepancy !== undefined) searchParams.append('min_discrepancy', params.min_discrepancy.toString());
      if (params.min_infra_deficit !== undefined) searchParams.append('min_infra_deficit', params.min_infra_deficit.toString());
      if (params.max_digital_access !== undefined) searchParams.append('max_digital_access', params.max_digital_access.toString());
      if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
      const queryString = searchParams.toString();
      if (queryString) url += `?${queryString}`;
    }
    const res = await this.request<{ success: boolean; data: SilentNeedSignal[] }>(url);
    return res.data;
  }

  public async fetchSilentNeedDetail(signalId: string): Promise<SilentNeedSignal> {
    const res = await this.request<{ success: boolean; data: SilentNeedSignal }>(`/api/v1/silent-need/${signalId}`);
    return res.data;
  }

  public async fetchSilentNeedSummary(): Promise<SilentNeedSummary> {
    const res = await this.request<{ success: boolean; data: SilentNeedSummary }>('/api/v1/silent-need/summary');
    return res.data;
  }

  public async fetchDigitalTwin(geoId: string): Promise<CivicDigitalTwin> {
    const res = await this.request<{ success: boolean; data: CivicDigitalTwin }>(`/api/v1/digital-twin/${geoId}`);
    return res.data;
  }

  public async fetchEvidenceBrief(signalId: string): Promise<EvidenceResponse> {
    const res = await this.request<{ success: boolean; data: EvidenceResponse }>(`/api/v1/evidence/${signalId}`);
    return res.data;
  }

  public async refreshEvidenceBrief(signalId: string): Promise<EvidenceResponse> {
    const res = await this.request<{ success: boolean; data: EvidenceResponse }>(`/api/v1/evidence/${signalId}/refresh`, {
      method: 'POST'
    });
    return res.data;
  }

  public async fetchEvidenceRecord(evidenceId: string): Promise<EvidenceRecord> {
    const res = await this.request<{ success: boolean; data: EvidenceRecord }>(`/api/v1/evidence/record/${evidenceId}`);
    return res.data;
  }

  public async fetchEvidenceSummary(): Promise<EvidenceSummary> {
    const res = await this.request<{ success: boolean; data: EvidenceSummary }>('/api/v1/evidence/summary');
    return res.data;
  }

  public async simulatePolicyScenario(payload: {
    geo_id: string;
    sector: string;
    intervention_type: string;
    parameters: Record<string, any>;
  }): Promise<SimulationResult> {
    const res = await this.request<{ success: boolean; data: SimulationResult }>('/api/v1/sandbox/simulate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  }

  // =========================================================================
  // PHASE 9: CLOSED-LOOP IMPACT MEASUREMENT & EVALUATION METHODS
  // =========================================================================

  public async fetchImpactEvaluations(params?: {
    geo_id?: string;
    sector?: string;
    evaluation_type?: string;
    data_quality?: string;
    attribution_level?: string;
    limit?: number;
  } | string): Promise<ImpactEvaluation[]> {
    let url = '/api/v1/impact/evaluations';
    if (typeof params === 'string') {
      url += `?sector=${params}`;
    } else if (params) {
      const searchParams = new URLSearchParams();
      if (params.geo_id) searchParams.append('geo_id', params.geo_id);
      if (params.sector && params.sector !== 'all') searchParams.append('sector', params.sector);
      if (params.evaluation_type && params.evaluation_type !== 'all') searchParams.append('evaluation_type', params.evaluation_type);
      if (params.data_quality && params.data_quality !== 'all') searchParams.append('data_quality', params.data_quality);
      if (params.attribution_level && params.attribution_level !== 'all') searchParams.append('attribution_level', params.attribution_level);
      if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
      const query = searchParams.toString();
      if (query) url += `?${query}`;
    }
    const res = await this.request<{ success: boolean; data: ImpactEvaluation[] }>(url);
    return res.data;
  }

  public async createImpactEvaluation(payload: EvaluationCreateInput): Promise<ImpactEvaluation> {
    const res = await this.request<{ success: boolean; data: ImpactEvaluation }>('/api/v1/impact/evaluations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  }

  public async fetchImpactEvaluationDetail(evaluationId: string): Promise<ImpactEvaluation> {
    const res = await this.request<{ success: boolean; data: ImpactEvaluation }>(`/api/v1/impact/evaluations/${evaluationId}`);
    return res.data;
  }

  public async recordImpactObservation(evaluationId: string, payload: ObservationInput): Promise<ImpactEvaluation> {
    const res = await this.request<{ success: boolean; data: ImpactEvaluation }>(`/api/v1/impact/evaluations/${evaluationId}/observations`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  }

  public async recalculateImpact(evaluationId: string): Promise<ImpactEvaluation> {
    const res = await this.request<{ success: boolean; data: ImpactEvaluation }>(`/api/v1/impact/evaluations/${evaluationId}/calculate`, {
      method: 'POST'
    });
    return res.data;
  }

  public async explainImpactEvaluation(evaluationId: string): Promise<ImpactExplanationResponse> {
    const res = await this.request<{ success: boolean; data: ImpactExplanationResponse }>(`/api/v1/impact/evaluations/${evaluationId}/explain`, {
      method: 'POST'
    });
    return res.data;
  }

  public async fetchModelValidation(): Promise<ModelValidationSummary> {
    const res = await this.request<{ success: boolean; data: ModelValidationSummary }>('/api/v1/impact/model-validation');
    return res.data;
  }

  public async fetchControlledIndicators(): Promise<IndicatorDefinition[]> {
    const res = await this.request<{ success: boolean; data: IndicatorDefinition[] }>('/api/v1/impact/indicators');
    return res.data;
  }

  // =========================================================================
  // PHASE 10: CIVIC INTELLIGENCE LEARNING & CALIBRATION METHODS
  // =========================================================================

  public async fetchLearningSummary(): Promise<LearningSummary> {
    const res = await this.request<{ success: boolean; data: LearningSummary }>('/api/v1/learning/summary');
    return res.data;
  }

  public async fetchLearningCandidates(params?: {
    model_family?: string;
    status?: string;
    limit?: number;
  }): Promise<LearningCandidate[]> {
    let url = '/api/v1/learning/candidates';
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.model_family && params.model_family !== 'all') searchParams.append('model_family', params.model_family);
      if (params.status && params.status !== 'all') searchParams.append('status', params.status);
      if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
      const query = searchParams.toString();
      if (query) url += `?${query}`;
    }
    const res = await this.request<{ success: boolean; data: LearningCandidate[] }>(url);
    return res.data;
  }

  public async fetchLearningCandidateDetail(learningId: string): Promise<LearningCandidate> {
    const res = await this.request<{ success: boolean; data: LearningCandidate }>(`/api/v1/learning/candidates/${learningId}`);
    return res.data;
  }

  public async generateLearningCandidate(payload: GenerateCandidateRequest): Promise<LearningCandidate> {
    const res = await this.request<{ success: boolean; data: LearningCandidate }>('/api/v1/learning/candidates/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  }

  public async validateLearningCandidate(learningId: string, payload: ValidateCandidateRequest = {}): Promise<LearningCandidate> {
    const res = await this.request<{ success: boolean; data: LearningCandidate }>(`/api/v1/learning/candidates/${learningId}/validate`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  }

  public async approveLearningCandidate(learningId: string, payload: ApproveCandidateRequest): Promise<LearningCandidate> {
    const res = await this.request<{ success: boolean; data: LearningCandidate }>(`/api/v1/learning/candidates/${learningId}/approve`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  }

  public async rejectLearningCandidate(learningId: string, payload: RejectCandidateRequest): Promise<LearningCandidate> {
    const res = await this.request<{ success: boolean; data: LearningCandidate }>(`/api/v1/learning/candidates/${learningId}/reject`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  }

  public async fetchModelVersions(params?: {
    model_family?: string;
    status?: string;
  }): Promise<ModelVersion[]> {
    let url = '/api/v1/learning/models';
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.model_family && params.model_family !== 'all') searchParams.append('model_family', params.model_family);
      if (params.status && params.status !== 'all') searchParams.append('status', params.status);
      const query = searchParams.toString();
      if (query) url += `?${query}`;
    }
    const res = await this.request<{ success: boolean; data: ModelVersion[] }>(url);
    return res.data;
  }

  public async activateModelVersion(version: string, payload: ActivateModelRequest): Promise<ModelVersion> {
    const res = await this.request<{ success: boolean; data: ModelVersion }>(`/api/v1/learning/models/${encodeURIComponent(version)}/activate`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  }

  public async rollbackModelVersion(version: string, payload: RollbackModelRequest): Promise<ModelVersion> {
    const res = await this.request<{ success: boolean; data: ModelVersion }>(`/api/v1/learning/models/${encodeURIComponent(version)}/rollback`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  }

  public async explainLearningCandidate(learningId: string): Promise<LearningExplanationResponse> {
    const res = await this.request<{ success: boolean; data: LearningExplanationResponse }>(`/api/v1/learning/candidates/${learningId}/explain`, {
      method: 'POST'
    });
    return res.data;
  }

  public async fetchLearningAuditEvents(params?: {
    learning_id?: string;
    model_version?: string;
    limit?: number;
  }): Promise<LearningAuditEvent[]> {
    let url = '/api/v1/learning/audit-events';
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.learning_id) searchParams.append('learning_id', params.learning_id);
      if (params.model_version) searchParams.append('model_version', params.model_version);
      if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
      const query = searchParams.toString();
      if (query) url += `?${query}`;
    }
    const res = await this.request<{ success: boolean; data: LearningAuditEvent[] }>(url);
    return res.data;
  }


  // =========================================================================
  // PHASE 8: POLICY SANDBOX & SCENARIO SIMULATION METHODS
  // =========================================================================

  public async simulateScenario(payload: ScenarioInput): Promise<ScenarioResult> {
    const res = await this.request<{ success: boolean; data: ScenarioResult }>('/api/v1/sandbox/simulate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  }

  public async fetchScenarios(params?: {
    geo_id?: string;
    sector?: string;
    limit?: number;
    include_archived?: boolean;
  }): Promise<{ total: number; scenarios: ScenarioResult[] }> {
    const searchParams = new URLSearchParams();
    if (params?.geo_id) searchParams.append('geo_id', params.geo_id);
    if (params?.sector) searchParams.append('sector', params.sector);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.include_archived) searchParams.append('include_archived', 'true');
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await this.request<{ success: boolean; data: { total: number; scenarios: ScenarioResult[] } }>(`/api/v1/sandbox/scenarios${query}`);
    return res.data;
  }

  public async fetchScenarioDetail(scenarioId: string): Promise<ScenarioResult> {
    const res = await this.request<{ success: boolean; data: ScenarioResult }>(`/api/v1/sandbox/scenarios/${scenarioId}`);
    return res.data;
  }

  public async compareScenarios(scenarioIds: string[]): Promise<ScenarioComparisonResponse> {
    const res = await this.request<{ success: boolean; data: ScenarioComparisonResponse }>('/api/v1/sandbox/compare', {
      method: 'POST',
      body: JSON.stringify({ scenario_ids: scenarioIds })
    });
    return res.data;
  }

  public async explainScenario(scenarioId: string): Promise<ScenarioExplanationResponse> {
    const res = await this.request<{ success: boolean; data: ScenarioExplanationResponse }>(`/api/v1/sandbox/${scenarioId}/explain`, {
      method: 'POST'
    });
    return res.data;
  }

  public async archiveScenario(scenarioId: string): Promise<{ success: boolean; scenario_id: string; is_archived: boolean }> {
    const res = await this.request<{ success: boolean; data: { success: boolean; scenario_id: string; is_archived: boolean } }>(`/api/v1/sandbox/${scenarioId}/archive`, {
      method: 'POST'
    });
    return res.data;
  }

  // =========================================================================
  // PHASE 2: DATA ENGINEERING & CANONICAL WAREHOUSE ENDPOINTS
  // =========================================================================

  public async getDataStatus(): Promise<{
    status: string;
    bigquery_connected: boolean;
    primary_dataset: string;
    analytics_dataset: string;
    canonical_tables_count: number;
    total_records: number;
    table_counts: Record<string, number>;
  }> {
    return this.request('/api/v1/data/status');
  }

  public async getGeographyById(geoId: string): Promise<{
    status: string;
    data: {
      record: any;
      hierarchy_path: any[];
      subdivisions_count: number;
      subdivisions: any[];
    };
  }> {
    return this.request(`/api/v1/data/geography/${geoId}`);
  }

  public async getDataQuality(): Promise<{
    status: string;
    data: {
      total_records: number;
      table_summaries: Record<string, any>;
      geographic_hierarchy_valid: boolean;
      missing_geo_references: number;
      provenance_sources: string[];
      status: string;
      timestamp: string;
    };
  }> {
    return this.request('/api/v1/data/quality');
  }

  // =========================================================================
  // PHASE 4: AI PERCEPTION & SEMANTIC CLUSTERING ENDPOINTS
  // =========================================================================

  public async processAIRequest(requestId: string): Promise<AIPerceptionResult> {
    return this.request<AIPerceptionResult>(`/api/v1/ai/process/${requestId}`, {
      method: 'POST'
    });
  }

  public async getAIStatus(requestId: string): Promise<AIPerceptionResult> {
    return this.request<AIPerceptionResult>(`/api/v1/ai/status/${requestId}`);
  }

  public async fetchDemandClusters(params?: {
    geo_id?: string;
    category?: string;
    limit?: number;
  }): Promise<{ total: number; clusters: DemandCluster[] }> {
    const searchParams = new URLSearchParams();
    if (params?.geo_id) searchParams.append('geo_id', params.geo_id);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request<{ total: number; clusters: DemandCluster[] }>(`/api/v1/ai/clusters${query}`);
  }

  public async fetchClusterDetails(clusterId: string): Promise<DemandCluster> {
    return this.request<DemandCluster>(`/api/v1/ai/clusters/${clusterId}`);
  }

  public async fetchSimilarRequests(requestId: string, limit: number = 5): Promise<{
    request_id: string;
    total_matches: number;
    matches: SimilarRequest[];
  }> {
    return this.request<{
      request_id: string;
      total_matches: number;
      matches: SimilarRequest[];
    }>(`/api/v1/ai/similar/${requestId}?limit=${limit}`);
  }

  public async fetchTaxonomy(): Promise<ControlledTaxonomy> {
    return this.request<ControlledTaxonomy>('/api/v1/ai/taxonomy');
  }
}

export const apiClient = new ApiClient('');

// Export wrapper functions for seamless backward-compatibility
export const submitTextRequest = (p: any) => apiClient.submitTextRequest(p);
export const submitVoiceRequest = (f: FormData) => apiClient.submitVoiceRequest(f);
export const getSupportedLanguages = () => apiClient.getSupportedLanguages();
export const getRequestStatus = (id: string) => apiClient.getRequestStatus(id);
export const fetchCommandCenterKPIs = () => apiClient.fetchCommandCenterKPIs();
export const fetchDemandShadowGrid = () => apiClient.fetchDemandShadowGrid();
export const fetchHotspots = (p?: any) => apiClient.fetchHotspots(p);
export const fetchSilentNeedSignals = (p?: any) => apiClient.fetchSilentNeedSignals(p);
export const fetchDigitalTwin = (g: string) => apiClient.fetchDigitalTwin(g);
export const fetchEvidenceBrief = (s: string) => apiClient.fetchEvidenceBrief(s);
export const simulatePolicyScenario = (p: any) => apiClient.simulatePolicyScenario(p);
export const fetchImpactEvaluations = (params?: {
  geo_id?: string;
  sector?: string;
  evaluation_type?: string;
  data_quality?: string;
  attribution_level?: string;
  limit?: number;
} | string) => apiClient.fetchImpactEvaluations(params);
export const getSystemInfo = () => apiClient.getSystemInfo();
export const getHealthStatus = () => apiClient.getHealthStatus();
export const getReadinessStatus = () => apiClient.getReadinessStatus();
export const getApiV1Status = () => apiClient.getApiV1Status();

// Phase 4 Exports
export const processAIRequest = (id: string) => apiClient.processAIRequest(id);
export const getAIStatus = (id: string) => apiClient.getAIStatus(id);
export const fetchDemandClusters = (p?: any) => apiClient.fetchDemandClusters(p);
export const fetchClusterDetails = (id: string) => apiClient.fetchClusterDetails(id);
export const fetchSimilarRequests = (id: string, l?: number) => apiClient.fetchSimilarRequests(id, l);
export const fetchTaxonomy = () => apiClient.fetchTaxonomy();

// Phase 5 Exports
export const fetchHotspotDetail = (id: string) => apiClient.fetchHotspotDetail(id);
export const fetchHotspotsSummary = () => apiClient.fetchHotspotsSummary();
export const fetchDemandShadowMatrix = (p?: any) => apiClient.fetchDemandShadowMatrix(p);

// Phase 6 Exports
export const fetchSilentNeedDetail = (id: string) => apiClient.fetchSilentNeedDetail(id);
export const fetchSilentNeedSummary = () => apiClient.fetchSilentNeedSummary();

// Phase 7 Exports
export const fetchEvidenceRecord = (id: string) => apiClient.fetchEvidenceRecord(id);
export const fetchEvidenceSummary = () => apiClient.fetchEvidenceSummary();
export const refreshEvidenceBrief = (id: string) => apiClient.refreshEvidenceBrief(id);

// Phase 8 Exports
export const simulateScenario = (p: ScenarioInput) => apiClient.simulateScenario(p);
export const fetchScenarios = (p?: any) => apiClient.fetchScenarios(p);
export const fetchScenarioDetail = (id: string) => apiClient.fetchScenarioDetail(id);
export const compareScenarios = (ids: string[]) => apiClient.compareScenarios(ids);
export const explainScenario = (id: string) => apiClient.explainScenario(id);
export const archiveScenario = (id: string) => apiClient.archiveScenario(id);

// Phase 9 Exports
export const createImpactEvaluation = (p: EvaluationCreateInput) => apiClient.createImpactEvaluation(p);
export const fetchImpactEvaluationDetail = (id: string) => apiClient.fetchImpactEvaluationDetail(id);
export const recordImpactObservation = (id: string, p: ObservationInput) => apiClient.recordImpactObservation(id, p);
export const recalculateImpact = (id: string) => apiClient.recalculateImpact(id);
export const explainImpactEvaluation = (id: string) => apiClient.explainImpactEvaluation(id);
export const fetchModelValidation = () => apiClient.fetchModelValidation();
export const fetchControlledIndicators = () => apiClient.fetchControlledIndicators();

// Phase 10 Exports
export const fetchLearningSummary = () => apiClient.fetchLearningSummary();
export const fetchLearningCandidates = (p?: any) => apiClient.fetchLearningCandidates(p);
export const fetchLearningCandidateDetail = (id: string) => apiClient.fetchLearningCandidateDetail(id);
export const generateLearningCandidate = (p: GenerateCandidateRequest) => apiClient.generateLearningCandidate(p);
export const validateLearningCandidate = (id: string, p?: ValidateCandidateRequest) => apiClient.validateLearningCandidate(id, p);
export const approveLearningCandidate = (id: string, p: ApproveCandidateRequest) => apiClient.approveLearningCandidate(id, p);
export const rejectLearningCandidate = (id: string, p: RejectCandidateRequest) => apiClient.rejectLearningCandidate(id, p);
export const fetchModelVersions = (p?: any) => apiClient.fetchModelVersions(p);
export const activateModelVersion = (v: string, p: ActivateModelRequest) => apiClient.activateModelVersion(v, p);
export const rollbackModelVersion = (v: string, p: RollbackModelRequest) => apiClient.rollbackModelVersion(v, p);
export const explainLearningCandidate = (id: string) => apiClient.explainLearningCandidate(id);
export const fetchLearningAuditEvents = (p?: any) => apiClient.fetchLearningAuditEvents(p);




