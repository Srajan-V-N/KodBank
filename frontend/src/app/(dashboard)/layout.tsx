import { Navbar } from '@/components/common/Navbar';
import { FloatingGradient } from '@/components/background/FloatingGradient';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden min-h-screen bg-background">
      <FloatingGradient />
      <Navbar />
      <main className="relative z-10 mx-auto px-6 py-8 max-w-7xl">{children}</main>
    </div>
  );
}
