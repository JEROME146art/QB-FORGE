import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Upload, Settings, Download, Users, BarChart3, Shield, Clock } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Question Generation',
    description: 'Upload notes in any format (PDF, DOCX, PPTX) and let Claude AI generate balanced questions with proper difficulty and Bloom\'s distribution.',
    color: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: Upload,
    title: 'Smart Question Bank',
    description: 'Organize questions by units, difficulty levels, Bloom\'s taxonomy, and course outcomes. Bulk import with error reporting.',
    color: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    icon: Settings,
    title: 'Flexible Blueprint System',
    description: 'Choose from preset templates (Semester Exam, CAT) or build custom blueprints with precise constraints for units, difficulty, and coverage.',
    color: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    icon: Download,
    title: 'Professional Export',
    description: 'Generate print-ready PDF/DOCX papers with college headers, answer keys, and marking schemes in seconds.',
    color: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    icon: Users,
    title: 'Role-Based Access',
    description: 'Seamless workflow for Admins (user management), Faculty (question management), and Students (practice tests).',
    color: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track question usage, syllabus coverage, student performance, and generate insights with interactive charts.',
    color: 'bg-indigo-100 dark:bg-indigo-900/30',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'JWT authentication, role-based access control, audit logging, and secure file uploads with validation.',
    color: 'bg-cyan-100 dark:bg-cyan-900/30',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    icon: Clock,
    title: 'Time-Efficient Workflow',
    description: 'Multi-step wizards guide you through paper generation. Drag-and-drop reordering and instant previews save hours.',
    color: 'bg-pink-100 dark:bg-pink-900/30',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
];

export function Features() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create professional, balanced question papers quickly and efficiently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`h-12 w-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}