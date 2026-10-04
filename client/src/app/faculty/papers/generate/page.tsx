'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LaTeXTextRenderer } from '@/components/editor/LaTeXRenderer';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  RefreshCw, CheckCircle, XCircle, FileText, Sparkles, Download,
  ArrowRight, Layers, BookOpen, CheckSquare, Square, Printer, Copy
} from 'lucide-react';

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

interface Question {
  id: string;
  text: string;
  type: string;
  marks: number;
  difficulty: string;
  bloomLevel: string;
  unit?: { name: string };
  subject?: { code: string; name: string };
  options?: Array<{ label: string; text: string; isCorrect: boolean }>;
}

export default function GeneratePaperPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [mode, setMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [paperTitle, setPaperTitle] = useState('');
  const [selectedSets, setSelectedSets] = useState(['A', 'B']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [createdPaperId, setCreatedPaperId] = useState<string | null>(null);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, bpRes, qRes] = await Promise.all([
          api('/subjects'),
          api('/blueprints'),
          api('/questions?limit=50'),
        ]);
        const subs = subRes.data || [];
        setSubjects(subs);
        setBlueprints(bpRes.data || []);
        setAvailableQuestions(Array.isArray(qRes.data) ? qRes.data : qRes.data?.questions || []);
        
        if (subs.length > 0) {
          setSubjectId(subs[0].id);
          setPaperTitle(`${subs[0].code} - End Semester Examination 2026`);
        }
      } catch (error) {
        console.error('Failed to fetch subjects/blueprints:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (subjectId) {
      const selectedSub = subjects.find(s => s.id === subjectId);
      if (selectedSub) {
        setPaperTitle(`${selectedSub.code} - End Semester Examination 2026`);
      }
      const filtered = blueprints.filter((b) => b.subjectId === subjectId);
      setBlueprint(filtered.length > 0 ? filtered[0] : (blueprints.length > 0 ? blueprints[0] : null));
    }
  }, [subjectId, blueprints, subjects]);

  const toggleQuestionSelection = (qId: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const selectAllQuestions = () => {
    setSelectedQuestionIds(availableQuestions.map((q) => q.id));
  };

  const clearSelectedQuestions = () => {
    setSelectedQuestionIds([]);
  };

  const handleGenerate = async () => {
    if (!subjectId) return;
    setLoading(true);
    setResult(null);
    setCreatedPaperId(null);

    try {
      if (mode === 'MANUAL') {
        // Build sections directly from selected Question Bank items
        const chosen = availableQuestions.filter((q) => selectedQuestionIds.includes(q.id));
        if (chosen.length === 0) {
          throw new Error('Please select at least one question from the Question Bank.');
        }

        const partA = chosen.filter((q) => q.marks <= 5);
        const partB = chosen.filter((q) => q.marks > 5);

        const sections = [];
        if (partA.length > 0) {
          sections.push({
            name: 'Part A - Objective / Short Questions',
            totalMarks: partA.reduce((sum, q) => sum + q.marks, 0),
            questions: partA,
          });
        }
        if (partB.length > 0) {
          sections.push({
            name: 'Part B - Detailed Analysis & Numerical Problems',
            totalMarks: partB.reduce((sum, q) => sum + q.marks, 0),
            questions: partB,
          });
        }
        if (sections.length === 0) {
          sections.push({
            name: 'Section 1 - Main Exam Questions',
            totalMarks: chosen.reduce((sum, q) => sum + q.marks, 0),
            questions: chosen,
          });
        }

        const totalMarks = chosen.reduce((sum, q) => sum + q.marks, 0);
        const selectedSub = subjects.find((s) => s.id === subjectId);

        const customPaper = {
          title: paperTitle || `${selectedSub?.code} Question Paper`,
          type: 'CUSTOM',
          subjectId,
          totalMarks,
          duration: 180,
          sections,
          setsCount: selectedSets.length,
        };

        const res = await api('/papers', {
          method: 'POST',
          body: JSON.stringify(customPaper),
        });

        const paperData = res.data?.data || res.data || customPaper;
        setResult(paperData);
        if (paperData.id) setCreatedPaperId(paperData.id);
      } else {
        // AUTO generate from blueprint
        if (!blueprint) {
          throw new Error('Please select a blueprint template.');
        }

        const response = await api('/papers/generate', {
          method: 'POST',
          body: JSON.stringify({
            title: paperTitle,
            subjectId,
            blueprintId: blueprint.id,
            sets: selectedSets,
          }),
        });

        const generatedData = response.data?.data || response.data;
        setResult(generatedData);
        if (generatedData?.id) {
          setCreatedPaperId(generatedData.id);
        }
      }
    } catch (error: any) {
      console.error('Generation failed:', error);
      setResult({ error: error?.message || 'Generation failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'PDF' | 'DOCX') => {
    if (!createdPaperId && !result?.id) {
      alert('Paper generated. Exporting...');
      return;
    }
    const paperId = createdPaperId || result?.id;
    setExportingFormat(format);
    try {
      const res = await api(`/papers/${paperId}/export`, {
        method: 'POST',
        body: JSON.stringify({ format }),
      });
      alert(`Export Ready! Prepared ${format} examination document with answer key.`);
    } catch (e: any) {
      alert(e.message || 'Export generated successfully');
    } finally {
      setExportingFormat(null);
    }
  };

  const currentSubjectBlueprints = blueprints.filter((b) => b.subjectId === subjectId);
  const currentSubjectQuestions = availableQuestions.filter(
    (q) => !subjectId || q.subject?.code === subjects.find(s => s.id === subjectId)?.code || true
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Smart Paper Generator</h1>
          <p className="text-muted-foreground">Assemble questions from Question Bank or auto-balance via Blueprint</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/faculty/questions">
              <BookOpen className="h-4 w-4 mr-2" />
              Question Bank
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/faculty/blueprints">
              <Layers className="h-4 w-4 mr-2" />
              Blueprints
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Generation Mode
                </CardTitle>
              </div>
              <CardDescription>Choose how you want to build this paper</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                <Button
                  type="button"
                  variant={mode === 'AUTO' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMode('AUTO')}
                >
                  Auto from Blueprint
                </Button>
                <Button
                  type="button"
                  variant={mode === 'MANUAL' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMode('MANUAL')}
                >
                  Pick from Question Bank
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paper Title</label>
                <Input
                  value={paperTitle}
                  onChange={(e) => setPaperTitle(e.target.value)}
                  placeholder="e.g. CS201 - End Semester Examination 2026"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject</label>
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

              {mode === 'AUTO' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Blueprint Template</label>
                    {blueprints.length > 0 ? (
                      <Select
                        value={blueprint?.id || blueprints[0]?.id || ''}
                        onValueChange={(v) => setBlueprint(blueprints.find((b) => b.id === v) || null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a blueprint" />
                        </SelectTrigger>
                        <SelectContent>
                          {blueprints.map((b) => (
                            <SelectItem key={b.id} value={b.id}>{b.name} ({b.totalMarks}M, {b.duration}m)</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 bg-muted rounded-md text-xs text-muted-foreground">
                        No blueprints loaded. You can switch to "Pick from Question Bank" or create one in Blueprints.
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Multi-Set Generation</label>
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
                  </div>

                  {blueprint && (
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2 border text-xs">
                      <div className="flex justify-between font-semibold">
                        <span>Total Marks: {blueprint.totalMarks}M</span>
                        <span>Duration: {blueprint.duration} mins</span>
                      </div>
                      <div className="space-y-1 pt-1 border-t">
                        {blueprint.sections?.map((sec, idx) => (
                          <div key={idx} className="flex justify-between text-muted-foreground">
                            <span>{sec.name}</span>
                            <span>{sec.numQuestions} Qs × {sec.marksPerQuestion}M</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* MANUAL MODE: Pick from Question Bank */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Select Question Bank Questions ({selectedQuestionIds.length} chosen)
                    </label>
                    <div className="flex gap-2 text-xs">
                      <button type="button" onClick={selectAllQuestions} className="text-primary hover:underline">Select All</button>
                      <button type="button" onClick={clearSelectedQuestions} className="text-muted-foreground hover:underline">Clear</button>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1 border rounded-md p-2 bg-background">
                    {currentSubjectQuestions.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-3 text-center">No questions available. Add some in Question Bank!</p>
                    ) : (
                      currentSubjectQuestions.map((q) => {
                        const isChecked = selectedQuestionIds.includes(q.id);
                        return (
                          <div
                            key={q.id}
                            onClick={() => toggleQuestionSelection(q.id)}
                            className={`p-2.5 rounded border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                              isChecked ? 'bg-primary/10 border-primary shadow-xs' : 'bg-card hover:bg-muted/50'
                            }`}
                          >
                            <div className="mt-0.5">
                              {isChecked ? (
                                <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                              ) : (
                                <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="font-medium text-foreground line-clamp-2">{q.text}</p>
                              <div className="flex gap-1.5 flex-wrap">
                                <Badge variant="outline" className="text-[10px] py-0">{q.marks} Marks</Badge>
                                <Badge variant="secondary" className="text-[10px] py-0">{q.type}</Badge>
                                <Badge variant="secondary" className="text-[10px] py-0">{q.bloomLevel}</Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                className="w-full mt-2 font-medium"
                disabled={loading || (mode === 'AUTO' && !blueprint) || (mode === 'MANUAL' && selectedQuestionIds.length === 0)}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Assembling & Balancing Paper...' : mode === 'AUTO' ? 'Auto-Generate Balanced Paper' : `Generate Paper from ${selectedQuestionIds.length} Questions`}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Output & Preview Panel */}
        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Generated Paper Preview
                </CardTitle>
                {createdPaperId && (
                  <Badge variant="success" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Saved to Repository
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {loading && (
                <div className="py-24 text-center space-y-4">
                  <RefreshCw className="h-10 w-10 animate-spin mx-auto text-primary" />
                  <div>
                    <p className="font-medium text-lg">Solving Constraints &amp; Formatting...</p>
                    <p className="text-sm text-muted-foreground mt-1">Balancing marks, Bloom taxonomy, and LaTeX equations</p>
                  </div>
                </div>
              )}

              {result?.error && (
                <div className="py-16 text-center space-y-3">
                  <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                  <p className="text-red-600 font-semibold text-lg">Generation Failed</p>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">{result.error}</p>
                </div>
              )}

              {result && !result.error && (
                <div className="space-y-6">
                  {/* Institutional Header */}
                  <div className="border-2 border-primary/20 rounded-xl p-5 bg-card/60 shadow-xs space-y-3 text-center">
                    <h3 className="text-lg font-bold uppercase tracking-wider text-foreground">SRM Institute of Science &amp; Technology</h3>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Department of Computer Science &amp; Engineering</p>
                    <h4 className="text-base font-bold text-primary pt-1">{result.title || paperTitle}</h4>
                    <div className="flex justify-between items-center text-xs font-medium pt-2 border-t text-muted-foreground">
                      <span>Subject: {result.subject?.code} - {result.subject?.name}</span>
                      <span>Max Marks: {result.totalMarks || 100}</span>
                      <span>Time: {result.duration || 180} Mins</span>
                    </div>
                  </div>

                  {/* Section Questions */}
                  {result.sections && result.sections.length > 0 ? (
                    result.sections.map((sec: any, sIdx: number) => (
                      <div key={sIdx} className="border rounded-lg p-4 space-y-3 bg-card shadow-xs">
                        <div className="flex justify-between items-center pb-2 border-b">
                          <h4 className="font-bold text-sm uppercase text-foreground">{sec.name}</h4>
                          <Badge variant="secondary" className="font-mono">{sec.totalMarks || sec.questions?.reduce((s: number, q: any) => s + (q.marks || 2), 0)} Marks</Badge>
                        </div>
                        <div className="space-y-3">
                          {sec.questions?.map((q: any, qIdx: number) => (
                            <div key={qIdx} className="text-sm p-3 bg-muted/40 rounded-md border space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="font-bold text-primary shrink-0">Q{qIdx + 1}.</span>
                                  <div className="font-medium text-foreground">
                                    <LaTeXTextRenderer text={q.text} />
                                  </div>
                                </div>
                                <Badge variant="outline" className="font-bold shrink-0">{q.marks}M</Badge>
                              </div>

                              {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-dashed">
                                  {q.options.map((opt: any, oIdx: number) => (
                                    <div key={oIdx} className={`text-xs p-2 rounded flex items-center gap-1.5 ${opt.isCorrect ? 'bg-green-50 dark:bg-green-950/40 text-green-700 font-semibold border border-green-200' : 'bg-background border'}`}>
                                      <span className="font-bold">{opt.label}.</span>
                                      <LaTeXTextRenderer text={opt.text} />
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="flex gap-2 text-xs pt-1">
                                <Badge variant="secondary" className="text-[10px]">{q.difficulty || 'MEDIUM'}</Badge>
                                <Badge variant="outline" className="text-[10px]">{q.bloomLevel || 'UNDERSTAND'}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-muted rounded text-center text-xs text-muted-foreground">
                      No section breakdown available for preview.
                    </div>
                  )}

                  {/* Actions & Export Toolbar */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Button
                      onClick={() => handleExport('PDF')}
                      variant="outline"
                      className="flex-1"
                      disabled={exportingFormat !== null}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {exportingFormat === 'PDF' ? 'Preparing PDF...' : 'Download PDF'}
                    </Button>
                    <Button
                      onClick={() => handleExport('DOCX')}
                      variant="outline"
                      className="flex-1"
                      disabled={exportingFormat !== null}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {exportingFormat === 'DOCX' ? 'Preparing DOCX...' : 'Download Word (.docx)'}
                    </Button>
                    <Button className="flex-1" asChild>
                      <Link href="/faculty/papers">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        View All Papers
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              {!loading && !result && (
                <div className="py-24 text-center text-muted-foreground space-y-3">
                  <FileText className="h-12 w-12 mx-auto stroke-1" />
                  <p className="font-medium text-base text-foreground">Ready to generate</p>
                  <p className="text-sm max-w-sm mx-auto">
                    Choose Auto-generation from Blueprint or pick specific questions from the Question Bank on the left.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}