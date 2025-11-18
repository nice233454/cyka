import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { LLMPrompt, PromptType } from '../types/database';
import { Plus, Edit2 } from 'lucide-react';

export function PromptsPage() {
  const [prompts, setPrompts] = useState<LLMPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<LLMPrompt | null>(null);
  const [formData, setFormData] = useState({
    type: 'summary' as PromptType,
    name: '',
    model: '',
    prompt_text: '',
    is_active: true,
  });

  useEffect(() => {
    loadPrompts();
  }, []);

  async function loadPrompts() {
    setLoading(true);
    const { data } = await supabase
      .from('llm_prompts')
      .select('*')
      .order('type')
      .order('created_at', { ascending: false });

    if (data) {
      setPrompts(data);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingPrompt) {
      await supabase
        .from('llm_prompts')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingPrompt.id);
    } else {
      await supabase.from('llm_prompts').insert(formData);
    }

    setShowModal(false);
    setEditingPrompt(null);
    setFormData({ type: 'summary', name: '', model: '', prompt_text: '', is_active: true });
    loadPrompts();
  }

  function openEditModal(prompt: LLMPrompt) {
    setEditingPrompt(prompt);
    setFormData({
      type: prompt.type,
      name: prompt.name,
      model: prompt.model,
      prompt_text: prompt.prompt_text,
      is_active: prompt.is_active,
    });
    setShowModal(true);
  }

  function openCreateModal() {
    setEditingPrompt(null);
    setFormData({ type: 'summary', name: '', model: '', prompt_text: '', is_active: true });
    setShowModal(true);
  }

  const groupedPrompts: Record<PromptType, LLMPrompt[]> = {
    summary: [],
    recommendations: [],
    checklist: [],
  };

  prompts.forEach((prompt) => {
    groupedPrompts[prompt.type].push(prompt);
  });

  if (loading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">LLM Prompts</h2>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Prompt
        </button>
      </div>

      <div className="space-y-6">
        {(['summary', 'recommendations', 'checklist'] as PromptType[]).map((type) => (
          <div key={type} className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 capitalize">{type}</h3>
            </div>
            <div className="p-4">
              {groupedPrompts[type].length > 0 ? (
                <div className="space-y-3">
                  {groupedPrompts[type].map((prompt) => (
                    <div
                      key={prompt.id}
                      className="border border-gray-200 rounded p-4 hover:border-gray-300"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{prompt.name}</h4>
                          <p className="text-sm text-gray-500">Model: {prompt.model}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              prompt.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {prompt.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            onClick={() => openEditModal(prompt)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded font-mono max-h-32 overflow-auto">
                        {prompt.prompt_text}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No prompts for {type}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              {editingPrompt ? 'Edit Prompt' : 'Create Prompt'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as PromptType })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="summary">Summary</option>
                  <option value="recommendations">Recommendations</option>
                  <option value="checklist">Checklist</option>
                </select>
              </div>

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
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                  placeholder="e.g., gpt-4.1-mini"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Text</label>
                <textarea
                  value={formData.prompt_text}
                  onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                  required
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  {editingPrompt ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
