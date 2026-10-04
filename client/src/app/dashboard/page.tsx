'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Users, FileText, Library, BarChart3, GraduationCap, TrendingUp,
  Activity, ArrowRight, Plus, Settings
} from 'lucide-react';

interface DashboardStats {
  totalQuestions: number;
  totalPapers: number;
  totalUsers: number;
  totalAttempts: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api<{ data: DashboardStats }>('/analytics/dashboard');
        setStats(data.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const quickActions = [
    { title: 'Create Paper', description: 'Generate a new exam paper', icon: FileText, href: '/faculty/papers/generate', color: 'bg-blue-100 text-blue-600', roles: ['FACULTY', 'ADMIN'] },
    { title: 'Manage Questions', description: 'Add, edit, or import questions', icon: Library, href: '/faculty/questions', color: 'bg-green-100 text-green-600', roles: ['FACULTY', 'ADMIN'] },
    { title: 'Upload Notes & AI', description: 'Generate questions from notes', icon: FileText, href: '/faculty/notes', color: 'bg-purple-100 text-purple-600', roles: ['FACULTY', 'ADMIN'] },
    { title: 'Blueprints', description: 'Create and manage blueprints', icon: Settings, href: '/faculty/blueprints', color: 'bg-orange-100 text-orange-600', roles: ['FACULTY', 'ADMIN'] },
    { title: 'Practice Test', description: 'Take a timed practice test', icon: GraduationCap, href: '/student/practice', color: 'bg-red-100 text-red-600', roles: ['STUDENT'] },
    { title: 'View Results', description: 'Check your test history', icon: Activity, href: '/student/results', color: 'bg-indigo-100 text-indigo-600', roles: ['STUDENT'] },
    { title: 'User Management', description: 'Manage users and roles', icon: Users, href: '/admin/users', color: 'bg-cyan-100 text-cyan-600', roles: ['ADMIN'] },
  ];

  const getUserRole = () => {
    if (typeof window === 'undefined') return 'FACULTY';
    const stored = localStorage.getItem('qpforge_user');
    if (stored) {
      try { return JSON.parse(stored).role; } catch { return 'FACULTY'; }
    }
    return 'FACULTY';
  };

  const role = getUserRole();
  const filteredActions = quickActions.filter(a => a.roles.includes(role));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/faculty/papers/generate">
              <Plus className="h-4 w-4 mr-2" />
              New Paper
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Questions"
          value={loading ? '...' : stats?.totalQuestions || 0}
          icon={Library}
          color="bg-blue-500"
          change="+12% from last month"
        />
        <StatCard
          title="Total Papers"
          value={loading ? '...' : stats?.totalPapers || 0}
          icon={FileText}
          color="bg-green-500"
          change="+8% from last month"
        />
        <StatCard
          title="Active Users"
          value={loading ? '...' : stats?.totalUsers || 0}
          icon={Users}
          color="bg-purple-500"
          change="+5% from last month"
        />
        <StatCard
          title="Test Attempts"
          value={loading ? '...' : stats?.totalAttempts || 0}
          icon={GraduationCap}
          color="bg-orange-500"
          change="+15% from last month"
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href} className="block">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className={`h-12 w-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold mb-1">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { time: '2 min ago', action: 'Created paper', details: 'CS201 - Semester Exam', user: 'Dr. Smith' },
              { time: '15 min ago', action: 'Uploaded notes', details: 'Unit 3 - Trees', user: 'Prof. Johnson' },
              { time: '1 hour ago', action: 'Generated questions', details: '20 MCQs from AI', user: 'Dr. Smith' },
              { time: '3 hours ago', action: 'Completed practice test', details: 'Score: 85%', user: 'Student A' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.details}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                  <p className="text-xs text-muted-foreground">{activity.user}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  change,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  change: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{change}</p>
          </div>
          <div className={`${color} p-3 rounded-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}