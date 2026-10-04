import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, FileText, Users, TrendingUp, Clock, Shield } from 'lucide-react';

export function Hero() {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-3xl -z-10" />

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary border border-primary/20">
            <Sparkles className="h-4 w-4" />
            <span>Powered by Claude AI</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Smart Question Paper
            <br />
            <span className="text-primary">Generator</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create perfectly balanced exam papers in minutes. Faculty upload notes, AI generates questions, you customize and export to PDF.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth/register">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold">AI Question Generation</p>
                <p className="text-sm text-muted-foreground">From notes to questions</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Smart Constraints</p>
                <p className="text-sm text-muted-foreground">Balanced difficulty & coverage</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Export Ready</p>
                <p className="text-sm text-muted-foreground">PDF & Word with answer keys</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}