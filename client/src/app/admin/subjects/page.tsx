'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';

interface Subject {
  id: string;
  code: string;
  name: string;
  department?: { name: string; code: string };
  semester: number;
  _count?: { questions: number; units: number };
}

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({ code: '', name: '', departmentId: '', semester: 1, description: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsRes, deptsRes] = await Promise.all([
          api('/subjects'),
          api('/departments'),
        ]);
        setSubjects(subjectsRes.data);
        setDepartments(deptsRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOpenDialog = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        code: subject.code,
        name: subject.name,
        departmentId: subject.department?.name || '',
        semester: subject.semester,
        description: '',
      });
    } else {
      setEditingSubject(null);
      setFormData({ code: '', name: '', departmentId: '', semester: 1, description: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await api(`/subjects/${editingSubject.id}`, {
          method: 'PATCH',
          body: JSON.stringify(formData),
        });
      } else {
        await api('/subjects', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      setDialogOpen(false);
      // Refresh
      const subjectsRes = await api('/subjects');
      setSubjects(subjectsRes.data);
    } catch (error) {
      console.error('Failed to save subject:', error);
    }
  };

  const handleDelete = async (subjectId: string) => {
    if (!confirm('Delete this subject? This will also delete all related questions and blueprints.')) return;
    try {
      await api(`/subjects/${subjectId}`, { method: 'DELETE' });
      setSubjects(subjects.filter((s) => s.id !== subjectId));
    } catch (error) {
      console.error('Failed to delete subject:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Subject Management</h1>
          <p className="text-muted-foreground">Manage subjects, codes, and academic structure</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSubject ? 'Edit Subject' : 'New Subject'}</DialogTitle>
              <DialogDescription>Enter the subject details below.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Code</label>
                <Input placeholder="CS201" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input placeholder="Data Structures & Algorithms" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <select value={formData.departmentId} onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Semester</label>
                <select value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-24" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editingSubject ? 'Update' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Subjects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subjects ({subjects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">Loading...</div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No subjects yet</h3>
              <p className="text-muted-foreground mb-4">Create your first subject to get started</p>
              <Button onClick={() => handleOpenDialog()}>Add Subject</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-mono font-medium">{subject.code}</TableCell>
                      <TableCell>{subject.name}</TableCell>
                      <TableCell>{subject.department?.name || '-'}</TableCell>
                      <TableCell>{subject.semester}</TableCell>
                      <TableCell>{subject._count?.units || 0}</TableCell>
                      <TableCell>{subject._count?.questions || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(subject)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(subject.id)}>
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