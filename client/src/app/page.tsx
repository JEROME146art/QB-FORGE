import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { SamplePaper } from '@/components/landing/SamplePaper';

export default function Page() {
  return (
    <main className="flex-1">
      <Hero />
      <Features />
      <HowItWorks />
      <SamplePaper />
    </main>
  );
}