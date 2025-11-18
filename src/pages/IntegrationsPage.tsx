import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { IntegrationSettings } from '../types/database';
import { Save, CheckCircle } from 'lucide-react';

export function IntegrationsPage() {
  const [settings, setSettings] = useState<IntegrationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    assemblyai_api_key: '',
    assemblyai_webhook_secret: '',
    llm_provider: 'openai',
    llm_api_key: '',
    llm_base_url: '',
    llm_default_model: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    const { data } = await supabase
      .from('integration_settings')
      .select('*')
      .single();

    if (data) {
      setSettings(data);
      setFormData({
        assemblyai_api_key: data.assemblyai_api_key || '',
        assemblyai_webhook_secret: data.assemblyai_webhook_secret || '',
        llm_provider: data.llm_provider || 'openai',
        llm_api_key: data.llm_api_key || '',
        llm_base_url: data.llm_base_url || '',
        llm_default_model: data.llm_default_model || '',
      });
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    await supabase
      .from('integration_settings')
      .update({
        ...formData,
        assemblyai_api_key: formData.assemblyai_api_key || null,
        assemblyai_webhook_secret: formData.assemblyai_webhook_secret || null,
        llm_api_key: formData.llm_api_key || null,
        llm_base_url: formData.llm_base_url || null,
        llm_default_model: formData.llm_default_model || null,
      })
      .eq('id', settings?.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    loadSettings();
  }

  if (loading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Integrations</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">AssemblyAI</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input
                type="password"
                value={formData.assemblyai_api_key}
                onChange={(e) => setFormData({ ...formData, assemblyai_api_key: e.target.value })}
                placeholder="Enter AssemblyAI API key"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Secret</label>
              <input
                type="password"
                value={formData.assemblyai_webhook_secret}
                onChange={(e) => setFormData({ ...formData, assemblyai_webhook_secret: e.target.value })}
                placeholder="Optional webhook secret"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
              <input
                type="text"
                value="https://your-backend.com/api/webhooks/assemblyai"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">Configure this URL in AssemblyAI dashboard</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">LLM Provider</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
              <select
                value={formData.llm_provider}
                onChange={(e) => setFormData({ ...formData, llm_provider: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="openai">OpenAI</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input
                type="password"
                value={formData.llm_api_key}
                onChange={(e) => setFormData({ ...formData, llm_api_key: e.target.value })}
                placeholder="Enter LLM API key"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
              <input
                type="text"
                value={formData.llm_base_url}
                onChange={(e) => setFormData({ ...formData, llm_base_url: e.target.value })}
                placeholder="Optional custom endpoint URL"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Model</label>
              <input
                type="text"
                value={formData.llm_default_model}
                onChange={(e) => setFormData({ ...formData, llm_default_model: e.target.value })}
                placeholder="e.g., gpt-4.1-mini"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

          {saved && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle size={18} />
              <span>Settings saved successfully</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
