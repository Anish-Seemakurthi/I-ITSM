import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentsApi, servicesApi } from '../api/client';
import { Category, Impact, Urgency, ITService } from '../types';
import { Sparkles, AlertTriangle, ShieldAlert, ArrowLeft } from 'lucide-react';
import { getErrorMessage } from '../utils/helpers';

export default function CreateIncidentPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');
  const [serviceId, setServiceId] = useState<string>('');
  const [impact, setImpact] = useState<string>('MEDIUM');
  const [urgency, setUrgency] = useState<string>('MEDIUM');
  const [criticality, setCriticality] = useState<string>('MEDIUM');
  const [affectedUsers, setAffectedUsers] = useState<number>(1);

  const [services, setServices] = useState<ITService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // AI Feature States
  const [aiCategorizing, setAiCategorizing] = useState(false);
  const [aiCategoryResult, setAiCategoryResult] = useState<{ suggested_category: string; confidence: number; rationale: string } | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<any[]>([]);

  useEffect(() => {
    servicesApi.getAll().then(setServices).catch(console.error);
  }, []);

  // Compute live estimated priority score
  const impactWeights: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  const urgencyWeights: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const critWeights: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

  const estimatedScore =
    (impactWeights[impact] || 2) * (urgencyWeights[urgency] || 2) * (critWeights[criticality] || 2);

  const estimatedPriority =
    estimatedScore >= 24 ? 'P1' : estimatedScore >= 12 ? 'P2' : estimatedScore >= 6 ? 'P3' : 'P4';

  const handleAiCategorize = async () => {
    if (!title && !description) {
      setError('Please provide at least a title or description for AI analysis.');
      return;
    }
    setAiCategorizing(true);
    try {
      const res = await incidentsApi.suggestCategory(title, description);
      setAiCategoryResult(res);
      setCategory(res.suggested_category);
    } catch (err) {
      console.error(err);
    } finally {
      setAiCategorizing(false);
    }
  };

  const handleCheckDuplicates = async () => {
    if (title.length < 5) return;
    try {
      const duplicates = await incidentsApi.checkDuplicate({
        title,
        description,
        category: category || undefined,
        service_id: serviceId || undefined,
      });
      setDuplicateWarning(duplicates);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const newInc = await incidentsApi.create({
        title,
        description,
        category: category || undefined,
        service_id: serviceId || undefined,
        impact,
        urgency,
        business_criticality: criticality,
        affected_users_count: Number(affectedUsers),
      });
      navigate(`/incidents/${newInc.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Report IT Incident</h1>
          <p className="text-xs text-slate-500">Provide details so our intelligent dispatch can prioritize and assign support.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Duplicate Alert Banner if detected */}
      {duplicateWarning.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Potential Duplicate Incident Detected!</span>
          </div>
          <p className="text-xs text-amber-700">
            Similar open incident(s) were found. You may be reporting a problem already under investigation:
          </p>
          <div className="space-y-1">
            {duplicateWarning.map((d) => (
              <div key={d.incident_id} className="text-xs bg-white p-2 rounded border border-amber-200 flex justify-between">
                <span className="font-semibold text-slate-800">{d.incident_number}: {d.title}</span>
                <span className="text-amber-700 font-mono">Similarity: {Math.round(d.similarity_score * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Incident Title / Summary *
          </label>
          <input
            type="text"
            required
            minLength={5}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleCheckDuplicates}
            placeholder="e.g. Payment gateway returning 500 error on checkout"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Detailed Description *
            </label>
            <button
              type="button"
              onClick={handleAiCategorize}
              disabled={aiCategorizing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              {aiCategorizing ? 'Analyzing...' : 'Auto-Suggest Category'}
            </button>
          </div>
          <textarea
            required
            minLength={10}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleCheckDuplicates}
            placeholder="Describe the failure, error messages, who is affected, and steps to reproduce..."
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-sans"
          />
        </div>

        {/* AI Categorization Suggestion Result */}
        {aiCategoryResult && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 flex items-center justify-between">
            <div>
              <span className="font-bold">AI Suggestion: </span>
              <span>{aiCategoryResult.suggested_category}</span>
              <span className="ml-2 text-purple-600">({Math.round(aiCategoryResult.confidence * 100)}% confidence)</span>
              <p className="text-purple-700 mt-0.5">{aiCategoryResult.rationale}</p>
            </div>
            <span className="text-emerald-600 font-bold">✓ Applied</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Incident Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">-- Select or Use AI Suggestion --</option>
              {Object.values(Category).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Affected IT Service
            </label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">-- General / Unknown Service --</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.is_critical ? '⭐ (Mission-Critical)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Priority Calculation Factors (Strategy Pattern) */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Priority Determination Factors
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Calculated Priority:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                  estimatedPriority === 'P1'
                    ? 'bg-red-600 text-white'
                    : estimatedPriority === 'P2'
                    ? 'bg-orange-500 text-white'
                    : estimatedPriority === 'P3'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-green-600 text-white'
                }`}
              >
                {estimatedPriority} (Score: {estimatedScore})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Business Impact</label>
              <select
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
              >
                <option value="HIGH">HIGH (3x)</option>
                <option value="MEDIUM">MEDIUM (2x)</option>
                <option value="LOW">LOW (1x)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Urgency</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
              >
                <option value="CRITICAL">CRITICAL (4x)</option>
                <option value="HIGH">HIGH (3x)</option>
                <option value="MEDIUM">MEDIUM (2x)</option>
                <option value="LOW">LOW (1x)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Business Criticality</label>
              <select
                value={criticality}
                onChange={(e) => setCriticality(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
              >
                <option value="HIGH">HIGH (3x)</option>
                <option value="MEDIUM">MEDIUM (2x)</option>
                <option value="LOW">LOW (1x)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Affected Users</label>
              <input
                type="number"
                min={1}
                value={affectedUsers}
                onChange={(e) => setAffectedUsers(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting Incident...' : 'Submit Incident'}
          </button>
        </div>
      </form>
    </div>
  );
}

