import React, { useState } from 'react';
import { StationForecast, ForecastHorizon } from '../types';
import { Cpu, Clock, AlertTriangle, ShieldCheck, TrendingUp, Sliders } from 'lucide-react';

interface ForecastTimelineScrubberProps {
  forecast: StationForecast;
  onOpenAudit: () => void;
}

export const ForecastTimelineScrubber: React.FC<ForecastTimelineScrubberProps> = ({
  forecast,
  onOpenAudit,
}) => {
  const [activeHorizon, setActiveHorizon] = useState<ForecastHorizon>('6h');

  const horizons: ForecastHorizon[] = ['NOW', '1h', '6h', '24h'];
  const activePred = forecast.predictions[activeHorizon];

  const horizonIndices: Record<ForecastHorizon, number> = {
    NOW: 0,
    '1h': 1,
    '6h': 2,
    '24h': 3,
  };

  const horizonLabels: Record<ForecastHorizon, string> = {
    NOW: 'CURRENT NOW',
    '1h': '+1 HOUR HORIZON',
    '6h': '+6 HOURS HORIZON',
    '24h': '+24 HOURS HORIZON',
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = parseInt(e.target.value, 10);
    setActiveHorizon(horizons[idx]);
  };

  return (
    <div className="brutal-card bg-paper-light p-6 sm:p-7">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b-[2px] border-ink/20 pb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-violet stroke-[2.5]" />
            <h3 className="text-xl font-black uppercase tracking-tight text-ink font-display">
              Four-Horizon Forecast Timeline Scrubber
            </h3>
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            Dedicated multi-horizon ML models for {forecast.stationName} with empirical uncertainty bounds (±1.96 × RMSE).
          </p>
        </div>

        <button
          onClick={onOpenAudit}
          className="brutal-sticker bg-mint text-ink hover:bg-mint/80 transition-colors cursor-pointer"
        >
          <ShieldCheck className="h-3 w-3 stroke-[2.5]" />
          <span>PROVENANCE: {activePred.provenance}</span>
        </button>
      </div>

      {/* Interactive Horizon Timeline Scrubber Bar */}
      <div className="mt-6 border-[3px] border-ink bg-paper p-4 shadow-[4px_4px_0_var(--ink)]">
        <div className="flex items-center justify-between text-xs font-black uppercase text-ink mb-2">
          <span>Timeline Scrubber Control:</span>
          <span className="font-mono text-violet font-bold">
            Target: {horizonLabels[activeHorizon]}
          </span>
        </div>

        {/* 4 Segmented Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {horizons.map((h, i) => {
            const pred = forecast.predictions[h];
            const isSelected = activeHorizon === h;

            return (
              <button
                key={h}
                onClick={() => setActiveHorizon(h)}
                className={`border-[2px] border-ink p-2 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-ink text-paper shadow-[3px_3px_0_var(--sun)] -translate-y-0.5'
                    : 'bg-white text-ink hover:bg-paper-light'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-black uppercase">
                    {h === 'NOW' ? 'NOW' : `+${h}`}
                  </span>
                  <span
                    className="h-2 w-2 rounded-full border border-ink"
                    style={{ backgroundColor: pred.categoryColor }}
                  />
                </div>
                <div className="mt-1 font-mono text-xs font-black">
                  {pred.predictedPm25} µg/m³
                </div>
                <div className="text-[9px] truncate text-ink-soft opacity-80 mt-0.5">
                  {h === 'NOW' ? 'BAM-1020' : h === '1h' ? 'XGBoost' : h === '6h' ? 'LSTM' : 'Prophet'}
                </div>
              </button>
            );
          })}
        </div>

        {/* Scrubber Range Slider */}
        <div className="mt-4 px-1">
          <input
            type="range"
            min="0"
            max="3"
            step="1"
            value={horizonIndices[activeHorizon]}
            onChange={handleSliderChange}
            className="w-full h-3 bg-paper-deep rounded border-[2px] border-ink appearance-none cursor-pointer accent-ink"
          />
          <div className="flex justify-between text-[10px] font-mono font-bold text-ink-soft mt-1">
            <span>NOW (Measured)</span>
            <span>+1h (XGBoost)</span>
            <span>+6h (LSTM)</span>
            <span>+24h (Prophet)</span>
          </div>
        </div>
      </div>

      {/* Horizon Deep-Dive Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Left: Model Specs & Prediction Card */}
        <div className="border-[2px] border-ink bg-white p-5 shadow-[3px_3px_0_var(--ink)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-ink/15 pb-3">
              <span className="font-mono text-[11px] font-black uppercase text-violet">
                {activePred.modelName}
              </span>
              <span
                className="border border-ink px-2 py-0.5 text-[10px] font-black uppercase text-ink"
                style={{ backgroundColor: activePred.categoryColor }}
              >
                AQI {activePred.predictedAqi} · {activePred.predictedAqiCategory.replace('_', ' ')}
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-mono text-5xl font-black text-ink">
                {activePred.predictedPm25}
              </span>
              <span className="text-sm font-mono font-bold text-ink-soft uppercase">
                µg/m³ PM2.5
              </span>
            </div>

            {/* Uncertainty Bounds Display (±1.96 × RMSE) */}
            <div className="mt-5 border-[2px] border-ink/20 bg-paper p-3.5">
              <div className="flex items-center justify-between text-[11px] font-black uppercase text-ink">
                <span>95% Uncertainty Coverage:</span>
                <span className="font-mono text-violet font-bold">
                  {activeHorizon === 'NOW' ? 'Exact Sensor' : `±1.96 × RMSE (±${(1.96 * activePred.rmse).toFixed(1)} µg/m³)`}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between font-mono text-xs font-bold text-ink">
                <span>Lower 95%: {activePred.lowerBoundPm25} µg/m³</span>
                <span>Expected: {activePred.predictedPm25} µg/m³</span>
                <span>Upper 95%: {activePred.upperBoundPm25} µg/m³</span>
              </div>

              <div className="mt-3 relative h-4 w-full border-[1.5px] border-ink bg-white rounded overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 bg-violet/30 border-x-2 border-violet"
                  style={{
                    left: `${Math.max(2, (activePred.lowerBoundPm25 / 350) * 100)}%`,
                    width: `${Math.min(95, ((activePred.upperBoundPm25 - activePred.lowerBoundPm25) / 350) * 100)}%`,
                  }}
                />
                <div
                  className="absolute top-0 bottom-0 w-2 bg-ink -ml-1"
                  style={{
                    left: `${Math.min(98, (activePred.predictedPm25 / 350) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-ink/15 grid grid-cols-2 gap-2 text-[10px] font-mono text-ink-soft">
            <div>Validation R²: <strong className="text-ink">{activePred.r2}</strong></div>
            <div>Model RMSE: <strong className="text-ink">{activePred.rmse} µg/m³</strong></div>
          </div>
        </div>

        {/* Right: Comparative Multi-Horizon Scientific Table */}
        <div className="border-[2px] border-ink bg-white p-5 shadow-[3px_3px_0_var(--ink)] flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black uppercase text-ink font-display mb-3">
              Model Taxonomy &amp; Scientific Specifications
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead>
                  <tr className="border-b-2 border-ink text-[10px] uppercase text-ink-soft">
                    <th className="py-1">Horizon</th>
                    <th className="py-1">Architecture</th>
                    <th className="py-1">R²</th>
                    <th className="py-1">RMSE</th>
                    <th className="py-1">Tag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  <tr className={activeHorizon === 'NOW' ? 'bg-sun/20 font-black' : ''}>
                    <td className="py-2">NOW</td>
                    <td>CPCB / ERA5</td>
                    <td>1.0</td>
                    <td>0.0</td>
                    <td><span className="px-1 py-0.2 bg-mint text-ink text-[9px] border border-ink">MEASURED</span></td>
                  </tr>
                  <tr className={activeHorizon === '1h' ? 'bg-sun/20 font-black' : ''}>
                    <td className="py-2">+1 HOUR</td>
                    <td>XGBoost (24-feat)</td>
                    <td>0.88</td>
                    <td>14.2</td>
                    <td><span className="px-1 py-0.2 bg-violet text-paper text-[9px] border border-ink">PREDICTED</span></td>
                  </tr>
                  <tr className={activeHorizon === '6h' ? 'bg-sun/20 font-black' : ''}>
                    <td className="py-2">+6 HOURS</td>
                    <td>LSTM (48-step PBL)</td>
                    <td>0.82</td>
                    <td>21.8</td>
                    <td><span className="px-1 py-0.2 bg-violet text-paper text-[9px] border border-ink">PREDICTED</span></td>
                  </tr>
                  <tr className={activeHorizon === '24h' ? 'bg-sun/20 font-black' : ''}>
                    <td className="py-2">+24 HOURS</td>
                    <td>Prophet (Regional)</td>
                    <td>0.74</td>
                    <td>34.5</td>
                    <td><span className="px-1 py-0.2 bg-violet text-paper text-[9px] border border-ink">PREDICTED</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-4 pt-3 border-t border-ink/15 text-[10px] text-ink-soft leading-relaxed font-mono">
            <strong>Honest Uncertainty Rule:</strong> As forecast horizon extends from 1h to 24h, non-linear atmospheric mixing increases uncertainty (RMSE grows from 14.2 to 34.5 µg/m³). AERIS shows these widened bands transparently.
          </p>
        </div>
      </div>
    </div>
  );
};
