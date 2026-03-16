import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined, formatStr = 'MMM d, yyyy'): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return format(d, formatStr);
}

export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';

  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatDeadline(date: Date | string | null | undefined): string {
  if (!date) return 'No deadline';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'No deadline';

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays <= 7) return `${diffDays}d left`;
  return format(d, 'MMM d');
}

export function truncate(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'PLANNING':
      return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'IN_PROGRESS':
      return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
    case 'REVIEW':
      return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    case 'COMPLETED':
      return 'text-green-400 bg-green-400/10 border-green-400/20';
    default:
      return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'PLANNING': return 'Planning';
    case 'IN_PROGRESS': return 'In Progress';
    case 'REVIEW': return 'Review';
    case 'COMPLETED': return 'Completed';
    default: return status;
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'HIGH':
      return 'text-red-400 bg-red-400/10 border-red-400/20';
    case 'MEDIUM':
      return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    case 'LOW':
      return 'text-green-400 bg-green-400/10 border-green-400/20';
    default:
      return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function parseTagsInput(input: string): string[] {
  return input
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length > 0);
}

export function getAvatarUrl(user: { image?: string | null; avatar?: string | null; name?: string | null }): string | null {
  return user.avatar || user.image || null;
}
