import React, { useEffect, useState } from 'react';
import { techniciansApi } from '../api/client';
import { Technician } from '../types';
import { Users, Plus, UserCheck, UserX, Shield, Edit3 } from 'lucide-react';
import { getErrorMessage } from '../utils/helpers';

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [skillsStr, setSkillsStr] = useState('');
  const [maxWorkload, setMaxWorkload] = useState(5);
  const [availability, setAvailability] = useState(true);
  const [error, setError] = useState('');

  const fetchTechs = async () => {
    setLoading(true);
    try {
      const data = await techniciansApi.getAll();
      setTechnicians(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechs();
  }, []);

  const openCreateModal = () => {
    setEditingTech(null);
    setName('');
    setEmail('');
    setPassword('tech123');
    setSkillsStr('');
    setMaxWorkload(5);
    setAvailability(true);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (t: Technician) => {
    setEditingTech(t);
    setName(t.name);
    setEmail(t.email);
    setPassword('');
    setSkillsStr(t.skills?.join(', ') || '');
    setMaxWorkload(t.max_workload || 5);
    setAvailability(t.availability !== false);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const skills = skillsStr.split(',').map((s) => s.trim()).filter(Boolean);
    try {
      if (editingTech) {
        await techniciansApi.update(editingTech.id, {
          name,
          skills,
          max_workload: Number(maxWorkload),
          availability,
        });
      } else {
        await techniciansApi.create({
          name,
          email,
          password,
          skills,
          max_workload: Number(maxWorkload),
        });
      }
      setShowModal(false);
      fetchTechs();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const toggleAvailability = async (t: Technician) => {
    try {
      await techniciansApi.update(t.id, {
        availability: !t.availability,
      });
      fetchTechs();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Technician Staff Management</h1>
          <p className="text-sm text-slate-500">Configure skill proficiencies, max load caps, and active duty status.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Technician
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {technicians.map((t) => {
          const load = t.current_workload || 0;
          const max = t.max_workload || 5;
          const pct = Math.round((load / max) * 100);

          return (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm uppercase">
                      {t.name ? t.name[0] : 'T'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
                      <span className="text-xs text-slate-400 font-mono">{t.email}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAvailability(t)}
                    title="Click to toggle availability"
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border transition-colors ${
                      t.availability !== false
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {t.availability !== false ? (
                      <>
                        <UserCheck className="w-3 h-3 text-emerald-600" /> Available
                      </>
                    ) : (
                      <>
                        <UserX className="w-3 h-3 text-slate-400" /> Off Duty
                      </>
                    )}
                  </button>
                </div>

                {/* Skills Badges */}
                <div className="mt-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Certified Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {t.skills && t.skills.length > 0 ? (
                      t.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[11px] font-medium"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No special skills listed</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Workload Progress */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-500">Active Workload</span>
                  <span className="font-mono text-slate-800">
                    {load} / {max} slots ({pct}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      pct >= 100 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => openEditModal(t)}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">
              {editingTech ? 'Edit Technician' : 'Add Technician Profile'}
            </h3>
            {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1">Technician Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-normal"
                />
              </div>

              {!editingTech && (
                <>
                  <div>
                    <label className="block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg font-normal"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Temporary Password *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg font-normal"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block mb-1">Skills (comma-separated)</label>
                <input
                  type="text"
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  placeholder="e.g. Network, Database, Security, Cloud"
                  className="w-full px-3 py-2 border rounded-lg font-normal"
                />
              </div>

              <div>
                <label className="block mb-1">Max Concurrent Workload</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={maxWorkload}
                  onChange={(e) => setMaxWorkload(parseInt(e.target.value) || 5)}
                  className="w-full px-3 py-2 border rounded-lg font-normal"
                />
              </div>

              {editingTech && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="avail"
                    checked={availability}
                    onChange={(e) => setAvailability(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <label htmlFor="avail" className="font-semibold text-slate-800">
                    Mark Available for Auto-Dispatch
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-normal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

