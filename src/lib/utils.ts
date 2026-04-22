import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(time: string) {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

export function timeAgo(date: string | Date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
}

export function getInitials(name?: string) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

export function getAdherenceColor(rate: number) {
  if (rate >= 0.8) return 'text-success-600 bg-success-50';
  if (rate >= 0.5) return 'text-warning-600 bg-warning-50';
  return 'text-danger-600 bg-danger-50';
}

export function getAdherenceLabel(rate: number) {
  if (rate >= 0.8) return 'Excellent';
  if (rate >= 0.5) return 'Good';
  return 'Poor';
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'active':
    case 'approved':
    case 'verified':
    case 'published':
      return 'bg-success-50 text-success-600';
    case 'pending':
    case 'pending_review':
    case 'pending_verification':
    case 'draft':
      return 'bg-warning-50 text-warning-600';
    case 'rejected':
    case 'cancelled':
    case 'suspended':
    case 'deactivated':
      return 'bg-danger-50 text-danger-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}
