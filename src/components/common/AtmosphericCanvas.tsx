import { useEffect, useRef } from 'react';
import { useAerisStore } from '@/store/aerisStore';

interface StreamlineParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
  life: number;
  maxLife: number;
  size: number;
}

/**
 * AtmosphericCanvas
 *
 * Real-time atmospheric field particle canvas rendering spatial wind streamlines
 * and ambient particulate dispersion vectors grounded in selected station telemetry.
 *
 * Illustrative particle overlay — explicitly labeled in HUD.
 */
export function AtmosphericCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { currentReadings, selectedStationId } = useAerisStore();

  const activeTelemetry = currentReadings.find((r) => r.stationId === selectedStationId) || currentReadings[0];
  const windSpeed = activeTelemetry?.weather.windSpeedKmH ?? 14.2;
  const windDeg = activeTelemetry?.weather.windDirectionDeg ?? 295; // default WNW

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Calculate base velocity components from windDeg (meteorological angle: direction wind is coming FROM)
    // Map angle to vector direction
    const rad = ((windDeg - 180) * Math.PI) / 180;
    const speedMult = Math.min(Math.max(windSpeed / 10, 0.6), 2.2);
    const baseVx = Math.cos(rad) * speedMult;
    const baseVy = Math.sin(rad) * speedMult;

    const particleCount = 60;
    const particles: StreamlineParticle[] = [];

    const createParticle = (): StreamlineParticle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: baseVx + (Math.random() - 0.5) * 0.3,
      vy: baseVy + (Math.random() - 0.5) * 0.3,
      length: 20 + Math.random() * 40,
      alpha: 0.12 + Math.random() * 0.28,
      life: Math.random() * 100,
      maxLife: 160 + Math.random() * 180,
      size: 1 + Math.random() * 1.5,
    });

    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle());
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      ctx.fillStyle = 'rgba(8, 12, 20, 0.5)';
      ctx.fillRect(0, 0, width, height);
      return () => window.removeEventListener('resize', handleResize);
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Atmospheric spatial gradient field
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(14, 165, 233, 0.035)');
      gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.025)');
      gradient.addColorStop(1, 'rgba(124, 58, 237, 0.035)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Render streamlines
      particles.forEach((p) => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -50 || p.x > width + 50 || p.y < -50 || p.y > height + 50 || p.life > p.maxLife) {
          p.x = baseVx > 0 ? -20 : width + 20;
          p.y = Math.random() * height;
          p.life = 0;
        }

        const headX = p.x;
        const headY = p.y;
        const tailX = p.x - p.vx * (p.length / 2);
        const tailY = p.y - p.vy * (p.length / 2);

        const lineGradient = ctx.createLinearGradient(tailX, tailY, headX, headY);
        lineGradient.addColorStop(0, 'rgba(56, 189, 248, 0)');
        lineGradient.addColorStop(1, `rgba(56, 189, 248, ${p.alpha})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [windSpeed, windDeg]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.9,
      }}
      aria-hidden="true"
    />
  );
}
