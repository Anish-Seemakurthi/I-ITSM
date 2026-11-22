import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { AuditLog } from '../types';
import { History, Search, ShieldCheck } from 'lucide-react';
import { formatDate } from '../utils/helpers';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAuditLogs({
        action: actionFilter || undefined,
        limit: 100,
      });
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Audit & Compliance Log</h1>
          <p className="text-sm text-slate-500">Immutable forensic record of all incident transitions, assignments, and resolutions.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-blue-600" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Filter Activity by Action
          </span>
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Action Types</option>
          <option value="INCIDENT_CREATED">INCIDENT_CREATED</option>
          <option value="INCIDENT_CLASSIFIED">INCIDENT_CLASSIFIED</option>
          <option value="TECHNICIAN_ASSIGNED">TECHNICIAN_ASSIGNED</option>
          <option value="INCIDENT_ACKNOWLEDGED">INCIDENT_ACKNOWLEDGED</option>
          <option value="INVESTIGATION_STARTED">INVESTIGATION_STARTED</option>
          <option value="INCIDENT_RESOLVED">INCIDENT_RESOLVED</option>
          <option value="INCIDENT_VERIFIED">INCIDENT_VERIFIED</option>
          <option value="INCIDENT_CLOSED">INCIDENT_CLOSED</option>
          <option value="FEEDBACK_PROVIDED">FEEDBACK_PROVIDED</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No audit logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Action Event</th>
                  <th className="px-5 py-3.5">State Transition</th>
                  <th className="px-5 py-3.5">Event Narrative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-mono text-slate-500 whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-800 font-mono">
                      <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200 text-blue-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-600">
                      {log.previous_state && log.new_state ? (
                        <span>
                          {log.previous_state} → <span className="font-bold text-slate-900">{log.new_state}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-700 max-w-md">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

