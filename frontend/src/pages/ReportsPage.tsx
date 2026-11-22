import React, { useEffect, useState } from 'react';
import { reportsApi } from '../api/client';
import {
  OverviewReport,
  TechnicianWorkload,
  ServiceAnalysis,
  PriorityDist,
  CategoryDist,
  SLACompliance,
  TrendData,
} from '../types';
import {
  BarChart3,
  TrendingUp,
  ShieldAlert,
  Server,
  Users,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewReport | null>(null);
  const [workloads, setWorkloads] = useState<TechnicianWorkload[]>([]);
  const [services, setServices] = useState<ServiceAnalysis[]>([]);
  const [priorityDist, setPriorityDist] = useState<PriorityDist>({});
  const [categoryDist, setCategoryDist] = useState<CategoryDist>({});
  const [compliance, setCompliance] = useState<SLACompliance | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        const [ov, wl, sa, pd, cd, comp, tr] = await Promise.all([
          reportsApi.getOverview(),
          reportsApi.getTechnicianWorkload(),
          reportsApi.getServiceAnalysis(),
          reportsApi.getPriorityDist(),
          reportsApi.getCategoryDist(),
          reportsApi.getSLACompliance(),
          reportsApi.getTrends(7),
        ]);
        setOverview(ov);
        setWorkloads(wl);
        setServices(sa);
        setPriorityDist(pd);
        setCategoryDist(cd);
        setCompliance(comp);
        setTrends(tr);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">ITSM Executive Analytics & Reports</h1>
        <p className="text-sm text-slate-500">Service reliability metrics, technician resource utilization, and SLA compliance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Incident Volume</p>
          <h3 className="text-3xl font-black text-slate-900 mt-2">{overview?.total_incidents || 0}</h3>
          <p className="text-xs text-slate-500 mt-1">Lifetime reported incidents</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Open Backlog</p>
          <h3 className="text-3xl font-black text-amber-600 mt-2">{overview?.open_incidents || 0}</h3>
          <p className="text-xs text-amber-700 mt-1">Pending investigation or resolution</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">P1 Critical Outages</p>
          <h3 className="text-3xl font-black text-red-600 mt-2">{overview?.critical_incidents || 0}</h3>
          <p className="text-xs text-red-700 mt-1">High business impact events</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">SLA Compliance Rate</p>
          <h3 className="text-3xl font-black text-indigo-600 mt-2">
            {compliance?.compliance_rate_percent !== undefined ? `${compliance.compliance_rate_percent}%` : '100%'}
          </h3>
          <p className="text-xs text-indigo-700 mt-1">Resolved within target deadline</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>Priority Tier Distribution</span>
          </h3>
          <div className="space-y-3">
            {[
              { label: 'P1 Critical', key: 'P1', bg: 'bg-red-500', text: 'text-red-700' },
              { label: 'P2 High', key: 'P2', bg: 'bg-orange-500', text: 'text-orange-700' },
              { label: 'P3 Medium', key: 'P3', bg: 'bg-yellow-500', text: 'text-yellow-700' },
              { label: 'P4 Low', key: 'P4', bg: 'bg-green-500', text: 'text-green-700' },
            ].map((item) => {
              const count = priorityDist[item.key] || 0;
              const total = overview?.total_incidents || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={item.key} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className={item.text}>{item.label}</span>
                    <span className="text-slate-600 font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.bg}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Technician Workload Analytics */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Technician Resource Allocation</span>
          </h3>
          <div className="space-y-3">
            {workloads.map((tech) => (
              <div key={tech.technician_id} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-800">
                  <span>{tech.technician_name}</span>
                  <span className="font-mono text-slate-500">
                    {tech.active_incidents} / {tech.max_workload} active ({tech.utilization_percent}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      tech.utilization_percent >= 100
                        ? 'bg-red-500'
                        : tech.utilization_percent > 60
                        ? 'bg-amber-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, tech.utilization_percent)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Analysis Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-600" />
            <span>IT Service Incident Counts</span>
          </h3>
          <div className="divide-y divide-slate-100">
            {services.map((s) => (
              <div key={s.service_id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{s.service_name}</span>
                  {s.is_critical && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold">
                      Critical Service
                    </span>
                  )}
                </div>
                <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {s.incident_count} incidents
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 7-Day Trend Analysis */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span>7-Day Inflow Velocity</span>
          </h3>
          <div className="flex items-end justify-between h-40 pt-6 px-2 border-b border-slate-200">
            {trends.map((t) => {
              const maxCount = Math.max(...trends.map((x) => x.count), 5);
              const heightPct = Math.max(10, Math.round((t.count / maxCount) * 100));
              return (
                <div key={t.date} className="flex flex-col items-center gap-2 flex-1">
                  <span className="text-[10px] font-mono font-bold text-slate-600">{t.count}</span>
                  <div
                    className="w-7 bg-blue-600 rounded-t transition-all hover:bg-blue-700"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[10px] text-slate-400 transform -rotate-45 origin-top-left mt-2 whitespace-nowrap">
                    {t.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

