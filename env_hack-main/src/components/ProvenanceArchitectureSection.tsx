import React from 'react';
import { ShieldCheck, Database, Cpu, FlaskConical, ExternalLink } from 'lucide-react';
import { PROVENANCE_AUDIT_TRAIL } from '../data/stationsData';

interface ProvenanceArchitectureSectionProps {
  onOpenAudit: () => void;
}

export const ProvenanceArchitectureSection: React.FC<ProvenanceArchitectureSectionProps> = ({
  onOpenAudit,
}) => {
  return (
    <section className="border-b-[3px] border-ink bg-paper py-14 lg:py-20">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        {/* Counterpart to CampusEvac's "Built on AWS" brutal-slab black card */}
        <div className="brutal-slab grid gap-8 bg-night p-8 text-paper shadow-[10px_10px_0_var(--sun)] lg:grid-cols-[0.8fr_1.2fr] lg:p-10">
          {/* Left Column: Heading & Philosophy */}
          <div className="flex flex-col justify-between">
            <div>
              <span className="brutal-sticker border-paper bg-sun text-ink -rotate-2">
                OPEN SCIENCE &amp; PROVENANCE
              </span>

              <h2 className="mt-5 text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] text-paper sm:text-5xl font-display">
                ZERO BLACK BOXES. <br />
                STRICT PROVENANCE.
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-paper/70">
                In environmental intelligence, confusing a hypothetical scenario with an actual regulatory sensor measurement is catastrophic for public trust. AERIS cryptographically tags each reading with its scientific lineage.
              </p>
            </div>

            <div className="mt-8">
              <button
                onClick={onOpenAudit}
                className="brutal-button bg-sun hover:bg-sun-hover px-5 py-3 text-xs text-ink shadow-[4px_4px_0_var(--coral)] gap-2"
              >
                <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
                <span>View Full Audit Registry</span>
              </button>
            </div>
          </div>

          {/* Right Column: 4 Scientific Pillars */}
          <div className="grid gap-4 sm:grid-cols-2">
            {PROVENANCE_AUDIT_TRAIL.map((item) => {
              const labelColors: Record<string, string> = {
                MEASURED: 'text-mint border-mint',
                SIMULATED: 'text-sun border-sun',
                PREDICTED: 'text-violet border-violet',
                ESTIMATED: 'text-coral border-coral',
              };

              const icons: Record<string, any> = {
                MEASURED: Database,
                SIMULATED: FlaskConical,
                PREDICTED: Cpu,
                ESTIMATED: ShieldCheck,
              };

              const Icon = icons[item.label] || ShieldCheck;

              return (
                <div
                  key={item.id}
                  className="border-[2px] border-paper/25 bg-paper/5 p-5 flex flex-col justify-between hover:border-paper/60 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <Icon className="h-5 w-5 text-sun stroke-[2.2]" />
                      <span className={`font-mono text-[10px] font-black uppercase tracking-widest border px-1.5 py-0.5 ${labelColors[item.label]}`}>
                        {item.label}
                      </span>
                    </div>

                    <h3 className="mt-3 text-sm font-black uppercase tracking-wide text-paper font-display">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-[11px] leading-relaxed text-paper/70">
                      {item.source}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-paper/15 text-[10px] font-mono text-paper/50">
                    Confidence: <span className="text-paper/90 font-bold">{item.confidenceScore.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
