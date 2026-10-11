import React from 'react';
import { UserLens } from '../types';
import { Wind, Shield, Users, Sliders, Activity, Trees } from 'lucide-react';

interface HeaderProps {
  activeLens: UserLens;
  onLensChange: (lens: UserLens) => void;
  onOpenAudit: () => void;
  onOpenArchitecture: () => void;
  onScrollTo: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeLens,
  onLensChange,
  onOpenAudit,
  onOpenArchitecture,
  onScrollTo,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-6 px-5 py-3 sm:px-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group flex items-center gap-2 text-decoration-none"
          >
            <span className="flex h-9 w-9 items-center justify-center border-[3px] border-ink bg-sun shadow-[3px_3px_0_var(--ink)] group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform">
              <Wind className="h-5 w-5 text-ink stroke-[2.5]" />
            </span>
            <span className="text-2xl font-black tracking-tight text-ink uppercase font-display">
              AERIS
            </span>
            <span className="hidden sm:inline-block border-[2px] border-ink bg-coral px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-ink shadow-[2px_2px_0_var(--ink)] -rotate-2">
              DELHI NCR
            </span>
          </a>
        </div>

        {/* Zone 2: Navigation Links (single line text links) */}
        <nav className="hidden lg:flex items-center gap-5 text-[12px] font-black uppercase tracking-wider text-ink-soft">
          <button
            onClick={() => onScrollTo('stations')}
            className="hover:text-ink transition-colors cursor-pointer whitespace-nowrap"
          >
            Stations &amp; Map
          </button>
          <button
            onClick={() => onScrollTo('flight')}
            className="hover:text-ink transition-colors cursor-pointer whitespace-nowrap text-violet font-black"
          >
            Intervention Flight
          </button>
          <button
            onClick={() => onScrollTo('live-cloud')}
            className="hover:text-ink transition-colors cursor-pointer whitespace-nowrap text-mint font-black flex items-center gap-1 border border-ink bg-mint/20 px-2 py-0.5 shadow-[2px_2px_0_var(--ink)]"
          >
            <Trees className="h-3 w-3 text-mint stroke-[2.5]" />
            <span>LIVE CLOUD ↗</span>
          </button>
          <button
            onClick={() => onScrollTo('forecasts')}
            className="hover:text-ink transition-colors cursor-pointer whitespace-nowrap"
          >
            ML Forecasts
          </button>
          <button
            onClick={() => onScrollTo('interventions')}
            className="hover:text-ink transition-colors cursor-pointer whitespace-nowrap"
          >
            Policy Lab
          </button>
          <button
            onClick={() => onScrollTo('copilot')}
            className="hover:text-ink transition-colors cursor-pointer whitespace-nowrap text-sun-hover font-black"
          >
            AI Copilot
          </button>
          <button
            onClick={onOpenArchitecture}
            className="hover:text-ink transition-colors cursor-pointer whitespace-nowrap text-coral"
          >
            AWS Architecture
          </button>
          <button
            onClick={onOpenAudit}
            className="hover:text-ink transition-colors cursor-pointer whitespace-nowrap text-mint font-black"
          >
            Provenance
          </button>
        </nav>

        {/* Zone 3: Active Lens Switcher & Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Lens Toggle */}
          <div className="flex items-center border-[2px] border-ink bg-paper-light p-0.5 shadow-[3px_3px_0_var(--ink)]">
            <button
              onClick={() => onLensChange('CITIZEN')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide transition-all ${
                activeLens === 'CITIZEN'
                  ? 'bg-violet text-paper shadow-[2px_2px_0_var(--ink)]'
                  : 'text-ink-soft hover:text-ink'
              }`}
              title="Switch to Citizen Exposure Lens"
            >
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Citizen</span>
            </button>
            <button
              onClick={() => onLensChange('AUTHORITY')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide transition-all ${
                activeLens === 'AUTHORITY'
                  ? 'bg-coral text-ink shadow-[2px_2px_0_var(--ink)]'
                  : 'text-ink-soft hover:text-ink'
              }`}
              title="Switch to Municipal Authority Lens"
            >
              <Shield className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Authority</span>
            </button>
          </div>

          {/* Primary CTA */}
          <button
            onClick={() => onScrollTo('interventions')}
            className="brutal-button bg-sun hover:bg-sun-hover px-3.5 py-1.5 text-[11px] text-ink gap-1.5"
          >
            <Sliders className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="whitespace-nowrap">Simulate Lab</span>
          </button>
        </div>
      </div>
    </header>
  );
};
