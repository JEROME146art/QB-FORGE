import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function getDifficultyColor(level: string): string {
  switch (level) {
    case 'EASY': return 'text-green-600 dark:text-green-400';
    case 'MEDIUM': return 'text-yellow-600 dark:text-yellow-400';
    case 'HARD': return 'text-red-600 dark:text-red-400';
    default: return 'text-gray-600 dark:text-gray-400';
  }
}

export function getBloomColor(level: string): string {
  const colors: Record<string, string> = {
    REMEMBER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    UNDERSTAND: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    APPLY: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    ANALYZE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    EVALUATE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    CREATE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };
  return colors[level] || 'bg-gray-100 text-gray-700';
}