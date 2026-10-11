import React, { useRef, useEffect, useState, useCallback } from 'react';
import { StationReading, UserLens } from '../types';
import { STATIONS_MAP } from '../data/stationsData';
import { Globe, Radar, RotateCw, Compass, MapPin, Radio, Eye } from 'lucide-react';

interface HeroDynamicGlobeProps {
  selectedStation: StationReading;
  allStations: StationReading[];
  onSelectStation: (stationId: string) => void;
  activeLens: UserLens;
}

// Simplified continent landmass seed points (lat, lng in degrees) for high-tech dot matrix globe
const LANDMASS_POINTS: [number, number][] = [
  // India & South Asia (dense points)
  [28.6, 77.2], [28.0, 77.0], [27.0, 78.0], [26.0, 80.0], [25.5, 85.0], [24.0, 88.0],
  [22.5, 88.3], [19.0, 72.8], [13.0, 80.2], [12.9, 77.6], [17.3, 78.4], [23.0, 72.5],
  [26.9, 75.8], [31.5, 74.3], [33.7, 73.0], [24.8, 67.0], [31.1, 77.1], [34.0, 74.8],
  [27.7, 85.3], [23.8, 90.4], [7.8, 80.7], [20.5, 78.9], [15.3, 75.1], [10.8, 76.2],
  // East Asia & SE Asia
  [39.9, 116.4], [31.2, 121.4], [23.1, 113.2], [30.5, 114.3], [35.8, 104.1], [34.3, 108.9],
  [35.6, 139.6], [37.5, 126.9], [13.7, 100.5], [10.8, 106.6], [1.3, 103.8], [-6.2, 106.8],
  [14.5, 120.9], [22.3, 114.1], [25.0, 121.5], [47.9, 106.9],
  // Central & Middle East
  [25.2, 55.2], [24.7, 46.6], [29.3, 47.9], [32.4, 53.6], [35.6, 51.3], [33.3, 44.3],
  [41.0, 28.9], [39.9, 32.8], [31.7, 35.2], [41.7, 44.8], [40.4, 49.8], [41.2, 69.2],
  // Europe
  [48.8, 2.3], [51.5, -0.1], [52.5, 13.4], [41.9, 12.5], [40.4, -3.7], [38.7, -9.1],
  [55.7, 37.6], [59.9, 30.3], [59.3, 18.0], [52.2, 21.0], [50.0, 14.4], [47.4, 19.0],
  [48.2, 16.3], [44.4, 26.1], [37.9, 23.7],
  // Africa
  [30.0, 31.2], [33.5, -7.5], [36.8, 10.1], [14.6, -17.4], [9.0, 7.4], [6.5, 3.3],
  [0.3, 32.5], [-1.2, 36.8], [-4.4, 15.2], [-8.8, 13.2], [-15.4, 28.2], [-26.2, 28.0],
  [-33.9, 18.4], [-18.9, 47.5],
  // Australia & Oceania
  [-33.8, 151.2], [-37.8, 144.9], [-27.4, 153.0], [-31.9, 115.8], [-12.4, 130.8],
  [-36.8, 174.7], [-41.2, 174.7],
  // Americas
  [40.7, -74.0], [34.0, -118.2], [41.8, -87.6], [29.7, -95.3], [37.7, -122.4], [47.6, -122.3],
  [45.5, -73.5], [43.6, -79.3], [49.2, -123.1], [19.4, -99.1], [9.9, -84.0], [4.7, -74.0],
  [-12.0, -77.0], [-23.5, -46.6], [-22.9, -43.1], [-34.6, -58.3], [-33.4, -70.6]
];

