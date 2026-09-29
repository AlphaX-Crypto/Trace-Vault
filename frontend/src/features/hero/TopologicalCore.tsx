import React, { useEffect, useRef } from 'react';

interface TopologicalCoreProps {
  className?: string;
  isTransitioning?: boolean;
}

interface Node3D {
  x: number;
  y: number;
  z: number;
}

export const TopologicalCore: React.FC<TopologicalCoreProps> = ({
  className = '',
  isTransitioning = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio);
    let height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };
    window.addEventListener('resize', handleResize);

    // Cube / Ledger Lattice 3D coordinates
    const baseNodes: Node3D[] = [
      { x: -70, y: -70, z: -70 },
      { x: 70, y: -70, z: -70 },
      { x: 70, y: 70, z: -70 },
      { x: -70, y: 70, z: -70 },
      { x: -70, y: -70, z: 70 },
      { x: 70, y: -70, z: 70 },
      { x: 70, y: 70, z: 70 },
      { x: -70, y: 70, z: 70 },
      // Inner ledger core nodes
      { x: 0, y: -40, z: 0 },
      { x: 0, y: 40, z: 0 },
      { x: -40, y: 0, z: 0 },
      { x: 40, y: 0, z: 0 },
      { x: 0, y: 0, z: -40 },
      { x: 0, y: 0, z: 40 }
    ];

    const edges: [number, number][] = [
      // Outer cube
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
      // Cross ledger bridges
      [0, 8], [1, 8], [4, 8], [5, 8],
      [2, 9], [3, 9], [6, 9], [7, 9],
      [8, 10], [8, 11], [9, 10], [9, 11],
      [12, 13]
    ];

    // Micro coordinate dust particles
    const dustParticles: { x: number; y: number; z: number; speed: number }[] = [];
    for (let i = 0; i < 45; i++) {
      dustParticles.push({
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400,
        z: (Math.random() - 0.5) * 400,
        speed: 0.2 + Math.random() * 0.3
      });
    }

    let angleX = 0.35;
    let angleY = 0.45;
    const fov = 350;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const scaleMultiplier = (width / 800) * (isTransitioning ? 1.6 : 1.0);

      // Subtle atmospheric core radial glow
      const glowGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 240 * scaleMultiplier);
      glowGrad.addColorStop(0, 'rgba(36, 199, 201, 0.08)');
      glowGrad.addColorStop(0.5, 'rgba(36, 199, 201, 0.02)');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 240 * scaleMultiplier, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric coordinate rings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 180 * scaleMultiplier, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.setLineDash([4, 8]);
      ctx.arc(cx, cy, 260 * scaleMultiplier, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Rotate slowly and smoothly
      angleY += 0.003;
      angleX += 0.001;

      // Project 3D to 2D
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      const projected = baseNodes.map((node) => {
        // Y rotation
        let x1 = node.x * cosY + node.z * sinY;
        let z1 = -node.x * sinY + node.z * cosY;
        // X rotation
        let y2 = node.y * cosX - z1 * sinX;
        let z2 = node.y * sinX + z1 * cosX;

        const distance = fov / (fov + z2);
        return {
          x: cx + x1 * distance * scaleMultiplier,
          y: cy + y2 * distance * scaleMultiplier,
          z: z2,
          alpha: Math.max(0.15, Math.min(0.85, (z2 + 100) / 200))
        };
      });

      // Render coordinate dust particles
      dustParticles.forEach((p) => {
        p.z -= p.speed;
        if (p.z < -200) p.z = 200;

        let px1 = p.x * cosY + p.z * sinY;
        let pz1 = -p.x * sinY + p.z * cosY;
        let py2 = p.y * cosX - pz1 * sinX;
        let pz2 = p.y * sinX + pz1 * cosX;

        const dist = fov / (fov + pz2);
        const screenX = cx + px1 * dist * scaleMultiplier;
        const screenY = cy + py2 * dist * scaleMultiplier;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.fillRect(screenX, screenY, 1, 1);
      });

      // Render edges
      edges.forEach(([i, j]) => {
        const p1 = projected[i];
        const p2 = projected[j];
        if (!p1 || !p2) return;

        const edgeAlpha = Math.min(p1.alpha, p2.alpha) * 0.45;
        ctx.strokeStyle = `rgba(36, 199, 201, ${edgeAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      // Render vertices
      projected.forEach((p, idx) => {
        const isCore = idx >= 8;
        const radius = (isCore ? 2.5 : 2) * scaleMultiplier;
        
        ctx.fillStyle = isCore 
          ? `rgba(245, 158, 11, ${p.alpha * 0.9})` 
          : `rgba(255, 255, 255, ${p.alpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle cross-hair on selected outer vertices
        if (idx === 1 || idx === 6) {
          ctx.strokeStyle = 'rgba(36, 199, 201, 0.3)';
          ctx.beginPath();
          ctx.moveTo(p.x - 4, p.y);
          ctx.lineTo(p.x + 4, p.y);
          ctx.moveTo(p.x, p.y - 4);
          ctx.lineTo(p.x, p.y + 4);
          ctx.stroke();
        }
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isTransitioning]);

  return (
    <div className={`relative pointer-events-none select-none ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};
