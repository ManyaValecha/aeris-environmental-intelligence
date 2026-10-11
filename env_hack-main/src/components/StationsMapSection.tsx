import React, { useState } from 'react';
import { StationReading, UserLens } from '../types';
import { STATIONS_MAP } from '../data/stationsData';
import { Compass, Wind, Droplets, Thermometer, ShieldAlert, CheckCircle, MapPin, Info } from 'lucide-react';

interface StationsMapSectionProps {
  allReadings: StationReading[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  activeLens: UserLens;
  onOpenAudit: () => void;
}

export const StationsMapSection: React.FC<StationsMapSectionProps> = ({
  allReadings,
  selectedStationId,
  onSelectStation,
  activeLens,
  onOpenAudit,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'severe' | 'industrial'>('all');

  const selectedReading = allReadings.find((r) => r.stationId === selectedStationId) || allReadings[0];
  const stationMeta = STATIONS_MAP.get(selectedReading.stationId);

  // Filter list
  const filteredReadings = allReadings.filter((r) => {
    if (filterMode === 'severe') return r.aqi.value >= 300;
    if (filterMode === 'industrial') {
      const meta = STATIONS_MAP.get(r.stationId);
      return meta?.locality.toLowerCase().includes('industrial') || r.stationId.includes('BAWANA') || r.stationId.includes('ANAND_VIHAR') || r.stationId.includes('NOIDA');
    }
    return true;
  });

  // Relative positions on an SVG coordinate map (approx 500x420)
  // Latitude spans ~28.45 to 28.80, Longitude spans ~77.02 to 77.40
  const getSvgCoords = (lat: number, lng: number) => {
    const minLat = 28.42;
    const maxLat = 28.82;
    const minLng = 77.0;
    const maxLng = 77.42;
    const x = ((lng - minLng) / (maxLng - minLng)) * 440 + 30;
    const y = 390 - ((lat - minLat) / (maxLat - minLat)) * 360;
    return { x, y };
  };

  return (
    <section id="stations" className="border-b-[3px] border-ink bg-paper py-14 lg:py-20">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="brutal-sticker bg-ink text-sun -rotate-2">
                MONITORING GRID
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-ink-soft">
                Delhi NCR Airshed
              </span>
            </div>
            <h2 className="mt-4 text-3xl font-black uppercase tracking-[-0.04em] text-ink sm:text-5xl font-display">
              STATIONS & TELEMETRY.
            </h2>
            <p className="mt-2 text-sm text-ink-soft max-w-xl">
              Inspect real-time continuous ambient monitoring across 8 regulatory stations. Click any station or pin to sync forecasts and policy models.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 border-[2px] border-ink bg-paper-light p-1 shadow-[3px_3px_0_var(--ink)] self-start sm:self-auto">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-ink text-paper shadow-[2px_2px_0_var(--sun)]'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              All (8)
            </button>
            <button
              onClick={() => setFilterMode('severe')}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                filterMode === 'severe'
                  ? 'bg-danger text-paper shadow-[2px_2px_0_var(--ink)]'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              Severe (&gt;300)
            </button>
            <button
              onClick={() => setFilterMode('industrial')}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                filterMode === 'industrial'
                  ? 'bg-coral text-ink shadow-[2px_2px_0_var(--ink)]'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              Hotspots
            </button>
          </div>
        </div>

        {/* 2-Column Split: Interactive Map & Station Inspector Card */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left Column: Interactive Delhi NCR SVG Map */}
          <div className="brutal-card p-5 bg-paper-light flex flex-col justify-between">
            <div className="flex items-center justify-between border-b-[2px] border-ink/20 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-coral stroke-[2.5]" />
                <span className="font-mono text-xs font-black uppercase tracking-wider text-ink">
                  DELHI NCR SPATIAL MAP
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold text-ink-soft">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-mint border border-ink"></span> &lt;100 Good
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-sun border border-ink"></span> &lt;200 Mod
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-coral border border-ink"></span> &lt;300 Poor
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-danger border border-ink"></span> &gt;300 Severe
                </span>
              </div>
            </div>

            {/* Map Canvas */}
            <div className="relative mt-4 h-[380px] w-full rounded border-[2px] border-ink/15 bg-[#f5ede2] overflow-hidden">
              <svg
                viewBox="0 0 500 420"
                className="h-full w-full select-none"
                style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.05))' }}
              >
                {/* Background Grid Lines */}
                <defs>
                  <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(29,22,38,0.06)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="500" height="420" fill="url(#mapGrid)" />

                {/* Stylized Delhi State Border Outline */}
                <path
                  d="M 120 70 Q 220 50 330 80 Q 390 120 380 220 Q 360 320 280 370 Q 180 390 130 310 Q 90 220 120 70 Z"
                  fill="rgba(255, 255, 255, 0.45)"
                  stroke="var(--ink)"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                />

                {/* Yamuna River Stylized Curve */}
                <path
                  d="M 280 40 Q 295 130 290 190 T 325 310 T 350 400"
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.75"
                />
                <text x="315" y="170" fill="#2563eb" fontSize="9" fontWeight="900" fontStyle="italic" opacity="0.8">
                  Yamuna River
                </text>

                {/* NCR Regional Annotations */}
                <text x="140" y="360" fill="var(--ink-soft)" fontSize="10" fontWeight="900" letterSpacing="0.1em" opacity="0.6">
                  HARYANA (GURUGRAM)
                </text>
                <text x="345" y="270" fill="var(--ink-soft)" fontSize="10" fontWeight="900" letterSpacing="0.1em" opacity="0.6">
                  UTTAR PRADESH (NOIDA)
                </text>
                <text x="210" y="110" fill="var(--ink)" fontSize="13" fontWeight="900" letterSpacing="0.15em" opacity="0.25">
                  NATIONAL CAPITAL TERRITORY
                </text>

                {/* Station Pins on the Map */}
                {allReadings.map((reading) => {
                  const meta = STATIONS_MAP.get(reading.stationId);
                  if (!meta) return null;
                  const { x, y } = getSvgCoords(meta.coordinates.lat, meta.coordinates.lng);
                  const isSelected = reading.stationId === selectedStationId;

                  return (
                    <g
                      key={reading.stationId}
                      className="cursor-pointer transition-transform duration-200"
                      onClick={() => onSelectStation(reading.stationId)}
                      transform={`translate(${x}, ${y})`}
                    >
                      {/* Pulse ring for active station */}
                      {isSelected && (
                        <circle
                          r="18"
                          fill={reading.aqi.categoryColor}
                          opacity="0.35"
                          className="animate-ping"
                        />
                      )}

                      {/* Hard shadow badge */}
                      <circle
                        cx="2"
                        cy="2"
                        r="11"
                        fill="var(--ink)"
                      />

                      {/* Main Node */}
                      <circle
                        r="10"
                        fill={reading.aqi.categoryColor}
                        stroke="var(--ink)"
                        strokeWidth="2.5"
                      />

                      {/* Pin Label Card */}
                      <g transform="translate(14, -12)">
                        <rect
                          x="0"
                          y="0"
                          width={meta.name.length * 6.5 + 42}
                          height="22"
                          fill={isSelected ? 'var(--ink)' : 'var(--paper-light)'}
                          stroke="var(--ink)"
                          strokeWidth="2"
                          rx="2"
                          filter="drop-shadow(2px 2px 0px var(--ink))"
                        />
                        <text
                          x="6"
                          y="15"
                          fontSize="9.5"
                          fontWeight="900"
                          fill={isSelected ? 'var(--paper)' : 'var(--ink)'}
                          fontFamily="'Outfit', sans-serif"
                        >
                          {meta.name}
                        </text>
                        <text
                          x={meta.name.length * 6.5 + 14}
                          y="15"
                          fontSize="9"
                          fontWeight="900"
                          fontFamily="'JetBrains Mono', monospace"
                          fill={reading.aqi.categoryColor}
                        >
                          {reading.aqi.value}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Bottom Station Grid Selector Strip */}
            <div className="mt-4 pt-3 border-t-[2px] border-ink/20">
              <span className="text-[10px] font-black uppercase text-ink-soft block mb-2">
                Click Station to Inspect Telemetry:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {filteredReadings.map((r) => {
                  const meta = STATIONS_MAP.get(r.stationId);
                  const isSel = r.stationId === selectedStationId;
                  return (
                    <button
                      key={r.stationId}
                      onClick={() => onSelectStation(r.stationId)}
                      className={`border-[2px] p-2 text-left transition-all cursor-pointer ${
                        isSel
                          ? 'border-ink bg-sun text-ink shadow-[3px_3px_0_var(--ink)] -translate-y-0.5'
                          : 'border-ink/30 bg-paper hover:border-ink hover:bg-white text-ink'
                      }`}
                    >
                      <div className="truncate text-[11px] font-black uppercase tracking-tight">
                        {meta?.name}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-mono text-xs font-black">
                          AQI {r.aqi.value}
                        </span>
                        <span
                          className="h-2 w-2 rounded-full border border-ink"
                          style={{ backgroundColor: r.aqi.categoryColor }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Station Inspector Card */}
          <div className="brutal-card p-6 bg-paper-light flex flex-col justify-between">
            <div>
              {/* Header: Station Name & Provenance Badge */}
              <div className="flex items-start justify-between gap-4 border-b-[2px] border-ink/20 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-ink-soft">
                    {stationMeta?.locality} · CPCB ID: {stationMeta?.openAqId}
                  </span>
                  <h3 className="text-3xl font-black uppercase tracking-tight text-ink font-display mt-0.5">
                    {stationMeta?.name}
                  </h3>
                </div>

                <button
                  onClick={onOpenAudit}
                  className="brutal-sticker bg-mint text-ink shrink-0 hover:bg-mint/80 transition-colors cursor-pointer"
                  title="View verification methodology for this measured value"
                >
                  <CheckCircle className="h-3 w-3 stroke-[2.5]" />
                  <span>{selectedReading.provenance}</span>
                </button>
              </div>

              {/* Main AQI Value Block */}
              <div className="mt-5 flex flex-wrap items-baseline justify-between gap-4 border-[3px] border-ink bg-paper p-4 shadow-[4px_4px_0_var(--ink)]">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-ink-soft">
                    Air Quality Index (NAQI)
                  </span>
                  <div className="mt-1 flex items-baseline gap-3">
                    <span className="text-5xl font-black font-display text-ink tabular-nums">
                      {selectedReading.aqi.value}
                    </span>
                    <span
                      className="border-[2px] border-ink px-2.5 py-1 text-xs font-black uppercase tracking-wider text-ink shadow-[2px_2px_0_var(--ink)]"
                      style={{ backgroundColor: selectedReading.aqi.categoryColor }}
                    >
                      {selectedReading.aqi.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-ink-soft">
                    Primary Pollutant
                  </span>
                  <div className="text-lg font-black uppercase text-ink font-display mt-1">
                    {selectedReading.aqi.primaryPollutant}
                  </div>
                  <div className="text-[11px] font-mono text-ink-soft">
                    {selectedReading.pollutants[selectedReading.aqi.primaryPollutant]} µg/m³
                  </div>
                </div>
              </div>

              {/* 6 Pollutant Matrix */}
              <div className="mt-5">
                <span className="text-[11px] font-black uppercase tracking-wider text-ink block mb-2">
                  Chemical Species Breakdown:
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="border-[2px] border-ink bg-white p-2.5">
                    <div className="flex items-center justify-between text-[10px] font-black text-ink-soft uppercase">
                      <span>PM2.5</span>
                      <span className="font-mono text-danger font-bold">Fine</span>
                    </div>
                    <div className="mt-1 text-base font-black font-mono text-ink">
                      {selectedReading.pollutants.pm25} <span className="text-[10px] text-ink-soft font-normal">µg/m³</span>
                    </div>
                  </div>

                  <div className="border-[2px] border-ink bg-white p-2.5">
                    <div className="flex items-center justify-between text-[10px] font-black text-ink-soft uppercase">
                      <span>PM10</span>
                      <span className="font-mono text-coral font-bold">Coarse</span>
                    </div>
                    <div className="mt-1 text-base font-black font-mono text-ink">
                      {selectedReading.pollutants.pm10} <span className="text-[10px] text-ink-soft font-normal">µg/m³</span>
                    </div>
                  </div>

                  <div className="border-[2px] border-ink bg-white p-2.5">
                    <div className="flex items-center justify-between text-[10px] font-black text-ink-soft uppercase">
                      <span>NO2</span>
                      <span className="font-mono text-ink-soft font-bold">Traffic</span>
                    </div>
                    <div className="mt-1 text-base font-black font-mono text-ink">
                      {selectedReading.pollutants.no2} <span className="text-[10px] text-ink-soft font-normal">µg/m³</span>
                    </div>
                  </div>

                  <div className="border-[2px] border-ink bg-white p-2.5">
                    <div className="flex items-center justify-between text-[10px] font-black text-ink-soft uppercase">
                      <span>SO2</span>
                      <span className="font-mono text-ink-soft font-bold">Industry</span>
                    </div>
                    <div className="mt-1 text-base font-black font-mono text-ink">
                      {selectedReading.pollutants.so2} <span className="text-[10px] text-ink-soft font-normal">µg/m³</span>
                    </div>
                  </div>

                  <div className="border-[2px] border-ink bg-white p-2.5">
                    <div className="flex items-center justify-between text-[10px] font-black text-ink-soft uppercase">
                      <span>CO</span>
                      <span className="font-mono text-ink-soft font-bold">Combustion</span>
                    </div>
                    <div className="mt-1 text-base font-black font-mono text-ink">
                      {selectedReading.pollutants.co} <span className="text-[10px] text-ink-soft font-normal">mg/m³</span>
                    </div>
                  </div>

                  <div className="border-[2px] border-ink bg-white p-2.5">
                    <div className="flex items-center justify-between text-[10px] font-black text-ink-soft uppercase">
                      <span>O3</span>
                      <span className="font-mono text-ink-soft font-bold">Photochem</span>
                    </div>
                    <div className="mt-1 text-base font-black font-mono text-ink">
                      {selectedReading.pollutants.o3} <span className="text-[10px] text-ink-soft font-normal">µg/m³</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weather Telemetry Mini Row */}
              <div className="mt-4 grid grid-cols-3 gap-2 border-[2px] border-ink bg-paper p-3 text-[11px] font-bold text-ink">
                <div className="flex items-center gap-1.5">
                  <Wind className="h-4 w-4 text-ink-soft stroke-[2.5]" />
                  <span>{selectedReading.weather.windSpeedKmH} km/h ({selectedReading.weather.windDirectionLabel})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Thermometer className="h-4 w-4 text-ink-soft stroke-[2.5]" />
                  <span>{selectedReading.weather.temperatureCelsius}°C Temp</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Droplets className="h-4 w-4 text-ink-soft stroke-[2.5]" />
                  <span>{selectedReading.weather.relativeHumidityPct}% RH</span>
                </div>
              </div>

              {/* 3D Sensor Station Hardware Visual Banner */}
              <div className="mt-4 relative border-[2px] border-ink bg-night overflow-hidden shadow-[2px_2px_0_var(--ink)]">
                <div className="relative h-32 w-full overflow-hidden">
                  <img
                    src="/src/assets/images/cpcb_sensor_station_1791698476368.jpg"
                    alt="CPCB CAAQMS Continuous Ambient Air Quality Monitoring Station Pod"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-night via-night/30 to-transparent pointer-events-none" />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-night/90 border border-sun px-2 py-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
                    <span className="font-mono text-[8px] font-black text-sun uppercase tracking-wider">
                      CAAQMS CONTINUOUS SENSOR HARDWARE POD
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none font-mono text-[8px] text-white">
                    <span className="bg-night/90 px-1.5 py-0.5 border border-white/20">
                      BETA-ATTENUATION SPECTROMETRY
                    </span>
                    <span className="bg-night/90 px-1.5 py-0.5 border border-white/20 text-mint font-bold">
                      TELEMETRY: ONLINE
                    </span>
                  </div>
                </div>
              </div>

              {/* Local Dominant Sources */}
              <div className="mt-4 text-xs text-ink-soft">
                <strong className="text-ink uppercase font-bold text-[10px] block mb-1">
                  Local Emission Fingerprint:
                </strong>
                <div className="flex flex-wrap gap-1.5">
                  {stationMeta?.dominantSources.map((src, idx) => (
                    <span
                      key={idx}
                      className="border border-ink/30 bg-white px-2 py-0.5 text-[10px] font-medium text-ink"
                    >
                      {src}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Lens Specific Advisory Box */}
            <div className={`mt-5 border-[3px] border-ink p-4 shadow-[4px_4px_0_var(--ink)] ${
              activeLens === 'CITIZEN' ? 'bg-violet/10' : 'bg-coral/10'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {activeLens === 'CITIZEN' ? (
                  <>
                    <ShieldAlert className="h-4 w-4 text-violet stroke-[2.5]" />
                    <span className="text-xs font-black uppercase text-violet tracking-wide">
                      Citizen Exposure Advisory
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-4 w-4 text-coral stroke-[2.5]" />
                    <span className="text-xs font-black uppercase text-coral tracking-wide">
                      Municipal Authority Statutory Action
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs leading-relaxed text-ink font-medium">
                {activeLens === 'CITIZEN' ? (
                  <span>
                    {selectedReading.aqi.healthAdvisory} For {stationMeta?.name}, limit physical exertion outdoors between 7–10 AM when nocturnal temperature inversion traps exhaust at breathing level.
                  </span>
                ) : (
                  <span>
                    Current station AQI ({selectedReading.aqi.value}) triggers statutory <strong>GRAP Stage {selectedReading.aqi.value > 300 ? 'III (Severe)' : 'II (Very Poor)'}</strong> enforcement. Intensify mechanized road sweeping, strictly prohibit diesel generators, and deploy anti-smog water cannons along {stationMeta?.locality}.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
