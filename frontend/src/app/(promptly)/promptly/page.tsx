'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { PromptlySidebar } from '@/components/promptly/PromptlySidebar';
import { PromptlyChat } from '@/components/promptly/PromptlyChat';

export default function PromptlyPage() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, _hasHydrated, router]);

  if (!_hasHydrated) return null;
  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden relative z-10">
      <PromptlySidebar />
      <PromptlyChat />
    </div>
  );
}
