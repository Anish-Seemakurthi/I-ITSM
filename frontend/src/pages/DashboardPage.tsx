import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, Incident, OverviewReport, SLACompliance } from '../types';
import { incidentsApi, reportsApi, slaApi } from '../api/client';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import SLATimer from '../components/SLATimer';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  PlusCircle,
  ShieldAlert,
  Users,
  Activity,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { formatDate } from '../utils/helpers';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [overview, setOverview] = useState<OverviewReport | null>(null);
  const [compliance, setCompliance] = useState<SLACompliance | null>(null);
  const [atRisk, setAtRisk] = useState<Incident[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (user?.role === UserRole.ADMIN) {
          const [ov, comp, risk, incs] = await Promise.all([
            reportsApi.getOverview(),
            reportsApi.getSLACompliance(),
            slaApi.getAtRisk(),
            incidentsApi.getAll(),
          ]);
          setOverview(ov);
          setCompliance(comp);
          setAtRisk(risk);
          setIncidents(incs.slice(0, 6));
        } else if (user?.role === UserRole.TECHNICIAN) {
          const incs = await incidentsApi.getAll({ technician_id: user.id });
          setIncidents(incs);
        } else {
          // Employee
          const incs = await incidentsApi.getAll({ my_only: true });
          setIncidents(incs);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ADMIN DASHBOARD
  // ───────────────────────────────────────────────────────────────────────────
  if (user?.role === UserRole.ADMIN) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">IT Operations Control Center</h1>
            <p className="text-sm text-slate-500">System overview, active incidents, and SLA compliance telemetry</p>
          </div>
          <Link
            to="/incidents/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Report Incident
          </Link>
        </div>

        {/* SLA At-Risk Alert Banner */}
        {atRisk.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-900">
                Early SLA Breach Warning: {atRisk.length} active incident(s) nearing SLA deadline
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                These incidents have consumed over 80% of allowed resolution time. Immediate technician intervention is advised.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {atRisk.map((inc) => (
                  <Link
                    key={inc.id}
                    to={`/incidents/${inc.id}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-amber-300 rounded text-xs font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    <span>{inc.incident_number}:</span>
                    <span className="truncate max-w-[150px]">{inc.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KPI Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Reported</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{overview?.total_incidents || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Open Incidents</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{overview?.open_incidents || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Critical (P1)</p>
              <h3 className="text-2xl font-black text-red-600 mt-1">{overview?.critical_incidents || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolved</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{overview?.resolved_incidents || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">SLA Compliance</p>
              <h3 className="text-2xl font-black text-indigo-600 mt-1">
                {compliance?.compliance_rate_percent !== undefined
                  ? `${compliance.compliance_rate_percent}%`
                  : '100%'}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Recent Incidents Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Live Incident Feed</h3>
            <Link to="/incidents" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {incidents.map((inc) => (
              <div key={inc.id} className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <PriorityBadge priority={inc.priority} />
                  <div className="min-w-0">
                    <Link to={`/incidents/${inc.id}`} className="text-sm font-bold text-slate-900 hover:text-blue-600 truncate block">
                      {inc.incident_number}: {inc.title}
                    </Link>
                    <span className="text-xs text-slate-400">Created {formatDate(inc.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <StatusBadge status={inc.status} />
                  <Link
                    to={`/incidents/${inc.id}`}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded transition-colors"
                  >
                    Inspect
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TECHNICIAN DASHBOARD
  // ───────────────────────────────────────────────────────────────────────────
  if (user?.role === UserRole.TECHNICIAN) {
    const activeAssigned = incidents.filter(
      (i) => i.status !== 'RESOLVED' && i.status !== 'VERIFIED' && i.status !== 'CLOSED'
    );
    const resolvedAssigned = incidents.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED');

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Technician Workbench</h1>
            <p className="text-sm text-slate-500">Welcome, {user.name}. Here are your assigned tasks and active queues.</p>
          </div>
        </div>

        {/* Workload Capacity Meter */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Active Workload</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {activeAssigned.length} / {user.max_workload || 5} Active Incidents
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Available capacity: {Math.max(0, (user.max_workload || 5) - activeAssigned.length)} slots
            </p>
          </div>
          <div className="w-32 bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
            <div
              className={`h-full ${
                activeAssigned.length >= (user.max_workload || 5)
                  ? 'bg-red-500'
                  : activeAssigned.length > 2
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (activeAssigned.length / (user.max_workload || 5)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Active Queue */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Assigned Incidents Requiring Action</h3>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">
              {activeAssigned.length} Open
            </span>
          </div>

          {activeAssigned.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No pending assigned incidents. Great job!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activeAssigned.map((inc) => (
                <div key={inc.id} className="p-5 hover:bg-slate-50 flex items-center justify-between transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={inc.priority} />
                      <Link to={`/incidents/${inc.id}`} className="font-bold text-slate-900 hover:text-blue-600 text-sm">
                        {inc.incident_number}: {inc.title}
                      </Link>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{inc.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>Reported: {formatDate(inc.created_at)}</span>
                      {inc.sla_resolution_deadline && (
                        <SLATimer deadline={inc.sla_resolution_deadline} isViolated={inc.sla_violated} />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={inc.status} />
                    <Link
                      to={`/incidents/${inc.id}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                    >
                      Handle Incident
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EMPLOYEE DASHBOARD
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">IT Support Portal</h1>
          <p className="text-sm text-slate-500">Welcome, {user?.name}. Need help with an IT service or application?</p>
        </div>
        <Link
          to="/incidents/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors text-sm"
        >
          <PlusCircle className="w-5 h-5" />
          Report an Incident
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Reported By Me</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{incidents.length}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Currently In Progress</p>
          <h3 className="text-2xl font-black text-amber-600 mt-1">
            {incidents.filter((i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length}
          </h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Successfully Resolved</p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">
            {incidents.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED').length}
          </h3>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">My Submitted Incidents</h3>
          <Link to="/incidents" className="text-xs font-semibold text-blue-600 hover:underline">
            View History
          </Link>
        </div>

        {incidents.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-medium">You have no active incidents reported.</p>
            <Link
              to="/incidents/create"
              className="mt-3 inline-block text-xs font-bold text-blue-600 hover:underline"
            >
              Report a problem now →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {incidents.map((inc) => (
              <div key={inc.id} className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={inc.priority} />
                    <Link to={`/incidents/${inc.id}`} className="font-bold text-slate-900 hover:text-blue-600 text-sm">
                      {inc.incident_number}: {inc.title}
                    </Link>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Submitted {formatDate(inc.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={inc.status} />
                  <Link
                    to={`/incidents/${inc.id}`}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded"
                  >
                    View Status
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

