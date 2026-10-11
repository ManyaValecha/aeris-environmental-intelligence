import React from 'react';
import { UserLens } from '../types';
import { Users, Shield, HeartPulse, BellRing, Gauge, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

interface DualLensesSectionProps {
  activeLens: UserLens;
  onLensChange: (lens: UserLens) => void;
  onScrollTo: (sectionId: string) => void;
}

export const DualLensesSection: React.FC<DualLensesSectionProps> = ({
  activeLens,
  onLensChange,
  onScrollTo,
}) => {
  return (
    <section id="lenses" className="border-b-[3px] border-ink bg-paper-deep py-14 lg:py-20">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-3">
            <span className="brutal-sticker bg-ink text-sun -rotate-2">
              TWO PERSPECTIVES
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-ink-soft">
              Zero Generic Dashboard Slop
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-black uppercase tracking-[-0.04em] text-ink sm:text-5xl font-display">
            CHOOSE YOUR LENS.
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
            Pollution data serves different masters. A mother planning a morning school drop requires actionable exposure safety; a municipal commissioner requires statutory GRAP trigger enforcement.
          </p>
        </div>

        {/* 2 Big Cards Grid */}
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* Card 01: The Citizen */}
          <div
            className={`brutal-card p-7 transition-all ${
              activeLens === 'CITIZEN'
                ? 'border-[4px] border-ink bg-paper-light shadow-[12px_12px_0_var(--violet)] ring-4 ring-violet/20'
                : 'bg-paper-light opacity-90 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="brutal-sticker bg-violet text-paper -rotate-2">
                Lens 01
              </span>
              <span className="font-mono text-xs font-black text-violet uppercase">
                Personal Defense
              </span>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center border-[3px] border-ink bg-violet text-paper shadow-[3px_3px_0_var(--ink)]">
                <Users className="h-6 w-6 stroke-[2.5]" />
              </span>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-ink font-display">
                  The Citizen
                </h3>
                <span className="text-xs text-ink-soft font-bold">
                  Exposure Risk & Personal Action
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              You live and breathe Delhi&apos;s airshed. You need straightforward answers: Can your child play outdoors at 4 PM? When should you run the HEPA air purifier? Which commute route minimizes toxic particulate inhalation?
            </p>

            <ul className="mt-6 space-y-3 text-xs font-bold text-ink">
              <li className="flex items-start gap-2.5 border-[2px] border-ink/15 bg-paper p-3">
                <HeartPulse className="h-4 w-4 text-violet shrink-0 stroke-[2.5] mt-0.5" />
                <span>
                  <strong>Vulnerable Group Alerts:</strong> Real-time guidance for asthma, cardiovascular patients, infants, and seniors.
                </span>
              </li>
              <li className="flex items-start gap-2.5 border-[2px] border-ink/15 bg-paper p-3">
                <BellRing className="h-4 w-4 text-violet shrink-0 stroke-[2.5] mt-0.5" />
                <span>
                  <strong>Safe Ventilation Windows:</strong> Identifies afternoon boundary-layer mixing slots with lowest ambient PM2.5.
                </span>
              </li>
              <li className="flex items-start gap-2.5 border-[2px] border-ink/15 bg-paper p-3">
                <CheckCircle2 className="h-4 w-4 text-violet shrink-0 stroke-[2.5] mt-0.5" />
                <span>
                  <strong>N95 Respirator Mandates:</strong> Clear threshold warnings when AQI crosses 200 (Moderate to Poor).
                </span>
              </li>
            </ul>

            <div className="mt-8 flex items-center justify-between border-t-[2px] border-ink/20 pt-5">
              <button
                onClick={() => {
                  onLensChange('CITIZEN');
                  onScrollTo('stations');
                }}
                className={`brutal-button px-5 py-2.5 text-xs ${
                  activeLens === 'CITIZEN'
                    ? 'bg-violet text-paper'
                    : 'bg-paper text-ink hover:bg-violet hover:text-paper'
                }`}
              >
                {activeLens === 'CITIZEN' ? 'Active Lens Selected' : 'Switch To Citizen Lens'}
              </button>
              <span className="font-mono text-[11px] text-ink-soft font-bold">
                8 STATIONS SYNCED
              </span>
            </div>
          </div>

          {/* Card 02: The Authority */}
          <div
            className={`brutal-card p-7 transition-all ${
              activeLens === 'AUTHORITY'
                ? 'border-[4px] border-ink bg-paper-light shadow-[12px_12px_0_var(--coral)] ring-4 ring-coral/20'
                : 'bg-paper-light opacity-90 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="brutal-sticker bg-coral text-ink rotate-2">
                Lens 02
              </span>
              <span className="font-mono text-xs font-black text-coral uppercase">
                Regulatory Control
              </span>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center border-[3px] border-ink bg-coral text-ink shadow-[3px_3px_0_var(--ink)]">
                <Shield className="h-6 w-6 stroke-[2.5]" />
              </span>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-ink font-display">
                  The Authority
                </h3>
                <span className="text-xs text-ink-soft font-bold">
                  Statutory GRAP & Policy Modeling
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              You regulate Delhi NCR&apos;s environment. You enforce Commission for Air Quality Management (CAQM) directives. You need to model the airshed consequence of halting construction or curbing interstate diesel trucks before issuing the orders.
            </p>

            <ul className="mt-6 space-y-3 text-xs font-bold text-ink">
              <li className="flex items-start gap-2.5 border-[2px] border-ink/15 bg-paper p-3">
                <Gauge className="h-4 w-4 text-coral shrink-0 stroke-[2.5] mt-0.5" />
                <span>
                  <strong>GRAP Stage I–IV Triggers:</strong> Automated threshold tracking for emergency odd-even and industrial closures.
                </span>
              </li>
              <li className="flex items-start gap-2.5 border-[2px] border-ink/15 bg-paper p-3">
                <FileSpreadsheet className="h-4 w-4 text-coral shrink-0 stroke-[2.5] mt-0.5" />
                <span>
                  <strong>Source Apportionment Attribution:</strong> Real-time weighting of vehicular exhaust, road dust, and biomass emissions.
                </span>
              </li>
              <li className="flex items-start gap-2.5 border-[2px] border-ink/15 bg-paper p-3">
                <CheckCircle2 className="h-4 w-4 text-coral shrink-0 stroke-[2.5] mt-0.5" />
                <span>
                  <strong>Counterfactual Policy Lab:</strong> Test 10%–50% sector curbs to project exact µg/m³ improvements.
                </span>
              </li>
            </ul>

            <div className="mt-8 flex items-center justify-between border-t-[2px] border-ink/20 pt-5">
              <button
                onClick={() => {
                  onLensChange('AUTHORITY');
                  onScrollTo('interventions');
                }}
                className={`brutal-button px-5 py-2.5 text-xs ${
                  activeLens === 'AUTHORITY'
                    ? 'bg-coral text-ink'
                    : 'bg-paper text-ink hover:bg-coral hover:text-ink'
                }`}
              >
                {activeLens === 'AUTHORITY' ? 'Active Lens Selected' : 'Switch To Authority Lens'}
              </button>
              <span className="font-mono text-[11px] text-ink-soft font-bold">
                POLICY LAB UNLOCKED
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
