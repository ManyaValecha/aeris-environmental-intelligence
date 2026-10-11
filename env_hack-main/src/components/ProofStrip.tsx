import React from 'react';
import { Compass, Cpu, Sliders, ShieldCheck, Cloud, Sparkles } from 'lucide-react';

export const ProofStrip: React.FC = () => {
  const stats = [
    {
      num: '08',
      title: 'REGULATORY STATIONS',
      desc: 'CPCB & DPCC continuous ambient CAAQMS monitors',
      icon: Compass,
      color: 'bg-sun text-ink shadow-[3px_3px_0_var(--ink)]',
      badge: 'MQTT 15-MIN',
      badgeBg: 'bg-sun text-ink',
    },
    {
      num: '3',
      title: 'LIGHTGBM FORECASTS',
      desc: '1h, 6h, 24h horizons with calibrated quantile bounds',
      icon: Cpu,
      color: 'bg-violet text-paper shadow-[3px_3px_0_var(--ink)]',
      badge: 'p10 / p50 / p90',
      badgeBg: 'bg-violet text-paper',
    },
    {
      num: '3',
      title: 'POLICY LEVERS',
      desc: 'Traffic odd-even, dust control & industrial shutdown',
      icon: Sliders,
      color: 'bg-coral text-ink shadow-[3px_3px_0_var(--ink)]',
      badge: 'COUNTERFACTUAL',
      badgeBg: 'bg-coral text-ink',
    },
    {
      num: '100%',
      title: 'AWS PROVENANCE',
      desc: 'Zero hallucinated numbers; Amazon Bedrock grounded',
      icon: ShieldCheck,
      color: 'bg-mint text-ink shadow-[3px_3px_0_var(--ink)]',
      badge: 'BEDROCK GROUNDED',
      badgeBg: 'bg-mint text-ink',
    },
  ];

  return (
    <div className="border-b-[3px] border-ink bg-paper-deep py-6">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((st, i) => {
            const Icon = st.icon;
            return (
              <div
                key={i}
                className="brutal-card flex flex-col justify-between p-4 sm:p-5 bg-paper-light hover:-translate-y-1 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-3xl font-black text-ink sm:text-4xl tabular-nums">
                    {st.num}
                  </span>
                  <span className={`grid h-9 w-9 place-items-center border-[2px] border-ink ${st.color}`}>
                    <Icon className="h-4.5 w-4.5 stroke-[2.5]" />
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-ink font-display">
                      {st.title}
                    </h4>
                    <span className={`text-[8px] font-mono font-black uppercase px-1.5 py-0.2 border border-ink ${st.badgeBg}`}>
                      {st.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-tight text-ink-soft">
                    {st.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
