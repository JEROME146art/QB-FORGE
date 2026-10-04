'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Timer, Send, Clock, CheckCircle, ArrowRight, ArrowLeft, GraduationCap } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PracticePage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [subRes, qRes] = await Promise.all([
          api('/subjects'),
          api('/questions?limit=50'),
        ]);
        setSubjects(subRes.data || []);
        
        // Build practice sets from available questions
        const sampleTests = [
          {
            id: 'cs201-practice-1',
            title: 'CS201 Data Structures & Algorithms - Mock Assessment',
            subject: 'CS201',
            subjectName: 'Data Structures & Algorithms',
            totalMarks: 30,
            duration: 30, // 30 min
            difficulty: 'Medium',
            questions: (qRes.data || []).slice(0, 10),
          },
          {
            id: 'cs201-practice-2',
            title: 'Trees & Graph Theory Quick Test',
            subject: 'CS201',
            subjectName: 'Data Structures & Algorithms',
            totalMarks: 20,
            duration: 20,
            difficulty: 'Hard',
            questions: (qRes.data || []).slice(10, 18),
          },
          {
            id: 'gen-practice-1',
            title: 'General Engineering & Computing Fundamentals',
            subject: 'CS/EC',
            subjectName: 'Core Foundations',
            totalMarks: 25,
            duration: 25,
            difficulty: 'Easy',
            questions: (qRes.data || []).slice(18, 26),
          },
        ];
        setAvailableTests(sampleTests);
      } catch (error) {
        console.error('Failed to initialize practice tests:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInit();
  }, []);

  const handleStartTest = (test: any) => {
    setSelectedTest(test);
    setQuestions(test.questions.length > 0 ? test.questions : [
      {
        id: 'q1',
        text: 'What is the time complexity of binary search on a sorted array of size N?',
        type: 'MCQ',
        marks: 2,
        options: [
          { label: 'A', text: 'O(log N)', isCorrect: true },
          { label: 'B', text: 'O(N)', isCorrect: false },
          { label: 'C', text: 'O(1)', isCorrect: false },
          { label: 'D', text: 'O(N^2)', isCorrect: false },
        ],
      },
      {
        id: 'q2',
        text: 'Explain the fundamental difference between a Stack and a Queue in terms of their ordering principles.',
        type: 'SHORT_ANSWER',
        marks: 5,
        modelAnswer: 'A Stack follows LIFO (Last In, First Out) while a Queue follows FIFO (First In, First Out).',
      },
      {
        id: 'q3',
        text: 'Which data structure is primarily utilized to implement Breadth-First Search (BFS) in graph traversal?',
        type: 'MCQ',
        marks: 2,
        options: [
          { label: 'A', text: 'Queue', isCorrect: true },
          { label: 'B', text: 'Stack', isCorrect: false },
          { label: 'C', text: 'Priority Queue', isCorrect: false },
          { label: 'D', text: 'Tree', isCorrect: false },
        ],
      },
    ]);
    setTimeLeft(test.duration * 60);
    setUserAnswers({});
    setCurrentQuestionIdx(0);
    setStarted(true);
    setSubmitted(false);
    setResult(null);
  };

  useEffect(() => {
    let timer: any;
    if (started && !submitted && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && started && !submitted) {
      handleSubmitTest();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, started, submitted]);

  const handleSubmitTest = () => {
    let earned = 0;
    let totalPossible = 0;

    questions.forEach((q) => {
      const qMarks = q.marks || 2;
      totalPossible += qMarks;
      const userAns = userAnswers[q.id];

      if (q.type === 'MCQ' && q.options && Array.isArray(q.options)) {
        const correctOpt = q.options.find((o: any) => o.isCorrect);
        if (correctOpt && correctOpt.label === userAns) {
          earned += qMarks;
        }
      } else if (userAns && userAns.trim().length > 5) {
        // Award reasonable partial marks for constructive written answer
        earned += Math.round(qMarks * 0.8);
      }
    });

    setSubmitted(true);
    setResult({
      score: earned,
      maxScore: totalPossible,
      percentage: Math.round((earned / (totalPossible || 1)) * 100),
      totalQuestions: questions.length,
      answeredCount: Object.keys(userAnswers).length,
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentQuestionIdx];

  return (
    <div className="space-y-6">
      {!started ? (
        // Test Selection Dashboard
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Practice Arena</h1>
            <p className="text-muted-foreground">Take timed online mock examinations with instant feedback and score breakdown</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availableTests.map((test) => (
              <Card key={test.id} className="hover:shadow-md transition-shadow flex flex-col justify-between">
                <CardHeader>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <Badge variant="outline" className="font-mono">{test.subject}</Badge>
                    <Badge variant="secondary">{test.difficulty}</Badge>
                  </div>
                  <CardTitle className="text-lg leading-snug">{test.title}</CardTitle>
                  <CardDescription>{test.subjectName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{test.duration} mins</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span>{test.totalMarks} Marks</span>
                    </div>
                  </div>
                  <Button onClick={() => handleStartTest(test)} className="w-full">
                    Start Test Now
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : !submitted ? (
        // Active Assessment Mode
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between p-4 bg-card rounded-lg border shadow-sm">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">{selectedTest?.subject}</p>
              <h2 className="text-lg font-bold">{selectedTest?.title}</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary font-mono font-bold rounded-md">
                <Clock className="h-4 w-4" />
                <span>{formatTime(timeLeft)}</span>
              </div>
              <Button variant="default" size="sm" onClick={handleSubmitTest}>
                <Send className="h-4 w-4 mr-2" />
                Submit
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Question {currentQuestionIdx + 1} of {questions.length}</span>
              <span>{Math.round(((currentQuestionIdx + 1) / questions.length) * 100)}% Progress</span>
            </div>
            <Progress value={((currentQuestionIdx + 1) / questions.length) * 100} className="h-2" />
          </div>

          <Card className="shadow-md">
            <CardContent className="p-8 space-y-6">
              <div className="flex justify-between items-start gap-4 pb-4 border-b">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">Question {currentQuestionIdx + 1}</span>
                  <p className="text-lg font-medium leading-relaxed">{currentQ?.text}</p>
                </div>
                <Badge variant="outline" className="shrink-0">{currentQ?.marks || 2} Marks</Badge>
              </div>

              {/* MCQ Options or Text Input */}
              {currentQ?.type === 'MCQ' && currentQ?.options && Array.isArray(currentQ.options) ? (
                <div className="space-y-3 pt-2">
                  {currentQ.options.map((opt: any, i: number) => {
                    const isSelected = userAnswers[currentQ.id] === opt.label;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setUserAnswers({ ...userAnswers, [currentQ.id]: opt.label })}
                        className={`w-full p-4 text-left border rounded-lg transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-medium shadow-sm ring-1 ring-primary'
                            : 'hover:bg-muted/50 border-input'
                        }`}
                      >
                        <div className={`h-6 w-6 rounded-full border flex items-center justify-center text-xs font-bold ${
                          isSelected ? 'bg-primary text-white border-primary' : 'bg-muted'
                        }`}>
                          {opt.label}
                        </div>
                        <span>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium">Your Solution / Answer:</label>
                  <textarea
                    rows={6}
                    value={userAnswers[currentQ?.id] || ''}
                    onChange={(e) => setUserAnswers({ ...userAnswers, [currentQ.id]: e.target.value })}
                    className="w-full rounded-md border border-input bg-background p-3 text-sm focus:ring-1 focus:ring-primary"
                    placeholder="Provide your step-by-step reasoning or mathematical explanation..."
                  />
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex justify-between items-center pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestionIdx === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <div className="flex gap-1 overflow-x-auto max-w-xs px-2">
                  {questions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestionIdx(idx)}
                      className={`h-7 w-7 text-xs rounded font-medium ${
                        idx === currentQuestionIdx
                          ? 'bg-primary text-white'
                          : userAnswers[questions[idx]?.id]
                          ? 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                {currentQuestionIdx < questions.length - 1 ? (
                  <Button onClick={() => setCurrentQuestionIdx((prev) => Math.min(questions.length - 1, prev + 1))}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmitTest} className="bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finish &amp; Grade
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Test Result Card
        <div className="max-w-2xl mx-auto space-y-6 pt-4">
          <Card className="shadow-lg border-muted text-center p-8">
            <CardContent className="space-y-6">
              <div className="h-20 w-20 bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-bold">Assessment Complete!</h2>
                <p className="text-muted-foreground">{selectedTest?.title}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/40 rounded-xl border">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Your Score</p>
                  <p className="text-3xl font-bold text-primary mt-1">{result?.score} / {result?.maxScore}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Percentage</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{result?.percentage}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Attempted</p>
                  <p className="text-3xl font-bold mt-1">{result?.answeredCount} / {result?.totalQuestions}</p>
                </div>
              </div>

              <div className="flex gap-4 pt-4 justify-center">
                <Button onClick={() => setStarted(false)} variant="outline">
                  Take Another Test
                </Button>
                <Button asChild>
                  <Link href="/student/results">
                    View Complete History
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}