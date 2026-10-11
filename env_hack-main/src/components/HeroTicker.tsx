import React from 'react';
import { AlertTriangle, Compass, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

export const HeroTicker: React.FC = () => {
  const tickerItems = [
    { text: '8 REGULATORY CAAQMS STATIONS', icon: Compass, color: 'text-sun' },
    { text: 'ANAND VIHAR AQI 348 (VERY POOR)', icon: ShieldAlert, color: 'text-coral' },
    { text: 'BAWANA INDUSTRIAL AQI 380 (SEVERE)', icon: AlertTriangle, color: 'text-danger' },
    { text: '1H XGBOOST & 6H LIGHTGBM ML FORECASTS', icon: Cpu, color: 'text-mint' },
    { text: 'CPCB / SAFAR SOURCE APPORTIONMENT SENSITIVITY', icon: Sparkles, color: 'text-sun' },
    { text: 'STRICT DATA PROVENANCE: MEASURED · PREDICTED · ESTIMATED', icon: Compass, color: 'text-paper' },
  ];

  return (
    <div className="brutal-ticker text-paper py-2.5 select-none" aria-label="Real-time environmental telemetry ticker">
      <div className="brutal-ticker__track flex items-center gap-8">
        {[...tickerItems, ...tickerItems].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center gap-3 shrink-0 text-[11px] font-black uppercase tracking-[0.18em]">
              <Icon className={`h-3.5 w-3.5 ${item.color} stroke-[2.5]`} />
              <span>{item.text}</span>
              <span className="text-sun opacity-60">·</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
