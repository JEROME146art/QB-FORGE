import { Card, CardContent } from '@/components/ui/card';
import { Users, Upload, Settings, Download } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Create Account & Setup',
    description: 'Register as faculty or admin. Set up your department, subjects, and academic structure.',
    icon: Users,
  },
  {
    number: 2,
    title: 'Upload Notes & Generate Questions',
    description: 'Upload course materials (PDF, DOCX, PPTX). AI extracts content and generates balanced questions based on your requirements.',
    icon: Upload,
  },
  {
    number: 3,
    title: 'Review & Customize',
    description: 'Review generated questions, approve them, and customize the paper blueprint with difficulty levels, unit coverage, and marking schemes.',
    icon: Settings,
  },
  {
    number: 4,
    title: 'Generate & Export',
    description: 'Create multiple paper sets (A, B, C) with balanced difficulty. Export to PDF or DOCX with professional formatting.',
    icon: Download,
  },
];

export function HowItWorks() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From a single note to a complete exam paper in just 4 simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.number} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 font-bold">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-lg text-muted-foreground mb-4">Ready to get started?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Start Free Trial
            </button>
            <button className="px-8 py-3 border border-input rounded-lg font-medium hover:bg-accent transition-colors">
              View Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}