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
  ControlledTaxonomy
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

  public async fetchHotspots(category?: string): Promise<Hotspot[]> {
    const url = category ? `/api/v1/hotspots?category=${category}` : '/api/v1/hotspots';
    const res = await this.request<{ success: boolean; data: Hotspot[] }>(url);
    return res.data;
  }

  public async fetchSilentNeedSignals(category?: string): Promise<SilentNeedSignal[]> {
    const url = category ? `/api/v1/silent-need?category=${category}` : '/api/v1/silent-need';
    const res = await this.request<{ success: boolean; data: SilentNeedSignal[] }>(url);
    return res.data;
  }

  public async fetchDigitalTwin(geoId: string): Promise<CivicDigitalTwin> {
    const res = await this.request<{ success: boolean; data: CivicDigitalTwin }>(`/api/v1/digital-twin/${geoId}`);
    return res.data;
  }

  public async fetchEvidenceBrief(signalId: string): Promise<GroundedEvidenceBrief> {
    const res = await this.request<{ success: boolean; data: GroundedEvidenceBrief }>(`/api/v1/evidence/${signalId}`);
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

  public async fetchImpactEvaluations(sector?: string): Promise<ImpactMetric[]> {
    const url = sector ? `/api/v1/impact/evaluations?sector=${sector}` : '/api/v1/impact/evaluations';
    const res = await this.request<{ success: boolean; data: ImpactMetric[] }>(url);
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
export const fetchHotspots = (c?: string) => apiClient.fetchHotspots(c);
export const fetchSilentNeedSignals = (c?: string) => apiClient.fetchSilentNeedSignals(c);
export const fetchDigitalTwin = (g: string) => apiClient.fetchDigitalTwin(g);
export const fetchEvidenceBrief = (s: string) => apiClient.fetchEvidenceBrief(s);
export const simulatePolicyScenario = (p: any) => apiClient.simulatePolicyScenario(p);
export const fetchImpactEvaluations = (s?: string) => apiClient.fetchImpactEvaluations(s);
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

