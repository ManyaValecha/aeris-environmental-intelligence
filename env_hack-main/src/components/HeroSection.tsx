import React from 'react';
import { UserLens, StationReading } from '../types';
import { ArrowRight, Shield, Users, Radio, Trees, ExternalLink } from 'lucide-react';
import { HeroDynamicGlobe } from './HeroDynamicGlobe';

interface HeroSectionProps {
  activeLens: UserLens;
  onLensChange: (lens: UserLens) => void;
  selectedStation: StationReading;
  allStations: StationReading[];
  onSelectStation: (stationId: string) => void;
  onScrollTo: (sectionId: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  activeLens,
  onLensChange,
  selectedStation,
  allStations,
  onSelectStation,
  onScrollTo,
}) => {
  return (
    <section className="relative overflow-hidden border-b-[3px] border-ink brutal-grid py-12 lg:py-20">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          {/* Left Column: Hero Typography & Actions */}
          <div className="flex flex-col items-start">
            {/* Kicker Sticker Badge */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="brutal-sticker bg-ink text-sun -rotate-2">
                <Radio className="h-3.5 w-3.5 text-sun animate-pulse" />
                <span>AERIS / ENVIRONMENTAL COMMAND / DELHI NCR</span>
              </span>
              <span className="border-[2px] border-ink bg-paper-light px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-ink shadow-[2px_2px_0_var(--ink)]">
                CPCB GRAP PROTOCOL COMPLIANT
              </span>
            </div>

            {/* Giant Display Headline */}
            <h1 className="text-[clamp(3.1rem,7.5vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.05em] text-ink font-display">
              TWO LENSES. <br />
              ONE{' '}
              <span className="inline-block border-[3px] border-ink bg-sun px-3 shadow-[8px_8px_0_var(--ink)] text-ink rotate-1">
                CLEAN SKY.
              </span>
            </h1>

            {/* Description Subtitle */}
            <p className="mt-8 max-w-xl text-base font-medium leading-relaxed text-ink-soft">
              Environmental intelligence engine for the National Capital Region. Switch between{' '}
              <strong className="text-ink font-bold">Citizen Exposure</strong> (real-time personal health risks & safe commute windows) and{' '}
              <strong className="text-ink font-bold">Municipal Authority</strong> (GRAP emergency triggers & policy intervention modeling). Track 8 regulatory CAAQMS stations with zero black-box obscurity.
            </p>

            {/* Dual CTAs & Secondary Links */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onScrollTo('stations')}
                className="brutal-button bg-sun hover:bg-sun-hover px-6 py-3.5 text-[12px] text-ink shadow-[6px_6px_0_var(--ink)] gap-2"
              >
                <span>Inspect 8 Stations</span>
                <ArrowRight className="h-4 w-4 stroke-[3]" />
              </button>
              <button
                onClick={() => onScrollTo('live-cloud')}
                className="brutal-button bg-mint hover:bg-mint-hover px-6 py-3.5 text-[12px] text-ink shadow-[6px_6px_0_var(--ink)] gap-2 flex items-center font-black"
              >
                <Trees className="h-4 w-4 text-ink stroke-[2.5]" />
                <span>Live Vercel Portal ↗</span>
              </button>
              <button
                onClick={() => onScrollTo('interventions')}
                className="brutal-button bg-paper-light hover:bg-paper px-6 py-3.5 text-[12px] text-ink shadow-[6px_6px_0_var(--ink)] gap-2"
              >
                <span>Simulate Policy Lab</span>
              </button>
            </div>

            {/* Lens Switcher Strip */}
            <div className="mt-8 flex items-center gap-3 border-[3px] border-ink bg-paper-light p-2 shadow-[4px_4px_0_var(--ink)]">
              <span className="text-[11px] font-black uppercase tracking-wider text-ink-soft pl-2">
                Active Lens:
              </span>
              <button
                onClick={() => onLensChange('CITIZEN')}
                className={`flex items-center gap-2 border-[2px] border-ink px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all ${
                  activeLens === 'CITIZEN'
                    ? 'bg-violet text-paper shadow-[3px_3px_0_var(--ink)] -rotate-1'
                    : 'bg-white text-ink-soft hover:text-ink'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Citizen View</span>
              </button>
              <button
                onClick={() => onLensChange('AUTHORITY')}
                className={`flex items-center gap-2 border-[2px] border-ink px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all ${
                  activeLens === 'AUTHORITY'
                    ? 'bg-coral text-ink shadow-[3px_3px_0_var(--ink)] rotate-1'
                    : 'bg-white text-ink-soft hover:text-ink'
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Authority View</span>
              </button>
            </div>
          </div>

          {/* Right Column: Dynamic Interactive Earth Globe & NCR Radar Map */}
          <div className="relative">
            <HeroDynamicGlobe
              selectedStation={selectedStation}
              allStations={allStations}
              onSelectStation={onSelectStation}
              activeLens={activeLens}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
