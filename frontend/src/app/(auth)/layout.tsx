import { FloatingGradient } from '@/components/background/FloatingGradient';
import { ParticleCanvas } from '@/components/background/ParticleCanvas';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      <FloatingGradient />
      <ParticleCanvas />
      <div className="relative z-10 w-full max-w-md px-4 py-8">{children}</div>
    </div>
  );
}
