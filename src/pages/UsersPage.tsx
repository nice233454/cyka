import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Company, Team } from '../types/database';
import { Plus, Edit2, Ban, CheckCircle } from 'lucide-react';

export function UsersPage() {
  const [users, setUsers] = useState<(User & { company_name?: string; team_name?: string })[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'manager' as const,
    company_id: '',
    team_id: '',
    status: 'active' as const,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [usersRes, companiesRes, teamsRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('companies').select('*').order('name'),
      supabase.from('teams').select('*').order('name'),
    ]);

    if (usersRes.data && companiesRes.data && teamsRes.data) {
      const usersWithData = usersRes.data.map((user) => {
        const company = companiesRes.data.find((c) => c.id === user.company_id);
        const team = teamsRes.data.find((t) => t.id === user.team_id);
        return {
          ...user,
          company_name: company?.name || '',
          team_name: team?.name || '',
        };
      });
      setUsers(usersWithData);
    }

    if (companiesRes.data) setCompanies(companiesRes.data);
    if (teamsRes.data) setTeams(teamsRes.data);

    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingUser) {
      await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          company_id: formData.company_id,
          team_id: formData.team_id || null,
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUser.id);
    } else {
      const tempPassword = Math.random().toString(36).slice(-8);
      const { data: authData } = await supabase.auth.signUp({
        email: formData.email,
        password: tempPassword,
      });

      if (authData.user) {
        await supabase.from('users').insert({
          id: authData.user.id,
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          company_id: formData.company_id,
          team_id: formData.team_id || null,
          status: formData.status,
          password_hash: '',
        });
      }
    }

    setShowModal(false);
    setEditingUser(null);
    setFormData({ full_name: '', email: '', role: 'manager', company_id: '', team_id: '', status: 'active' });
    loadData();
  }

  async function toggleStatus(user: User) {
    await supabase
      .from('users')
      .update({
        status: user.status === 'active' ? 'blocked' : 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    loadData();
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
      team_id: user.team_id || '',
      status: user.status,
    });
    setShowModal(true);
  }

  function openCreateModal() {
    setEditingUser(null);
    setFormData({ full_name: '', email: '', role: 'manager', company_id: '', team_id: '', status: 'active' });
    setShowModal(true);
  }

  const filteredTeams = teams.filter((team) => team.company_id === formData.company_id);

  if (loading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={18} />
          Create User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Email</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Role</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Company</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Team</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Status</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{user.full_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.role}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.company_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.team_name || '-'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEditModal(user)}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mr-3"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => toggleStatus(user)}
                    className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    {user.status === 'active' ? <Ban size={14} /> : <CheckCircle size={14} />}
                    {user.status === 'active' ? 'Block' : 'Unblock'}
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
              {editingUser ? 'Edit User' : 'Create User'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!editingUser}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="manager">Manager</option>
                  <option value="lead">Lead</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <select
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value, team_id: '' })}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                <select
                  value={formData.team_id}
                  onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  {filteredTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
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
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
