'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const dotVariants = {
  bounce: (i: number) => ({
    y: [0, -6, 0],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      delay: i * 0.15,
      ease: 'easeInOut',
    },
  }),
};

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25 }}
      className="flex items-start gap-3"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center mt-1">
        <Sparkles className="w-4 h-4 text-brand" />
      </div>

      {/* Dots */}
      <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            custom={i}
            variants={dotVariants}
            animate="bounce"
            className="block w-2 h-2 rounded-full bg-muted-foreground/50"
          />
        ))}
      </div>
    </motion.div>
  );
}