export const HeroDynamicGlobe: React.FC<HeroDynamicGlobeProps> = ({
  selectedStation,
  allStations,
  onSelectStation,
  activeLens,
}) => {
  const [viewMode, setViewMode] = useState<'globe' | 'radar'>('globe');
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Globe rotation angles (radians)
  // Centered initially towards South Asia / Delhi (lat 28.6° N, lng 77.2° E)
  const rotationRef = useRef<{ x: number; y: number }>({
    x: 0.38, // tilt slightly down to look at Northern Hemisphere
    y: -1.35, // rotated towards India longitude ~77 deg
  });

  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const radarAngleRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);

  // Atmospheric smog particles around Delhi NCR
  const particlesRef = useRef<Array<{ x: number; y: number; z: number; size: number; speed: number; opacity: number }>>([]);

  useEffect(() => {
    // Generate smog particulate cloud
    const particles = [];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 80,
        y: (Math.random() - 0.5) * 80,
        z: Math.random() * 50,
        size: Math.random() * 2.5 + 1.2,
        speed: Math.random() * 0.02 + 0.008,
        opacity: Math.random() * 0.6 + 0.2,
      });
    }
    particlesRef.current = particles;
  }, []);

  // Main rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * 0.38;

      ctx.clearRect(0, 0, width, height);

      // Auto rotation when enabled and not dragging
      if (viewMode === 'globe') {
        if (isAutoRotate && !isDraggingRef.current) {
          rotationRef.current.y += 0.004; // slow orbit
        }
        renderGlobe(ctx, cx, cy, radius);
      } else {
        radarAngleRef.current = (radarAngleRef.current + 0.035) % (Math.PI * 2);
        renderRadar(ctx, cx, cy, radius);
      }

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    animationFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [viewMode, isAutoRotate, selectedStation, allStations]);

  // Render 3D Earth Globe
  const renderGlobe = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number
  ) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const rotX = rotationRef.current.x;
    const rotY = rotationRef.current.y;

    // 1. Outer Atmospheric Haze Ring
    const atmoGrad = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius * 1.25);
    atmoGrad.addColorStop(0, 'rgba(255, 196, 77, 0.08)');
    atmoGrad.addColorStop(0.6, 'rgba(255, 106, 61, 0.15)');
    atmoGrad.addColorStop(1, 'rgba(22, 17, 30, 0)');
    ctx.fillStyle = atmoGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.25, 0, Math.PI * 2);
    ctx.fill();

    // 2. Globe Sphere Base
    const sphereGrad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.1, cx, cy, radius);
    sphereGrad.addColorStop(0, '#221a30');
    sphereGrad.addColorStop(0.7, '#16111e');
    sphereGrad.addColorStop(1, '#0e0b13');
    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Globe Outline
    ctx.strokeStyle = '#5c5066';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. Draw Graticules (Latitude & Longitude grid lines)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip(); // clip to globe circle

    // Parallels (latitudes)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let lat = -60; lat <= 60; lat += 30) {
      const latRad = (lat * Math.PI) / 180;
      ctx.beginPath();
      let first = true;
      for (let lon = -180; lon <= 180; lon += 10) {
        const lonRad = (lon * Math.PI) / 180 + rotY;
        const x3d = radius * Math.cos(latRad) * Math.sin(lonRad);
        const y3d = -radius * Math.sin(latRad);
        const z3d = radius * Math.cos(latRad) * Math.cos(lonRad);

        // Rotate by rotX (pitch)
        const yRot = y3d * Math.cos(rotX) - z3d * Math.sin(rotX);
        const zRot = y3d * Math.sin(rotX) + z3d * Math.cos(rotX);

        if (zRot > 0) {
          const px = cx + x3d;
          const py = cy + yRot;
          if (first) {
            ctx.moveTo(px, py);
            first = false;
          } else {
            ctx.lineTo(px, py);
          }
        } else {
          first = true;
        }
      }
      ctx.stroke();
    }

    // Meridians (longitudes)
    for (let lon = -180; lon < 180; lon += 30) {
      ctx.beginPath();
      let first = true;
      for (let lat = -90; lat <= 90; lat += 6) {
        const latRad = (lat * Math.PI) / 180;
        const lonRad = (lon * Math.PI) / 180 + rotY;

        const x3d = radius * Math.cos(latRad) * Math.sin(lonRad);
        const y3d = -radius * Math.sin(latRad);
        const z3d = radius * Math.cos(latRad) * Math.cos(lonRad);

        const yRot = y3d * Math.cos(rotX) - z3d * Math.sin(rotX);
        const zRot = y3d * Math.sin(rotX) + z3d * Math.cos(rotX);

        if (zRot > 0) {
          const px = cx + x3d;
          const py = cy + yRot;
          if (first) {
            ctx.moveTo(px, py);
            first = false;
          } else {
            ctx.lineTo(px, py);
          }
        } else {
          first = true;
        }
      }
      ctx.stroke();
    }

    // 5. Draw Landmass Points (Continental dots)
    for (const [lat, lon] of LANDMASS_POINTS) {
      const latRad = (lat * Math.PI) / 180;
      const lonRad = (lon * Math.PI) / 180 + rotY;

      const x3d = radius * Math.cos(latRad) * Math.sin(lonRad);
      const y3d = -radius * Math.sin(latRad);
      const z3d = radius * Math.cos(latRad) * Math.cos(lonRad);

      const yRot = y3d * Math.cos(rotX) - z3d * Math.sin(rotX);
      const zRot = y3d * Math.sin(rotX) + z3d * Math.cos(rotX);

      if (zRot > 0) {
        const px = cx + x3d;
        const py = cy + yRot;
        const pointSize = Math.max(1, (zRot / radius) * 2.2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(px, py, pointSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 6. Draw Indo-Gangetic Smog Plume & Delhi NCR Target Node
    const delhiLat = 28.6469;
    const delhiLng = 77.316;
    const delhiLatRad = (delhiLat * Math.PI) / 180;
    const delhiLonRad = (delhiLng * Math.PI) / 180 + rotY;

    const dx3d = radius * Math.cos(delhiLatRad) * Math.sin(delhiLonRad);
    const dy3d = -radius * Math.sin(delhiLatRad);
    const dz3d = radius * Math.cos(delhiLatRad) * Math.cos(delhiLonRad);

    const dyRot = dy3d * Math.cos(rotX) - dz3d * Math.sin(rotX);
    const dzRot = dy3d * Math.sin(rotX) + dz3d * Math.cos(rotX);

    if (dzRot > 0) {
      const dpx = cx + dx3d;
      const dpy = cy + dyRot;

      // Smog haze plume over Northern India
      const plumeGrad = ctx.createRadialGradient(dpx, dpy, 4, dpx, dpy, 42);
      plumeGrad.addColorStop(0, 'rgba(239, 59, 75, 0.55)');
      plumeGrad.addColorStop(0.5, 'rgba(255, 106, 61, 0.35)');
      plumeGrad.addColorStop(1, 'rgba(255, 196, 77, 0)');
      ctx.fillStyle = plumeGrad;
      ctx.beginPath();
      ctx.arc(dpx, dpy, 42, 0, Math.PI * 2);
      ctx.fill();

      // Pulsating target beacon
      const pulseTime = (Date.now() % 1600) / 1600;
      ctx.strokeStyle = '#ef3b4b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(dpx, dpy, 6 + pulseTime * 16, 0, Math.PI * 2);
      ctx.stroke();

      // Pin center node
      ctx.fillStyle = '#ffc44d';
      ctx.beginPath();
      ctx.arc(dpx, dpy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1d1626';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Crosshair lines
      ctx.strokeStyle = 'rgba(255, 196, 77, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(dpx - 14, dpy);
      ctx.lineTo(dpx + 14, dpy);
      ctx.moveTo(dpx, dpy - 14);
      ctx.lineTo(dpx, dpy + 14);
      ctx.stroke();

      // Target Label
      ctx.restore(); // restore clip to draw label outside sphere if needed
      ctx.save();
      ctx.fillStyle = '#1d1626';
      ctx.strokeStyle = '#ffc44d';
      ctx.lineWidth = 2;
      const labelText = `DELHI NCR [AQI ${selectedStation.aqi.value}]`;
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      const textWidth = ctx.measureText(labelText).width;

      const lx = Math.min(width - textWidth - 14, Math.max(10, dpx + 16));
      const ly = Math.min(height - 14, Math.max(22, dpy - 14));

      ctx.fillStyle = 'rgba(22, 17, 30, 0.9)';
      ctx.fillRect(lx - 4, ly - 12, textWidth + 8, 16);
      ctx.strokeRect(lx - 4, ly - 12, textWidth + 8, 16);

      ctx.fillStyle = '#ffc44d';
      ctx.fillText(labelText, lx, ly);

      // Connecting indicator line
      ctx.strokeStyle = '#ffc44d';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(dpx, dpy);
      ctx.lineTo(lx - 4, ly - 4);
      ctx.stroke();
    } else {
      ctx.restore();
    }
  };

  // Render Dynamic Airshed Radar Map
  const renderRadar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number
  ) => {
    // 1. Radar background
    ctx.fillStyle = '#16111e';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Concentric Range Rings
    ctx.strokeStyle = 'rgba(47, 209, 143, 0.2)';
    ctx.lineWidth = 1;
    [0.33, 0.66, 1.0].forEach((scale, idx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius * scale, 0, Math.PI * 2);
      ctx.stroke();

      // Range text
      ctx.fillStyle = 'rgba(47, 209, 143, 0.5)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(`${(idx + 1) * 15}km`, cx + radius * scale - 26, cy - 4);
    });

    // 3. Radar Crosshairs
    ctx.strokeStyle = 'rgba(47, 209, 143, 0.18)';
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.stroke();

    // 4. Sweeping Radar Beam
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    const beamAngle = radarAngleRef.current;
    const sweepGrad = ctx.createConicGradient(beamAngle - Math.PI / 2, cx, cy);
    sweepGrad.addColorStop(0, 'rgba(47, 209, 143, 0)');
    sweepGrad.addColorStop(0.75, 'rgba(47, 209, 143, 0)');
    sweepGrad.addColorStop(0.95, 'rgba(47, 209, 143, 0.25)');
    sweepGrad.addColorStop(1, 'rgba(47, 209, 143, 0.55)');

    ctx.fillStyle = sweepGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Leading sweep line
    ctx.strokeStyle = '#2fd18f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(beamAngle) * radius, cy + Math.sin(beamAngle) * radius);
    ctx.stroke();
    ctx.restore();

    // 5. Dynamic Wind Flow Streamlines (NW wind)
    ctx.strokeStyle = 'rgba(255, 196, 77, 0.25)';
    ctx.lineWidth = 1.2;
    const timeOffset = (Date.now() / 25) % 80;
    for (let line = -radius; line <= radius; line += 35) {
      ctx.beginPath();
      const startX = cx - radius * 0.7 + line + timeOffset;
      const startY = cy - radius * 0.6 + line * 0.5 + timeOffset * 0.4;
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX + 24, startY + 12);
      ctx.stroke();
    }

    // 6. Stations as Interactive Radar Blips
    allStations.forEach((st) => {
      const meta = STATIONS_MAP.get(st.stationId);
      if (!meta) return;

      // Convert lat/lng to radar offset from center (28.63° N, 77.22° E)
      const latDelta = meta.coordinates.lat - 28.63;
      const lngDelta = meta.coordinates.lng - 77.22;
      const px = cx + lngDelta * (radius * 3.8);
      const py = cy - latDelta * (radius * 3.8);

      const isSelected = st.stationId === selectedStation.stationId;

      // Blip node
      ctx.fillStyle = st.aqi.categoryColor;
      ctx.beginPath();
      ctx.arc(px, py, isSelected ? 5.5 : 3.5, 0, Math.PI * 2);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.strokeStyle = st.aqi.categoryColor;
        ctx.beginPath();
        ctx.arc(px, py, 11, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Name & AQI tag
      ctx.fillStyle = isSelected ? '#ffc44d' : 'rgba(255, 255, 255, 0.85)';
      ctx.font = isSelected ? 'bold 10px "JetBrains Mono", monospace' : '9px "Outfit", sans-serif';
      ctx.fillText(meta.name.substring(0, 9), px + 7, py - 4);
    });

    // Radar border
    ctx.strokeStyle = '#2fd18f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  };

  // Mouse / Touch Drag Handlers for 3D Globe Rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || viewMode !== 'globe') return;
    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;

    rotationRef.current.y += deltaX * 0.008;
    rotationRef.current.x = Math.max(-1.2, Math.min(1.2, rotationRef.current.x + deltaY * 0.008));

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || viewMode !== 'globe' || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - lastMousePosRef.current.x;
    const deltaY = e.touches[0].clientY - lastMousePosRef.current.y;

    rotationRef.current.y += deltaX * 0.008;
    rotationRef.current.x = Math.max(-1.2, Math.min(1.2, rotationRef.current.x + deltaY * 0.008));

    lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const resetToDelhi = () => {
    rotationRef.current = { x: 0.38, y: -1.35 };
  };

  return (
    <div className="brutal-screen tilt-shadow-coral p-5 text-paper sm:p-6 flex flex-col justify-between">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b-[2px] border-paper/20 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-danger animate-pulse"></span>
          <span className="font-mono text-[11px] font-black uppercase tracking-[0.16em] text-sun">
            {viewMode === 'globe' ? 'PLANETARY AIRSHED 3D GLOBE' : 'DELHI NCR DYNAMIC AIRSHED RADAR'}
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center border-[1.5px] border-paper/30 bg-paper/5 p-0.5">
          <button
            onClick={() => setViewMode('globe')}
            className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition-all ${
              viewMode === 'globe'
                ? 'bg-sun text-ink shadow-[1px_1px_0_var(--coral)]'
                : 'text-paper/70 hover:text-paper'
            }`}
          >
            <Globe className="h-3 w-3" />
            <span>3D Earth</span>
          </button>
          <button
            onClick={() => setViewMode('radar')}
            className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition-all ${
              viewMode === 'radar'
                ? 'bg-mint text-ink shadow-[1px_1px_0_var(--coral)]'
                : 'text-paper/70 hover:text-paper'
            }`}
          >
            <Radar className="h-3 w-3" />
            <span>NCR Radar</span>
          </button>
        </div>
      </div>

      {/* Canvas Display Area */}
      <div className="relative mt-3 h-[290px] w-full flex items-center justify-center overflow-hidden bg-night/80 rounded border-[2px] border-paper/15 cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          width={440}
          height={290}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          className="h-full w-full object-contain select-none"
        />

        {/* Interactive Overlay Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 pointer-events-none">
          <span className="border-[1.5px] border-sun/60 bg-night/90 px-2 py-0.5 font-mono text-[9px] font-black text-sun">
            TARGET: 28.6469° N, 77.3160° E
          </span>
          <span className="border-[1.5px] border-paper/40 bg-night/90 px-2 py-0.5 font-mono text-[9px] text-mint">
            AIRSHED DISPERSION: {selectedStation.weather.windSpeedKmH} KM/H {selectedStation.weather.windDirectionLabel}
          </span>
        </div>

        {/* Controls Overlay (Top Right) */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          {viewMode === 'globe' && (
            <>
              <button
                onClick={() => setIsAutoRotate(!isAutoRotate)}
                className={`border-[1.5px] border-paper/40 px-2 py-0.5 font-mono text-[9px] font-bold uppercase transition-colors cursor-pointer ${
                  isAutoRotate ? 'bg-sun text-ink' : 'bg-night/90 text-paper hover:bg-paper/20'
                }`}
                title="Toggle Auto Rotation"
              >
                Auto-Orbit: {isAutoRotate ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={resetToDelhi}
                className="border-[1.5px] border-paper/40 bg-night/90 p-1 text-paper hover:bg-paper/20 transition-colors cursor-pointer"
                title="Reset Camera to Delhi NCR"
              >
                <RotateCw className="h-3 w-3" />
              </button>
            </>
          )}
        </div>

        {/* Drag Hint on Bottom */}
        <div className="absolute bottom-2 left-2 text-[9px] font-mono text-paper/50 flex items-center gap-1 pointer-events-none">
          <span>{viewMode === 'globe' ? 'Drag globe to rotate 3D view' : 'Live 360° CAAQMS sweeping radar'}</span>
        </div>
      </div>

      {/* Hero Station Data Ribbon */}
      <div className="mt-4 grid grid-cols-2 gap-3 border-[2px] border-paper/20 bg-paper/5 p-3">
        <div>
          <div className="flex items-center justify-between text-[10px] font-black uppercase text-paper/70">
            <span>Focused Station</span>
            <span className="font-mono text-sun">{selectedStation.stationId.replace('DELHI_', '')}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-black font-display text-paper">
              {selectedStation.aqi.value}
            </span>
            <span
              className="border-[1.5px] border-ink px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider text-ink"
              style={{ backgroundColor: selectedStation.aqi.categoryColor }}
            >
              {selectedStation.aqi.category.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="border-l border-paper/15 pl-3 flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-paper/70">
            Dominant Driver
          </span>
          <div className="text-xs font-mono font-bold text-sun uppercase">
            {selectedStation.aqi.primaryPollutant}: {selectedStation.pollutants.pm25} µg/m³
          </div>
          <div className="text-[9px] font-mono text-paper/60">
            Temp: {selectedStation.weather.temperatureCelsius}°C · RH: {selectedStation.weather.relativeHumidityPct}%
          </div>
        </div>
      </div>

      {/* Quick Station Switcher Pills */}
      <div className="mt-3">
        <span className="block text-[9px] font-mono font-black uppercase text-paper/50 mb-1.5">
          Select Station Node:
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {allStations.map((st) => {
            const isSelected = st.stationId === selectedStation.stationId;
            return (
              <button
                key={st.stationId}
                onClick={() => onSelectStation(st.stationId)}
                className={`border-[1.5px] p-1.5 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-sun bg-sun text-ink font-black shadow-[2px_2px_0_var(--coral)]'
                    : 'border-paper/25 bg-paper/5 text-paper/80 hover:border-paper/50 hover:bg-paper/10'
                }`}
              >
                <div className="truncate text-[9px] uppercase font-bold">
                  {st.stationId.replace('DELHI_', '').substring(0, 7)}
                </div>
                <div className="font-mono text-[10px] mt-0.5">
                  AQI {st.aqi.value}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
