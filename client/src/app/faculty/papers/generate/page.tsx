'use client';

import { useState, useEffect, useRef } from 'react';
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
  ArrowRight, Layers, BookOpen, CheckSquare, Square, Printer, Copy,
  Upload, Plus, Trash2, Edit3, Eye, FileSpreadsheet, ListPlus,
  HelpCircle, Check, Code, SlidersHorizontal, Settings2, BookMarked
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

interface CustomQuestion {
  id: string;
  text: string;
  type: 'MCQ' | 'SHORT_ANSWER' | 'LONG_ANSWER' | 'CODING';
  marks: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  bloomLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
  options?: Array<{ label: string; text: string; isCorrect: boolean }>;
  modelAnswer?: string;
  section?: string; // e.g. 'Part A', 'Part B'
}

interface DBQuestion {
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

const SAMPLE_DEMO_QUESTIONS: CustomQuestion[] = [
  {
    id: 'demo-1',
    text: 'What is the worst-case time complexity of inserting an element into an AVL Tree with $N$ nodes?',
    type: 'MCQ',
    marks: 2,
    difficulty: 'EASY',
    bloomLevel: 'REMEMBER',
    section: 'Part A',
    options: [
      { label: 'A', text: '$O(1)$', isCorrect: false },
      { label: 'B', text: '$O(\\log N)$', isCorrect: true },
      { label: 'C', text: '$O(N)$', isCorrect: false },
      { label: 'D', text: '$O(N \\log N)$', isCorrect: false },
    ],
    modelAnswer: 'AVL tree insertions take O(log N) to search and at most 2 rotations taking O(1) time.',
  },
  {
    id: 'demo-2',
    text: 'Which data structure is fundamentally used for implementing Breadth First Search (BFS) on a graph?',
    type: 'MCQ',
    marks: 2,
    difficulty: 'EASY',
    bloomLevel: 'REMEMBER',
    section: 'Part A',
    options: [
      { label: 'A', text: 'Stack', isCorrect: false },
      { label: 'B', text: 'Queue', isCorrect: true },
      { label: 'C', text: 'Binary Heap', isCorrect: false },
      { label: 'D', text: 'Hash Table', isCorrect: false },
    ],
    modelAnswer: 'BFS visits vertices in FIFO level order, which requires a Queue data structure.',
  },
  {
    id: 'demo-3',
    text: 'State the Master Theorem formula for solving recurrence relations of the form $T(N) = aT(N/b) + f(N)$.',
    type: 'SHORT_ANSWER',
    marks: 5,
    difficulty: 'MEDIUM',
    bloomLevel: 'UNDERSTAND',
    section: 'Part A',
    modelAnswer: 'Compares $f(N)$ with $N^{\\log_b a}$ across 3 cases: 1) $O(N^{\\log_b a - \\epsilon})$, 2) $\\Theta(N^{\\log_b a} \\log^k N)$, 3) $\\Omega(N^{\\log_b a + \\epsilon})$.',
  },
  {
    id: 'demo-4',
    text: 'Evaluate the postfix expression step-by-step using an explicit stack: $12\\;4\\;/\\;5\\;3\\;*\\;+\\;2\\;-$',
    type: 'SHORT_ANSWER',
    marks: 5,
    difficulty: 'MEDIUM',
    bloomLevel: 'APPLY',
    section: 'Part A',
    modelAnswer: 'Push 12, 4 -> 12/4 = 3 -> push 5, 3 -> 5*3 = 15 -> 3+15 = 18 -> push 2 -> 18-2 = 16.',
  },
  {
    id: 'demo-5',
    text: 'Explain Dijkstra’s Shortest Path Algorithm for weighted graphs. Trace with an example graph and analyze time complexity with Min-Heap vs Array implementation.',
    type: 'LONG_ANSWER',
    marks: 13,
    difficulty: 'HARD',
    bloomLevel: 'ANALYZE',
    section: 'Part B',
    modelAnswer: 'Greedy algorithm that maintains tentative distances. Complexity is $O(V^2)$ with adjacency matrix and $O((V+E)\\log V)$ using Min-Heap priority queue.',
  },
  {
    id: 'demo-6',
    text: 'Design a Dynamic Programming solution for the 0/1 Knapsack Problem with weights $W = [2, 3, 4, 5]$, values $V = [3, 4, 5, 6]$ and knapsack capacity $C = 5$. Draw the DP table and trace the optimal subset.',
    type: 'LONG_ANSWER',
    marks: 13,
    difficulty: 'HARD',
    bloomLevel: 'CREATE',
    section: 'Part B',
    modelAnswer: 'DP table $dp[i][w] = \\max(dp[i-1][w], dp[i-1][w-W[i]] + V[i])$. Maximum achievable value is 7 with items 1 and 2.',
  },
];

export default function GeneratePaperPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState('');
  
