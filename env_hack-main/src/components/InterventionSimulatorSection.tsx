import React from 'react';
import {
  StationForecast,
  InterventionControls,
  ScenarioResult,
  ForecastHorizon,
} from '../types';
import { Sliders, RotateCcw, AlertCircle, ArrowDown, TrendingDown, BookOpen, Check } from 'lucide-react';

interface InterventionSimulatorSectionProps {
  forecast: StationForecast;
  controls: InterventionControls;
  onControlsChange: (controls: InterventionControls) => void;
  scenarioResult: ScenarioResult;
  onOpenAudit: () => void;
}

export const InterventionSimulatorSection: React.FC<InterventionSimulatorSectionProps> = ({
  forecast,
  controls,
  onControlsChange,
  scenarioResult,
  onOpenAudit,
}) => {
  const handleSliderChange = (
    key: keyof InterventionControls,
    val: number
  ) => {
    onControlsChange({
      ...controls,
      [key]: val,
    });
  };

  const handleReset = () => {
    onControlsChange({
      trafficReductionFraction: 0,
      constructionReductionFraction: 0,
      industrialReductionFraction: 0,
    });
  };

  const applyPreset = (preset: 'oddeven' | 'dustcurb' | 'fullgrap') => {
    if (preset === 'oddeven') {
      onControlsChange({
        trafficReductionFraction: 0.35,
        constructionReductionFraction: 0.05,
        industrialReductionFraction: 0.05,
      });
    } else if (preset === 'dustcurb') {
      onControlsChange({
        trafficReductionFraction: 0.1,
        constructionReductionFraction: 0.45,
        industrialReductionFraction: 0.1,
      });
    } else if (preset === 'fullgrap') {
      onControlsChange({
        trafficReductionFraction: 0.45,
        constructionReductionFraction: 0.5,
        industrialReductionFraction: 0.45,
      });
    }
  };

  return (
    <section id="interventions" className="border-b-[3px] border-ink bg-paper-deep py-14 lg:py-20">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="brutal-sticker bg-coral text-ink -rotate-2">
                POLICY SIMULATION LAB
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-ink-soft">
                Counterfactual Sensitivity Engine
              </span>
            </div>
            <h2 className="mt-4 text-3xl font-black uppercase tracking-[-0.04em] text-ink sm:text-5xl font-display">
              TEST INTERVENTIONS.
            </h2>
            <p className="mt-2 text-sm text-ink-soft max-w-xl">
              Model hypothetical municipal mitigation levers for {forecast.stationName}. View immediate 1h, 6h, and 24h airshed sensitivity based on CPCB source apportionment coefficients.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={handleReset}
              className="brutal-button bg-white hover:bg-paper px-3 py-1.5 text-xs text-ink gap-1.5 shadow-[3px_3px_0_var(--ink)] cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={onOpenAudit}
              className="brutal-sticker bg-mint text-ink hover:bg-mint/80 transition-colors cursor-pointer"
            >
              PROVENANCE: {scenarioResult.provenance}
            </button>
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-black uppercase text-ink-soft pr-2">
            Quick Policy Scenarios:
          </span>
          <button
            onClick={() => applyPreset('oddeven')}
            className="border-[2px] border-ink bg-paper-light px-3 py-1 text-xs font-black uppercase tracking-wider hover:bg-sun transition-colors shadow-[2px_2px_0_var(--ink)] cursor-pointer"
          >
            Odd-Even Vehicle Scheme
          </button>
          <button
            onClick={() => applyPreset('dustcurb')}
            className="border-[2px] border-ink bg-paper-light px-3 py-1 text-xs font-black uppercase tracking-wider hover:bg-sun transition-colors shadow-[2px_2px_0_var(--ink)] cursor-pointer"
          >
            Construction Moratorium
          </button>
          <button
            onClick={() => applyPreset('fullgrap')}
            className="border-[2px] border-ink bg-danger text-paper px-3 py-1 text-xs font-black uppercase tracking-wider hover:bg-danger/80 transition-colors shadow-[2px_2px_0_var(--ink)] cursor-pointer"
          >
            Emergency GRAP Stage IV
          </button>
        </div>

        {/* Main Grid: Control Sliders (Left) vs Real-Time Impact Results (Right) */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          {/* Left Column: Interactive Policy Controls */}
          <div className="brutal-card p-6 sm:p-7 bg-paper-light flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b-[2px] border-ink/20 pb-3">
                <span className="font-mono text-xs font-black uppercase text-ink">
                  SECTOR MITIGATION SLIDERS
                </span>
                <span className="text-[10px] font-bold text-ink-soft font-mono">
                  Cap: 50% Reduction Max
                </span>
              </div>

              {/* Slider 1: Traffic Reduction */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-ink font-display">
                    1. Vehicular Traffic Combustion
                  </label>
                  <span className="border-[2px] border-ink bg-sun px-2 py-0.5 font-mono text-xs font-black text-ink shadow-[2px_2px_0_var(--ink)]">
                    {Math.round(controls.trafficReductionFraction * 100)}%
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-ink-soft leading-tight">
                  Odd-Even passenger vehicle rationing, restricted diesel truck entry, and EV public transit deployment.
                </p>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={controls.trafficReductionFraction}
                  onChange={(e) => handleSliderChange('trafficReductionFraction', parseFloat(e.target.value))}
                  className="mt-3 w-full h-3 bg-paper rounded border-[2px] border-ink appearance-none cursor-pointer accent-ink"
                />
                <div className="mt-1 flex justify-between text-[10px] font-mono text-ink-soft">
                  <span>Baseline (0%)</span>
                  <span>Max Achievable Curb (50%)</span>
                </div>
              </div>

              {/* Slider 2: Construction & Dust Reduction */}
              <div className="mt-6 pt-5 border-t border-ink/15">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-ink font-display">
                    2. Construction & Road Dust Suspension
                  </label>
                  <span className="border-[2px] border-ink bg-coral px-2 py-0.5 font-mono text-xs font-black text-ink shadow-[2px_2px_0_var(--ink)]">
                    {Math.round(controls.constructionReductionFraction * 100)}%
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-ink-soft leading-tight">
                  Mechanized vacuum road sweeping, water misting cannons, and total cessation of structural demolition.
                </p>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={controls.constructionReductionFraction}
                  onChange={(e) => handleSliderChange('constructionReductionFraction', parseFloat(e.target.value))}
                  className="mt-3 w-full h-3 bg-paper rounded border-[2px] border-ink appearance-none cursor-pointer accent-ink"
                />
                <div className="mt-1 flex justify-between text-[10px] font-mono text-ink-soft">
                  <span>Baseline (0%)</span>
                  <span>Max Achievable Curb (50%)</span>
                </div>
              </div>

              {/* Slider 3: Industrial & Biomass Reduction */}
              <div className="mt-6 pt-5 border-t border-ink/15">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-ink font-display">
                    3. Industrial Combustion & Waste Burning
                  </label>
                  <span className="border-[2px] border-ink bg-violet px-2 py-0.5 font-mono text-xs font-black text-paper shadow-[2px_2px_0_var(--ink)]">
                    {Math.round(controls.industrialReductionFraction * 100)}%
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-ink-soft leading-tight">
                  Shutdown of non-conforming industrial units, ban on diesel generator sets, and zero-tolerance municipal waste burning patrol.
                </p>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={controls.industrialReductionFraction}
                  onChange={(e) => handleSliderChange('industrialReductionFraction', parseFloat(e.target.value))}
                  className="mt-3 w-full h-3 bg-paper rounded border-[2px] border-ink appearance-none cursor-pointer accent-ink"
                />
                <div className="mt-1 flex justify-between text-[10px] font-mono text-ink-soft">
                  <span>Baseline (0%)</span>
                  <span>Max Achievable Curb (50%)</span>
                </div>
              </div>
            </div>

            {/* Scientific Citation Footer */}
            <div className="mt-6 border-t-[2px] border-ink/20 pt-4 flex items-center justify-between text-[10px] font-mono text-ink-soft">
              <span>Coefficients: CPCB &amp; SAFAR 2020 Study</span>
              <span className="text-ink font-bold">Linear Sensitivity Bound</span>
            </div>
          </div>

          {/* Right Column: Comparative Results Across Horizons */}
          <div className="brutal-card p-6 sm:p-7 bg-paper-light flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b-[2px] border-ink/20 pb-3">
                <span className="font-mono text-xs font-black uppercase text-ink">
                  HORIZON SENSITIVITY IMPACT
                </span>
                <span className="text-[10px] font-mono font-bold text-coral">
                  Station: {forecast.stationName}
                </span>
              </div>

              {/* Horizon Cards 1h, 6h, 24h */}
              <div className="mt-5 space-y-3">
                {(['1h', '6h', '24h'] as ForecastHorizon[]).map((h) => {
                  const impact = scenarioResult.horizons[h];
                  const isStrongest = scenarioResult.strongest_horizon === h;

                  return (
                    <div
                      key={h}
                      className={`border-[3px] border-ink p-4 transition-all ${
                        isStrongest ? 'bg-sun/20 shadow-[4px_4px_0_var(--ink)]' : 'bg-paper'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="border border-ink bg-ink px-2 py-0.5 font-mono text-[10px] font-black text-paper uppercase">
                            +{h} Horizon
                          </span>
                          {isStrongest && (
                            <span className="text-[10px] font-black uppercase text-coral">
                              Peak Policy Sensitivity
                            </span>
                          )}
                        </div>

                        {impact.absoluteDelta < 0 && (
                          <div className="flex items-center gap-1 font-mono text-xs font-black text-mint bg-ink px-2 py-0.5">
                            <ArrowDown className="h-3.5 w-3.5 stroke-[3]" />
                            <span>{Math.abs(impact.absoluteDelta)} µg/m³ ({Math.abs(impact.percentageDelta)}%)</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-ink-soft uppercase block">
                            Baseline Forecast:
                          </span>
                          <div className="font-mono text-base font-black text-ink mt-0.5">
                            {impact.baselinePm25} µg/m³
                          </div>
                          <span className="text-[9px] font-bold text-ink-soft uppercase">
                            {impact.baselineAqiCategory.replace('_', ' ')}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-ink-soft uppercase block">
                            Mitigated Scenario:
                          </span>
                          <div className="font-mono text-base font-black text-ink mt-0.5 flex items-baseline gap-1.5">
                            <span className={impact.scenarioPm25 < impact.baselinePm25 ? 'text-coral' : ''}>
                              {impact.scenarioPm25} µg/m³
                            </span>
                          </div>
                          <span
                            className="inline-block border border-ink px-1.5 py-0.2 text-[9px] font-black uppercase text-ink"
                            style={{ backgroundColor: impact.scenarioCategoryColor }}
                          >
                            {impact.scenarioAqiCategory.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Deterministic Summary Paragraph */}
              <div className="mt-5 border-l-[4px] border-ink bg-paper p-3 text-xs leading-relaxed text-ink font-medium">
                <strong className="text-ink uppercase font-bold block mb-1">
                  AERIS Deterministic Summary:
                </strong>
                {scenarioResult.deterministic_summary}
              </div>
            </div>

            {/* Scientific Disclaimer */}
            <div className="mt-5 border-t-[2px] border-ink/20 pt-3 text-[10px] leading-snug text-ink-soft font-mono flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                <strong>PROVENANCE DISCLAIMER:</strong> {scenarioResult.disclaimer}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
