import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Library,
  BarChart3,
  GraduationCap,
  Settings,
  Users,
  Building2,
  Menu,
  X,
} from 'lucide-react';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'FACULTY', 'STUDENT'] },
  { href: '/faculty/papers', label: 'Papers', icon: FileText, roles: ['FACULTY', 'ADMIN'] },
  { href: '/faculty/questions', label: 'Question Bank', icon: Library, roles: ['FACULTY', 'ADMIN'] },
  { href: '/faculty/notes', label: 'Notes & AI', icon: BookOpen, roles: ['FACULTY', 'ADMIN'] },
  { href: '/faculty/blueprints', label: 'Blueprints', icon: FileText, roles: ['FACULTY', 'ADMIN'] },
  { href: '/student/practice', label: 'Practice Tests', icon: GraduationCap, roles: ['STUDENT'] },
  { href: '/admin/users', label: 'Users', icon: Users, roles: ['ADMIN'] },
  { href: '/admin/subjects', label: 'Subjects', icon: Building2, roles: ['ADMIN'] },
  { href: '/admin/settings', label: 'Settings', icon: Settings, roles: ['ADMIN'] },
];

export function Sidebar({ role, open, onClose }: { role?: string; open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const visible = links.filter((l) => !role || l.roles.includes(role));

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-card p-4 transition-transform md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-64',
        )}
      >
        <nav className="space-y-1">
          {visible.map((l) => {
            const Icon = l.icon;
            const active = pathname?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="h-5 w-5" />
                {l.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}