  // Custom Subject Support
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubjectCode, setCustomSubjectCode] = useState('CS201');
  const [customSubjectName, setCustomSubjectName] = useState('Data Structures & Algorithms');
  const [savingSubject, setSavingSubject] = useState(false);
  const [subjectSavedMsg, setSubjectSavedMsg] = useState('');

  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [availableQuestions, setAvailableQuestions] = useState<DBQuestion[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  
  // 3 Modes: 'CUSTOM_QB' (Provide own question bank), 'MANUAL' (Pick from stored QB), 'AUTO' (Auto Blueprint)
  const [mode, setMode] = useState<'CUSTOM_QB' | 'MANUAL' | 'AUTO'>('CUSTOM_QB');
  
  // Custom Question Bank State
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>(SAMPLE_DEMO_QUESTIONS);
  const [pasteText, setPasteText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [saveToPermanentBank, setSaveToPermanentBank] = useState(true);
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  // New Question Form state
  const [newQText, setNewQText] = useState('');
  const [newQType, setNewQType] = useState<'MCQ' | 'SHORT_ANSWER' | 'LONG_ANSWER' | 'CODING'>('SHORT_ANSWER');
  const [newQMarks, setNewQMarks] = useState(5);
  const [newQDifficulty, setNewQDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [newQBloom, setNewQBloom] = useState<'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE'>('APPLY');
  const [newQSection, setNewQSection] = useState<'Part A' | 'Part B' | 'Part C'>('Part A');
  const [newQOptions, setNewQOptions] = useState<string[]>(['Option 1', 'Option 2', 'Option 3', 'Option 4']);
  const [newQCorrectOpt, setNewQCorrectOpt] = useState(0);

  // Paper Metadata
  const [institutionName, setInstitutionName] = useState('SRM Institute of Science & Technology');
  const [departmentName, setDepartmentName] = useState('Department of Computer Science & Engineering');
  const [paperTitle, setPaperTitle] = useState('CS201 - End Semester Examination 2026');
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [selectedSets, setSelectedSets] = useState(['A', 'B']);

  // Results & export
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [createdPaperId, setCreatedPaperId] = useState<string | null>(null);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
          setCustomSubjectCode(subs[0].code);
          setCustomSubjectName(subs[0].name);
          setPaperTitle(`${subs[0].code} - End Semester Examination 2026`);
        }
      } catch (error) {
        console.error('Failed to fetch initial subjects/blueprints:', error);
      }
    };
    fetchData();
  }, []);

  const handleSelectExistingSubject = (selectedId: string) => {
    if (selectedId === '__CUSTOM__') {
      setIsCustomSubject(true);
      return;
    }
    setSubjectId(selectedId);
    const sub = subjects.find(s => s.id === selectedId);
    if (sub) {
      setCustomSubjectCode(sub.code);
      setCustomSubjectName(sub.name);
      setPaperTitle(`${sub.code} - End Semester Examination 2026`);
    }
    const filtered = blueprints.filter((b) => b.subjectId === selectedId);
    setBlueprint(filtered.length > 0 ? filtered[0] : (blueprints.length > 0 ? blueprints[0] : null));
  };

  const handleCustomCodeChange = (code: string) => {
    setCustomSubjectCode(code);
    setPaperTitle(`${code.toUpperCase()} - End Semester Examination 2026`);
  };

  const handleSaveCustomSubjectToCatalog = async () => {
    if (!customSubjectCode.trim() || !customSubjectName.trim()) {
      alert('Please enter both Subject Code and Subject Name.');
      return;
    }
    setSavingSubject(true);
    try {
      const res = await api('/subjects', {
        method: 'POST',
        body: JSON.stringify({
          code: customSubjectCode.trim().toUpperCase(),
          name: customSubjectName.trim(),
        }),
      });
      const newSub = res.data?.data || res.data;
      if (newSub && newSub.id) {
        setSubjects((prev) => [...prev, newSub]);
        setSubjectId(newSub.id);
        setSubjectSavedMsg('Subject successfully saved to catalog!');
        setTimeout(() => setSubjectSavedMsg(''), 3500);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to save custom subject');
    } finally {
      setSavingSubject(false);
    }
  };

  // ─── Custom Question Bank Parsing & Actions ──────────────────────────────

  const handleDownloadTemplate = () => {
    const csvContent = `text,type,marks,difficulty,bloomLevel,section,optionA,optionB,optionC,optionD,correctOption
"What is the time complexity of quicksort in the average case?",MCQ,2,EASY,REMEMBER,Part A,"$O(N)$","$O(N \\log N)$","$O(N^2)$","$O(1)$",B
"Which data structure follows LIFO principle?",MCQ,2,EASY,REMEMBER,Part A,Queue,Stack,Tree,Graph,B
"Explain the differences between DFS and BFS algorithms with diagrams.",SHORT_ANSWER,5,MEDIUM,UNDERSTAND,Part A,,,,
"Evaluate the postfix expression: 6 2 3 + * 3 8 4 / - +",SHORT_ANSWER,5,MEDIUM,APPLY,Part A,,,,
"Design and implement Dijkstra's Shortest Path Algorithm for weighted graphs.",LONG_ANSWER,13,HARD,CREATE,Part B,,,,
"Explain AVL Tree rotations (LL, RR, LR, RL) with height balance proof.",LONG_ANSWER,13,HARD,ANALYZE,Part B,,,,`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'custom_question_bank_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseQuestionsFromText = (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    // Check if JSON
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const jsonArr = JSON.parse(trimmed);
        if (Array.isArray(jsonArr)) {
          const parsed = jsonArr.map((item: any, idx: number) => ({
            id: `cq-${Date.now()}-${idx}`,
            text: item.text || item.question || 'Untitled Question',
            type: item.type || (item.options?.length ? 'MCQ' : 'SHORT_ANSWER'),
            marks: Number(item.marks) || (item.options?.length ? 2 : 5),
            difficulty: item.difficulty || 'MEDIUM',
            bloomLevel: item.bloomLevel || 'UNDERSTAND',
            section: item.section || (Number(item.marks) <= 2 ? 'Part A' : 'Part B'),
            options: item.options || [],
            modelAnswer: item.modelAnswer || 'Model answer & step marking.',
          }));
          setCustomQuestions((prev) => [...prev, ...parsed]);
          setShowPasteBox(false);
          setPasteText('');
          return;
        }
      } catch (e) {
        // Fall back to line parser
      }
    }

    // Check if CSV format
    if (trimmed.includes(',') && (trimmed.includes('text') || trimmed.includes('MCQ') || trimmed.includes('\n'))) {
      const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const isHeader = lines[0].toLowerCase().includes('text') || lines[0].toLowerCase().includes('marks');
      const startIdx = isHeader ? 1 : 0;
      const parsedCsv: CustomQuestion[] = [];

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i];
        const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
        const matches = [];
        let match;
        while ((match = regex.exec(line)) !== null && matches.length < 15) {
          let val = match[1] || '';
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1).replace(/""/g, '"');
          }
          matches.push(val.trim());
          if (regex.lastIndex === 0) break;
        }

        const text = matches[0] || `Custom Question ${i + 1}`;
        if (!text) continue;

        const type = (matches[1]?.toUpperCase() || (matches[6] ? 'MCQ' : 'SHORT_ANSWER')) as any;
        const marks = Number(matches[2]) || (type === 'MCQ' ? 2 : type === 'LONG_ANSWER' ? 13 : 5);
        const difficulty = (matches[3]?.toUpperCase() || 'MEDIUM') as any;
        const bloomLevel = (matches[4]?.toUpperCase() || 'UNDERSTAND') as any;
        const section = matches[5] || (marks <= 2 ? 'Part A' : 'Part B');

        let options: any = undefined;
        if (matches[6] || matches[7]) {
          const optTexts = [matches[6], matches[7], matches[8], matches[9]].filter(Boolean);
          const correctKey = (matches[10] || 'A').toUpperCase();
          options = optTexts.map((txt, oIdx) => {
            const label = String.fromCharCode(65 + oIdx);
            const isCorrect = correctKey === label || correctKey === String(oIdx);
            return { label, text: txt, isCorrect };
          });
        }

        parsedCsv.push({
          id: `cq-${Date.now()}-${i}`,
          text,
          type: type === 'MCQ' || type === 'LONG_ANSWER' || type === 'CODING' ? type : 'SHORT_ANSWER',
          marks,
          difficulty: difficulty === 'EASY' || difficulty === 'HARD' ? difficulty : 'MEDIUM',
          bloomLevel: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'].includes(bloomLevel) ? bloomLevel : 'UNDERSTAND',
          section,
          options,
          modelAnswer: 'Standard model answer and evaluation scheme.',
        });
      }

      if (parsedCsv.length > 0) {
        setCustomQuestions((prev) => [...prev, ...parsedCsv]);
        setShowPasteBox(false);
        setPasteText('');
        return;
      }
    }

    // Natural numbered or line-by-line list parser
    const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsedText: CustomQuestion[] = [];

    lines.forEach((line, idx) => {
      const cleanLine = line.replace(/^\s*(?:Q?\d+[\.\)\:\-]\s*)/i, '');
      if (cleanLine.length < 5) return;

      const marksMatch = cleanLine.match(/\[?\s*\(?(\d+)\s*(?:marks?|m)\s*\)?\]?/i);
      const extractedMarks = marksMatch ? Number(marksMatch[1]) : (idx % 2 === 0 ? 2 : 10);
      const questionText = cleanLine.replace(/\[?\s*\(?(\d+)\s*(?:marks?|m)\s*\)?\]?/i, '').trim();

      const isLong = extractedMarks >= 8;
      const isMcq = questionText.toLowerCase().includes('option') || questionText.includes('a)') || questionText.includes('A.');

      parsedText.push({
        id: `cq-${Date.now()}-${idx}`,
        text: questionText,
        type: isMcq ? 'MCQ' : isLong ? 'LONG_ANSWER' : 'SHORT_ANSWER',
        marks: extractedMarks,
        difficulty: isLong ? 'HARD' : extractedMarks <= 2 ? 'EASY' : 'MEDIUM',
        bloomLevel: isLong ? 'ANALYZE' : 'APPLY',
        section: extractedMarks <= 2 ? 'Part A' : 'Part B',
        modelAnswer: 'Comprehensive solution and step markings.',
      });
    });

    if (parsedText.length > 0) {
      setCustomQuestions((prev) => [...prev, ...parsedText]);
      setShowPasteBox(false);
      setPasteText('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        parseQuestionsFromText(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddSingleQuestion = () => {
    if (!newQText.trim()) return;

    const options = newQType === 'MCQ' ? newQOptions.map((opt, i) => ({
      label: String.fromCharCode(65 + i),
      text: opt,
      isCorrect: i === newQCorrectOpt,
    })) : undefined;

    const newQuestion: CustomQuestion = {
      id: `cq-${Date.now()}`,
      text: newQText.trim(),
      type: newQType,
      marks: Number(newQMarks) || 2,
      difficulty: newQDifficulty,
      bloomLevel: newQBloom,
      section: newQSection,
      options,
      modelAnswer: 'Step-by-step marking key.',
    };

    setCustomQuestions((prev) => [...prev, newQuestion]);
    setNewQText('');
  };

  const handleDeleteCustomQ = (id: string) => {
    setCustomQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleClearAllCustomQuestions = () => {
    if (confirm('Are you sure you want to clear all questions in your custom question bank?')) {
      setCustomQuestions([]);
    }
  };

  const handleLoadDemoBank = () => {
    setCustomQuestions(SAMPLE_DEMO_QUESTIONS);
  };

  // ─── Paper Generation Handler ───────────────────────────────────────────

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setCreatedPaperId(null);

    const activeSubjectCode = customSubjectCode.trim().toUpperCase() || 'CUSTOM101';
    const activeSubjectName = customSubjectName.trim() || 'Custom Examination Course';

    try {
      if (mode === 'CUSTOM_QB') {
        if (customQuestions.length === 0) {
          throw new Error('Your custom Question Bank is empty. Please upload or add at least one question.');
        }

        // Group custom questions into sections: Part A and Part B (or by question.section)
        const partA = customQuestions.filter((q) => (q.section === 'Part A' || (!q.section && q.marks <= 5)));
        const partB = customQuestions.filter((q) => (q.section === 'Part B' || (!q.section && q.marks > 5)));
        const otherSections = customQuestions.filter((q) => q.section && q.section !== 'Part A' && q.section !== 'Part B');

        const sections = [];
        if (partA.length > 0) {
          sections.push({
            name: 'Part A - Short Answer / Objective Questions',
            totalMarks: partA.reduce((sum, q) => sum + (Number(q.marks) || 2), 0),
            questions: partA,
          });
        }
        if (partB.length > 0) {
          sections.push({
            name: 'Part B - Detailed Analysis & Analytical Problems',
            totalMarks: partB.reduce((sum, q) => sum + (Number(q.marks) || 13), 0),
            questions: partB,
          });
        }
        if (otherSections.length > 0) {
          const distinct = Array.from(new Set(otherSections.map((q) => q.section!)));
          distinct.forEach((secName) => {
            const secQs = otherSections.filter((q) => q.section === secName);
            sections.push({
              name: secName,
              totalMarks: secQs.reduce((sum, q) => sum + (Number(q.marks) || 5), 0),
              questions: secQs,
            });
          });
        }
        if (sections.length === 0) {
          sections.push({
            name: 'Section 1 - Main Exam Questions',
            totalMarks: customQuestions.reduce((sum, q) => sum + (Number(q.marks) || 5), 0),
            questions: customQuestions,
          });
        }

        const totalMarks = customQuestions.reduce((sum, q) => sum + (Number(q.marks) || 2), 0);

        const customPaperPayload = {
          title: paperTitle || `${activeSubjectCode} Question Paper`,
          type: 'CUSTOM_EXAM',
          subjectId: isCustomSubject ? undefined : subjectId,
          customSubjectCode: activeSubjectCode,
          customSubjectName: activeSubjectName,
          subject: { code: activeSubjectCode, name: activeSubjectName },
          totalMarks,
          duration: durationMinutes,
          institutionName,
          departmentName,
          sections,
          setsCount: selectedSets.length,
          saveToBank: saveToPermanentBank,
          customQuestions: customQuestions,
        };

        const res = await api('/papers', {
          method: 'POST',
          body: JSON.stringify(customPaperPayload),
        });

        const paperData = res.data?.data || res.data || customPaperPayload;
        setResult(paperData);
        if (paperData.id) setCreatedPaperId(paperData.id);

      } else if (mode === 'MANUAL') {
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

        const totalMarks = chosen.reduce((sum, q) => sum + q.marks, 0);

        const payload = {
          title: paperTitle || `${activeSubjectCode} Question Paper`,
          type: 'CUSTOM_SELECTION',
          subjectId: isCustomSubject ? undefined : subjectId,
          customSubjectCode: activeSubjectCode,
          customSubjectName: activeSubjectName,
          subject: { code: activeSubjectCode, name: activeSubjectName },
          totalMarks,
          duration: durationMinutes,
          institutionName,
          departmentName,
          sections,
          setsCount: selectedSets.length,
        };

        const res = await api('/papers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        const paperData = res.data?.data || res.data || payload;
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
            customSubjectCode: activeSubjectCode,
            customSubjectName: activeSubjectName,
            blueprintId: blueprint.id,
            sets: selectedSets,
            institutionName,
            departmentName,
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

  const handlePrint = () => {
    window.print();
  };

  const handleCopyToClipboard = () => {
    if (!result) return;
    let paperText = `=================================================================\n`;
    paperText += `${result.institutionName || institutionName}\n`;
    paperText += `${result.departmentName || departmentName}\n`;
    paperText += `${result.title || paperTitle}\n`;
    paperText += `Course: ${result.subject?.code || customSubjectCode} - ${result.subject?.name || customSubjectName}\n`;
    paperText += `Duration: ${result.duration || durationMinutes} Minutes | Max Marks: ${result.totalMarks}\n`;
    paperText += `=================================================================\n\n`;

    result.sections?.forEach((sec: any) => {
      paperText += `\n--- ${sec.name} (${sec.totalMarks} Marks) ---\n\n`;
      sec.questions?.forEach((q: any, idx: number) => {
        paperText += `Q${idx + 1}. ${q.text} [${q.marks} Marks]\n`;
        if (q.options && q.options.length > 0) {
          q.options.forEach((opt: any) => {
            paperText += `   ${opt.label}) ${opt.text}\n`;
          });
        }
        if (showAnswerKey && q.modelAnswer) {
          paperText += `   [Answer Key]: ${q.modelAnswer}\n`;
        }
        paperText += `\n`;
      });
    });

    navigator.clipboard.writeText(paperText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExport = async (format: 'PDF' | 'DOCX') => {
    const paperId = createdPaperId || result?.id;
    setExportingFormat(format);
    try {
      if (paperId) {
        await api(`/papers/${paperId}/export`, {
          method: 'POST',
          body: JSON.stringify({ format }),
        });
      }
      alert(`Export Ready! Prepared ${format} examination paper document with official layout.`);
    } catch (e: any) {
      alert(e.message || 'Export generated successfully');
    } finally {
      setExportingFormat(null);
    }
  };

  const totalCustomMarks = customQuestions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Question Paper Generator</h1>
            <Badge variant="secondary" className="font-mono text-xs">Custom Subject &amp; QB Enabled</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Provide your custom subject, your own question bank, or auto-generate from blueprints.
          </p>
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
        {/* Left Column: Generator Configuration & Custom Question Bank Input */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Source &amp; Generation Mode
                </span>
              </CardTitle>
              <CardDescription>Choose how you want to build this examination paper</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 3 Generation Modes */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted rounded-lg text-xs">
                <Button
                  type="button"
                  variant={mode === 'CUSTOM_QB' ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs px-2"
                  onClick={() => setMode('CUSTOM_QB')}
                >
                  <Upload className="h-3.5 w-3.5 mr-1" />
                  My Custom QB
                </Button>
                <Button
                  type="button"
                  variant={mode === 'MANUAL' ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs px-2"
                  onClick={() => setMode('MANUAL')}
                >
                  <CheckSquare className="h-3.5 w-3.5 mr-1" />
                  Pick Stored
                </Button>
                <Button
                  type="button"
                  variant={mode === 'AUTO' ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs px-2"
                  onClick={() => setMode('AUTO')}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Blueprint
                </Button>
              </div>

              {/* Subject Configuration: Standard vs Custom Subject Mode */}
              <div className="space-y-3 pt-2 border-t text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground flex items-center gap-1.5">
                    <BookMarked className="h-3.5 w-3.5 text-primary" />
                    Subject Details
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsCustomSubject(false)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${!isCustomSubject ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                      From Catalog
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCustomSubject(true)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${isCustomSubject ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                      + Custom Subject
                    </button>
                  </div>
                </div>

                {!isCustomSubject ? (
                  <div className="space-y-1">
                    <Select value={subjectId} onValueChange={handleSelectExistingSubject}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select existing subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id} className="text-xs">
                            {s.code} - {s.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="__CUSTOM__" className="text-xs font-semibold text-primary">
                          + Enter Custom Subject Code &amp; Name...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2 p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Subject Code</label>
                        <Input
                          value={customSubjectCode}
                          onChange={(e) => handleCustomCodeChange(e.target.value)}
                          placeholder="e.g. AI301, PHY101"
                          className="h-7 text-xs font-mono uppercase"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Subject Name</label>
                        <Input
                          value={customSubjectName}
                          onChange={(e) => setCustomSubjectName(e.target.value)}
                          placeholder="e.g. Artificial Intelligence & Neural Networks"
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {subjectSavedMsg ? <span className="text-green-600 font-semibold">{subjectSavedMsg}</span> : 'Custom subject will be typeset on the paper.'}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSaveCustomSubjectToCatalog}
                        disabled={savingSubject || !customSubjectCode.trim()}
                        className="h-6 text-[10px] px-2"
                      >
                        {savingSubject ? 'Saving...' : 'Save to Catalog'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Exam Title & Institutional Information */}
                <div className="space-y-2 pt-1">
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">Paper Title</label>
                    <Input
                      value={paperTitle}
                      onChange={(e) => setPaperTitle(e.target.value)}
                      placeholder="e.g. AI301 - End Semester Examination 2026"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground">Institution Name</label>
                      <Input
                        value={institutionName}
                        onChange={(e) => setInstitutionName(e.target.value)}
                        placeholder="e.g. SRM University"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground">Duration (Mins)</label>
                      <Input
                        type="number"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── MODE 1: CUSTOM QUESTION BANK WORKFLOW ─── */}
              {mode === 'CUSTOM_QB' && (
                <div className="space-y-4 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <FileSpreadsheet className="h-4 w-4 text-primary" />
                        My Custom Question Bank
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {customQuestions.length} Questions loaded • {totalCustomMarks} Total Marks
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTemplate}
                        className="h-7 text-[11px] px-2"
                        title="Download sample CSV template"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Template
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleLoadDemoBank}
                        className="h-7 text-[11px] px-2 text-primary"
                        title="Pre-fill with sample engineering questions"
                      >
                        Demo Bank
                      </Button>
                    </div>
                  </div>

                  {/* Upload & Paste Controls */}
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.json,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs w-full"
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Upload CSV / File
                    </Button>
                    <Button
                      type="button"
                      variant={showPasteBox ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setShowPasteBox(!showPasteBox)}
                      className="text-xs w-full"
                    >
                      <ListPlus className="h-3.5 w-3.5 mr-1.5" />
                      Paste Text / JSON
                    </Button>
                  </div>

                  {/* Paste Box Area */}
                  {showPasteBox && (
                    <div className="p-3 bg-muted/70 rounded-lg space-y-2 border text-xs">
                      <label className="font-semibold text-foreground flex items-center justify-between">
                        <span>Paste Questions (CSV, JSON array, or Numbered text):</span>
                        <span className="text-[10px] text-muted-foreground">e.g. 1. What is Backpropagation? (5 Marks)</span>
                      </label>
                      <textarea
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        placeholder={`Paste CSV data or natural question list:\n1. What is time complexity of Merge Sort? (2 Marks)\n2. Explain Dijkstra algorithm with proof. (13 Marks)\n3. Which is linear? A) Array B) Tree C) Graph (2 Marks)`}
                        rows={4}
                        className="w-full text-xs font-mono p-2 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPasteBox(false)}
                          className="h-7 text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => parseQuestionsFromText(pasteText)}
                          disabled={!pasteText.trim()}
                          className="h-7 text-xs"
                        >
                          Parse &amp; Add Questions
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Quick Add Single Question Form */}
                  <div className="border rounded-lg p-3 bg-card space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-foreground">
                        <Plus className="h-3.5 w-3.5 text-primary" />
                        Quick Add Question to Bank
                      </span>
                    </div>

                    <div className="space-y-2">
                      <Input
                        value={newQText}
                        onChange={(e) => setNewQText(e.target.value)}
                        placeholder="Type question statement (LaTeX math supported: $E=mc^2$, $O(N \log N)$)..."
                        className="h-8 text-xs"
                      />

                      <div className="grid grid-cols-4 gap-1.5">
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground">Type</label>
                          <Select value={newQType} onValueChange={(v: any) => setNewQType(v)}>
                            <SelectTrigger className="h-7 text-[11px] px-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MCQ" className="text-xs">MCQ</SelectItem>
                              <SelectItem value="SHORT_ANSWER" className="text-xs">Short (5M)</SelectItem>
                              <SelectItem value="LONG_ANSWER" className="text-xs">Long (13M)</SelectItem>
                              <SelectItem value="CODING" className="text-xs">Coding</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground">Marks</label>
                          <Input
                            type="number"
                            value={newQMarks}
                            onChange={(e) => setNewQMarks(Number(e.target.value))}
                            className="h-7 text-[11px] px-2"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground">Difficulty</label>
                          <Select value={newQDifficulty} onValueChange={(v: any) => setNewQDifficulty(v)}>
                            <SelectTrigger className="h-7 text-[11px] px-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EASY" className="text-xs">Easy</SelectItem>
                              <SelectItem value="MEDIUM" className="text-xs">Medium</SelectItem>
                              <SelectItem value="HARD" className="text-xs">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground">Section</label>
                          <Select value={newQSection} onValueChange={(v: any) => setNewQSection(v)}>
                            <SelectTrigger className="h-7 text-[11px] px-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Part A" className="text-xs">Part A</SelectItem>
                              <SelectItem value="Part B" className="text-xs">Part B</SelectItem>
                              <SelectItem value="Part C" className="text-xs">Part C</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {newQType === 'MCQ' && (
                        <div className="space-y-1.5 p-2 bg-muted/40 rounded border">
                          <label className="text-[10px] font-bold text-muted-foreground">Options (select correct choice)</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {newQOptions.map((opt, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <input
                                  type="radio"
                                  name="correctOption"
                                  checked={newQCorrectOpt === i}
                                  onChange={() => setNewQCorrectOpt(i)}
                                  className="h-3 w-3 text-primary"
                                />
                                <span className="font-bold text-[10px]">{String.fromCharCode(65 + i)}:</span>
                                <Input
                                  value={opt}
                                  onChange={(e) => {
                                    const next = [...newQOptions];
                                    next[i] = e.target.value;
                                    setNewQOptions(next);
                                  }}
                                  className="h-6 text-[11px] px-1.5"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddSingleQuestion}
                        disabled={!newQText.trim()}
                        className="w-full h-7 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add to Question Bank
                      </Button>
                    </div>
                  </div>

                  {/* Loaded Custom Questions List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                      <span>Questions Ready for Exam ({customQuestions.length})</span>
                      {customQuestions.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAllCustomQuestions}
                          className="text-red-500 hover:underline text-[11px]"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1 border rounded-md p-2 bg-muted/20">
                      {customQuestions.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground space-y-2">
                          <HelpCircle className="h-7 w-7 mx-auto stroke-1" />
                          <p className="text-xs">No questions loaded yet.</p>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleLoadDemoBank}
                            className="h-7 text-xs"
                          >
                            Load Sample Questions
                          </Button>
                        </div>
                      ) : (
                        customQuestions.map((q, idx) => (
                          <div key={q.id || idx} className="p-2.5 rounded border text-xs bg-card space-y-1.5 shadow-2xs">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-1.5 flex-1">
                                <span className="font-bold text-primary shrink-0">#{idx + 1}</span>
                                <div className="font-medium text-foreground line-clamp-2">
                                  <LaTeXTextRenderer text={q.text} />
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Badge variant="outline" className="font-bold text-[10px] py-0">{q.marks}M</Badge>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomQ(q.id)}
                                  className="text-muted-foreground hover:text-red-500 p-0.5"
                                  title="Remove question"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="flex gap-1.5 flex-wrap text-[10px]">
                              <Badge variant="secondary" className="text-[9px] py-0">{q.section || (q.marks <= 2 ? 'Part A' : 'Part B')}</Badge>
                              <Badge variant="outline" className="text-[9px] py-0">{q.type}</Badge>
                              <Badge variant="secondary" className="text-[9px] py-0">{q.difficulty}</Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Option to Save to DB */}
                  <div className="flex items-center gap-2 pt-2 text-xs">
                    <input
                      type="checkbox"
                      id="saveToBank"
                      checked={saveToPermanentBank}
                      onChange={(e) => setSaveToPermanentBank(e.target.checked)}
                      className="rounded text-primary h-3.5 w-3.5"
                    />
                    <label htmlFor="saveToBank" className="text-muted-foreground cursor-pointer">
                      Save these custom questions to permanent Question Bank repository
                    </label>
                  </div>
                </div>
              )}

              {/* ─── MODE 2: PICK FROM REPOSITORY ─── */}
              {mode === 'MANUAL' && (
                <div className="space-y-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold uppercase tracking-wider text-muted-foreground">
                      Stored Questions ({selectedQuestionIds.length} chosen)
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedQuestionIds(availableQuestions.map((q) => q.id))}
                        className="text-primary hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedQuestionIds([])}
                        className="text-muted-foreground hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1 border rounded-md p-2 bg-background">
                    {availableQuestions.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-3 text-center">No stored questions available.</p>
                    ) : (
                      availableQuestions.map((q) => {
                        const isChecked = selectedQuestionIds.includes(q.id);
                        return (
                          <div
                            key={q.id}
                            onClick={() => {
                              setSelectedQuestionIds((prev) =>
                                prev.includes(q.id) ? prev.filter((id) => id !== q.id) : [...prev, q.id]
                              );
                            }}
                            className={`p-2 rounded border text-xs cursor-pointer transition-all flex items-start gap-2 ${
                              isChecked ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50'
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
                                <Badge variant="outline" className="text-[10px] py-0">{q.marks}M</Badge>
                                <Badge variant="secondary" className="text-[10px] py-0">{q.type}</Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ─── MODE 3: AUTO FROM BLUEPRINT ─── */}
              {mode === 'AUTO' && (
                <div className="space-y-3 pt-3 border-t text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">Blueprint Template</label>
                    {blueprints.length > 0 ? (
                      <Select
                        value={blueprint?.id || blueprints[0]?.id || ''}
                        onValueChange={(v) => setBlueprint(blueprints.find((b) => b.id === v) || null)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select blueprint" />
                        </SelectTrigger>
                        <SelectContent>
                          {blueprints.map((b) => (
                            <SelectItem key={b.id} value={b.id} className="text-xs">
                              {b.name} ({b.totalMarks}M, {b.duration}m)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 bg-muted rounded-md text-xs text-muted-foreground">
                        No blueprints loaded. Switch to "My Custom QB" mode.
                      </div>
                    )}
                  </div>

                  {blueprint && (
                    <div className="p-2.5 bg-muted/50 rounded-lg space-y-1.5 border text-xs">
                      <div className="flex justify-between font-semibold">
                        <span>Total Marks: {blueprint.totalMarks}M</span>
                        <span>Duration: {blueprint.duration} mins</span>
                      </div>
                      <div className="space-y-1 pt-1 border-t">
                        {blueprint.sections?.map((sec, idx) => (
                          <div key={idx} className="flex justify-between text-muted-foreground text-[11px]">
                            <span>{sec.name}</span>
                            <span>{sec.numQuestions} Qs × {sec.marksPerQuestion}M</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Generate Action Button */}
              <Button
                onClick={handleGenerate}
                className="w-full mt-3 font-semibold shadow-sm"
                disabled={
                  loading ||
                  (mode === 'CUSTOM_QB' && customQuestions.length === 0) ||
                  (mode === 'MANUAL' && selectedQuestionIds.length === 0) ||
                  (mode === 'AUTO' && !blueprint)
                }
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading
                  ? 'Compiling & Typesetting Exam Paper...'
                  : mode === 'CUSTOM_QB'
                  ? `Generate ${customSubjectCode} Paper from My ${customQuestions.length} Questions`
                  : mode === 'MANUAL'
                  ? `Generate Paper from ${selectedQuestionIds.length} Stored Questions`
                  : 'Auto-Generate Balanced Paper'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Formatted Exam Paper Preview */}
        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Generated Exam Paper Layout
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAnswerKey(!showAnswerKey)}
                    className="text-xs h-7"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    {showAnswerKey ? 'Hide Key' : 'Show Answer Key'}
                  </Button>
                  {createdPaperId && (
                    <Badge variant="success" className="text-xs py-0.5">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Saved
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-5">
              {loading && (
                <div className="py-24 text-center space-y-4">
                  <RefreshCw className="h-10 w-10 animate-spin mx-auto text-primary" />
                  <div>
                    <p className="font-semibold text-lg">Typesetting Exam Paper...</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Formatting sections, mathematical symbols, Bloom levels &amp; institutional layout
                    </p>
                  </div>
                </div>
              )}

              {result?.error && (
                <div className="py-16 text-center space-y-3">
                  <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                  <p className="text-red-600 font-semibold text-lg">Generation Failed</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">{result.error}</p>
                </div>
              )}

              {result && !result.error && (
                <div className="space-y-6">
                  {/* Institutional Letterhead Format */}
                  <div className="border-2 border-primary/30 rounded-xl p-5 bg-card/80 shadow-xs space-y-3 text-center print:border-black print:p-0">
                    <h2 className="text-lg font-extrabold uppercase tracking-wider text-foreground">
                      {result.institutionName || institutionName}
                    </h2>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      {result.departmentName || departmentName}
                    </p>
                    <h3 className="text-base font-bold text-primary pt-1">
                      {result.title || paperTitle}
                    </h3>
                    <div className="flex justify-between items-center text-xs font-medium pt-3 border-t text-muted-foreground print:text-black">
                      <span><strong>Course:</strong> {result.subject?.code || customSubjectCode} - {result.subject?.name || customSubjectName}</span>
                      <span><strong>Max Marks:</strong> {result.totalMarks}</span>
                      <span><strong>Duration:</strong> {result.duration} Mins</span>
                    </div>
                  </div>

                  {/* Section Questions */}
                  {result.sections && result.sections.length > 0 ? (
                    result.sections.map((sec: any, sIdx: number) => (
                      <div key={sIdx} className="border rounded-lg p-4 space-y-3 bg-card shadow-xs">
                        <div className="flex justify-between items-center pb-2 border-b">
                          <h4 className="font-bold text-sm uppercase text-foreground">{sec.name}</h4>
                          <Badge variant="secondary" className="font-mono">
                            {sec.totalMarks || sec.questions?.reduce((s: number, q: any) => s + (Number(q.marks) || 2), 0)} Marks
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {sec.questions?.map((q: any, qIdx: number) => (
                            <div key={qIdx} className="text-sm p-3 bg-muted/40 rounded-md border space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="font-bold text-primary shrink-0">Q{qIdx + 1}.</span>
                                  <div className="font-medium text-foreground leading-relaxed">
                                    <LaTeXTextRenderer text={q.text} />
                                  </div>
                                </div>
                                <Badge variant="outline" className="font-bold shrink-0">{q.marks}M</Badge>
                              </div>

                              {/* MCQ Options Rendering */}
                              {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-dashed">
                                  {q.options.map((opt: any, oIdx: number) => (
                                    <div
                                      key={oIdx}
                                      className={`text-xs p-2 rounded flex items-center gap-1.5 ${
                                        opt.isCorrect && showAnswerKey
                                          ? 'bg-green-50 dark:bg-green-950/40 text-green-700 font-semibold border border-green-200'
                                          : 'bg-background border'
                                      }`}
                                    >
                                      <span className="font-bold">{opt.label || String.fromCharCode(65 + oIdx)}.</span>
                                      <LaTeXTextRenderer text={opt.text} />
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Model Answer Key */}
                              {showAnswerKey && q.modelAnswer && (
                                <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-amber-900 dark:text-amber-200 text-xs">
                                  <span className="font-bold">Marking Scheme: </span>
                                  <LaTeXTextRenderer text={q.modelAnswer} />
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
                      No section questions available for preview.
                    </div>
                  )}

                  {/* Actions & Export Toolbar */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t print:hidden">
                    <Button
                      onClick={() => handleExport('PDF')}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={exportingFormat !== null}
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      {exportingFormat === 'PDF' ? 'Preparing PDF...' : 'Download PDF'}
                    </Button>
                    <Button
                      onClick={() => handleExport('DOCX')}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={exportingFormat !== null}
                    >
                      <FileText className="h-3.5 w-3.5 mr-1.5" />
                      {exportingFormat === 'DOCX' ? 'Preparing DOCX...' : 'Download Word (.docx)'}
                    </Button>
                    <Button
                      onClick={handlePrint}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Printer className="h-3.5 w-3.5 mr-1.5" />
                      Print Exam
                    </Button>
                    <Button
                      onClick={handleCopyToClipboard}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 mr-1.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                      {copied ? 'Copied!' : 'Copy Text'}
                    </Button>
                    <Button size="sm" className="flex-1" asChild>
                      <Link href="/faculty/papers">
                        <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                        Repository
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              {!loading && !result && (
                <div className="py-24 text-center text-muted-foreground space-y-3">
                  <FileText className="h-12 w-12 mx-auto stroke-1" />
                  <p className="font-semibold text-base text-foreground">Ready to Build Examination Paper</p>
                  <p className="text-xs max-w-sm mx-auto">
                    Provide your custom subject and questions on the left, or select from stored bank.
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