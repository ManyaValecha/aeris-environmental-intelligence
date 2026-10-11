import React, { useState, useMemo } from 'react';
import {
  UserLens,
  InterventionControls,
} from './types';
import {
  DELHI_STATIONS,
  getLiveReadings,
  getHistoricalObservations,
  getStationForecast,
  detectStationAnomalies,
  simulateIntervention,
} from './data/stationsData';
import { Header } from './components/Header';
import { HeroTicker } from './components/HeroTicker';
import { HeroSection } from './components/HeroSection';
import { ProofStrip } from './components/ProofStrip';
import { AtmosphericDigitalTwinHUD } from './components/AtmosphericDigitalTwinHUD';
import { LiveVercelDeploymentSection } from './components/LiveVercelDeploymentSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { DualLensesSection } from './components/DualLensesSection';
import { InterventionFlightWorkflow } from './components/InterventionFlightWorkflow';
import { StationsMapSection } from './components/StationsMapSection';
import { ForecastsSection } from './components/ForecastsSection';
import { ForecastTimelineScrubber } from './components/ForecastTimelineScrubber';
import { AnomaliesSection } from './components/AnomaliesSection';
import { InterventionSimulatorSection } from './components/InterventionSimulatorSection';
import { EnvironmentalCopilot } from './components/EnvironmentalCopilot';
import { ProvenanceArchitectureSection } from './components/ProvenanceArchitectureSection';
import { Footer } from './components/Footer';
import { ProvenanceModal } from './components/ProvenanceModal';
import { AWSArchitectureModal } from './components/AWSArchitectureModal';

