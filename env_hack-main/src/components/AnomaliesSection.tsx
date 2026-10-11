import React from 'react';
import { Anomaly } from '../types';
import { AlertTriangle, AlertOctagon, Info, Flame, Wind, Clock, ShieldAlert, GitBranch, Trees, Sparkles } from 'lucide-react';

interface AnomaliesSectionProps {
  anomalies: Anomaly[];
  onSelectStation: (stationId: string) => void;
  onOpenAudit: () => void;
  anomalyMethod?: 'ISOLATION_FOREST' | 'MAD';
  onMethodChange?: (method: 'ISOLATION_FOREST' | 'MAD') => void;
}

export const AnomaliesSection: React.FC<AnomaliesSectionProps> = ({
  anomalies,
  onSelectStation,
  onOpenAudit,
  anomalyMethod = 'ISOLATION_FOREST',
  onMethodChange,
}) => {
  return (
    <section id="anomalies" className="border-b-[3px] border-ink bg-paper py-14 lg:py-20">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="brutal-sticker bg-danger text-paper -rotate-2">
                ANOMALY DETECTOR
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-ink-soft">
                {anomalyMethod === 'ISOLATION_FOREST' ? 'Isolation Forest (Random Trees)' : 'Median Absolute Deviation (MAD)'}
              </span>
            </div>
            <h2 className="mt-4 text-3xl font-black uppercase tracking-[-0.04em] text-ink sm:text-5xl font-display">
              UNUSUAL SPIKES &amp; DRIVERS.
            </h2>
            <p className="mt-2 text-sm text-ink-soft max-w-xl">
              Detect unusual pollution spikes or suspicious sensor readings relative to historical patterns. Validated against 24-hour historical telemetry before raising alerts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
            {/* Method Switcher */}
            {onMethodChange && (
              <div className="flex items-center border-[2px] border-ink bg-paper-light p-0.5 shadow-[2px_2px_0_var(--ink)]">
                <button
                  onClick={() => onMethodChange('ISOLATION_FOREST')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    anomalyMethod === 'ISOLATION_FOREST'
                      ? 'bg-ink text-sun shadow-[1px_1px_0_var(--coral)]'
                      : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  <Trees className="h-3 w-3" />
                  <span>Isolation Forest</span>
                </button>
                <button
                  onClick={() => onMethodChange('MAD')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    anomalyMethod === 'MAD'
                      ? 'bg-coral text-ink shadow-[1px_1px_0_var(--ink)]'
                      : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  <GitBranch className="h-3 w-3" />
                  <span>MAD Z-Score</span>
                </button>
              </div>
            )}

            <span className="border-[2px] border-ink bg-paper-light px-3 py-1.5 font-mono text-xs font-black text-ink shadow-[2px_2px_0_var(--ink)]">
              {anomalies.length} ACTIVE ALERTS
            </span>
          </div>
        </div>

        {/* Method Information Strip */}
        <div className="mt-6 border-[2px] border-ink bg-paper-light p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-ink font-mono">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-danger animate-ping" />
            <span className="font-bold">
              {anomalyMethod === 'ISOLATION_FOREST'
                ? 'Algorithm: Isolation Forest (iTree path length score s(x,n), contamination=0.05)'
                : 'Algorithm: Median Absolute Deviation (Modified Z-Score invariance Z_MAD > 3.0)'}
            </span>
          </div>
          <span className="text-[10px] text-ink-soft">
            Input: Pollutant readings + ERA5 boundary layer &amp; wind features
          </span>
        </div>

        {/* Anomalies List */}
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {anomalies.length === 0 ? (
            <div className="brutal-card col-span-full p-8 text-center bg-paper-light">
              <ShieldAlert className="h-8 w-8 text-mint mx-auto stroke-[2.5]" />
              <h3 className="mt-2 text-lg font-black uppercase text-ink font-display">
                No Statistical Outliers Detected
              </h3>
              <p className="mt-1 text-xs text-ink-soft">
                All monitoring stations are tracking within normal margins of the regional trend.
              </p>
            </div>
          ) : (
            anomalies.map((anom) => {
              const severityColor =
                anom.severity === 'CRITICAL'
                  ? 'bg-danger text-paper'
                  : anom.severity === 'HIGH'
                  ? 'bg-coral text-ink'
                  : 'bg-sun text-ink';

              return (
                <div
                  key={anom.id}
                  className="brutal-card flex flex-col justify-between p-6 bg-paper-light"
                >
                  <div>
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <span className={`brutal-sticker ${severityColor} -rotate-1 text-[9px]`}>
                        {anom.severity} SEVERITY
                      </span>
                      <button
                        onClick={onOpenAudit}
                        className="font-mono text-[9px] font-black text-ink-soft uppercase hover:text-ink hover:underline cursor-pointer"
                      >
                        {anom.provenance}
                      </button>
                    </div>

                    {/* Station Name & Metric */}
                    <div className="mt-4">
                      <div className="flex items-baseline justify-between">
                        <h3 className="text-xl font-black uppercase tracking-tight text-ink font-display">
                          {anom.stationName}
                        </h3>
                        <span className="font-mono text-sm font-black text-danger">
                          {anom.observedValue} µg/m³
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-ink-soft mt-0.5">
                        <span>Baseline: {anom.baselineValue} µg/m³</span>
                        {anom.isolationPathLength ? (
                          <span className="text-coral font-bold">h(x): {anom.isolationPathLength} steps</span>
                        ) : null}
                      </div>
                    </div>

                    {/* Explanation */}
                    <p className="mt-3 text-xs leading-relaxed text-ink font-medium border-l-[3px] border-ink pl-3 bg-paper p-2">
                      {anom.explanation}
                    </p>

                    {/* Contributing Factors */}
                    <div className="mt-4">
                      <span className="text-[10px] font-black uppercase text-ink-soft block mb-1.5">
                        Contributing Factors Identified:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {anom.contributingFactors.map((factor, i) => (
                          <span
                            key={i}
                            className="border border-ink/30 bg-white px-2 py-0.5 text-[10px] font-medium text-ink flex items-center gap-1"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-coral"></span>
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-6 border-t-[2px] border-ink/20 pt-4 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-ink-soft">
                      Anomaly Score: {anom.anomalyScore.toFixed(2)}
                    </span>
                    <button
                      onClick={() => onSelectStation(anom.stationId)}
                      className="brutal-button bg-paper hover:bg-sun px-3 py-1.5 text-[10px] text-ink cursor-pointer"
                    >
                      Inspect Station
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
