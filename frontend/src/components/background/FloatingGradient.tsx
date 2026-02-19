'use client';

import { motion } from 'framer-motion';

export function FloatingGradient() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Top-right blob */}
      <motion.div
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-25 dark:opacity-[0.18]"
        style={{ background: 'radial-gradient(circle, #feba01 0%, transparent 70%)' }}
        animate={{ x: [0, 30, -20, 0], y: [0, -50, 20, 0], scale: [1, 1.1, 0.9, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Bottom-left blob */}
      <motion.div
        className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-25 dark:opacity-[0.18]"
        style={{ background: 'radial-gradient(circle, #feba01 0%, transparent 70%)' }}
        animate={{ x: [0, -30, 20, 0], y: [0, 50, -20, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
