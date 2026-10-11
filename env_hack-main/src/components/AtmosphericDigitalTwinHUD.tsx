import React, { useRef, useEffect } from 'react';
import { WeatherValues, StationReading } from '../types';
import { Layers, ThermometerSnowflake, Compass, Gauge, Wind, ShieldAlert, Sparkles } from 'lucide-react';

interface AtmosphericDigitalTwinHUDProps {
  reading: StationReading;
}

export const AtmosphericDigitalTwinHUD: React.FC<AtmosphericDigitalTwinHUDProps> = ({
  reading,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { weather } = reading;

  // Animated Particle Streamlines aligned with the station wind vector
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = canvas.width;
    const height = canvas.height;

    // Wind direction in radians
    const windRad = ((weather.windDirectionDeg - 90) * Math.PI) / 180;
    const speedMultiplier = Math.max(0.5, weather.windSpeedKmH / 4);

    // Initialize streamlines particles
    const particleCount = 55;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: Math.random() * 28 + 12,
      speed: (Math.random() * 1.5 + 1.0) * speedMultiplier,
      opacity: Math.random() * 0.5 + 0.2,
      thickness: Math.random() * 1.8 + 0.8,
    }));

    const render = () => {
      ctx.fillStyle = 'rgba(22, 17, 30, 0.25)';
      ctx.fillRect(0, 0, width, height);

      const vx = Math.cos(windRad);
      const vy = Math.sin(windRad);

      particles.forEach((p) => {
        p.x += vx * p.speed;
        p.y += vy * p.speed;

        // Wrap around borders
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.strokeStyle = `rgba(255, 196, 77, ${p.opacity})`;
        ctx.lineWidth = p.thickness;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - vx * p.length, p.y - vy * p.length);
        ctx.stroke();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [weather.windDirectionDeg, weather.windSpeedKmH]);

  const ratingColor =
    weather.verticalDispersionRating === 'CRITICAL_STAGNATION'
      ? 'bg-danger text-paper'
      : weather.verticalDispersionRating === 'POOR'
      ? 'bg-coral text-ink'
      : weather.verticalDispersionRating === 'MODERATE'
      ? 'bg-sun text-ink'
      : 'bg-mint text-ink';

  return (
    <div className="brutal-card bg-paper-light p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b-[2px] border-ink/20 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-coral stroke-[2.5]" />
          <div>
            <h3 className="text-base font-black uppercase tracking-tight text-ink font-display">
              Atmospheric Boundary Layer Digital Twin HUD
            </h3>
            <span className="font-mono text-[10px] text-ink-soft">
              ERA5 Reanalysis Grid + Station Anemometer · Micro-Physics Engine
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="brutal-sticker bg-violet text-paper text-[9px] -rotate-1">
            AWS IOT + REANALYSIS
          </span>
          <span className="brutal-sticker bg-ink text-sun text-[9px]">
            PROVENANCE: REANALYSIS
          </span>
        </div>
      </div>

      {/* Featured 3D Atmospheric Twin Image Banner */}
      <div className="mt-5 relative border-[3px] border-ink overflow-hidden bg-night shadow-[4px_4px_0_var(--ink)]">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_0.6fr]">
          <div className="relative h-48 sm:h-56 overflow-hidden">
            <img
              src="/src/assets/images/delhi_atmospheric_twin_1791698436710.jpg"
              alt="Delhi NCR Atmospheric Digital Twin 3D Model"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-night via-night/30 to-transparent pointer-events-none" />
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-night/90 border border-sun/60 px-2.5 py-0.5">
              <span className="h-2 w-2 rounded-full bg-mint animate-pulse" />
              <span className="font-mono text-[9px] font-black text-sun uppercase tracking-wider">
                3D BOUNDARY LAYER RECONSTRUCTION · 28.6°N 77.2°E
              </span>
            </div>
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
              <div className="bg-night/90 border border-white/20 px-2 py-0.5 font-mono text-[9px] text-white">
                STATION SENSOR MESH: <span className="text-mint font-bold">{reading.stationId.replace('DELHI_', '')}</span>
              </div>
              <div className="bg-night/90 border border-white/20 px-2 py-0.5 font-mono text-[9px] text-sun">
                SURFACE PM2.5: <span className="font-black">{reading.pollutants.pm25} µg/m³</span>
              </div>
            </div>
          </div>

          <div className="bg-night p-4 flex flex-col justify-between border-t md:border-t-0 md:border-l-[3px] border-ink text-white">
            <div>
              <span className="brutal-sticker bg-coral text-ink font-black text-[10px] mb-2.5 inline-block">
                AWS BEDROCK DIGITAL TWIN
              </span>
              <h4 className="text-sm font-black uppercase tracking-wide text-sun font-display">
                Micro-Meteorological Airshed Cap
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-white font-medium">
                During north Indian winter episodes, warm air aloft forms an inversion lid at <strong className="text-sun font-mono font-bold bg-white/10 px-1.5 py-0.5 rounded-sm">{weather.pblMixingHeightM}m</strong>, preventing vertical exhaust.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-white/20 grid grid-cols-2 gap-2.5 text-[11px] font-mono">
              <div className="bg-white/10 p-2 border border-white/25">
                <span className="text-white font-bold block text-[9px] uppercase tracking-wider">SURFACE TEMP</span>
                <span className="text-mint font-black text-sm">{weather.temperatureCelsius}°C</span>
              </div>
              <div className="bg-white/10 p-2 border border-white/25">
                <span className="text-white font-bold block text-[9px] uppercase tracking-wider">HUMIDITY</span>
                <span className="text-sun font-black text-sm">{weather.relativeHumidityPct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 4 Digital Twin Indicators */}
      <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Indicator 1: PBL Mixing Height */}
        <div className="border-[2px] border-ink bg-white p-3.5 flex flex-col justify-between shadow-[2px_2px_0_var(--ink)]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-ink-soft">
                PBL Mixing Height
              </span>
              <Layers className="h-4 w-4 text-ink-soft" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-3xl font-black text-ink">
                {weather.pblMixingHeightM}
              </span>
              <span className="text-xs font-mono font-bold text-ink-soft">m AGL</span>
            </div>
          </div>
          <p className="mt-2 pt-2 border-t border-ink/10 text-[10px] text-ink-soft leading-tight">
            Atmospheric &ldquo;lid&rdquo; ceiling. Lower mixing height traps surface emissions near ground level.
          </p>
        </div>

        {/* Indicator 2: Thermal Inversion Status */}
        <div className="border-[2px] border-ink bg-white p-3.5 flex flex-col justify-between shadow-[2px_2px_0_var(--ink)]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-ink-soft">
                Thermal Inversion
              </span>
              <ThermometerSnowflake className="h-4 w-4 text-coral" />
            </div>
            <div className="mt-2 font-mono text-sm font-black text-danger leading-snug">
              {weather.thermalInversionStatus}
            </div>
          </div>
          <p className="mt-2 pt-2 border-t border-ink/10 text-[10px] text-ink-soft leading-tight">
            Δ surface / 850 hPa temp. Warmer air aloft acts as an impenetrable cap preventing vertical dispersion.
          </p>
        </div>

        {/* Indicator 3: Wind Vector Heading */}
        <div className="border-[2px] border-ink bg-white p-3.5 flex flex-col justify-between shadow-[2px_2px_0_var(--ink)]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-ink-soft">
                Wind Vector Heading
              </span>
              <Compass className="h-4 w-4 text-sun" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-black text-ink">
                {weather.windDirectionDeg}°
              </span>
              <span className="text-xs font-mono font-bold text-ink-soft">
                ({weather.windDirectionLabel}) · {weather.windSpeedKmH} km/h
              </span>
            </div>
          </div>
          <p className="mt-2 pt-2 border-t border-ink/10 text-[10px] text-ink-soft leading-tight">
            Identifies upwind source corridors (Northwest trajectory brings stubble & peripheral kiln plumes).
          </p>
        </div>

        {/* Indicator 4: Vertical Dispersion Index */}
        <div className="border-[2px] border-ink bg-white p-3.5 flex flex-col justify-between shadow-[2px_2px_0_var(--ink)]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-ink-soft">
                Dispersion Index
              </span>
              <Gauge className="h-4 w-4 text-violet" />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-3xl font-black text-ink">
                {weather.verticalDispersionIndex}/100
              </span>
              <span className={`px-2 py-0.5 text-[9px] font-black uppercase border border-ink ${ratingColor}`}>
                {weather.verticalDispersionRating.replace('_', ' ')}
              </span>
            </div>
          </div>
          <p className="mt-2 pt-2 border-t border-ink/10 text-[10px] text-ink-soft leading-tight">
            Atmosphere&apos;s current self-cleaning capacity computed from PBL height × wind velocity × relative humidity.
          </p>
        </div>
      </div>

      {/* Streamline Wind Flow Canvas Strip */}
      <div className="mt-4 relative h-20 w-full overflow-hidden rounded border-[2px] border-ink bg-night">
        <canvas
          ref={canvasRef}
          width={760}
          height={80}
          className="h-full w-full object-cover select-none"
        />
        <div className="absolute top-2 left-3 flex items-center gap-2 bg-night/85 px-2 py-0.5 border border-white/20 pointer-events-none">
          <Wind className="h-3.5 w-3.5 text-sun animate-pulse" />
          <span className="font-mono text-[10px] font-black text-white">
            LIVE PARTICLE STREAMLINES: <span className="text-sun">ALIGNED WITH {weather.windDirectionLabel} WIND ({weather.windSpeedKmH} KM/H)</span>
          </span>
        </div>
        <div className="absolute bottom-2 right-3 font-mono text-[9px] font-bold text-white bg-night/85 px-2 py-0.5 border border-white/20 pointer-events-none">
          CONVECTIVE ADVECTION VECTOR
        </div>
      </div>
    </div>
  );
};
