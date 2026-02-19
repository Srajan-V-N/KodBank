'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/lib/axios';
import { toast } from 'sonner';

export function Navbar() {
  const { logout } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Continue with client-side logout even if server call fails
    }
    logout();
    router.replace('/login');
    toast.success('Logged out successfully');
  };

  return (
    <nav className="glass-card border-b sticky top-0 z-50">
      <div className="mx-auto px-6 max-w-7xl h-16 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setOpen((v) => !v)}
              className="w-9 h-9 rounded-full bg-muted border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Account menu"
            >
              <User className="w-4 h-4" />
            </motion.button>
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-40 glass-card border shadow-lg rounded-xl overflow-hidden"
                >
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-muted/60 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
}
