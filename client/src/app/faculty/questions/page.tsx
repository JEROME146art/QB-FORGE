'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, Upload, Download, Edit, Trash2, Eye, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

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

  // New question form state
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
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const data = await api<{ data: Question[]; pagination: any }>(`/questions?${params.toString()}`);
      setQuestions(data.data || []);
      setTotal(data.pagination?.total || 0);
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
        setSubjects(data.data || []);
        if (data.data && data.data.length > 0) {
          setNewForm((prev) => ({ ...prev, subjectId: data.data[0].id }));
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
        ...newForm,
        text: '',
        modelAnswer: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
      });
      fetchQuestions();
    } catch (err: any) {
      alert(err.message || 'Failed to create question');
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'EASY': return 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400';
      case 'HARD': return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700';
    }
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
        <div className="flex gap-2">
          <Button onClick={() => setNewDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
          <Button variant="outline" asChild>
            <Link href="/faculty/notes">
              <BookOpen className="h-4 w-4 mr-2" />
              AI from Notes
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
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-3">No questions match your filter criteria.</p>
              <Button onClick={() => setNewDialogOpen(true)}>Add your first question</Button>
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
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Bloom's</TableHead>
                      <TableHead className="text-right">Marks</TableHead>
                      <TableHead className="text-right">Used</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((question) => (
                      <TableRow key={question.id}>
                        <TableCell className="font-medium">
                          <p className="line-clamp-2">{question.text}</p>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-semibold">{question.subject?.code || 'CS201'}</span>
                          <p className="text-muted-foreground truncate max-w-[120px]">{question.unit?.name || 'Unit 1'}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getTypeColor(question.type)}>
                            {question.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getDifficultyColor(question.difficulty)}>
                            {question.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{question.bloomLevel}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">{question.marks}M</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">{question.usageCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedQuestion(question);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleDelete(question.id)}
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
              {total > limit && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} questions
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Question Modal */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Question Details</DialogTitle>
            <DialogDescription>Full question text, options, and model answer</DialogDescription>
          </DialogHeader>
          {selectedQuestion && (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-muted/40 rounded-lg border">
                <p className="text-base font-semibold">{selectedQuestion.text}</p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="secondary" className={getTypeColor(selectedQuestion.type)}>{selectedQuestion.type}</Badge>
                  <Badge variant="secondary" className={getDifficultyColor(selectedQuestion.difficulty)}>{selectedQuestion.difficulty}</Badge>
                  <Badge variant="outline">{selectedQuestion.bloomLevel}</Badge>
                  <Badge variant="outline">{selectedQuestion.marks} Marks</Badge>
                </div>
              </div>

              {selectedQuestion.options && Array.isArray(selectedQuestion.options) && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Options:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedQuestion.options.map((opt: any, idx: number) => (
                      <div key={idx} className={`p-2.5 rounded-md border text-sm ${opt.isCorrect ? 'bg-green-50 dark:bg-green-950/30 border-green-300 font-semibold text-green-800 dark:text-green-300' : 'bg-muted/20'}`}>
                        <span className="font-bold mr-2">{opt.label}.</span>
                        {opt.text}
                        {opt.isCorrect && <span className="ml-2 text-xs text-green-600 font-bold">✓ (Correct)</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedQuestion.modelAnswer && (
                <div className="space-y-1 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase">Model Answer / Marking Key</p>
                  <p className="text-sm text-foreground">{selectedQuestion.modelAnswer}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Question Modal */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Question</DialogTitle>
            <DialogDescription>Create a verified question and assign it to a subject</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateQuestion} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Subject</label>
                <select
                  value={newForm.subjectId}
                  onChange={(e) => setNewForm({ ...newForm, subjectId: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
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
              <label className="text-xs font-semibold">Question Text (supports LaTeX expressions like $O(N)$)</label>
              <textarea
                value={newForm.text}
                onChange={(e) => setNewForm({ ...newForm, text: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-24"
                placeholder="Enter complete question statement..."
                required
              />
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
              <Button type="submit">Save Question</Button>
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