import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export function AtmosphericCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 200);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle pool for atmospheric wind flow animation
    const particleCount = 45;
    const particles: Particle[] = [];

    const createParticle = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0.6 + Math.random() * 1.2, // Prevailing WNW -> ESE wind vector
      vy: (Math.random() - 0.5) * 0.3,
      length: 15 + Math.random() * 35,
      alpha: 0.15 + Math.random() * 0.3,
      life: 0,
      maxLife: 150 + Math.random() * 200,
    });

    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle());
    }

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Static background render for accessibility
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.fillRect(0, 0, width, height);
      return () => window.removeEventListener('resize', handleResize);
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle atmospheric gradient overlay
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.03)');
      gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.02)');
      gradient.addColorStop(1, 'rgba(124, 58, 237, 0.03)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw wind vector streamlines
      particles.forEach((p) => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x > width || p.life > p.maxLife) {
          p.x = -p.length;
          p.y = Math.random() * height;
          p.life = 0;
        }

        const headX = p.x;
        const headY = p.y;
        const tailX = p.x - p.length;
        const tailY = p.y - p.vy * 10;

        const lineGradient = ctx.createLinearGradient(tailX, tailY, headX, headY);
        lineGradient.addColorStop(0, 'rgba(56, 189, 248, 0)');
        lineGradient.addColorStop(1, `rgba(56, 189, 248, ${p.alpha})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 1.2;
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
  }, []);

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
        opacity: 0.85,
      }}
      aria-hidden="true"
    />
  );
}
