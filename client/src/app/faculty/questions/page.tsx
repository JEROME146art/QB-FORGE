'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { LaTeXTextRenderer } from '@/components/editor/LaTeXRenderer';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus, Search, Upload, Download, Edit, Trash2, Eye,
  ChevronLeft, ChevronRight, BookOpen, FileText, CheckCircle2,
  AlertCircle, Sparkles, FileSpreadsheet, Copy
} from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type: string;
  marks: number;
  difficulty: string;
  bloomLevel: string;
  unit?: { name: string };
  subject?: { code: string; name: string };
  usageCount: number;
  options?: any;
  modelAnswer?: string;
  createdAt: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  units?: Array<{ id: string; name: string }>;
}

function QuestionsTableContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [type, setType] = useState('ALL');
  const [difficulty, setDifficulty] = useState('ALL');
  const [bloomLevel, setBloomLevel] = useState('ALL');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Bulk Import state
  const [importMode, setImportMode] = useState<'FILE' | 'PASTE'>('PASTE');
  const [importText, setImportText] = useState('');
  const [importSubjectId, setImportSubjectId] = useState('');
  const [parsedImportQuestions, setParsedImportQuestions] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  // New single question form state
  const [newForm, setNewForm] = useState({
    subjectId: '',
    unitId: '',
    type: 'SHORT_ANSWER',
    text: '',
    marks: 5,
    difficulty: 'MEDIUM',
    bloomLevel: 'UNDERSTAND',
    modelAnswer: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
  });

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (type && type !== 'ALL') params.append('type', type);
      if (difficulty && difficulty !== 'ALL') params.append('difficulty', difficulty);
      if (bloomLevel && bloomLevel !== 'ALL') params.append('bloomLevel', bloomLevel);
      
      const data = await api<any>(`/questions?${params.toString()}`);
      if (Array.isArray(data.data)) {
        setQuestions(data.data);
        setTotal(data.pagination?.total || data.data.length);
      } else if (data.data && Array.isArray(data.data.questions)) {
        setQuestions(data.data.questions);
        setTotal(data.data.total || data.data.questions.length);
      } else {
        setQuestions([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const data = await api('/subjects');
        const subs = data.data || [];
        setSubjects(subs);
        if (subs.length > 0) {
          setNewForm((prev) => ({ ...prev, subjectId: subs[0].id }));
          setImportSubjectId(subs[0].id);
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
      }
    };
    fetchSubs();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [page, search, type, difficulty, bloomLevel]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQuestions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await api(`/questions/${id}`, { method: 'DELETE' });
      setQuestions(questions.filter((q) => q.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        subjectId: newForm.subjectId,
        unitId: newForm.unitId || undefined,
        type: newForm.type,
        text: newForm.text,
        marks: Number(newForm.marks),
        difficulty: newForm.difficulty,
        bloomLevel: newForm.bloomLevel,
        modelAnswer: newForm.modelAnswer || undefined,
      };

      if (newForm.type === 'MCQ') {
        payload.options = [
          { label: 'A', text: newForm.optionA, isCorrect: newForm.correctOption === 'A' },
          { label: 'B', text: newForm.optionB, isCorrect: newForm.correctOption === 'B' },
          { label: 'C', text: newForm.optionC, isCorrect: newForm.correctOption === 'C' },
          { label: 'D', text: newForm.optionD, isCorrect: newForm.correctOption === 'D' },
        ];
      }

      await api('/questions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setNewDialogOpen(false);
      setNewForm({
        subjectId: subjects[0]?.id || '',
        unitId: '',
        type: 'SHORT_ANSWER',
        text: '',
        marks: 5,
        difficulty: 'MEDIUM',
        bloomLevel: 'UNDERSTAND',
        modelAnswer: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctOption: 'A',
      });
      fetchQuestions();
    } catch (err: any) {
      alert(err.message || 'Failed to create question');
    }
  };

  // Parse Raw / CSV / JSON Text
  const parsePastedContent = (text: string) => {
    setImportError('');
    if (!text.trim()) {
      setParsedImportQuestions([]);
      return;
    }

    try {
      // 1. Try JSON parsing
      if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        setParsedImportQuestions(
          list.map((item) => ({
            text: item.text || item.question || '',
            type: item.type || 'SHORT_ANSWER',
            marks: Number(item.marks) || 5,
            difficulty: item.difficulty || 'MEDIUM',
            bloomLevel: item.bloomLevel || 'UNDERSTAND',
            modelAnswer: item.modelAnswer || '',
            options: item.options || [],
          }))
        );
        return;
      }

      // 2. Try CSV lines (question, type, marks, difficulty, bloomLevel, optionA, optionB, optionC, optionD, correctOption, modelAnswer)
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      const parsedList: any[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip header if present
        if (i === 0 && (line.toLowerCase().includes('question') || line.toLowerCase().includes('text'))) {
          continue;
        }

        const parts = line.split(',').map((p) => p.trim());
        if (parts.length >= 1) {
          const qText = parts[0];
          const qType = parts[1] || (parts.length > 5 ? 'MCQ' : 'SHORT_ANSWER');
          const qMarks = Number(parts[2]) || 5;
          const qDiff = parts[3] || 'MEDIUM';
          const qBloom = parts[4] || 'UNDERSTAND';

          const options = [];
          if (parts[5] && parts[6]) {
            options.push(
              { label: 'A', text: parts[5], isCorrect: (parts[9] || 'A').toUpperCase() === 'A' },
              { label: 'B', text: parts[6] || '', isCorrect: (parts[9] || 'A').toUpperCase() === 'B' },
              { label: 'C', text: parts[7] || '', isCorrect: (parts[9] || 'A').toUpperCase() === 'C' },
              { label: 'D', text: parts[8] || '', isCorrect: (parts[9] || 'A').toUpperCase() === 'D' }
            );
          }

          parsedList.push({
            text: qText,
            type: qType,
            marks: qMarks,
            difficulty: qDiff,
            bloomLevel: qBloom,
            options,
            modelAnswer: parts[10] || 'Standard marking criteria',
          });
        }
      }

      setParsedImportQuestions(parsedList);
    } catch (e: any) {
      setImportError('Could not parse format. Ensure valid CSV rows or JSON array.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
      parsePastedContent(content);
    };
    reader.readAsText(file);
  };

  const handleBulkImportSubmit = async () => {
    if (parsedImportQuestions.length === 0) {
      setImportError('No valid questions parsed to import.');
      return;
    }

    setImporting(true);
    setImportError('');
    setImportSuccessMsg('');

    try {
      const payload = parsedImportQuestions.map((q) => ({
        ...q,
        subjectId: importSubjectId,
      }));

      const res = await api('/questions/bulk', {
        method: 'POST',
        body: JSON.stringify({ questions: payload }),
      });

      setImportSuccessMsg(`Successfully imported ${res.count || payload.length} questions into the repository!`);
      setTimeout(() => {
        setImportDialogOpen(false);
        setImportText('');
        setParsedImportQuestions([]);
        setImportSuccessMsg('');
        fetchQuestions();
      }, 1200);
    } catch (err: any) {
      setImportError(err.message || 'Failed to import questions');
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleTemplate = () => {
    const sampleCsv = `text,type,marks,difficulty,bloomLevel,optionA,optionB,optionC,optionD,correctOption,modelAnswer
"What is the worst-case time complexity of QuickSort with naive pivot?",MCQ,2,EASY,UNDERSTAND,"O(N log N)","O(N^2)","O(N)","O(1)",B,"Worst case occurs when array is already sorted or reverse sorted."
"Explain Dijkstra shortest path algorithm with time complexity derivation.",LONG_ANSWER,13,MEDIUM,APPLY,"","","","",,"Maintains min-priority queue of distances."
"Define the principle of Mathematical Induction with an example.",SHORT_ANSWER,5,EASY,REMEMBER,"","","","",,"Base case, inductive hypothesis, and induction step."
"Evaluate the postfix expression: 4 2 + 3 5 1 - * +",SHORT_ANSWER,5,HARD,APPLY,"","","","",,"Step 1: (4+2)=6; Step 2: (5-1)=4; Step 3: 3*4=12; Step 4: 6+12=18."`;

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'qpforge_question_bank_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeColor = (t: string) => {
    const colors: Record<string, string> = {
      MCQ: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
      SHORT_ANSWER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
      LONG_ANSWER: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
      TRUE_FALSE: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
      NUMERICAL: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
      FILL_IN_BLANKS: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400',
      CASE_STUDY: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400',
    };
    return colors[t] || 'bg-gray-100 text-gray-700';
  };

  const currentUnits = subjects.find((s) => s.id === newForm.subjectId)?.units || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Question Bank</h1>
          <p className="text-muted-foreground">Manage your repository of multi-format questions with LaTeX math support</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setImportDialogOpen(true)} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Upload / Bulk Import
          </Button>
          <Button onClick={() => setNewDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Single Question
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/faculty/notes">
              <BookOpen className="h-4 w-4 mr-2" />
              AI Notes Ingestion
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search questions by text or tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  {['MCQ', 'SHORT_ANSWER', 'LONG_ANSWER', 'TRUE_FALSE', 'NUMERICAL', 'FILL_IN_BLANKS', 'CASE_STUDY'].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Difficulties</SelectItem>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={bloomLevel} onValueChange={setBloomLevel}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Bloom's" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Levels</SelectItem>
                  {['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'].map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit"><Search className="h-4 w-4 mr-2" />Filter</Button>
          </form>
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Repository Questions ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12 text-muted-foreground">Loading questions...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-3">
              <p>No questions match your filter criteria.</p>
              <div className="flex justify-center gap-2">
                <Button onClick={() => setImportDialogOpen(true)} variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Question Bank File
                </Button>
                <Button onClick={() => setNewDialogOpen(true)}>Add Question Manually</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Question</TableHead>
                      <TableHead>Subject / Unit</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Bloom's</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell className="font-medium">
                          <div className="line-clamp-2">
                            <LaTeXTextRenderer text={q.text} />
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-semibold text-foreground">{q.subject?.code || 'CS201'}</div>
                          <div className="text-muted-foreground">{q.unit?.name || 'General'}</div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getTypeColor(q.type)}`}>
                            {q.type}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono font-bold">{q.marks}M</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{q.difficulty}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{q.bloomLevel}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedQuestion(q);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleDelete(q.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <p className="text-xs text-muted-foreground">Showing {questions.length} of {total} questions</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={questions.length < limit}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ────────────────── BULK IMPORT MODAL ────────────────── */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload / Bulk Import Question Bank
            </DialogTitle>
            <DialogDescription>
              Upload a CSV/JSON file or paste raw question text to import into the Question Bank in bulk.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Target Subject:</span>
                <select
                  value={importSubjectId}
                  onChange={(e) => setImportSubjectId(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              <Button variant="outline" size="sm" onClick={downloadSampleTemplate} className="text-xs">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download CSV Template
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
              <Button
                type="button"
                variant={importMode === 'PASTE' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setImportMode('PASTE')}
              >
                Paste CSV / Text / JSON
              </Button>
              <Button
                type="button"
                variant={importMode === 'FILE' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setImportMode('FILE')}
              >
                Choose File (.csv, .json, .txt)
              </Button>
            </div>

            {importMode === 'FILE' ? (
              <div className="border-2 border-dashed rounded-xl p-8 text-center space-y-3 bg-muted/20">
                <FileSpreadsheet className="h-10 w-10 mx-auto text-primary" />
                <div>
                  <p className="font-semibold text-sm">Select CSV or JSON file</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports standard CSV with question, type, marks, options columns</p>
                </div>
                <input
                  type="file"
                  accept=".csv,.json,.txt"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Paste CSV Lines or JSON Array:</label>
                <textarea
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    parsePastedContent(e.target.value);
                  }}
                  className="w-full rounded-md border border-input bg-background p-3 text-xs font-mono h-40"
                  placeholder={`question,type,marks,difficulty,bloomLevel,optionA,optionB,optionC,optionD,correctOption,modelAnswer\n"What is the time complexity of binary search?",MCQ,2,EASY,UNDERSTAND,"O(1)","O(log N)","O(N)","O(N^2)",B,"Divides search space by 2."`}
                />
              </div>
            )}

            {importError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 border border-red-200 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importSuccessMsg && (
              <div className="p-3 bg-green-50 dark:bg-green-950/40 text-green-700 border border-green-200 rounded-lg text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{importSuccessMsg}</span>
              </div>
            )}

            {/* Parsed Preview Table */}
            {parsedImportQuestions.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase text-foreground">
                    Parsed Questions Preview ({parsedImportQuestions.length} ready to import)
                  </p>
                  <Badge variant="success" className="text-[10px]">Valid Format</Badge>
                </div>
                <div className="max-h-48 overflow-y-auto border rounded-md divide-y text-xs">
                  {parsedImportQuestions.slice(0, 10).map((q, idx) => (
                    <div key={idx} className="p-2.5 bg-card flex justify-between items-start gap-2">
                      <div className="space-y-1 flex-1">
                        <p className="font-medium text-foreground">{q.text}</p>
                        <div className="flex gap-1.5 flex-wrap">
                          <Badge variant="outline" className="text-[9px] py-0">{q.type}</Badge>
                          <Badge variant="secondary" className="text-[9px] py-0">{q.marks}M</Badge>
                          <Badge variant="secondary" className="text-[9px] py-0">{q.difficulty}</Badge>
                          <Badge variant="secondary" className="text-[9px] py-0">{q.bloomLevel}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {parsedImportQuestions.length > 10 && (
                    <div className="p-2 text-center text-xs text-muted-foreground bg-muted">
                      + {parsedImportQuestions.length - 10} more questions...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleBulkImportSubmit}
              disabled={importing || parsedImportQuestions.length === 0}
            >
              {importing ? 'Importing...' : `Import ${parsedImportQuestions.length} Questions`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────── VIEW QUESTION MODAL ────────────────── */}
      {selectedQuestion && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Question Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-muted/40 rounded-lg border space-y-2">
                <div className="text-sm font-semibold text-foreground">
                  <LaTeXTextRenderer text={selectedQuestion.text} />
                </div>
                {selectedQuestion.options && Array.isArray(selectedQuestion.options) && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t mt-2">
                    {selectedQuestion.options.map((opt: any, idx: number) => (
                      <div key={idx} className={`p-2 rounded text-xs border ${opt.isCorrect ? 'bg-green-50 text-green-700 font-bold border-green-200' : 'bg-background'}`}>
                        {opt.label}. {opt.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedQuestion.modelAnswer && (
                <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
                  <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Model Answer / Key:</span>
                  <div className="text-foreground pt-1">
                    <LaTeXTextRenderer text={selectedQuestion.modelAnswer} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 border rounded text-center">
                  <span className="text-muted-foreground block text-[10px]">Type</span>
                  <span className="font-bold">{selectedQuestion.type}</span>
                </div>
                <div className="p-2 border rounded text-center">
                  <span className="text-muted-foreground block text-[10px]">Marks</span>
                  <span className="font-bold">{selectedQuestion.marks} Marks</span>
                </div>
                <div className="p-2 border rounded text-center">
                  <span className="text-muted-foreground block text-[10px]">Difficulty</span>
                  <span className="font-bold">{selectedQuestion.difficulty}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ────────────────── ADD SINGLE QUESTION MODAL ────────────────── */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Single Question</DialogTitle>
            <DialogDescription>Create a new question statement with LaTeX math equations</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateQuestion} className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Subject</label>
                <select
                  value={newForm.subjectId}
                  onChange={(e) => setNewForm({ ...newForm, subjectId: e.target.value, unitId: '' })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Unit / Module</label>
                <select
                  value={newForm.unitId}
                  onChange={(e) => setNewForm({ ...newForm, unitId: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">General</option>
                  {currentUnits.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Question Type</label>
                <select
                  value={newForm.type}
                  onChange={(e) => setNewForm({ ...newForm, type: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="SHORT_ANSWER">Short Answer</option>
                  <option value="MCQ">Multiple Choice (MCQ)</option>
                  <option value="LONG_ANSWER">Long Answer</option>
                  <option value="TRUE_FALSE">True / False</option>
                  <option value="NUMERICAL">Numerical Problem</option>
                  <option value="CASE_STUDY">Case Study</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Difficulty</label>
                <select
                  value={newForm.difficulty}
                  onChange={(e) => setNewForm({ ...newForm, difficulty: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Bloom's Taxonomy</label>
                <select
                  value={newForm.bloomLevel}
                  onChange={(e) => setNewForm({ ...newForm, bloomLevel: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="REMEMBER">Remember</option>
                  <option value="UNDERSTAND">Understand</option>
                  <option value="APPLY">Apply</option>
                  <option value="ANALYZE">Analyze</option>
                  <option value="EVALUATE">Evaluate</option>
                  <option value="CREATE">Create</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Marks</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={newForm.marks}
                  onChange={(e) => setNewForm({ ...newForm, marks: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Question Text (supports LaTeX expressions like $O(N \\log N)$)</label>
              <textarea
                value={newForm.text}
                onChange={(e) => setNewForm({ ...newForm, text: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-24 font-mono"
                placeholder="Enter question statement (e.g. Solve the recurrence relation $T(N) = 2T(N/2) + O(N)$)..."
                required
              />
              {newForm.text && (
                <div className="p-2.5 bg-muted/30 rounded border text-xs space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Live Math Preview:</span>
                  <div className="font-medium text-foreground">
                    <LaTeXTextRenderer text={newForm.text} />
                  </div>
                </div>
              )}
            </div>

            {newForm.type === 'MCQ' && (
              <div className="space-y-3 p-3 bg-muted/40 rounded-lg border">
                <p className="text-xs font-bold uppercase">MCQ Options</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Option A" value={newForm.optionA} onChange={(e) => setNewForm({ ...newForm, optionA: e.target.value })} required />
                  <Input placeholder="Option B" value={newForm.optionB} onChange={(e) => setNewForm({ ...newForm, optionB: e.target.value })} required />
                  <Input placeholder="Option C" value={newForm.optionC} onChange={(e) => setNewForm({ ...newForm, optionC: e.target.value })} required />
                  <Input placeholder="Option D" value={newForm.optionD} onChange={(e) => setNewForm({ ...newForm, optionD: e.target.value })} required />
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <label className="text-xs font-semibold">Correct Option:</label>
                  <div className="flex gap-4">
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <label key={opt} className="flex items-center gap-1 text-sm">
                        <input
                          type="radio"
                          name="correctOption"
                          value={opt}
                          checked={newForm.correctOption === opt}
                          onChange={(e) => setNewForm({ ...newForm, correctOption: e.target.value })}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Model Answer / Marking Key</label>
              <textarea
                value={newForm.modelAnswer}
                onChange={(e) => setNewForm({ ...newForm, modelAnswer: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-20"
                placeholder="Detailed key or criteria for marking..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save to Question Bank</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Loading Question Bank...</div>}>
      <QuestionsTableContent />
    </Suspense>
  );
}