'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Layers, Plus, Trash2, Edit, Sparkles, Clock, BookOpen, CheckCircle } from 'lucide-react';

interface BlueprintSection {
  name: string;
  order: number;
  numQuestions: number;
  marksPerQuestion: number;
  questionType?: string;
  difficulty?: string;
  bloomLevel?: string;
}

interface Blueprint {
  id: string;
  name: string;
  type: string;
  totalMarks: number;
  duration: number;
  subject?: { code: string; name: string };
  sections: BlueprintSection[];
  createdAt: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
}

export default function BlueprintsPage() {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Form state for creating custom blueprint
  const [name, setName] = useState('');
  const [type, setType] = useState('CUSTOM');
  const [subjectId, setSubjectId] = useState('');
  const [totalMarks, setTotalMarks] = useState(100);
  const [duration, setDuration] = useState(180);
  const [sections, setSections] = useState<BlueprintSection[]>([
    { name: 'Part A - Objective / Short', order: 1, numQuestions: 10, marksPerQuestion: 2, questionType: 'SHORT_ANSWER' },
    { name: 'Part B - Analytical Problems', order: 2, numQuestions: 5, marksPerQuestion: 13, questionType: 'LONG_ANSWER' },
    { name: 'Part C - Comprehensive Case Study', order: 3, numQuestions: 1, marksPerQuestion: 15, questionType: 'CASE_STUDY' },
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bpRes, subRes] = await Promise.all([
        api('/blueprints'),
        api('/subjects'),
      ]);
      setBlueprints(bpRes.data || []);
      setSubjects(subRes.data || []);
      if (subRes.data && subRes.data.length > 0) {
        setSubjectId(subRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch blueprints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/blueprints', {
        method: 'POST',
        body: JSON.stringify({
          name,
          type,
          subjectId,
          totalMarks: Number(totalMarks),
          duration: Number(duration),
          sections: sections.map((s, idx) => ({
            ...s,
            order: idx + 1,
            numQuestions: Number(s.numQuestions),
            marksPerQuestion: Number(s.marksPerQuestion),
          })),
        }),
      });

      setCreateDialogOpen(false);
      setName('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create blueprint');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blueprint?')) return;
    try {
      await api(`/blueprints/${id}`, { method: 'DELETE' });
      setBlueprints(blueprints.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Failed to delete blueprint:', err);
    }
  };

  const updateSection = (index: number, field: keyof BlueprintSection, value: any) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);

    // Auto-calculate total marks
    const calcMarks = updated.reduce((sum, s) => sum + (Number(s.numQuestions) * Number(s.marksPerQuestion)), 0);
    setTotalMarks(calcMarks);
  };

  const addSection = () => {
    setSections([
      ...sections,
      { name: `Part ${String.fromCharCode(65 + sections.length)}`, order: sections.length + 1, numQuestions: 2, marksPerQuestion: 10, questionType: 'LONG_ANSWER' },
    ]);
  };

  const removeSection = (index: number) => {
    if (sections.length <= 1) return;
    setSections(sections.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Examination Blueprints</h1>
          <p className="text-muted-foreground">Define section quotas, mark weights, and Bloom's distributions for automatic paper assembly</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Blueprint
        </Button>
      </div>

      {/* Preset Cards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex justify-between items-start">
              <Badge variant="default">Preset Standard</Badge>
              <span className="text-xs font-mono font-bold text-muted-foreground">100 Marks • 180 Mins</span>
            </div>
            <CardTitle className="text-xl">Semester End Examination</CardTitle>
            <CardDescription>SRM University official 3-part blueprint with 100% Bloom's compliance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between p-2 bg-background/80 rounded border">
                <span className="font-semibold">Part A (Short Answer)</span>
                <span>10 Questions × 2 Marks = 20M</span>
              </div>
              <div className="flex justify-between p-2 bg-background/80 rounded border">
                <span className="font-semibold">Part B (Analytical Problems)</span>
                <span>5 Questions × 13 Marks = 65M</span>
              </div>
              <div className="flex justify-between p-2 bg-background/80 rounded border">
                <span className="font-semibold">Part C (Case Study)</span>
                <span>1 Question × 15 Marks = 15M</span>
              </div>
            </div>
            <Button className="w-full mt-2" size="sm" asChild>
              <Link href="/faculty/papers/generate">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Generate Paper Using This Blueprint
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-purple-50/20 dark:bg-purple-950/10">
          <CardHeader>
            <div className="flex justify-between items-start">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">Internal Exam</Badge>
              <span className="text-xs font-mono font-bold text-muted-foreground">50 Marks • 90 Mins</span>
            </div>
            <CardTitle className="text-xl">Continuous Assessment Test (CAT)</CardTitle>
            <CardDescription>Mid-term periodic assessment covering first 3 syllabus modules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between p-2 bg-background/80 rounded border">
                <span className="font-semibold">Part A (MCQs)</span>
                <span>5 Questions × 2 Marks = 10M</span>
              </div>
              <div className="flex justify-between p-2 bg-background/80 rounded border">
                <span className="font-semibold">Part B (Core Problems)</span>
                <span>2 Questions × 13 Marks = 26M</span>
              </div>
              <div className="flex justify-between p-2 bg-background/80 rounded border">
                <span className="font-semibold">Part C (Application Problem)</span>
                <span>1 Question × 14 Marks = 14M</span>
              </div>
            </div>
            <Button className="w-full mt-2" size="sm" variant="outline" asChild>
              <Link href="/faculty/papers/generate">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Generate Paper Using This Blueprint
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Blueprint Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Configured Blueprints ({blueprints.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading blueprints...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Blueprint Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Sections</TableHead>
                    <TableHead className="text-right">Total Marks</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blueprints.map((bp) => (
                    <TableRow key={bp.id}>
                      <TableCell className="font-medium">
                        <p className="font-semibold">{bp.name}</p>
                        <p className="text-xs text-muted-foreground">{bp.subject?.code} - {bp.subject?.name}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{bp.type.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {bp.sections?.length || 0} Sections ({bp.sections?.map(s => s.name).join(', ')})
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">{bp.totalMarks}M</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{bp.duration}m</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href="/faculty/papers/generate">
                              Generate
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(bp.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Custom Blueprint Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Custom Blueprint</DialogTitle>
            <DialogDescription>Define sections and questions distribution for automated generation</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBlueprint} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Blueprint Name</label>
                <Input
                  placeholder="e.g. Mid-Semester Assessment 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Duration (Minutes)</label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Total Marks (Calculated)</label>
                <Input
                  type="number"
                  value={totalMarks}
                  readOnly
                  className="bg-muted font-bold font-mono"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider">Blueprint Sections</label>
                <Button type="button" size="sm" variant="outline" onClick={addSection}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Section
                </Button>
              </div>

              {sections.map((sec, idx) => (
                <div key={idx} className="p-3 bg-muted/40 rounded-lg border space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Input
                      placeholder="Section Name (e.g. Part A)"
                      value={sec.name}
                      onChange={(e) => updateSection(idx, 'name', e.target.value)}
                      className="font-medium text-sm"
                      required
                    />
                    {sections.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeSection(idx)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-muted-foreground">Num Questions</label>
                      <Input
                        type="number"
                        min="1"
                        value={sec.numQuestions}
                        onChange={(e) => updateSection(idx, 'numQuestions', Number(e.target.value))}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">Marks Per Question</label>
                      <Input
                        type="number"
                        min="1"
                        value={sec.marksPerQuestion}
                        onChange={(e) => updateSection(idx, 'marksPerQuestion', Number(e.target.value))}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">Question Type</label>
                      <select
                        value={sec.questionType || 'SHORT_ANSWER'}
                        onChange={(e) => updateSection(idx, 'questionType', e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-2 py-2 text-xs"
                      >
                        <option value="MCQ">MCQ</option>
                        <option value="SHORT_ANSWER">Short Answer</option>
                        <option value="LONG_ANSWER">Long Answer</option>
                        <option value="CASE_STUDY">Case Study</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Blueprint</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
