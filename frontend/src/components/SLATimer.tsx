import React, { useState, useEffect } from 'react';
import { secondsUntil, formatDuration } from '../utils/helpers';
import { Clock, AlertTriangle } from 'lucide-react';

interface SLATimerProps {
  deadline?: string | null;
  label?: string;
  violated?: boolean;
  isViolated?: boolean;
}

export default function SLATimer({
  deadline,
  label = 'Resolution SLA',
  violated,
  isViolated,
}: SLATimerProps) {
  const isV = violated || isViolated;
  const [seconds, setSeconds] = useState(() => (deadline ? secondsUntil(deadline) : 0));

  useEffect(() => {
    if (!deadline) return;
    setSeconds(secondsUntil(deadline));
    const interval = setInterval(() => {
      setSeconds(secondsUntil(deadline));
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline) return null;

  const isExpired = seconds <= 0;
  const isWarning = !isExpired && seconds < 1800; // less than 30 min

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
        isV || isExpired
          ? 'bg-red-50 text-red-700 border-red-200'
          : isWarning
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-blue-50 text-blue-700 border-blue-200'
      }`}
    >
      {isV || isExpired ? (
        <AlertTriangle className="w-3 h-3 text-red-600" />
      ) : (
        <Clock className="w-3 h-3 text-blue-600" />
      )}
      <span>{label}:</span>
      <span className="font-bold">
        {isV ? 'BREACHED' : isExpired ? 'EXPIRED' : formatDuration(seconds)}
      </span>
    </div>
  );
}
