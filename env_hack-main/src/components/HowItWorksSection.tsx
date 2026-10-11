import React from 'react';
import { Eye, AlertTriangle, TrendingUp, SlidersHorizontal, ArrowRight } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: '🔭 OBSERVE',
      subtitle: 'Continuous CAAQMS Monitoring',
      tag: '8 Reference Stations',
      desc: 'Ingest real-time PM2.5, PM10, NO2, SO2, CO, and O3 measurements from 8 regulatory reference monitors across Delhi, Noida, and Gurugram with deterministic CPCB NAQI calculations.',
      icon: Eye,
      stickerColor: 'bg-sun text-ink',
    },
    {
      num: '02',
      title: '🧠 UNDERSTAND',
      subtitle: 'Isolation Forest & MAD Invariance',
      tag: 'Spike Isolation',
      desc: 'Unsupervised Isolation Forest tree path length analysis and Median Absolute Deviation (MAD) statistics detect localized emission spikes and boundary-layer thermal inversions.',
      icon: AlertTriangle,
      stickerColor: 'bg-coral text-ink',
    },
    {
      num: '03',
      title: '🔮 PREDICT',
      subtitle: 'LightGBM Multi-Horizon Forecaster',
      tag: '1h · 6h · 24h Horizons',
      desc: 'Dedicated LightGBM quantile regression models forecast PM2.5 and PM10 for 1-hour, 6-hour, and 24-hour horizons using historical telemetry and ERA5 weather features.',
      icon: TrendingUp,
      stickerColor: 'bg-violet text-paper',
    },
    {
      num: '04',
      title: '🎛️ INTERVENE',
      subtitle: 'Policy Simulation Sandbox',
      tag: 'CPCB/SAFAR Sensitivity',
      desc: 'Municipal authorities and citizens simulate hypothetical policy decisions (odd-even traffic, construction halts, DG set bans) to preview honest airshed reductions with uncertainty bounds.',
      icon: SlidersHorizontal,
      stickerColor: 'bg-mint text-ink',
    },
  ];

  return (
    <section className="border-b-[3px] border-ink bg-paper py-14 lg:py-20">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-3">
            <span className="brutal-sticker bg-ink text-sun -rotate-2">
              FOUR-STAGE DECISION WORKFLOW
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-ink-soft">
              Continuous Loop
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-black uppercase tracking-[-0.04em] text-ink sm:text-5xl font-display">
            HOW AERIS CLEARS THE HAZE.
          </h2>

          {/* Signature Workflow Banner */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-[2px] border-ink bg-paper-light p-2.5 shadow-[3px_3px_0_var(--ink)] font-mono text-xs font-black">
            <span className="text-sun bg-ink px-2 py-0.5">WORKFLOW:</span>
            <span>🔭 OBSERVE</span>
            <ArrowRight className="h-3.5 w-3.5 stroke-[3] text-ink-soft" />
            <span>🧠 UNDERSTAND</span>
            <ArrowRight className="h-3.5 w-3.5 stroke-[3] text-ink-soft" />
            <span>🔮 PREDICT</span>
            <ArrowRight className="h-3.5 w-3.5 stroke-[3] text-ink-soft" />
            <span>🎛️ INTERVENE</span>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
            Existing tools show static pollution numbers — AERIS shows what to do about it. Every processing step is grounded in peer-reviewed atmospheric science, deterministic calculations, and transparent provenance.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((st, i) => {
            const Icon = st.icon;
            return (
              <div
                key={i}
                className="brutal-card flex flex-col justify-between p-6 bg-paper-light"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="brutal-num font-mono text-5xl font-black leading-none">
                      {st.num}
                    </span>
                    <span className={`brutal-sticker ${st.stickerColor} rotate-2 text-[9px]`}>
                      {st.tag}
                    </span>
                  </div>

                  <div className="mt-6 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center border-[2px] border-ink bg-paper shadow-[2px_2px_0_var(--ink)]">
                        <Icon className="h-4 w-4 text-ink stroke-[2.5]" />
                      </span>
                      <h3 className="text-xl font-black uppercase tracking-tight text-ink font-display">
                        {st.title}
                      </h3>
                    </div>
                    <span className="font-mono text-[10px] text-ink-soft font-bold pl-10">
                      {st.subtitle}
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-ink-soft font-medium">
                    {st.desc}
                  </p>
                </div>

                <div className="mt-6 border-t-[2px] border-ink/10 pt-3 text-[10px] font-mono text-ink-soft flex items-center justify-between">
                  <span>STAGE {st.num} OF 04</span>
                  <span className="font-black text-ink">ACTIVE</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
