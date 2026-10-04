'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import Link from 'next/link';
import { FileText, Download, Plus, Trash2, Copy, Eye, Clock, CheckCircle, Sparkles } from 'lucide-react';

interface Paper {
  id: string;
  title: string;
  type: string;
  totalMarks: number;
  duration: number;
  status: string;
  createdAt: string;
  subject?: { code: string; name: string };
  sets?: Array<{ id: string; setLabel: string }>;
}

export default function PapersListPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const data = await api('/papers');
      setPapers(data.data || []);
    } catch (err) {
      console.error('Failed to fetch papers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const handleExport = async (paperId: string, format: 'PDF' | 'DOCX') => {
    setExportingId(paperId);
    try {
      const res = await api(`/papers/${paperId}/export`, {
        method: 'POST',
        body: JSON.stringify({ format }),
      });
      alert(`Export successful! File prepared: ${res.data?.url || 'paper.' + format.toLowerCase()}`);
      fetchPapers();
    } catch (err: any) {
      alert(err.message || 'Export failed');
    } finally {
      setExportingId(null);
    }
  };

  const handleDelete = async (paperId: string) => {
    if (!confirm('Are you sure you want to delete this paper?')) return;
    try {
      await api(`/papers/${paperId}`, { method: 'DELETE' });
      setPapers(papers.filter((p) => p.id !== paperId));
    } catch (err) {
      console.error('Failed to delete paper:', err);
    }
  };

  const handleClone = async (paperId: string) => {
    try {
      await api(`/papers/${paperId}/clone`, { method: 'POST' });
      fetchPapers();
    } catch (err) {
      console.error('Failed to clone paper:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Question Papers</h1>
          <p className="text-muted-foreground">Manage generated papers, print layouts, and export to PDF/DOCX</p>
        </div>
        <Button asChild>
          <Link href="/faculty/papers/generate">
            <Plus className="h-4 w-4 mr-2" />
            Generate New Paper
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Generated Papers Repository ({papers.length})</CardTitle>
          <CardDescription>All drafts, finalized, and exported examination papers</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading examination papers...</div>
          ) : papers.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto stroke-1" />
              <div>
                <h3 className="text-lg font-semibold">No question papers created yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
                  Use the smart constraint solver to create your first balanced exam paper.
                </p>
              </div>
              <Button asChild>
                <Link href="/faculty/papers/generate">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Paper from Blueprint
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title &amp; Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {papers.map((paper) => (
                    <TableRow key={paper.id}>
                      <TableCell className="font-medium">
                        <p className="font-semibold text-foreground">{paper.title}</p>
                        <p className="text-xs text-muted-foreground">{paper.subject?.code} - {paper.subject?.name}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{paper.type.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell className="font-mono font-bold">{paper.totalMarks} Marks</TableCell>
                      <TableCell className="text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {paper.duration}m
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={paper.status === 'EXPORTED' ? 'success' : 'secondary'}>
                          {paper.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(paper.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport(paper.id, 'PDF')}
                            disabled={exportingId === paper.id}
                          >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport(paper.id, 'DOCX')}
                            disabled={exportingId === paper.id}
                          >
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            Word
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Duplicate Paper"
                            onClick={() => handleClone(paper.id)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDelete(paper.id)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
