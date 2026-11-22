import { Link } from 'react-router-dom';
import type { Incident } from '../types';
import { IncidentStatus } from '../types';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import SLATimer from './SLATimer';
import { formatRelative } from '../utils/helpers';
import { AlertTriangle, User, Wrench } from 'lucide-react';

interface IncidentCardProps {
  incident: Incident;
  compact?: boolean;
}

export default function IncidentCard({ incident, compact = false }: IncidentCardProps) {
  const isActive = ![IncidentStatus.CLOSED, IncidentStatus.RESOLVED, IncidentStatus.VERIFIED].includes(incident.status as IncidentStatus);

  return (
    <Link
      to={`/incidents/${incident.id}`}
      className="block bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-mono text-slate-400">{incident.incident_number}</span>
            {incident.is_duplicate && (
              <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">
                Duplicate
              </span>
            )}
          </div>
          <h3 className="font-semibold text-slate-800 text-sm truncate">{incident.title}</h3>
          {!compact && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{incident.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <PriorityBadge priority={incident.priority} />
          <StatusBadge status={incident.status} />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 flex-wrap">
        {incident.sla_violated && (
          <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
            <AlertTriangle className="w-3 h-3" />
            SLA Violated
          </span>
        )}
        {isActive && incident.sla_resolution_deadline && !incident.sla_violated && (
          <SLATimer
            deadline={incident.sla_resolution_deadline}
            label="SLA"
            violated={incident.sla_violated}
          />
        )}
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <User className="w-3 h-3" />
          {incident.reporter_name}
        </div>
        {incident.technician_name && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Wrench className="w-3 h-3" />
            {incident.technician_name}
          </div>
        )}
        <span className="text-xs text-slate-400 ml-auto">{formatRelative(incident.created_at)}</span>
      </div>
    </Link>
  );
}
