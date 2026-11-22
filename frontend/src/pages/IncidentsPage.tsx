import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { incidentsApi, servicesApi } from '../api/client';
import { Incident, Category, Priority, IncidentStatus, ITService } from '../types';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import { Search, Filter, AlertTriangle, PlusCircle, RefreshCw } from 'lucide-react';
import { formatDate } from '../utils/helpers';

export default function IncidentsPage() {
  const [searchParams] = useSearchParams();
  const myOnly = searchParams.get('my_only') === 'true';

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [services, setServices] = useState<ITService[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [slaFilter, setSlaFilter] = useState<string>('');

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await incidentsApi.getAll({
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        category: categoryFilter || undefined,
        service_id: serviceFilter || undefined,
        sla_violated: slaFilter === 'true' ? true : slaFilter === 'false' ? false : undefined,
        my_only: myOnly,
      });
      setIncidents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    servicesApi.getAll().then(setServices).catch(console.error);
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [searchParams, statusFilter, priorityFilter, categoryFilter, serviceFilter, slaFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {myOnly ? 'My Assigned Incidents' : 'Incident Directory'}
          </h1>
          <p className="text-sm text-slate-500">
            Search, filter, and track IT incident tickets across departments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchIncidents}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/incidents/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Report Incident
          </Link>
        </div>
      </div>

      {/* Filter Bar (5+ criteria: search, status, priority, category, service, SLA) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filters & Search Criteria</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchIncidents()}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {Object.values(IncidentStatus).map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="P1">P1 Critical</option>
            <option value="P2">P2 High</option>
            <option value="P3">P3 Medium</option>
            <option value="P4">P4 Low</option>
          </select>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {Object.values(Category).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Service */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* SLA Status */}
          <select
            value={slaFilter}
            onChange={(e) => setSlaFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All SLA States</option>
            <option value="true">⚠️ Breached SLA</option>
            <option value="false">✅ Within SLA</option>
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No incidents matched your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Ticket #</th>
                  <th className="px-5 py-3.5">Title & Summary</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">SLA</th>
                  <th className="px-5 py-3.5">Created</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-xs text-blue-600">
                      {inc.incident_number}
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <Link
                        to={`/incidents/${inc.id}`}
                        className="font-bold text-slate-900 hover:text-blue-600 block truncate"
                      >
                        {inc.title}
                      </Link>
                      {inc.is_duplicate && (
                        <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200">
                          Duplicate
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 capitalize">
                      {inc.category?.toString().toLowerCase() || '—'}
                    </td>
                    <td className="px-5 py-4">
                      <PriorityBadge priority={inc.priority} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="px-5 py-4">
                      {inc.sla_violated ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          Breached
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">On Track</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {formatDate(inc.created_at)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/incidents/${inc.id}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition-colors"
                      >
                        Inspect
                      </Link>
                    </td>
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

