// app/page.tsx
import AiroiCalculator from '@/components/AiroiCalculator';

export const metadata = {
  title: 'AI ROI Playground',     // ← this drives the tab text
  description: 'Interactive AI ROI calculator for banks',
};

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <AiroiCalculator />
    </main>
  );
}
