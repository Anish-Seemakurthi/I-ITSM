import { priorityColor, priorityLabel } from '../utils/helpers';
import type { Priority } from '../types';

interface PriorityBadgeProps {
  priority?: Priority | string;
  size?: 'sm' | 'md';
}

export default function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  const color = priorityColor(priority);
  const label = priorityLabel(priority);
  const sizeClass = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${color} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        priority?.toString().includes('P1') ? 'bg-red-600' :
        priority?.toString().includes('P2') ? 'bg-orange-500' :
        priority?.toString().includes('P3') ? 'bg-yellow-500' :
        priority?.toString().includes('P4') ? 'bg-green-500' : 'bg-slate-400'
      }`} />
      {label}
    </span>
  );
}
