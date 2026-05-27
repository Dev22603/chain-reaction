"use client";

import { motion } from "framer-motion";

interface ExplosionBloomProps {
  color: string;
}

const PARTICLE_COUNT = 8;

const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const angle = (i * Math.PI * 2) / PARTICLE_COUNT;
  const distance = i % 2 === 0 ? 42 : 32;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    delay: i * 0.008
  };
});

export function ExplosionBloom({ color }: ExplosionBloomProps) {
  return (
    <span className="pointer-events-none absolute inset-0 z-10 grid place-items-center" aria-hidden="true">
      {[0, 1].map((ring) => (
        <motion.span
          key={ring}
          className="absolute h-full w-full rounded-full border-2"
          style={{ borderColor: color, boxShadow: `0 0 24px ${color}` }}
          initial={{ scale: 0.18, opacity: 0.7, borderWidth: 4 }}
          animate={{ scale: 2.25 + ring * 0.28, opacity: 0, borderWidth: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.72,
            delay: ring * 0.055,
            ease: [0.16, 0.84, 0.32, 1]
          }}
        />
      ))}
      {PARTICLES.map((particle, i) => (
        <motion.span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ x: particle.x, y: particle.y, scale: 0, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 170,
            damping: 24,
            mass: 0.42,
            delay: particle.delay
          }}
        />
      ))}
    </span>
  );
}
