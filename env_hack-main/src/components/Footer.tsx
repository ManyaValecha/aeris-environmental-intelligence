import React from 'react';
import { Wind, Shield, Compass, Heart, Github, ExternalLink, Trees, Leaf } from 'lucide-react';

interface FooterProps {
  onScrollTo: (sectionId: string) => void;
  onOpenAudit: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onScrollTo, onOpenAudit }) => {
  return (
    <footer className="border-t-[3px] border-ink bg-paper-deep text-ink">
      {/* Mini Ticker Strip */}
      <div className="border-b-[3px] border-ink bg-sun py-2 text-[11px] font-black uppercase tracking-widest text-ink text-center">
        <span>DELHI NCR AIRSHED COORDINATES: 28.6139° N, 77.2090° E · ELEVATION 216M MSL · CAAQMS GRID ONLINE</span>
      </div>

      <div className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Col 1: Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center border-[2px] border-ink bg-sun shadow-[2px_2px_0_var(--ink)]">
                <Wind className="h-4 w-4 text-ink stroke-[2.5]" />
              </span>
              <span className="text-xl font-black tracking-tight text-ink uppercase font-display">
                AERIS
              </span>
              <span className="border border-ink bg-coral px-1.5 py-0.5 text-[9px] font-black text-ink uppercase">
                DELHI NCR
              </span>
            </div>

            <p className="mt-3 max-w-sm text-xs leading-relaxed text-ink-soft">
              Environmental intelligence and decision engine for Delhi National Capital Region. Continuous CAAQMS ingestion, Median Absolute Deviation anomaly detection, and counterfactual policy simulation.
            </p>

            <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-ink-soft">
              <Compass className="h-3.5 w-3.5" />
              <span>Grounded in CPCB, SAFAR &amp; OpenAQ open standards.</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-ink font-display">
              Platform Modules
            </h4>
            <ul className="mt-3 space-y-2 text-xs font-bold text-ink-soft">
              <li>
                <button
                  onClick={() => onScrollTo('stations')}
                  className="hover:text-ink transition-colors cursor-pointer"
                >
                  Stations &amp; Spatial Map
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollTo('lenses')}
                  className="hover:text-ink transition-colors cursor-pointer"
                >
                  Dual Lenses (Citizen / Authority)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollTo('forecasts')}
                  className="hover:text-ink transition-colors cursor-pointer"
                >
                  XGBoost ML Forecasts
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollTo('anomalies')}
                  className="hover:text-ink transition-colors cursor-pointer"
                >
                  Pollution Anomaly Radar
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollTo('interventions')}
                  className="hover:text-ink transition-colors cursor-pointer"
                >
                  Policy Sensitivity Lab
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Standards & Provenance */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-ink font-display">
              Scientific Standards
            </h4>
            <ul className="mt-3 space-y-2 text-xs font-bold text-ink-soft">
              <li>
                <button
                  onClick={onOpenAudit}
                  className="text-coral hover:underline transition-colors cursor-pointer font-black"
                >
                  Data Provenance Audit Log
                </button>
              </li>
              <li>
                <span className="text-ink-soft">Indian National AQI (NAQI)</span>
              </li>
              <li>
                <span className="text-ink-soft">SAFAR Source Apportionment</span>
              </li>
              <li>
                <span className="text-ink-soft">CPCB GRAP Emergency Stages</span>
              </li>
              <li>
                <button
                  onClick={() => onScrollTo('live-cloud')}
                  className="text-mint hover:underline transition-colors cursor-pointer font-black flex items-center gap-1"
                >
                  <Trees className="h-3 w-3" />
                  <span>Forest Biosphere Buffer</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Live Cloud & GitHub Deployment */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-ink font-display flex items-center gap-1.5">
              <Leaf className="h-3.5 w-3.5 text-mint" />
              Production Cloud
            </h4>
            <div className="mt-3 space-y-2 text-xs font-bold">
              <a
                href="https://aeris-environmental-intelligence.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 border-[2px] border-ink bg-coral/20 px-2.5 py-1.5 text-ink hover:bg-coral hover:text-ink transition-colors shadow-[2px_2px_0_var(--ink)]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Live Vercel App ↗</span>
              </a>
              <a
                href="https://github.com/ManyaValecha/aeris-environmental-intelligence"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 border-[2px] border-ink bg-paper px-2.5 py-1.5 text-ink hover:bg-night hover:text-paper transition-colors shadow-[2px_2px_0_var(--ink)]"
              >
                <Github className="h-3.5 w-3.5" />
                <span>GitHub Repository</span>
              </a>
              <a
                href="https://github.com/ManyaValecha"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] font-mono text-ink-soft hover:text-ink transition-colors"
              >
                <span>@ManyaValecha Profile</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 border-t-[2px] border-ink/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-ink-soft">
          <div>
            © 2026 AERIS Environmental Intelligence. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-ink font-black">STRICT PROVENANCE ENFORCED</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
