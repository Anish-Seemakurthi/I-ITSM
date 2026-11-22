import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { incidentsApi, techniciansApi } from '../api/client';
import { Incident, AuditLog, Technician, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import SLATimer from '../components/SLATimer';
import {
  ArrowLeft,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  Sparkles,
  Star,
  Send,
  Shield,
  Activity,
} from 'lucide-react';
import { formatDate, getErrorMessage } from '../utils/helpers';

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [recommendedTechs, setRecommendedTechs] = useState<any[]>([]);
  const [similarResolutions, setSimilarResolutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Form modals / state
  const [selectedTech, setSelectedTech] = useState('auto');
  const [assignStrategy, setAssignStrategy] = useState('skill');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const fetchIncidentData = async () => {
    if (!id) return;
    try {
      const [incData, logs, similar] = await Promise.all([
        incidentsApi.getOne(id),
        incidentsApi.getAudit(id),
        incidentsApi.getSimilar(id),
      ]);
      setIncident(incData);
      setAuditLogs(logs);
      setSimilarResolutions(similar);

      if (user?.role === UserRole.ADMIN) {
        const [allTechs, recs] = await Promise.all([
          techniciansApi.getAll(),
          incidentsApi.recommendTechnicians(id),
        ]);
        setTechnicians(allTechs);
        setRecommendedTechs(recs);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentData();
  }, [id, user]);

  // Lifecycle Transitions (State Pattern)
  const handleAcknowledge = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await incidentsApi.acknowledge(id);
      await fetchIncidentData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartInvestigation = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await incidentsApi.startInvestigation(id);
      await fetchIncidentData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await incidentsApi.assign(id, {
        technician_id: selectedTech,
        strategy: assignStrategy,
      });
      await fetchIncidentData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setActionLoading(true);
    try {
      await incidentsApi.resolve(id, { resolution_notes: resolutionNotes });
      setShowResolveModal(false);
      await fetchIncidentData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await incidentsApi.verify(id);
      await fetchIncidentData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await incidentsApi.close(id);
      await fetchIncidentData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await incidentsApi.addFeedback(id, {
        feedback_rating: rating,
        feedback_comment: feedbackComment,
      });
      setFeedbackSuccess(true);
      await fetchIncidentData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!incident) {
    return <div className="p-8 text-center text-slate-500">Incident ticket not found.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xl font-black text-blue-600">{incident.incident_number}</span>
          <PriorityBadge priority={incident.priority} size="md" />
          <StatusBadge status={incident.status} />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Lifecycle Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{incident.title}</h1>
              <p className="text-xs text-slate-400 mt-1">
                Reported on {formatDate(incident.created_at)}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap font-sans">
                {incident.description}
              </div>
            </div>

            {/* Resolution Display if resolved */}
            {incident.resolution_notes && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Resolution Notes:</span>
                </div>
                <p className="text-xs text-emerald-900 whitespace-pre-wrap">{incident.resolution_notes}</p>
                {incident.resolved_at && (
                  <p className="text-[11px] text-emerald-600 font-medium">
                    Resolved at {formatDate(incident.resolved_at)}
                  </p>
                )}
              </div>
            )}

            {/* State Pattern Lifecycle Action Toolbar */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Lifecycle Actions (State Machine)
              </h3>
              <div className="flex flex-wrap gap-3">
                {/* Admin Assignment Trigger */}
                {user?.role === UserRole.ADMIN &&
                  (incident.status === 'NEW' || incident.status === 'CLASSIFIED') && (
                    <div className="flex items-center gap-2 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <select
                        value={selectedTech}
                        onChange={(e) => setSelectedTech(e.target.value)}
                        className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="auto">✨ Auto-Assign via Strategy</option>
                        {technicians.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} (Load: {t.current_workload || 0}/{t.max_workload || 5})
                          </option>
                        ))}
                      </select>

                      {selectedTech === 'auto' && (
                        <select
                          value={assignStrategy}
                          onChange={(e) => setAssignStrategy(e.target.value)}
                          className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-700"
                        >
                          <option value="skill">Strategy: Skill-Based</option>
                          <option value="load">Strategy: Load-Balanced</option>
                          <option value="round_robin">Strategy: Round-Robin</option>
                          <option value="priority">Strategy: Priority-Based</option>
                        </select>
                      )}

                      <button
                        onClick={handleAssign}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
                      >
                        {actionLoading ? 'Assigning...' : 'Dispatch & Assign'}
                      </button>
                    </div>
                  )}

                {/* Technician Acknowledge */}
                {(user?.role === UserRole.TECHNICIAN || user?.role === UserRole.ADMIN) &&
                  incident.status === 'ASSIGNED' && (
                    <button
                      onClick={handleAcknowledge}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      Acknowledge Incident
                    </button>
                  )}

                {/* Technician Start Investigation */}
                {(user?.role === UserRole.TECHNICIAN || user?.role === UserRole.ADMIN) &&
                  incident.status === 'ACKNOWLEDGED' && (
                    <button
                      onClick={handleStartInvestigation}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      Commence Investigation
                    </button>
                  )}

                {/* Technician Resolve */}
                {(user?.role === UserRole.TECHNICIAN || user?.role === UserRole.ADMIN) &&
                  incident.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => setShowResolveModal(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      Provide Resolution & Mark Resolved
                    </button>
                  )}

                {/* Admin Verify */}
                {user?.role === UserRole.ADMIN && incident.status === 'RESOLVED' && (
                  <button
                    onClick={handleVerify}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    Verify Resolution
                  </button>
                )}

                {/* Admin Close */}
                {user?.role === UserRole.ADMIN && incident.status === 'VERIFIED' && (
                  <button
                    onClick={handleClose}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-slate-800 hover:bg-black text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    Close Incident Ticket
                  </button>
                )}
              </div>
            </div>

            {/* Post-Resolution Feedback Form */}
            {(incident.status === 'RESOLVED' ||
              incident.status === 'VERIFIED' ||
              incident.status === 'CLOSED') && (
              <div className="pt-6 border-t border-slate-100 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Post-Resolution User Feedback
                </h3>
                {incident.feedback_rating ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= (incident.feedback_rating || 0)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                      <span className="text-xs font-bold text-slate-700 ml-2">
                        {incident.feedback_rating} / 5 Stars
                      </span>
                    </div>
                    {incident.feedback_comment && (
                      <p className="text-xs text-slate-600 mt-2 italic">
                        "{incident.feedback_comment}"
                      </p>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <p className="text-xs text-slate-600">Rate your satisfaction with the resolution of this issue:</p>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-6 h-6 cursor-pointer transition-colors ${
                              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={2}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Optional remarks on technician helpfulness, resolution speed..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      Submit Feedback
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Audit History Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <History className="w-4 h-4 text-blue-600" />
              <span>Audit Trail Timeline (Immutable Event Log)</span>
            </div>
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
              {auditLogs.map((log) => (
                <div key={log.id} className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
                  <div>
                    <span className="text-xs font-bold text-slate-800">{log.action}</span>
                    <span className="text-xs text-slate-400 ml-2">{formatDate(log.timestamp)}</span>
                    <p className="text-xs text-slate-600 mt-0.5">{log.description}</p>
                    {log.previous_state && log.new_state && (
                      <span className="inline-block mt-1 font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {log.previous_state} → {log.new_state}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Metadata, SLA, and Intelligent Suggestions */}
        <div className="space-y-6">
          {/* SLA Tracking Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>SLA Target Tracking</span>
            </h3>

            {incident.sla_resolution_deadline ? (
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-slate-400 block">Resolution Target</span>
                  <div className="mt-1">
                    <SLATimer
                      deadline={incident.sla_resolution_deadline}
                      isViolated={incident.sla_violated}
                    />
                  </div>
                </div>
                <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 space-y-1">
                  <p>Deadline: {formatDate(incident.sla_resolution_deadline)}</p>
                  <p>
                    Status:{' '}
                    {incident.sla_violated ? (
                      <span className="text-red-600 font-bold">VIOLATION DETECTED</span>
                    ) : (
                      <span className="text-emerald-600 font-bold">COMPLIANT</span>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No active SLA timer for this state.</p>
            )}
          </div>

          {/* Incident Properties Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Properties</h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Category</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {incident.category?.toString().toLowerCase() || 'Unassigned'}
                </span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Business Impact</span>
                <span className="font-semibold text-slate-800">{incident.impact}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Urgency</span>
                <span className="font-semibold text-slate-800">{incident.urgency}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Criticality</span>
                <span className="font-semibold text-slate-800">{incident.business_criticality || 'MEDIUM'}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Affected Users</span>
                <span className="font-semibold text-slate-800">{incident.affected_users_count || 1}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Priority Score</span>
                <span className="font-mono font-bold text-slate-900">{incident.priority_score || '—'}</span>
              </div>
            </div>
          </div>

          {/* AI Feature: Similar Resolutions */}
          {similarResolutions.length > 0 && (
            <div className="bg-purple-50 rounded-2xl border border-purple-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>AI Suggested Resolutions</span>
              </div>
              <p className="text-[11px] text-purple-700">
                From historical incidents in category '{incident.category}':
              </p>
              <div className="space-y-2">
                {similarResolutions.map((item, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-purple-200 text-xs space-y-1">
                    <p className="font-bold text-slate-900 truncate">{item.title}</p>
                    <p className="text-slate-600 line-clamp-2 italic">"{item.resolution}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Feature: Technician Ranking Recommendation */}
          {user?.role === UserRole.ADMIN && recommendedTechs.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>AI Technician Match Ranking</span>
              </h3>
              <div className="space-y-2">
                {recommendedTechs.slice(0, 3).map((rt) => (
                  <div key={rt.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{rt.name}</span>
                      <span className="text-blue-600">Match: {rt.suitability_score} pts</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Workload: {rt.current_workload}/{rt.max_workload} • Skills: {rt.skills?.join(', ') || 'General'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Resolve Incident</h3>
            <p className="text-xs text-slate-500">
              Provide thorough resolution details so the employee and auditing logs have a clear record.
            </p>
            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <textarea
                required
                minLength={10}
                rows={5}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Restarted payment worker pods, flushed stale Redis connection pool, and verified successful test transactions."
                className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  {actionLoading ? 'Saving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

