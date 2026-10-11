import React, { useState } from 'react';
import { StationReading, StationForecast, ScenarioResult, Anomaly } from '../types';
import { Plane, CheckCircle, ArrowRight, ArrowLeft, MapPin, AlertTriangle, TrendingUp, Sliders, ShieldCheck, Bot } from 'lucide-react';

interface InterventionFlightWorkflowProps {
  selectedStation: StationReading;
  forecast: StationForecast;
  scenarioResult: ScenarioResult;
  anomalies: Anomaly[];
  onScrollTo: (sectionId: string) => void;
  onOpenAudit: () => void;
}

export const InterventionFlightWorkflow: React.FC<InterventionFlightWorkflowProps> = ({
  selectedStation,
  forecast,
  scenarioResult,
  anomalies,
  onScrollTo,
  onOpenAudit,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  const steps = [
    {
      num: 1,
      name: 'Identify Anomaly Station',
      sectionId: 'stations',
      icon: MapPin,
      badge: 'MEASURED',
      desc: `Focus on hotspot: ${selectedStation.stationId.replace('DELHI_', '')} reporting AQI ${selectedStation.aqi.value} (${selectedStation.aqi.category.replace('_', ' ')}).`,
    },
    {
      num: 2,
      name: 'Inspect Historical Series & MAD Spikes',
      sectionId: 'anomalies',
      icon: AlertTriangle,
      badge: 'SIMULATED',
      desc: `Automated MAD detector flags local surge (+${anomalies[0]?.observedValue || 182} µg/m³ PM2.5) exceeding rolling median.`,
    },
    {
      num: 3,
      name: 'Compare 1h / 6h / 24h ML Forecasts',
      sectionId: 'forecasts',
      icon: TrendingUp,
      badge: 'PREDICTED',
      desc: `Multi-horizon models (XGBoost 1h, LSTM 6h, Prophet 24h) display calibrated 95% uncertainty spans (±1.96 × RMSE).`,
    },
    {
      num: 4,
      name: 'Adjust Sector Intervention Levers',
      sectionId: 'interventions',
      icon: Sliders,
      badge: 'ESTIMATED',
      desc: `Simulate vehicular odd-even, construction dust suppression, and industrial shutdown sliders.`,
    },
    {
      num: 5,
      name: 'Evaluate Estimated AQI Delta',
      sectionId: 'interventions',
      icon: ShieldCheck,
      badge: 'ESTIMATED',
      desc: `Projected reduction: -${Math.abs(scenarioResult.horizons['6h'].absoluteDelta)} µg/m³ (${Math.abs(scenarioResult.horizons['6h'].percentageDelta)}%) over the next 6 hours.`,
    },
    {
      num: 6,
      name: 'Read Amazon Bedrock Briefing',
      sectionId: 'copilot',
      icon: Bot,
      badge: 'AI-GENERATED',
      desc: `Grounded executive summary and GRAP statutory directives synthesized without hallucinations.`,
    },
  ];

  const activeStepData = steps[currentStep - 1];
  const StepIcon = activeStepData.icon;

  const handleNext = () => {
    if (currentStep < 6) {
      const next = currentStep + 1;
      setCurrentStep(next);
      onScrollTo(steps[next - 1].sectionId);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      onScrollTo(steps[prev - 1].sectionId);
    }
  };

  const handleJump = (stepNum: number) => {
    setCurrentStep(stepNum);
    onScrollTo(steps[stepNum - 1].sectionId);
  };

  return (
    <div id="flight" className="brutal-card bg-paper-light p-6 sm:p-8">
      {/* Flight Header */}
      <div className="flex flex-wrap items-center justify-between border-b-[2px] border-ink/20 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center border-[2px] border-ink bg-coral text-ink shadow-[2px_2px_0_var(--ink)]">
            <Plane className="h-5 w-5 stroke-[2.5]" />
          </span>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-ink font-display">
              The Intervention Flight — Signature Guided Workflow
            </h3>
            <span className="font-mono text-[10px] text-ink-soft">
              Six-Stage End-to-End Decision Journey · From Anomaly Discovery to Actionable Policy
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-black text-ink border-[2px] border-ink bg-sun px-3 py-1 shadow-[2px_2px_0_var(--ink)]">
            STAGE {currentStep} OF 6
          </span>
        </div>
      </div>

      {/* 6 Step Progress Track */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {steps.map((st) => {
          const isDone = st.num < currentStep;
          const isCurrent = st.num === currentStep;

          return (
            <button
              key={st.num}
              onClick={() => handleJump(st.num)}
              className={`border-[2px] border-ink p-3 text-left transition-all cursor-pointer flex flex-col justify-between ${
                isCurrent
                  ? 'bg-ink text-paper shadow-[4px_4px_0_var(--sun)] -translate-y-1'
                  : isDone
                  ? 'bg-sun/20 text-ink hover:bg-sun/40'
                  : 'bg-white text-ink hover:bg-paper'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black">
                    0{st.num}
                  </span>
                  {isDone ? (
                    <CheckCircle className="h-3.5 w-3.5 text-mint stroke-[3]" />
                  ) : (
                    <span className="font-mono text-[8px] uppercase border px-1 border-current">
                      {st.badge}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-[10px] font-black uppercase tracking-tight line-clamp-2">
                  {st.name}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Stage Deep-Dive Card */}
      <div className="mt-6 border-[3px] border-ink bg-paper p-5 sm:p-6 shadow-[4px_4px_0_var(--ink)]">
        <div className="flex flex-wrap items-center justify-between border-b border-ink/20 pb-3 gap-2">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center border-[2px] border-ink bg-sun text-ink shadow-[2px_2px_0_var(--ink)]">
              <StepIcon className="h-4 w-4 stroke-[2.5]" />
            </span>
            <span className="font-mono text-sm font-black uppercase text-ink">
              Stage 0{currentStep}: {activeStepData.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 border border-ink bg-white text-ink">
              TARGET MODULE: #{activeStepData.sectionId.toUpperCase()}
            </span>
            <button
              onClick={onOpenAudit}
              className="font-mono text-[10px] font-bold text-coral underline cursor-pointer"
            >
              TAG: {activeStepData.badge}
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs sm:text-sm leading-relaxed text-ink font-medium">
          {activeStepData.desc}
        </p>

        {/* Step Navigation Actions */}
        <div className="mt-6 pt-4 border-t border-ink/20 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`brutal-button px-4 py-2 text-xs gap-1.5 ${
              currentStep === 1 ? 'opacity-40 cursor-not-allowed bg-paper' : 'bg-white hover:bg-paper-light text-ink'
            }`}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Previous Stage</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onScrollTo(activeStepData.sectionId)}
              className="brutal-button bg-sun hover:bg-sun-hover px-4 py-2 text-xs text-ink"
            >
              <span>Jump To Module View</span>
            </button>
            <button
              onClick={handleNext}
              disabled={currentStep === 6}
              className={`brutal-button px-5 py-2 text-xs gap-1.5 ${
                currentStep === 6 ? 'opacity-40 cursor-not-allowed bg-paper' : 'bg-ink text-paper shadow-[3px_3px_0_var(--sun)]'
              }`}
            >
              <span>{currentStep === 6 ? 'Workflow Completed' : 'Proceed to Next Stage'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
