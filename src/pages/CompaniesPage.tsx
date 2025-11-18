import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Company, Checklist } from '../types/database';
import { Plus, Edit2, Power } from 'lucide-react';

export function CompaniesPage() {
  const [companies, setCompanies] = useState<(Company & { users_count?: number; checklist_name?: string })[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active_checklist_id: '',
    status: 'active' as const,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [companiesRes, checklistsRes] = await Promise.all([
      supabase.from('companies').select('*').order('created_at', { ascending: false }),
      supabase.from('checklists').select('*').order('name'),
    ]);

    if (companiesRes.data) {
      const companiesWithCounts = await Promise.all(
        companiesRes.data.map(async (company) => {
          const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id);

          const checklist = checklistsRes.data?.find((c) => c.id === company.active_checklist_id);

          return {
            ...company,
            users_count: count || 0,
            checklist_name: checklist?.name || '',
          };
        })
      );
      setCompanies(companiesWithCounts);
    }

    if (checklistsRes.data) {
      setChecklists(checklistsRes.data);
    }

    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingCompany) {
      await supabase
        .from('companies')
        .update({
          ...formData,
          active_checklist_id: formData.active_checklist_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingCompany.id);
    } else {
      await supabase.from('companies').insert({
        ...formData,
        active_checklist_id: formData.active_checklist_id || null,
      });
    }

    setShowModal(false);
    setEditingCompany(null);
    setFormData({ name: '', description: '', active_checklist_id: '', status: 'active' });
    loadData();
  }

  async function toggleStatus(company: Company) {
    await supabase
      .from('companies')
      .update({
        status: company.status === 'active' ? 'inactive' : 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', company.id);
    loadData();
  }

  function openEditModal(company: Company) {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      description: company.description || '',
      active_checklist_id: company.active_checklist_id || '',
      status: company.status,
    });
    setShowModal(true);
  }

  function openCreateModal() {
    setEditingCompany(null);
    setFormData({ name: '', description: '', active_checklist_id: '', status: 'active' });
    setShowModal(true);
  }

  if (loading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Companies</h2>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Company
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Active Checklist</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Users</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Created</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {companies.map((company) => (
              <tr key={company.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{company.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{company.checklist_name || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{company.users_count}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      company.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {company.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(company.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEditModal(company)}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mr-3"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => toggleStatus(company)}
                    className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    <Power size={14} />
                    {company.status === 'active' ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              {editingCompany ? 'Edit Company' : 'Create Company'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Active Checklist</label>
                <select
                  value={formData.active_checklist_id}
                  onChange={(e) => setFormData({ ...formData, active_checklist_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  {checklists.map((checklist) => (
                    <option key={checklist.id} value={checklist.id}>
                      {checklist.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingCompany ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
