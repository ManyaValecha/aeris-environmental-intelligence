import React, { useState } from 'react';
import { StationForecast, ForecastHorizon, HistoricalObservation } from '../types';
import { Cpu, TrendingUp, AlertTriangle, ShieldCheck, Layers, Sparkles, CheckCircle2 } from 'lucide-react';

interface ForecastsSectionProps {
  forecast: StationForecast;
  historical: HistoricalObservation[];
  onOpenAudit: () => void;
  modelSuite?: 'LIGHTGBM' | 'RESEARCH_MULTIMODEL';
  onModelSuiteChange?: (suite: 'LIGHTGBM' | 'RESEARCH_MULTIMODEL') => void;
}

export const ForecastsSection: React.FC<ForecastsSectionProps> = ({
  forecast,
  historical,
  onOpenAudit,
  modelSuite = 'LIGHTGBM',
  onModelSuiteChange,
}) => {
  const [selectedHorizon, setSelectedHorizon] = useState<ForecastHorizon>('6h');

  const curPred = forecast.predictions[selectedHorizon];

  // Map 24 historical points plus 3 forecast points for a mini sparkline/trend chart
  const recentHistory = historical.slice(-16);
  const maxPm25 = Math.max(...recentHistory.map((h) => h.pm25), curPred.upperBoundPm25, 250);

  const isLightGbm = modelSuite === 'LIGHTGBM';

  return (
    <section id="forecasts" className="border-b-[3px] border-ink bg-paper-deep py-14 lg:py-20">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="brutal-sticker bg-violet text-paper -rotate-2">
                MACHINE LEARNING
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-ink-soft">
                {isLightGbm ? 'LightGBM Quantile Regressors' : 'Multi-Model Benchmark (XGBoost / LSTM / Prophet)'}
              </span>
            </div>
            <h2 className="mt-4 text-3xl font-black uppercase tracking-[-0.04em] text-ink sm:text-5xl font-display">
              PREDICTIVE HORIZONS.
            </h2>
            <p className="mt-2 text-sm text-ink-soft max-w-xl">
              Predicting PM2.5 and PM10 for the next 1, 6, and 24 hours using historical pollution telemetry, ECMWF ERA5 boundary layer weather, time of day, and recent trends with quantile uncertainty intervals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
            {/* Model Suite Toggle */}
            {onModelSuiteChange && (
              <div className="flex items-center border-[2px] border-ink bg-white p-0.5 shadow-[2px_2px_0_var(--ink)]">
                <button
                  onClick={() => onModelSuiteChange('LIGHTGBM')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-black uppercase transition-all cursor-pointer ${
                    isLightGbm
                      ? 'bg-sun text-ink shadow-[2px_2px_0_var(--ink)]'
                      : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  <Sparkles className="h-3 w-3 stroke-[2.5]" />
                  <span>LightGBM (Recommended)</span>
                </button>
                <button
                  onClick={() => onModelSuiteChange('RESEARCH_MULTIMODEL')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-black uppercase transition-all cursor-pointer ${
                    !isLightGbm
                      ? 'bg-ink text-paper shadow-[2px_2px_0_var(--sun)]'
                      : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  <Layers className="h-3 w-3 stroke-[2.5]" />
                  <span>Multi-Model Benchmark</span>
                </button>
              </div>
            )}

            <button
              onClick={onOpenAudit}
              className="brutal-sticker bg-mint text-ink hover:bg-mint/80 transition-colors cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>PROVENANCE: {forecast.provenance}</span>
            </button>
          </div>
        </div>

        {/* Feature Input Pipeline Banner */}
        <div className="mt-6 border-[2px] border-ink bg-paper-light p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-ink font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-mint stroke-[2.5]" />
            <span className="font-bold">
              Feature Inputs: In Situ Telemetry (Lag-1h, 3h, 6h, 24h) + ERA5 PBL Height + 2m Temp + RH + Wind Vectors + Diurnal Cosine
            </span>
          </div>
          <span className="text-[10px] bg-sun border border-ink px-2 py-0.5 font-bold uppercase">
            Quantile Objectives [q=0.10, q=0.50, q=0.90]
          </span>
        </div>

        {/* Horizon Selector Tabs */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {(['NOW', '1h', '6h', '24h'] as ForecastHorizon[]).map((h) => {
            const pred = forecast.predictions[h];
            const isSel = selectedHorizon === h;
            const labelMap: Record<ForecastHorizon, string> = isLightGbm
              ? {
                  NOW: 'Current Now (CPCB/ERA5)',
                  '1h': '1-Hour Horizon (LightGBM)',
                  '6h': '6-Hour Horizon (LightGBM)',
                  '24h': '24-Hour Horizon (LightGBM)',
                }
              : {
                  NOW: 'Current Now (CPCB/ERA5)',
                  '1h': '1-Hour Horizon (XGBoost)',
                  '6h': '6-Hour Horizon (LSTM)',
                  '24h': '24-Hour Horizon (Prophet)',
                };
            return (
              <button
                key={h}
                onClick={() => setSelectedHorizon(h)}
                className={`brutal-button px-5 py-3 text-xs gap-2 transition-all cursor-pointer ${
                  isSel
                    ? 'bg-ink text-paper shadow-[5px_5px_0_var(--sun)] -translate-y-1'
                    : 'bg-paper-light text-ink hover:bg-white shadow-[3px_3px_0_var(--ink)]'
                }`}
              >
                <Cpu className="h-4 w-4 stroke-[2.5]" />
                <span>{labelMap[h]}</span>
                <span className="font-mono text-[11px] font-black opacity-80 pl-1">
                  ({pred.predictedPm25} µg/m³)
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Forecast Inspection Layout */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left: Detailed Horizon Forecast Card */}
          <div className="brutal-card p-6 sm:p-7 bg-paper-light flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between border-b-[2px] border-ink/20 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-ink-soft">
                    Active Target Horizon
                  </span>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-ink font-display mt-0.5">
                    {selectedHorizon === 'NOW' && 'Now: CPCB Reference & ERA5 Reanalysis'}
                    {selectedHorizon === '1h' && (isLightGbm ? '1-Hour LightGBM Quantile Forecast' : '1-Hour Rapid XGBoost Forecast')}
                    {selectedHorizon === '6h' && (isLightGbm ? '6-Hour LightGBM Boundary-Layer Forecast' : '6-Hour Convective LSTM Deep Network')}
                    {selectedHorizon === '24h' && (isLightGbm ? '24-Hour LightGBM Multi-Step Horizon' : '24-Hour Regional Transport Prophet Forecast')}
                  </h3>
                </div>

                <span
                  className="border-[2px] border-ink px-3 py-1 text-xs font-black uppercase text-ink shadow-[2px_2px_0_var(--ink)]"
                  style={{ backgroundColor: curPred.categoryColor }}
                >
                  AQI {curPred.predictedAqi} · {curPred.predictedAqiCategory.replace('_', ' ')}
                </span>
              </div>

              {/* Point Prediction with 95% Confidence / Quantile Interval Bar */}
              <div className="mt-6 border-[3px] border-ink bg-paper p-5 shadow-[4px_4px_0_var(--ink)]">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-ink-soft">
                    Predicted PM2.5 &amp; PM10 Concentration
                  </span>
                  <span className="font-mono text-xs font-black text-ink">
                    Objective: {curPred.quantileObjective || 'Quantile Intervals [q=0.10, q=0.90]'}
                  </span>
                </div>

                {/* Dual PM2.5 and PM10 Primary Numbers */}
                <div className="mt-3 grid grid-cols-2 gap-4 border-b border-ink/15 pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-ink-soft block uppercase font-bold">PM2.5 (Fine Respirable)</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-4xl sm:text-5xl font-black font-display text-ink tabular-nums">
                        {curPred.predictedPm25}
                      </span>
                      <span className="text-xs font-black text-ink-soft uppercase font-mono">µg/m³</span>
                    </div>
                    <span className="text-[10px] font-mono text-ink-soft">
                      Quantile: {curPred.lowerBoundPm25} – {curPred.upperBoundPm25} µg/m³
                    </span>
                  </div>

                  <div className="border-l border-ink/15 pl-4">
                    <span className="text-[10px] font-mono text-ink-soft block uppercase font-bold">PM10 (Inhalable Dust)</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-4xl sm:text-5xl font-black font-display text-ink tabular-nums">
                        {curPred.predictedPm10 || Math.round(curPred.predictedPm25 * 1.65)}
                      </span>
                      <span className="text-xs font-black text-ink-soft uppercase font-mono">µg/m³</span>
                    </div>
                    <span className="text-[10px] font-mono text-ink-soft">
                      Quantile: {curPred.lowerBoundPm10 || Math.round(curPred.lowerBoundPm25 * 1.6)} – {curPred.upperBoundPm10 || Math.round(curPred.upperBoundPm25 * 1.6)} µg/m³
                    </span>
                  </div>
                </div>

                {/* Range Interval Display for PM2.5 */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-ink mb-2">
                    <span>10th Percentile: <strong>{curPred.lowerBoundPm25} µg/m³</strong></span>
                    <span>Median (p50): <strong>{curPred.predictedPm25} µg/m³</strong></span>
                    <span>90th Percentile: <strong>{curPred.upperBoundPm25} µg/m³</strong></span>
                  </div>

                  {/* Visual Confidence Interval Span Bar */}
                  <div className="relative h-6 w-full rounded border-[2px] border-ink bg-white overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 bg-violet/25 border-x-2 border-violet"
                      style={{
                        left: `${Math.max(5, (curPred.lowerBoundPm25 / maxPm25) * 100)}%`,
                        width: `${Math.min(90, ((curPred.upperBoundPm25 - curPred.lowerBoundPm25) / maxPm25) * 100)}%`,
                      }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-2 bg-ink -ml-1"
                      style={{
                        left: `${Math.min(98, Math.max(2, (curPred.predictedPm25 / maxPm25) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[9px] font-mono text-ink-soft">
                    <span>0 µg/m³</span>
                    <span>{Math.round(maxPm25)} µg/m³ (Scale Max)</span>
                  </div>
                </div>
              </div>

              {/* Anomaly Flag if Spiking */}
              {curPred.anomalyFlag && (
                <div className="mt-5 flex items-center gap-2.5 border-[2px] border-danger bg-danger/10 p-3 text-xs font-bold text-danger">
                  <AlertTriangle className="h-4 w-4 shrink-0 stroke-[2.5]" />
                  <span>
                    Severe Spike Alert: Forecasted PM2.5 crosses severe 280 µg/m³ threshold. Triggering preemptive GRAP warning.
                  </span>
                </div>
              )}
            </div>

            {/* Model Architecture Specs */}
            <div className="mt-6 border-t-[2px] border-ink/20 pt-4 text-xs">
              <span className="font-mono text-[10px] font-black uppercase text-ink-soft block mb-1">
                Model Evaluation Metadata ({forecast.model.modelName}):
              </span>
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-ink">
                <div className="border border-ink/20 p-2 bg-white">
                  <div className="text-[9px] text-ink-soft uppercase">Validation R²</div>
                  <div className="font-black text-sm">{forecast.model.metrics.r2}</div>
                </div>
                <div className="border border-ink/20 p-2 bg-white">
                  <div className="text-[9px] text-ink-soft uppercase">Mean Abs Error</div>
                  <div className="font-black text-sm">{forecast.model.metrics.mae} µg/m³</div>
                </div>
                <div className="border border-ink/20 p-2 bg-white">
                  <div className="text-[9px] text-ink-soft uppercase">Test Split Obs</div>
                  <div className="font-black text-sm">{forecast.model.testObservationCount}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Diurnal Trend Chart (History vs Forecast) */}
          <div className="brutal-card p-6 bg-paper-light flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b-[2px] border-ink/20 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-ink stroke-[2.5]" />
                  <span className="font-mono text-xs font-black uppercase tracking-wider text-ink">
                    DIURNAL TREND (16H RECORD + INFERENCE)
                  </span>
                </div>
                <span className="font-mono text-[10px] font-bold text-ink-soft">
                  Hourly Telemetry
                </span>
              </div>

              {/* Bar Chart Visualization with Multi-Gradient Bars */}
              <div className="mt-6 h-[220px] flex items-end gap-1.5 border-b-[3px] border-ink pb-2 pt-6 bg-gradient-to-t from-paper/30 to-transparent px-2">
                {recentHistory.map((pt, i) => {
                  const heightPct = Math.min(100, (pt.pm25 / maxPm25) * 100);
                  const barColor =
                    pt.pm25 >= 250
                      ? 'bg-danger text-white'
                      : pt.pm25 >= 150
                      ? 'bg-coral text-ink'
                      : pt.pm25 >= 90
                      ? 'bg-sun text-ink'
                      : 'bg-mint text-ink';

                  return (
                    <div
                      key={i}
                      className="group relative flex-1 flex flex-col items-center h-full justify-end"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 hidden group-hover:flex z-20 whitespace-nowrap border-[2px] border-ink bg-night text-paper px-2 py-0.5 text-[10px] font-mono shadow-[2px_2px_0_var(--sun)]">
                        {pt.pm25} µg/m³ PM2.5
                      </div>
                      <div
                        className={`w-full border-[1.5px] border-ink ${barColor} shadow-[1px_1px_0_var(--ink)] hover:scale-105 transition-all`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                  );
                })}

                {/* The Target Forecast Bar with Vibrant Neon Ring */}
                <div className="group relative flex-1 flex flex-col items-center h-full justify-end">
                  <div className="absolute -top-11 hidden group-hover:flex z-20 whitespace-nowrap border-[2px] border-ink bg-violet text-paper px-2 py-0.5 text-[10px] font-mono shadow-[2px_2px_0_var(--sun)]">
                    PREDICTED: {curPred.predictedPm25} µg/m³
                  </div>
                  <div
                    className="w-full border-[2.5px] border-ink bg-gradient-to-t from-violet to-sun shadow-[2px_2px_0_var(--ink)] animate-pulse"
                    style={{ height: `${Math.min(100, (curPred.predictedPm25 / maxPm25) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Chart Legend */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono font-bold text-ink-soft">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 border border-ink bg-mint"></span> &lt;90
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 border border-ink bg-sun"></span> 90-150
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 border border-ink bg-coral"></span> 150-250
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 border border-ink bg-danger"></span> &gt;250
                  </span>
                </div>
                <span className="flex items-center gap-1.5 text-violet font-black">
                  <span className="h-3 w-3 border border-ink bg-gradient-to-t from-violet to-sun inline-block"></span>
                  +{selectedHorizon} {isLightGbm ? 'LightGBM' : 'Model'} Projection
                </span>
              </div>
            </div>

            {/* Scientific Caveats Note */}
            <div className="mt-6 border-l-[3px] border-ink bg-paper p-3 text-[11px] leading-relaxed text-ink-soft">
              <strong className="text-ink font-bold block mb-0.5">Atmospheric Boundary Layer Caveat:</strong>
              {forecast.model.limitations[0]}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

