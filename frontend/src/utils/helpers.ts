import { Priority, IncidentStatus, Category, Impact, Urgency } from '../types';
import { format, formatDistanceToNow, parseISO, differenceInSeconds } from 'date-fns';

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'MMM dd, yyyy HH:mm');
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'MMM dd, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatRelative(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function secondsUntil(dateStr?: string | null): number {
  if (!dateStr) return 0;
  try {
    return differenceInSeconds(parseISO(dateStr), new Date());
  } catch {
    return 0;
  }
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return 'Breached / Expired';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// Priority colors
export function priorityColor(priority?: Priority | string): string {
  const p = priority?.toString().toUpperCase();
  if (p?.includes('P1')) return 'bg-red-100 text-red-700 border-red-200';
  if (p?.includes('P2')) return 'bg-orange-100 text-orange-700 border-orange-200';
  if (p?.includes('P3')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  if (p?.includes('P4')) return 'bg-green-100 text-green-700 border-green-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

export function priorityDotColor(priority?: Priority | string): string {
  const p = priority?.toString().toUpperCase();
  if (p?.includes('P1')) return 'bg-red-600';
  if (p?.includes('P2')) return 'bg-orange-500';
  if (p?.includes('P3')) return 'bg-yellow-500';
  if (p?.includes('P4')) return 'bg-green-500';
  return 'bg-slate-400';
}

export function priorityLabel(priority?: Priority | string): string {
  const p = priority?.toString().toUpperCase();
  if (p?.includes('P1')) return 'P1 Critical';
  if (p?.includes('P2')) return 'P2 High';
  if (p?.includes('P3')) return 'P3 Medium';
  if (p?.includes('P4')) return 'P4 Low';
  return 'Unset';
}

// Status colors
export function statusColor(status?: IncidentStatus | string): string {
  switch (status) {
    case IncidentStatus.NEW:
    case 'NEW':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case IncidentStatus.CLASSIFIED:
    case 'CLASSIFIED':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case IncidentStatus.ASSIGNED:
    case 'ASSIGNED':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case IncidentStatus.ACKNOWLEDGED:
    case 'ACKNOWLEDGED':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case IncidentStatus.IN_PROGRESS:
    case 'IN_PROGRESS':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case IncidentStatus.RESOLVED:
    case 'RESOLVED':
      return 'bg-green-100 text-green-700 border-green-200';
    case IncidentStatus.VERIFIED:
    case 'VERIFIED':
      return 'bg-teal-100 text-teal-700 border-teal-200';
    case IncidentStatus.CLOSED:
    case 'CLOSED':
      return 'bg-slate-200 text-slate-600 border-slate-300';
    case 'CANCELLED':
      return 'bg-red-50 text-red-600 border-red-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

export function statusLabel(status?: IncidentStatus | string): string {
  if (!status) return '—';
  return status.toString().replace(/_/g, ' ');
}

// Category label
export function categoryLabel(cat?: Category | string): string {
  return cat ? cat.toString().replace(/_/g, ' ') : '—';
}

export function impactLabel(impact?: Impact | string): string {
  return impact ? impact.toString() : '—';
}

export function urgencyLabel(urgency?: Urgency | string): string {
  return urgency ? urgency.toString() : '—';
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { detail?: string | { msg: string }[] } } };
    const detail = axiosError.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(', ');
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