export default function App() {
  const [activeLens, setActiveLens] = useState<UserLens>('CITIZEN');
  const [selectedStationId, setSelectedStationId] = useState<string>('DELHI_ANAND_VIHAR');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isArchModalOpen, setIsArchModalOpen] = useState<boolean>(false);
  const [forecastModelSuite, setForecastModelSuite] = useState<'LIGHTGBM' | 'RESEARCH_MULTIMODEL'>('LIGHTGBM');
  const [anomalyMethod, setAnomalyMethod] = useState<'ISOLATION_FOREST' | 'MAD'>('ISOLATION_FOREST');

  // Policy intervention sliders state
  const [interventionControls, setInterventionControls] = useState<InterventionControls>({
    trafficReductionFraction: 0,
    constructionReductionFraction: 0,
    industrialReductionFraction: 0,
  });

  // Current readings for all 8 stations
  const allReadings = useMemo(() => getLiveReadings(), []);

  // Selected station reading
  const selectedReading = useMemo(() => {
    return allReadings.find((r) => r.stationId === selectedStationId) || allReadings[0];
  }, [allReadings, selectedStationId]);

  // Historical 24h observations for the selected station
  const historical = useMemo(() => {
    return getHistoricalObservations(selectedStationId, 24);
  }, [selectedStationId]);

  // Multi-horizon ML forecast for the selected station (NOW, 1h, 6h, 24h)
  const forecast = useMemo(() => {
    return getStationForecast(selectedReading, forecastModelSuite);
  }, [selectedReading, forecastModelSuite]);

  // Anomalies detected across all Delhi stations
  const anomalies = useMemo(() => {
    const list = [];
    for (const reading of allReadings) {
      const hist = getHistoricalObservations(reading.stationId, 24);
      const stMeta = DELHI_STATIONS.find((s) => s.id === reading.stationId);
      const anoms = detectStationAnomalies(
        reading.stationId,
        stMeta?.name || reading.stationId,
        hist,
        anomalyMethod
      );
      list.push(...anoms);
    }
    return list;
  }, [allReadings, anomalyMethod]);

  // Real-time counterfactual policy intervention impact
  const scenarioResult = useMemo(() => {
    return simulateIntervention(forecast, interventionControls);
  }, [forecast, interventionControls]);

  const handleScrollTo = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-sans selection:bg-sun selection:text-ink">
      {/* 1. Sticky Navigation Header */}
      <Header
        activeLens={activeLens}
        onLensChange={setActiveLens}
        onOpenAudit={() => setIsAuditModalOpen(true)}
        onOpenArchitecture={() => setIsArchModalOpen(true)}
        onScrollTo={handleScrollTo}
      />

      {/* 2. Marquee Ticker */}
      <HeroTicker />

      {/* 3. Hero Section (Split Grid with Dynamic 3D Earth Globe & NCR Radar) */}
      <HeroSection
        activeLens={activeLens}
        onLensChange={setActiveLens}
        selectedStation={selectedReading}
        allStations={allReadings}
        onSelectStation={setSelectedStationId}
        onScrollTo={handleScrollTo}
      />

      {/* 4. Quick Proof / Stats Strip */}
      <ProofStrip />

      {/* 5. Atmospheric Boundary Layer Digital Twin HUD Strip */}
      <section className="border-b-[3px] border-ink bg-paper py-8">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <AtmosphericDigitalTwinHUD reading={selectedReading} />
        </div>
      </section>

      {/* 5B. Live Cloud Production Portal, Forest Biosphere & Vercel/GitHub Deployment */}
      <LiveVercelDeploymentSection />

      {/* 6. Signature Guided Workflow: The Intervention Flight (6 Stages) */}
      <section className="border-b-[3px] border-ink bg-paper-deep py-10">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <InterventionFlightWorkflow
            selectedStation={selectedReading}
            forecast={forecast}
            scenarioResult={scenarioResult}
            anomalies={anomalies}
            onScrollTo={handleScrollTo}
            onOpenAudit={() => setIsAuditModalOpen(true)}
          />
        </div>
      </section>

      {/* 7. How AERIS Works (4 Steps) */}
      <HowItWorksSection />

      {/* 8. Dual Lenses: Citizen vs Municipal Authority */}
      <DualLensesSection
        activeLens={activeLens}
        onLensChange={setActiveLens}
        onScrollTo={handleScrollTo}
      />

      {/* 9. Delhi NCR Interactive Stations & Spatial Map */}
      <StationsMapSection
        allReadings={allReadings}
        selectedStationId={selectedStationId}
        onSelectStation={setSelectedStationId}
        activeLens={activeLens}
        onOpenAudit={() => setIsAuditModalOpen(true)}
      />

      {/* 10. Machine Learning Multi-Horizon Forecasts & Scrubber */}
      <ForecastsSection
        forecast={forecast}
        historical={historical}
        onOpenAudit={() => setIsAuditModalOpen(true)}
        modelSuite={forecastModelSuite}
        onModelSuiteChange={setForecastModelSuite}
      />

      <section className="border-b-[3px] border-ink bg-paper py-8">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <ForecastTimelineScrubber
            forecast={forecast}
            onOpenAudit={() => setIsAuditModalOpen(true)}
          />
        </div>
      </section>

      {/* 11. Pollution Anomaly Radar & Drivers */}
      <AnomaliesSection
        anomalies={anomalies}
        onSelectStation={setSelectedStationId}
        onOpenAudit={() => setIsAuditModalOpen(true)}
        anomalyMethod={anomalyMethod}
        onMethodChange={setAnomalyMethod}
      />

      {/* 12. Policy Intervention Simulation Lab */}
      <InterventionSimulatorSection
        forecast={forecast}
        controls={interventionControls}
        onControlsChange={setInterventionControls}
        scenarioResult={scenarioResult}
        onOpenAudit={() => setIsAuditModalOpen(true)}
      />

      {/* 13. Amazon Bedrock Grounded Environmental Copilot */}
      <section id="copilot" className="border-b-[3px] border-ink bg-paper py-12 lg:py-16">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="mb-6 flex flex-col items-start">
            <span className="brutal-sticker bg-sun text-ink -rotate-1">
              GROUNDED NATURAL LANGUAGE
            </span>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-ink sm:text-4xl font-display">
              ENVIRONMENTAL COPILOT INTELLIGENCE
            </h2>
            <p className="mt-1 text-xs text-ink-soft max-w-xl">
              Amazon Bedrock synthesis strictly grounded in CPCB station sensors and ERA5 reanalysis. Never hallucinates numbers.
            </p>
          </div>

          <EnvironmentalCopilot
            activeLens={activeLens}
            onLensChange={setActiveLens}
            selectedStation={selectedReading}
            forecast={forecast}
            scenarioResult={scenarioResult}
            onOpenAudit={() => setIsAuditModalOpen(true)}
          />
        </div>
      </section>

      {/* 14. Open Science & Provenance Architecture */}
      <ProvenanceArchitectureSection
        onOpenAudit={() => setIsAuditModalOpen(true)}
      />

      {/* 15. Footer */}
      <Footer
        onScrollTo={handleScrollTo}
        onOpenAudit={() => setIsAuditModalOpen(true)}
      />

      {/* 16. Data Provenance Audit Modal (6 Taxonomy Tiers) */}
      <ProvenanceModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      {/* 17. AWS CDK Serverless Architecture Modal */}
      <AWSArchitectureModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />
    </div>
  );
}
