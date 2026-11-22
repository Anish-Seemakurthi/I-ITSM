import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { slaApi } from '../api/client';
import { SLAPolicy, Incident } from '../types';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import { Clock, AlertTriangle, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../utils/helpers';

export default function SLAPage() {
  const [policies, setPolicies] = useState<SLAPolicy[]>([]);
  const [violations, setViolations] = useState<Incident[]>([]);
  const [atRisk, setAtRisk] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'policies' | 'violations' | 'at_risk'>('policies');
  const [scanMessage, setScanMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [pols, viols, risk] = await Promise.all([
        slaApi.getPolicies(),
        slaApi.getViolations(),
        slaApi.getAtRisk(),
      ]);
      setPolicies(pols);
      setViolations(viols);
      setAtRisk(risk);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleScan = async () => {
    try {
      const res = await slaApi.triggerCheck();
      setScanMessage(`Scan finished! Found ${res.new_violations_count} new violations.`);
      loadData();
      setTimeout(() => setScanMessage(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Service Level Agreement (SLA) Engine</h1>
          <p className="text-sm text-slate-500">Continuous deadline tracking, early risk warnings, and policy enforcement.</p>
        </div>
        <button
          onClick={handleScan}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white font-medium rounded-lg shadow-sm text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Sweep SLA Deadlines Now
        </button>
      </div>

      {scanMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-sm font-bold">
        <button
          onClick={() => setActiveTab('policies')}
          className={`pb-3 transition-colors ${
            activeTab === 'policies'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          SLA Policy Targets
        </button>
        <button
          onClick={() => setActiveTab('violations')}
          className={`pb-3 transition-colors flex items-center gap-1.5 ${
            activeTab === 'violations'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>Breached Incidents</span>
          <span className="px-2 py-0.2 bg-red-100 text-red-700 text-xs rounded-full font-bold">
            {violations.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('at_risk')}
          className={`pb-3 transition-colors flex items-center gap-1.5 ${
            activeTab === 'at_risk'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>At-Risk (80%+ Elapsed)</span>
          <span className="px-2 py-0.2 bg-amber-100 text-amber-700 text-xs rounded-full font-bold">
            {atRisk.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Policies */}
      {activeTab === 'policies' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Standard Organizational Response & Resolution Targets
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Priority Level</th>
                  <th className="px-6 py-3">First Response Target</th>
                  <th className="px-6 py-3">Final Resolution Target</th>
                  <th className="px-6 py-3">Escalation Policy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {policies.map((p) => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      <PriorityBadge priority={p.priority} />
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-slate-700">
                      {p.response_time_minutes} minutes
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-slate-700">
                      {p.resolution_time_minutes >= 60
                        ? `${p.resolution_time_minutes / 60} hours (${p.resolution_time_minutes}m)`
                        : `${p.resolution_time_minutes} minutes`}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {p.priority === 'P1'
                        ? 'Immediate auto-escalation to IT Manager if unacknowledged in 10m'
                        : 'Routine technician assignment'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Breached Violations */}
      {activeTab === 'violations' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {violations.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <span>Zero SLA breaches recorded! System is in full compliance.</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {violations.map((inc) => (
                <div key={inc.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={inc.priority} />
                      <Link to={`/incidents/${inc.id}`} className="font-bold text-slate-900 hover:text-blue-600 text-sm">
                        {inc.incident_number}: {inc.title}
                      </Link>
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-black uppercase">
                        SLA Breached
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Deadline was {formatDate(inc.sla_resolution_deadline)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={inc.status} />
                    <Link
                      to={`/incidents/${inc.id}`}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg"
                    >
                      Urgent Action
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: At Risk */}
      {activeTab === 'at_risk' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {atRisk.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <span>No incidents currently at risk of breaching SLA.</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {atRisk.map((inc) => (
                <div key={inc.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={inc.priority} />
                      <Link to={`/incidents/${inc.id}`} className="font-bold text-slate-900 hover:text-blue-600 text-sm">
                        {inc.incident_number}: {inc.title}
                      </Link>
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-black uppercase">
                        &gt; 80% Time Elapsed
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Target resolution deadline: {formatDate(inc.sla_resolution_deadline)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={inc.status} />
                    <Link
                      to={`/incidents/${inc.id}`}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg"
                    >
                      Intervene
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

