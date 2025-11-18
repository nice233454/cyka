import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { ProcessingLog, Company } from '../types/database';
import { Filter } from 'lucide-react';

export function LogsPage() {
  const [logs, setLogs] = useState<(ProcessingLog & { company_name?: string })[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    company_id: '',
    call_id: '',
    stage: '',
    status: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, [filters]);

  async function loadData() {
    setLoading(true);

    let query = supabase.from('processing_logs').select('*').order('created_at', { ascending: false }).limit(100);

    if (filters.company_id) {
      query = query.eq('company_id', filters.company_id);
    }
    if (filters.call_id) {
      query = query.eq('call_id', filters.call_id);
    }
    if (filters.stage) {
      query = query.eq('stage', filters.stage);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const [logsRes, companiesRes] = await Promise.all([
      query,
      supabase.from('companies').select('*').order('name'),
    ]);

    if (logsRes.data && companiesRes.data) {
      const logsWithCompany = logsRes.data.map((log) => {
        const company = companiesRes.data.find((c) => c.id === log.company_id);
        return {
          ...log,
          company_name: company?.name || '',
        };
      });
      setLogs(logsWithCompany);
    }

    if (companiesRes.data) {
      setCompanies(companiesRes.data);
    }

    setLoading(false);
  }

  function resetFilters() {
    setFilters({
      company_id: '',
      call_id: '',
      stage: '',
      status: '',
    });
  }

  const stages = [
    'audio_received',
    'sent_to_assembly',
    'transcript_ready',
    'summary_done',
    'checklist_done',
    'error',
  ];

  if (loading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Processing Logs</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
        >
          <Filter size={18} />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <select
                value={filters.company_id}
                onChange={(e) => setFilters({ ...filters, company_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Companies</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Call ID</label>
              <input
                type="text"
                value={filters.call_id}
                onChange={(e) => setFilters({ ...filters, call_id: e.target.value })}
                placeholder="Enter call ID"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <select
                value={filters.stage}
                onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Stages</option>
                {stages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="ok">OK</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Time</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Call ID</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Company</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Stage</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                  {log.call_id ? log.call_id.slice(0, 8) : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{log.company_name || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{log.stage}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      log.status === 'ok'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {log.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate">
                  {log.message || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No logs found
          </div>
        )}
      </div>
    </div>
  );
}
