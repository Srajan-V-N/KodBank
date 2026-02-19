'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { PageTransition } from '@/components/common/PageTransition';
import { FloatingGradient } from '@/components/background/FloatingGradient';

export default function DashboardPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <PageTransition>
      <div className="relative">
        <FloatingGradient />
        <div className="relative z-10 space-y-6">
          <WelcomeCard />
          <BalanceCard />
        </div>
      </div>
    </PageTransition>
  );
}
