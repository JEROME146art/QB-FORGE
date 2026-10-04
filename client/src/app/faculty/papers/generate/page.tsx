'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import Link from 'next/link';
import { RefreshCw, CheckCircle, XCircle, FileText, Sparkles, Download, ArrowRight, Layers } from 'lucide-react';

interface Subject {
  id: string;
  code: string;
  name: string;
}

interface BlueprintSection {
  name: string;
  order: number;
  numQuestions: number;
  marksPerQuestion: number;
  questionType?: string;
  difficulty?: string;
}

interface Blueprint {
  id: string;
  name: string;
  type: string;
  subjectId: string;
  totalMarks: number;
  duration: number;
  sections: BlueprintSection[];
}

export default function GeneratePaperPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSets, setSelectedSets] = useState(['A', 'B']);
  const [result, setResult] = useState<any>(null);
  const [createdPaperId, setCreatedPaperId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, bpRes] = await Promise.all([
          api('/subjects'),
          api('/blueprints'),
        ]);
        setSubjects(subRes.data || []);
        setBlueprints(bpRes.data || []);
        if (subRes.data && subRes.data.length > 0) {
          setSubjectId(subRes.data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch subjects/blueprints:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (subjectId) {
      const filtered = blueprints.filter((b) => b.subjectId === subjectId);
      setBlueprint(filtered.length > 0 ? filtered[0] : (blueprints.length > 0 ? blueprints[0] : null));
    }
  }, [subjectId, blueprints]);

  const handleGenerate = async () => {
    if (!subjectId || !blueprint) return;
    setLoading(true);
    setResult(null);
    setCreatedPaperId(null);

    try {
      // 1. Generate questions from blueprint
      const response = await api('/papers/generate', {
        method: 'POST',
        body: JSON.stringify({ blueprintId: blueprint.id, sets: selectedSets }),
      });
      setResult(response.data);

      // 2. Also persist the generated paper
      const selectedSubject = subjects.find(s => s.id === subjectId);
      const paperRes = await api('/papers', {
        method: 'POST',
        body: JSON.stringify({
          title: `${selectedSubject?.code || 'CS'} - ${blueprint.name}`,
          type: blueprint.type,
          subjectId: subjectId,
          blueprintId: blueprint.id,
          totalMarks: blueprint.totalMarks,
          duration: blueprint.duration,
          instructions: 'Answer all questions. Calculators are permitted where specified.',
          collegeHeader: {
            collegeName: 'SRM Institute of Science & Technology',
            department: 'Department of Computer Science and Engineering',
            subjectCode: selectedSubject?.code,
            subjectName: selectedSubject?.name,
          },
        }),
      });

      if (paperRes.data?.id) {
        setCreatedPaperId(paperRes.data.id);
      }
    } catch (error) {
      console.error('Generation failed:', error);
      setResult({ error: error instanceof Error ? error.message : 'Generation failed' });
    } finally {
      setLoading(false);
    }
  };

  const currentSubjectBlueprints = blueprints.filter((b) => b.subjectId === subjectId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Smart Paper Generator</h1>
          <p className="text-muted-foreground">Constraint satisfaction engine balancing unit coverage, difficulty, and Bloom's taxonomy</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/faculty/blueprints">
            <Layers className="h-4 w-4 mr-2" />
            Manage Blueprints
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Blueprint &amp; Parameters
              </CardTitle>
              <CardDescription>Select target subject and examination structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.code} - {s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {subjectId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Blueprint Template</label>
                  {currentSubjectBlueprints.length > 0 ? (
                    <Select
                      value={blueprint?.id || ''}
                      onValueChange={(v) => setBlueprint(blueprints.find((b) => b.id === v) || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a blueprint" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentSubjectBlueprints.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.name} ({b.totalMarks} Marks)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-muted rounded-md text-xs text-muted-foreground">
                      No blueprint found for this subject. Create one in{' '}
                      <Link href="/faculty/blueprints" className="text-primary underline">Blueprints</Link>.
                    </div>
                  )}
                </div>
              )}

              {blueprint && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Generate Sets</label>
                    <div className="flex gap-2">
                      {['A', 'B', 'C'].map((s) => (
                        <Button
                          key={s}
                          type="button"
                          variant={selectedSets.includes(s) ? 'default' : 'outline'}
                          size="sm"
                          className="w-16"
                          onClick={() => {
                            setSelectedSets(selectedSets.includes(s)
                              ? (selectedSets.length > 1 ? selectedSets.filter((x) => x !== s) : selectedSets)
                              : [...selectedSets, s]);
                          }}
                        >
                          Set {s}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Sets have non-overlapping questions with identical difficulty distribution.</p>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Total Marks:</span>
                      <span>{blueprint.totalMarks} Marks</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Exam Duration:</span>
                      <span>{blueprint.duration} Minutes</span>
                    </div>
                    <div className="pt-2 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Sections</p>
                      {blueprint.sections.map((sec, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-2 bg-muted/50 rounded">
                          <span className="font-medium">{sec.name}</span>
                          <span>{sec.numQuestions} Qs × {sec.marksPerQuestion}M</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Button
                onClick={handleGenerate}
                className="w-full mt-4"
                disabled={loading || !blueprint}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Solving Constraints & Generating...' : 'Generate Balanced Paper'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Output & Preview Panel */}
        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Generated Paper Preview</span>
                {createdPaperId && (
                  <Badge variant="success" className="text-xs">Saved to Papers</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {loading && (
                <div className="py-20 text-center space-y-4">
                  <RefreshCw className="h-10 w-10 animate-spin mx-auto text-primary" />
                  <div>
                    <p className="font-medium text-lg">Generating Questions...</p>
                    <p className="text-sm text-muted-foreground mt-1">Applying constraint solver across Bloom's levels and syllabus units</p>
                  </div>
                </div>
              )}

              {result?.error && (
                <div className="py-12 text-center space-y-3">
                  <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                  <p className="text-red-600 font-semibold text-lg">Generation Failed</p>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">{result.error}</p>
                </div>
              )}

              {result?.success && (
                <div className="space-y-6">
                  {result.sections?.map((sec: any, sIdx: number) => (
                    <div key={sIdx} className="border rounded-lg p-4 space-y-3 bg-card">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <h4 className="font-bold text-base">{sec.name}</h4>
                        <Badge variant="secondary">{sec.totalMarks} Marks</Badge>
                      </div>
                      <div className="space-y-3">
                        {sec.questions?.map((q: any, qIdx: number) => (
                          <div key={qIdx} className="text-sm p-3 bg-muted/40 rounded-md border space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium">
                                <span className="font-bold text-primary mr-2">Q{qIdx + 1}.</span>
                                {q.text}
                              </p>
                              <Badge variant="outline" className="shrink-0">{q.marks}M</Badge>
                            </div>
                            {q.options && Array.isArray(q.options) && (
                              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-dashed">
                                {q.options.map((opt: any, oIdx: number) => (
                                  <div key={oIdx} className={`text-xs p-1.5 rounded ${opt.isCorrect ? 'bg-green-50 dark:bg-green-950/30 text-green-700 font-semibold' : 'text-muted-foreground'}`}>
                                    {opt.label}. {opt.text}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2 text-xs pt-1">
                              <Badge variant="secondary" className="text-[10px]">{q.difficulty}</Badge>
                              <Badge variant="outline" className="text-[10px]">{q.bloomLevel}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                    <Button className="flex-1" asChild>
                      <Link href="/faculty/papers">
                        <FileText className="h-4 w-4 mr-2" />
                        View All Papers
                      </Link>
                    </Button>
                    <Button variant="outline" onClick={handleGenerate} className="flex-1">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              )}

              {!loading && !result && (
                <div className="py-24 text-center text-muted-foreground space-y-3">
                  <FileText className="h-12 w-12 mx-auto stroke-1" />
                  <p className="font-medium text-base text-foreground">Ready to generate</p>
                  <p className="text-sm max-w-sm mx-auto">Select your subject and blueprint on the left, then click Generate Paper.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}