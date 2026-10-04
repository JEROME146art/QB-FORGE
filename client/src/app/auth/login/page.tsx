'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, saveToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('faculty@srmrmp.edu.in');
  const [password, setPassword] = useState('Faculty@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('qpforge_token') : null;
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.success) {
        saveToken(data.data.accessToken);
        if (typeof window !== 'undefined') {
          localStorage.setItem('qpforge_user', JSON.stringify(data.data.user));
        }
        router.push('/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-xl shadow-md">
              Q
            </div>
            <span className="text-2xl font-bold tracking-tight">QPForge</span>
          </Link>
          <h2 className="text-2xl font-bold">Sign in to your account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Welcome back! Access your question papers and bank</p>
        </div>

        <Card className="shadow-lg border-muted">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Credentials</CardTitle>
            <CardDescription>Enter your institutional email to proceed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Institutional Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="faculty@srmrmp.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full font-medium" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="border-t pt-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Quick Demo Login</p>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" type="button" onClick={() => quickLogin('faculty@srmrmp.edu.in', 'Faculty@123')}>
                  Faculty
                </Button>
                <Button variant="outline" size="sm" type="button" onClick={() => quickLogin('admin@srmrmp.edu.in', 'Admin@123')}>
                  Admin
                </Button>
                <Button variant="outline" size="sm" type="button" onClick={() => quickLogin('student@srmrmp.edu.in', 'Student@123')}>
                  Student
                </Button>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/auth/register" className="text-primary hover:underline font-medium">
                  Register
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}