import { FloatingGradient } from '@/components/background/FloatingGradient';

export default function PromptlyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <FloatingGradient />
      {children}
    </div>
  );
}
