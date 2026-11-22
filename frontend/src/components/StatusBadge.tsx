import { statusColor, statusLabel } from '../utils/helpers';
import type { IncidentStatus } from '../types';

interface StatusBadgeProps {
  status: IncidentStatus | string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const color = statusColor(status);
  const label = statusLabel(status);
  const sizeClass = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${color} ${sizeClass}`}>
      {label}
    </span>
  );
}
