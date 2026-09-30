import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { apiClient } from '../src/lib/api';
import { AuthProvider } from '../src/context/AuthContext';
import { Phase1FoundationShell } from '../src/components/Phase1FoundationShell';
import { DataFoundationView } from '../src/components/DataFoundationView';
import { CitizenPortal } from '../src/components/CitizenPortal';
import { AIPerceptionView } from '../src/components/AIPerceptionView';
import { CommandCenter } from '../src/components/CommandCenter';
import { HotspotsView } from '../src/components/HotspotsView';
import { DemandShadowMap } from '../src/components/DemandShadowMap';
import { SilentNeedView } from '../src/components/SilentNeedView';
import { CivicDigitalTwinView } from '../src/components/CivicDigitalTwinView';
import { PolicySandbox } from '../src/components/PolicySandbox';
import { ImpactDashboard } from '../src/components/ImpactDashboard';
import { LearningDashboard } from '../src/components/LearningDashboard';
import { EvidenceModal } from '../src/components/EvidenceModal';
import { Navbar } from '../src/components/Navbar';
import { App } from '../src/App';

async function verifyAll() {
  console.log('====================================================');
  console.log('JANSETU — METADATA & COMPONENT VERIFICATION SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(title: string, condition: boolean, extraInfo?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ [PASS] ${title}`);
    } else {
      console.error(`  ✗ [FAIL] ${title} - ${extraInfo || 'Assertion failed'}`);
    }
  }

  // ---------------------------------------------------------
  // STEP 1: VERIFY ALL API CLIENT METHODS (IN-MEMORY METADATA)
  // ---------------------------------------------------------
  console.log('--- 1. Testing API Client Metadata Endpoints ---');

  try {
    const health = await apiClient.getHealthStatus();
    assert('getHealthStatus() returns healthy status', health.status === 'healthy');

    const readiness = await apiClient.getReadinessStatus();
    assert('getReadinessStatus() indicates ready', readiness.status === 'ready');

    const sysInfo = await apiClient.getSystemInfo();
    assert('getSystemInfo() returns system info', sysInfo.name === 'JANSETU');

    const dataCatalog = await apiClient.getDataStatus();
    assert('getDataStatus() returns 12 canonical tables', dataCatalog.canonical_tables_count === 12);

    const dataQuality = await apiClient.getDataQuality();
    assert('getDataQuality() returns quality report', dataQuality.status === 'healthy' && !!dataQuality.data);

    const geoNode = await apiClient.getGeographyById('IND_TN_DHM_HRR');
    assert('getGeographyById() returns node', geoNode.data.record.geo_id === 'IND_TN_DHM_HRR');

    const languages = await apiClient.getSupportedLanguages();
    assert('getSupportedLanguages() returns supported languages', languages.languages.length >= 7);

    const textSubmit = await apiClient.submitTextRequest({
      text: 'Water supply line in Harur is cracked and leaking.',
      detected_language: 'ta',
      declared_district: 'Dharmapuri',
      declared_state: 'Tamil Nadu'
    });
    assert('submitTextRequest() processes and returns extraction', textSubmit.status === 'PROCESSED' && !!textSubmit.extraction);

    const taxonomy = await apiClient.fetchTaxonomy();
    assert('fetchTaxonomy() returns 7 priority sectors', Object.keys(taxonomy.categories).length === 7);

    const clusters = await apiClient.fetchDemandClusters();
    assert('fetchDemandClusters() returns clusters', clusters.clusters.length > 0);

    const clusterDetail = await apiClient.fetchClusterDetails(clusters.clusters[0].cluster_id);
    assert('fetchClusterDetails() returns cluster detail', !!clusterDetail.cluster_id);

    const similar = await apiClient.fetchSimilarRequests(textSubmit.request_id);
    assert('fetchSimilarRequests() returns nearest neighbors', similar.matches.length > 0);

    const kpis = await apiClient.fetchCommandCenterKPIs();
    assert('fetchCommandCenterKPIs() returns active hotspots and requests', kpis.total_citizen_requests > 0);

    const hotspots = await apiClient.fetchHotspots();
    assert('fetchHotspots() returns pan-India hotspots', hotspots.length > 0);

    const hotspotSummary = await apiClient.fetchHotspotsSummary();
    assert('fetchHotspotsSummary() returns summary telemetry', hotspotSummary.active_demand_hotspots > 0);

    const shadowZones = await apiClient.fetchDemandShadowGrid();
    assert('fetchDemandShadowGrid() returns 4-quadrant zones', shadowZones.zones.length > 0);

    const shadowMatrix = await apiClient.fetchDemandShadowMatrix();
    assert('fetchDemandShadowMatrix() returns matrix items', shadowMatrix.matrix.length > 0);

    const silentSignals = await apiClient.fetchSilentNeedSignals();
    assert('fetchSilentNeedSignals() returns silent need signals', silentSignals.length > 0);

    const silentSummary = await apiClient.fetchSilentNeedSummary();
    assert('fetchSilentNeedSummary() returns analytical summary', silentSummary.total_signals > 0);

    const twin = await apiClient.fetchDigitalTwin('IND_TN_DHM_HRR');
    assert('fetchDigitalTwin() returns multi-layer twin', twin.geo_id === 'IND_TN_DHM_HRR' && !!twin.population_metrics);

    const evidenceBrief = await apiClient.fetchEvidenceBrief('SIG-5127A0-TN-DHM-01');
    assert('fetchEvidenceBrief() returns synthesis and audit trail', evidenceBrief.evidence.length > 0 && !!evidenceBrief.signal_id);

    const evidenceRecord = await apiClient.fetchEvidenceRecord('EV-5127A0-INF-01');
    assert('fetchEvidenceRecord() returns verified record', !!evidenceRecord.evidence_id);

    const evidenceSummary = await apiClient.fetchEvidenceSummary();
    assert('fetchEvidenceSummary() returns summary telemetry', evidenceSummary.total_evidence_records > 0);

    const scenarios = await apiClient.fetchScenarios();
    assert('fetchScenarios() returns scenarios', scenarios.scenarios.length > 0);

    const simResult = await apiClient.simulateScenario({
      geo_id: 'IND_TN_DHM_HRR',
      sector: 'water',
      intervention_type: 'INFRASTRUCTURE_CAPACITY_INCREASE',
      coverage_improvement_pct: 65,
      target_population_pct: 50,
      hypothetical_budget_inr: 30000000
    });
    assert('simulateScenario() runs deterministic simulation', simResult.status === 'COMPLETED' && simResult.absolute_gain_pct === 65);

    const evaluations = await apiClient.fetchImpactEvaluations();
    assert('fetchImpactEvaluations() returns closed-loop evaluations', evaluations.length > 0);

    const indicators = await apiClient.fetchControlledIndicators();
    assert('fetchControlledIndicators() returns indicators', indicators.length > 0);

    const recordedObs = await apiClient.recordImpactObservation(evaluations[0].evaluation_id, {
      value: 78.5,
      unit: "%",
      observation_date: "2026-09-30",
      source: "District Water Supply Monitoring Unit",
      source_type: "FIELD_AUDIT"
    });
    assert('recordImpactObservation() updates observed delta and verified status', recordedObs.observation?.value === 78.5);

    const modelValidation = await apiClient.fetchModelValidation();
    assert('fetchModelValidation() returns validation scores', modelValidation.total_scenarios_evaluated > 0);

    const learningSummary = await apiClient.fetchLearningSummary();
    assert('fetchLearningSummary() returns continuous calibration metrics', learningSummary.total_candidates > 0);

    const learningCandidates = await apiClient.fetchLearningCandidates();
    assert('fetchLearningCandidates() returns candidate parameters', learningCandidates.length > 0);

    const modelVersions = await apiClient.fetchModelVersions();
    assert('fetchModelVersions() returns versioned models', modelVersions.length > 0);

    const auditTrail = await apiClient.fetchLearningAuditEvents();
    assert('fetchLearningAuditEvents() returns auditable events', auditTrail.length > 0);

    const validatedCandidate = await apiClient.validateLearningCandidate(learningCandidates[0].candidate_id);
    assert('validateLearningCandidate() transitions to VALIDATED', validatedCandidate.status === 'VALIDATED');

  } catch (err: any) {
    console.error('API Test Failure:', err);
    assert('All API methods succeed', false, err.message);
  }

  // ---------------------------------------------------------
  // STEP 2: VERIFY ALL PAGE COMPONENTS RENDER WITHOUT CRASH
  // ---------------------------------------------------------
  console.log('\n--- 2. Testing Component Rendering (SSR Smoke Tests) ---');

  const pagesToTest = [
    { name: 'Navbar', element: <Navbar activeTab="foundation" setActiveTab={() => {}} /> },
    { name: 'Phase 1: Foundation Shell', element: <Phase1FoundationShell /> },
    { name: 'Phase 2: Data Foundation View', element: <DataFoundationView /> },
    { name: 'Phase 3: Citizen Portal', element: <CitizenPortal /> },
    { name: 'Phase 4: AI Perception & Clustering', element: <AIPerceptionView /> },
    { name: 'Phase 5: Command Center View', element: <CommandCenter onSelectRegion={() => {}} /> },
    { name: 'Phase 5: Hotspots View', element: <HotspotsView onSelectRegion={() => {}} /> },
    { name: 'Phase 5: Demand Shadow Map', element: <DemandShadowMap onSelectRegion={() => {}} onOpenEvidence={() => {}} /> },
    { name: 'Phase 6: Silent Need Lab View', element: <SilentNeedView onSelectRegion={() => {}} onOpenEvidence={() => {}} /> },
    { name: 'Phase 6: Civic Digital Twin View', element: <CivicDigitalTwinView selectedGeoId="IND_TN_DHM_HRR" onSelectGeoId={() => {}} onOpenEvidence={() => {}} /> },
    { name: 'Phase 8: Policy Sandbox', element: <PolicySandbox /> },
    { name: 'Phase 9: Impact Dashboard', element: <ImpactDashboard /> },
    { name: 'Phase 10: Learning Dashboard', element: <LearningDashboard onNavigateToImpact={() => {}} /> },
    { name: 'Phase 7: Evidence Modal', element: <EvidenceModal signalId="SIG-5127A0-TN-DHM-01" onClose={() => {}} /> },
    { name: 'Full Application (App)', element: <App /> }
  ];

  for (const page of pagesToTest) {
    try {
      const html = ReactDOMServer.renderToString(
        <AuthProvider>
          {page.element}
        </AuthProvider>
      );
      assert(`Render page: ${page.name}`, typeof html === 'string' && html.length > 50);
    } catch (err: any) {
      console.error(`Render Failure on [${page.name}]:`, err);
      assert(`Render page: ${page.name}`, false, err.message);
    }
  }

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
  console.log('====================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

verifyAll().catch((e) => {
  console.error("FATAL ERROR:", e);
  process.exit(1);
});
