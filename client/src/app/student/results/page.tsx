'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { BarChart3, Clock, Trophy, TrendingDown, TrendingUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Attempt {
  id: string;
  score: number;
  maxScore: number;
  status: string;
  createdAt: string;
  paperSet: { paper: { title: string; subjectId: string } };
}

export default function ResultsPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const data = await api('/attempts/history');
        setAttempts(data.data);
      } catch (error) {
        console.error('Failed to fetch attempts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAttempts();
  }, []);

  const getPercentage = (attempt: Attempt) => {
    if (!attempt.score) return 0;
    return Math.round((attempt.score / attempt.maxScore) * 100);
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600' };
    if (percentage >= 80) return { grade: 'A', color: 'text-blue-600' };
    if (percentage >= 70) return { grade: 'B', color: 'text-indigo-600' };
    if (percentage >= 60) return { grade: 'C', color: 'text-yellow-600' };
    if (percentage >= 50) return { grade: 'D', color: 'text-orange-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/student" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">My Results</h1>
          <p className="text-muted-foreground">Your test performance history</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : attempts.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No attempts yet</h3>
          <p className="text-muted-foreground mb-4">Start practicing to see your results</p>
          <Link href="/student/practice">
            <Button>Take a Practice Test</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {attempts.map((attempt) => {
            const percentage = getPercentage(attempt);
            const grade = getGrade(percentage);
            return (
              <Card key={attempt.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{attempt.paperSet?.paper?.title || (attempt as any).title || 'Practice Test'}</h3>
                    <Badge variant={percentage >= 50 ? 'success' : 'destructive'}>
                      {grade.grade}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Score</span>
                      <span className="font-medium">{attempt.score} / {attempt.maxScore}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Percentage</span>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Date</span>
                      <span className="text-muted-foreground">{new Date(attempt.createdAt || (attempt as any).completedAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="outline">{attempt.status}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">
                {attempts.length > 0 ? Math.round(attempts.reduce((sum, a) => sum + getPercentage(a), 0) / attempts.length) : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Average Score</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{attempts.length}</p>
              <p className="text-sm text-muted-foreground">Tests Taken</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">
                {attempts.length > 0 ? Math.max(...attempts.map((a) => getPercentage(a))) : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Best Score</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}