'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Loader2, Save, Plus, X } from 'lucide-react';
import { LaTeXRenderer } from './LaTeXRenderer';

// Dynamic import for ReactQuill to prevent SSR window issues
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="h-48 border rounded-md p-4 text-muted-foreground flex items-center justify-center">Loading Rich Editor...</div>,
});

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'clean'],
  ],
};

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'list',
  'bullet',
  'link',
];

interface QuestionEditorProps {
  initialContent?: string;
  initialType?: string;
  initialDifficulty?: string;
  initialBloomLevel?: string;
  initialMarks?: number;
  initialTags?: string[];
  onContentChange?: (content: string) => void;
  onQuestionChange?: (question: any) => void;
  onSave?: () => void;
  isLoading?: boolean;
}

export default function QuestionEditor({
  initialContent = '',
  initialType = 'MCQ',
  initialDifficulty = 'EASY',
  initialBloomLevel = 'REMEMBER',
  initialMarks = 2,
  initialTags = [],
  onContentChange,
  onQuestionChange,
  onSave,
  isLoading = false,
}: QuestionEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [type, setType] = useState(initialType);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [bloomLevel, setBloomLevel] = useState(initialBloomLevel);
  const [marks, setMarks] = useState(initialMarks);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');

  const question = useMemo(() => ({
    content,
    type,
    difficulty,
    bloomLevel,
    marks,
    tags,
  }), [content, type, difficulty, bloomLevel, marks, tags]);

  useEffect(() => {
    if (onQuestionChange) {
      onQuestionChange(question);
    }
  }, [question, onQuestionChange]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (onContentChange) {
      onContentChange(newContent);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Question Editor</CardTitle>
        <CardDescription>
          Format your question statement with LaTeX math support (use $...$ for inline and $$...$$ for block math).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Rich Text Editor */}
        <div className="space-y-2">
          <Label htmlFor="question-content">Question Statement</Label>
          <div className="border rounded-md">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={handleContentChange}
              modules={modules}
              formats={formats}
              placeholder="Enter question text... Use $O(N)$ for mathematical formulas."
            />
          </div>
        </div>

        {/* Question Properties */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Question Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MCQ">MCQ</SelectItem>
                <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
                <SelectItem value="LONG_ANSWER">Long Answer</SelectItem>
                <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                <SelectItem value="NUMERICAL">Numerical</SelectItem>
                <SelectItem value="FILL_IN_BLANKS">Fill in Blanks</SelectItem>
                <SelectItem value="CASE_STUDY">Case Study</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Bloom's Level</Label>
            <Select value={bloomLevel} onValueChange={setBloomLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REMEMBER">Remember</SelectItem>
                <SelectItem value="UNDERSTAND">Understand</SelectItem>
                <SelectItem value="APPLY">Apply</SelectItem>
                <SelectItem value="ANALYZE">Analyze</SelectItem>
                <SelectItem value="EVALUATE">Evaluate</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Marks</Label>
            <Input
              type="number"
              min="1"
              value={marks}
              onChange={(e) => setMarks(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a search tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" onClick={addTag} size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 md:col-span-3">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-2 hover:text-destructive"
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* LaTeX Preview */}
        {content && (
          <div className="space-y-2">
            <Label>Live Preview (LaTeX Formatted)</Label>
            <div className="p-4 border rounded-md bg-muted/30">
              <LaTeXRenderer html={content} />
            </div>
          </div>
        )}

        {/* Save Button */}
        {onSave && (
          <Button
            onClick={onSave}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Question
          </Button>
        )}
      </CardContent>
    </Card>
  );
}