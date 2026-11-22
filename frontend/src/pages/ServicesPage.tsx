import React, { useEffect, useState } from 'react';
import { servicesApi } from '../api/client';
import { ITService, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Server, Plus, Trash2, Edit2, ShieldAlert } from 'lucide-react';
import { formatDate, getErrorMessage } from '../utils/helpers';

export default function ServicesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const [services, setServices] = useState<ITService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<ITService | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isCritical, setIsCritical] = useState(false);
  const [owner, setOwner] = useState('');
  const [error, setError] = useState('');

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await servicesApi.getAll();
      setServices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openCreateModal = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setCategory('');
    setIsCritical(false);
    setOwner('');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (s: ITService) => {
    setEditingService(s);
    setName(s.name);
    setDescription(s.description || '');
    setCategory(s.category || '');
    setIsCritical(s.is_critical);
    setOwner(s.owner || '');
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingService) {
        await servicesApi.update(editingService.id, {
          name,
          description,
          category,
          is_critical: isCritical,
          owner,
        });
      } else {
        await servicesApi.create({
          name,
          description,
          category,
          is_critical: isCritical,
          owner,
        });
      }
      setShowModal(false);
      fetchServices();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this IT service?')) return;
    try {
      await servicesApi.delete(id);
      fetchServices();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Enterprise IT Services Catalog</h1>
          <p className="text-sm text-slate-500">Business services, infrastructure components, and digital platforms.</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            Add IT Service
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((svc) => (
          <div
            key={svc.id}
            className={`bg-white rounded-2xl border p-6 shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
              svc.is_critical ? 'border-red-200' : 'border-slate-200'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      svc.is_critical ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{svc.name}</h3>
                    <span className="text-[11px] font-semibold text-slate-400 capitalize">
                      {svc.category || 'General'}
                    </span>
                  </div>
                </div>
                {svc.is_critical && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700 border border-red-200">
                    <ShieldAlert className="w-3 h-3" />
                    Critical
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 line-clamp-3">
                {svc.description || 'No description registered.'}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Owner: {svc.owner || 'IT Operations'}</span>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(svc)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(svc.id)}
                    className="p-1.5 text-slate-500 hover:text-red-600 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">
              {editingService ? 'Edit IT Service' : 'Add IT Service'}
            </h3>
            {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-normal"
                />
              </div>

              <div>
                <label className="block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-normal"
                />
              </div>

              <div>
                <label className="block mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Finance, Core Infra, Storage"
                  className="w-full px-3 py-2 border rounded-lg font-normal"
                />
              </div>

              <div>
                <label className="block mb-1">System Owner</label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="e.g. Payments Engineering Team"
                  className="w-full px-3 py-2 border rounded-lg font-normal"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="critical"
                  checked={isCritical}
                  onChange={(e) => setIsCritical(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <label htmlFor="critical" className="font-semibold text-slate-800">
                  Mark as Mission-Critical Service
                </label>
              </div>

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
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

