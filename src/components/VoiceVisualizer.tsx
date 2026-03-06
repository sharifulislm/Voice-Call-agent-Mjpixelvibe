import React from 'react';
import { motion } from 'motion/react';

interface VoiceVisualizerProps {
  isActive: boolean;
  level: number;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ isActive, level }) => {
  const bars = Array.from({ length: 20 });
  
  return (
    <div className="flex items-center justify-center gap-1 h-24">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 bg-emerald-400 rounded-full"
          animate={{
            height: isActive ? [20, Math.max(20, level * 200 * (1 + Math.sin(i * 0.5))), 20] : 4,
            opacity: isActive ? 1 : 0.3,
          }}
          transition={{
            duration: 0.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
