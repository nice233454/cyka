import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Team, Company } from '../types/database';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export function TeamsPage() {
  const [teams, setTeams] = useState<(Team & { company_name?: string; users_count?: number })[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    company_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [teamsRes, companiesRes] = await Promise.all([
      supabase.from('teams').select('*').order('created_at', { ascending: false }),
      supabase.from('companies').select('*').order('name'),
    ]);

    if (teamsRes.data && companiesRes.data) {
      const teamsWithData = await Promise.all(
        teamsRes.data.map(async (team) => {
          const company = companiesRes.data.find((c) => c.id === team.company_id);
          const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id);

          return {
            ...team,
            company_name: company?.name || '',
            users_count: count || 0,
          };
        })
      );
      setTeams(teamsWithData);
    }

    if (companiesRes.data) {
      setCompanies(companiesRes.data);
    }

    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingTeam) {
      await supabase
        .from('teams')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTeam.id);
    } else {
      await supabase.from('teams').insert(formData);
    }

    setShowModal(false);
    setEditingTeam(null);
    setFormData({ name: '', company_id: '' });
    loadData();
  }

  async function deleteTeam(id: string) {
    if (confirm('Are you sure you want to delete this team?')) {
      await supabase.from('teams').delete().eq('id', id);
      loadData();
    }
  }

  function openEditModal(team: Team) {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      company_id: team.company_id,
    });
    setShowModal(true);
  }

  function openCreateModal() {
    setEditingTeam(null);
    setFormData({ name: '', company_id: '' });
    setShowModal(true);
  }

  if (loading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Teams</h2>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Team
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Company</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Users</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Created</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {teams.map((team) => (
              <tr key={team.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{team.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{team.company_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{team.users_count}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(team.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEditModal(team)}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mr-3"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTeam(team.id)}
                    className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={14} />
                    Delete
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
              {editingTeam ? 'Edit Team' : 'Create Team'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <select
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
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
                  {editingTeam ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
