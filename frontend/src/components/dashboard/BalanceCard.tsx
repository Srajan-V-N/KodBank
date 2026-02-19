'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { useBalance } from '@/hooks/useBalance';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

export function BalanceCard() {
  const { currency, isLoading, fetchBalance } = useBalance();
  const [displayBalance, setDisplayBalance] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const { animate } = useAnimatedCounter();

  const handleCheckBalance = async () => {
    const amount = await fetchBalance();
    if (amount === null) {
      toast.error('Failed to fetch balance');
      return;
    }

    setIsRevealed(true);

    animate(0, amount, 2000, (value) => {
      setDisplayBalance(value);
    }, () => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#feba01', '#fff9e6', '#cb9501', '#ffffff', '#ffe799'],
      });
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      {/* Card header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h3 className="font-semibold" style={{ fontFamily: 'var(--font-space)' }}>
            Account Balance
          </h3>
          <p className="text-xs text-muted-foreground">Your current available balance</p>
        </div>
      </div>

      {/* Balance display */}
      <AnimatePresence mode="wait">
        {isRevealed && displayBalance !== null ? (
          <motion.div
            key="balance"
            initial={{ opacity: 0, filter: 'blur(12px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(12px)' }}
            transition={{ duration: 0.5 }}
            className="text-center py-4"
          >
            <p
              className="text-4xl font-bold text-brand tabular-nums"
              style={{ fontFamily: 'var(--font-space)' }}
            >
              {formatCurrency(displayBalance)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{currency} Savings Account</p>
          </motion.div>
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-4"
          >
            <p
              className="text-4xl font-bold text-muted-foreground/30"
              style={{ fontFamily: 'var(--font-space)' }}
            >
              ₹ ••••••
            </p>
            <p className="text-xs text-muted-foreground mt-2">Balance hidden — click below to reveal</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA button */}
      <motion.button
        onClick={handleCheckBalance}
        disabled={isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 rounded-xl bg-brand text-zinc-900 font-semibold flex items-center justify-center gap-2 hover:bg-brand-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Wallet className="w-4 h-4" />
        )}
        {isLoading ? 'Fetching…' : isRevealed ? 'Refresh Balance' : 'Check Balance'}
      </motion.button>
    </div>
  );
}
