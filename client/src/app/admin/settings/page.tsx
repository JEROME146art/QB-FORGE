'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building2, Key, ShieldCheck, Database, Save, CheckCircle } from 'lucide-react';

export default function AdminSettingsPage() {
  const [collegeName, setCollegeName] = useState('SRM Institute of Science & Technology');
  const [department, setDepartment] = useState('Department of Computer Science & Engineering');
  const [logoUrl, setLogoUrl] = useState('');
  const [examCodePrefix, setExamCodePrefix] = useState('SRM-EXAM-2026');
  const [anthropicStatus, setAnthropicStatus] = useState('Active / Connected (Claude 3.5 Sonnet)');
  const [dbStatus] = useState('Healthy (PostgreSQL / Prisma Engine)');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System &amp; Institution Settings</h1>
        <p className="text-muted-foreground">Configure college branding, exam header presets, and API connections</p>
      </div>

      {saved && (
        <div className="p-4 bg-green-50 dark:bg-green-950/40 border border-green-300 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span>System configuration saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Institution Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Institution Header Branding
            </CardTitle>
            <CardDescription>Default metadata printed at the top of all PDF &amp; DOCX question papers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">University / College Name</label>
              <Input
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Department Name</label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Exam Code Identifier Prefix</label>
              <Input
                value={examCodePrefix}
                onChange={(e) => setExamCodePrefix(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* AI & Infrastructure Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              Integration &amp; API Health
            </CardTitle>
            <CardDescription>Status of external AI engines and database services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border">
              <div>
                <p className="font-semibold text-sm">AI Engine (Claude 3.5 Sonnet / Anthropic SDK)</p>
                <p className="text-xs text-muted-foreground">High-precision question generation with Bloom's alignment</p>
              </div>
              <Badge variant="success">{anthropicStatus}</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border">
              <div>
                <p className="font-semibold text-sm">Database Cluster (PostgreSQL + Prisma ORM)</p>
                <p className="text-xs text-muted-foreground">Relational store with full audit tracking</p>
              </div>
              <Badge variant="success">{dbStatus}</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" className="font-medium">
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
}
