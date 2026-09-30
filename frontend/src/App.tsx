import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { apiClient } from './lib/api';
import { Navbar } from './components/Navbar';
import { Phase1FoundationShell } from './components/Phase1FoundationShell';
import { DataFoundationView } from './components/DataFoundationView';
import { CitizenPortal } from './components/CitizenPortal';
import { CommandCenter } from './components/CommandCenter';
import { HotspotsView } from './components/HotspotsView';
import { DemandShadowMap } from './components/DemandShadowMap';
import { SilentNeedView } from './components/SilentNeedView';
import { CivicDigitalTwinView } from './components/CivicDigitalTwinView';
import { PolicySandbox } from './components/PolicySandbox';
import { ImpactDashboard } from './components/ImpactDashboard';
import { EvidenceModal } from './components/EvidenceModal';

const AppContent: React.FC = () => {
  const { getIdToken } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('foundation');
  const [selectedGeoId, setSelectedGeoId] = useState<string>('IND_TN_DHM_HRR');
  const [activeEvidenceSignalId, setActiveEvidenceSignalId] = useState<string | null>(null);

  useEffect(() => {
    // Configure API client with the dynamic Firebase token provider
    apiClient.setTokenProvider(getIdToken);
  }, [getIdToken]);

  const handleSelectRegion = (geoId: string) => {
    setSelectedGeoId(geoId);
    setActiveTab('digital-twin');
  };

  const handleOpenEvidence = (signalId: string) => {
    setActiveEvidenceSignalId(signalId);
  };

  return (
    <div className="min-h-screen bg-[#070F1E] flex flex-col">
      {/* Sovereign Header & Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'foundation' && <Phase1FoundationShell />}
        {activeTab === 'data-foundation' && <DataFoundationView />}
        {activeTab === 'citizen' && <CitizenPortal />}
        {activeTab === 'command-center' && <CommandCenter onSelectRegion={handleSelectRegion} />}
        {activeTab === 'hotspots' && <HotspotsView onSelectRegion={handleSelectRegion} />}
        {activeTab === 'shadow-map' && (
          <DemandShadowMap 
            onSelectRegion={handleSelectRegion} 
            onOpenEvidence={handleOpenEvidence} 
          />
        )}
        {activeTab === 'silent-need' && (
          <SilentNeedView 
            onOpenEvidence={handleOpenEvidence} 
            onSelectRegion={handleSelectRegion} 
          />
        )}
        {activeTab === 'digital-twin' && (
          <CivicDigitalTwinView 
            selectedGeoId={selectedGeoId} 
            onSelectGeoId={setSelectedGeoId}
            onOpenEvidence={handleOpenEvidence}
          />
        )}
        {activeTab === 'sandbox' && <PolicySandbox />}
        {activeTab === 'impact' && <ImpactDashboard />}
      </main>

      {/* Global Grounded Evidence Modal */}
      <EvidenceModal 
        signalId={activeEvidenceSignalId} 
        onClose={() => setActiveEvidenceSignalId(null)} 
      />

      {/* Footer */}
      <footer className="border-t border-[#1E3E62]/40 bg-[#0B192C] px-4 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <p>
            <strong>JANSETU</strong> • AI Civic Infrastructure Intelligence Grid • Republic of India Digital Public Good Foundation
          </p>
          <p className="font-mono text-[11px] text-slate-400">
            Powered by Google Cloud (Cloud Run, BigQuery, Pub/Sub, Cloud Storage, Firebase Auth)
          </p>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};
