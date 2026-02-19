'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useThemeStore } from '@/stores/themeStore';

export function Logo() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-0.5 select-none">
      <Image src="/K-logo.png" alt="KodBank" width={32} height={32} />
      <motion.span
        animate={{ color: isDark ? '#ffffff' : '#111111' }}
        transition={{ duration: 0.3 }}
        className="text-xl font-bold tracking-tight"
        style={{ fontFamily: 'var(--font-poppins)', letterSpacing: '-0.02em' }}
      >
        odBank
      </motion.span>
    </div>
  );
}
