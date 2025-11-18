import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Checklist, ChecklistCategory, ChecklistItem } from '../types/database';
import { Plus, Edit2, Trash2, Copy, ChevronDown, ChevronRight } from 'lucide-react';

export function ChecklistsPage() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(null);
  const [categories, setCategories] = useState<ChecklistCategory[]>([]);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);
  const [checklistFormData, setChecklistFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadChecklists();
  }, []);

  useEffect(() => {
    if (selectedChecklist) {
      loadChecklistDetails(selectedChecklist);
    }
  }, [selectedChecklist]);

  async function loadChecklists() {
    setLoading(true);
    const { data } = await supabase
      .from('checklists')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setChecklists(data);
      if (data.length > 0 && !selectedChecklist) {
        setSelectedChecklist(data[0].id);
      }
    }
    setLoading(false);
  }

  async function loadChecklistDetails(checklistId: string) {
    const [categoriesRes, itemsRes] = await Promise.all([
      supabase
        .from('checklist_categories')
        .select('*')
        .eq('checklist_id', checklistId)
        .order('position'),
      supabase
        .from('checklist_items')
        .select('*')
        .order('position'),
    ]);

    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (itemsRes.data) setItems(itemsRes.data);
  }

  async function handleChecklistSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingChecklist) {
      await supabase
        .from('checklists')
        .update({
          ...checklistFormData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingChecklist.id);
    } else {
      await supabase.from('checklists').insert(checklistFormData);
    }

    setShowChecklistModal(false);
    setEditingChecklist(null);
    setChecklistFormData({ name: '', description: '' });
    loadChecklists();
  }

  async function deleteChecklist(id: string) {
    if (confirm('Are you sure you want to delete this checklist?')) {
      await supabase.from('checklists').delete().eq('id', id);
      setSelectedChecklist(null);
      loadChecklists();
    }
  }

  async function cloneChecklist(id: string) {
    const { data: checklist } = await supabase
      .from('checklists')
      .select('*')
      .eq('id', id)
      .single();

    if (checklist) {
      const { data: newChecklist } = await supabase
        .from('checklists')
        .insert({
          name: `${checklist.name} (Copy)`,
          description: checklist.description,
        })
        .select()
        .single();

      if (newChecklist) {
        const { data: cats } = await supabase
          .from('checklist_categories')
          .select('*')
          .eq('checklist_id', id);

        if (cats) {
          for (const cat of cats) {
            const { data: newCat } = await supabase
              .from('checklist_categories')
              .insert({
                checklist_id: newChecklist.id,
                name: cat.name,
                position: cat.position,
              })
              .select()
              .single();

            if (newCat) {
              const { data: itms } = await supabase
                .from('checklist_items')
                .select('*')
                .eq('category_id', cat.id);

              if (itms) {
                await supabase.from('checklist_items').insert(
                  itms.map((item) => ({
                    category_id: newCat.id,
                    name: item.name,
                    description: item.description,
                    position: item.position,
                    is_active: item.is_active,
                  }))
                );
              }
            }
          }
        }
      }

      loadChecklists();
    }
  }

  async function addCategory() {
    if (!selectedChecklist) return;
    const name = prompt('Category name:');
    if (!name) return;

    await supabase.from('checklist_categories').insert({
      checklist_id: selectedChecklist,
      name,
      position: categories.length,
    });

    loadChecklistDetails(selectedChecklist);
  }

  async function deleteCategory(id: string) {
    if (confirm('Delete this category and all its items?')) {
      await supabase.from('checklist_categories').delete().eq('id', id);
      loadChecklistDetails(selectedChecklist!);
    }
  }

  async function addItem(categoryId: string) {
    const name = prompt('Criterion name:');
    if (!name) return;

    const itemsInCategory = items.filter((i) => i.category_id === categoryId);

    await supabase.from('checklist_items').insert({
      category_id: categoryId,
      name,
      position: itemsInCategory.length,
      is_active: true,
    });

    loadChecklistDetails(selectedChecklist!);
  }

  async function deleteItem(id: string) {
    if (confirm('Delete this criterion?')) {
      await supabase.from('checklist_items').delete().eq('id', id);
      loadChecklistDetails(selectedChecklist!);
    }
  }

  async function toggleItemActive(item: ChecklistItem) {
    await supabase
      .from('checklist_items')
      .update({ is_active: !item.is_active })
      .eq('id', item.id);
    loadChecklistDetails(selectedChecklist!);
  }

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  function toggleCategory(id: string) {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  }

  if (loading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  return (
    <div className="flex gap-6">
      <div className="w-80 bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Checklists</h3>
          <button
            onClick={() => {
              setEditingChecklist(null);
              setChecklistFormData({ name: '', description: '' });
              setShowChecklistModal(true);
            }}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="space-y-2">
          {checklists.map((checklist) => (
            <div
              key={checklist.id}
              className={`p-2 rounded cursor-pointer ${
                selectedChecklist === checklist.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedChecklist(checklist.id)}
            >
              <div className="font-medium text-sm text-gray-900">{checklist.name}</div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingChecklist(checklist);
                    setChecklistFormData({
                      name: checklist.name,
                      description: checklist.description || '',
                    });
                    setShowChecklistModal(true);
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cloneChecklist(checklist.id);
                  }}
                  className="text-xs text-gray-600 hover:underline"
                >
                  Clone
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChecklist(checklist.id);
                  }}
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1">
        {selectedChecklist ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {checklists.find((c) => c.id === selectedChecklist)?.name}
              </h2>
              <button
                onClick={addCategory}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                <Plus size={18} />
                Add Category
              </button>
            </div>

            <div className="space-y-4">
              {categories.map((category) => {
                const categoryItems = items.filter((item) => item.category_id === category.id);
                const isExpanded = expandedCategories.has(category.id);

                return (
                  <div key={category.id} className="border border-gray-200 rounded">
                    <div
                      className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
                      onClick={() => toggleCategory(category.id)}
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        <span className="font-medium text-gray-900">{category.name}</span>
                        <span className="text-sm text-gray-500">({categoryItems.length} items)</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addItem(category.id);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCategory(category.id);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 space-y-2">
                        {categoryItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                          >
                            <div className="flex-1">
                              <div className="text-sm text-gray-900">{item.name}</div>
                              {item.description && (
                                <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                              )}
                            </div>
                            <div className="flex gap-2 items-center">
                              <button
                                onClick={() => toggleItemActive(item)}
                                className={`px-2 py-1 text-xs rounded ${
                                  item.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {item.is_active ? 'Active' : 'Inactive'}
                              </button>
                              <button
                                onClick={() => deleteItem(item.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500">Select a checklist to view details</p>
          </div>
        )}
      </div>

      {showChecklistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              {editingChecklist ? 'Edit Checklist' : 'Create Checklist'}
            </h3>

            <form onSubmit={handleChecklistSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={checklistFormData.name}
                  onChange={(e) => setChecklistFormData({ ...checklistFormData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={checklistFormData.description}
                  onChange={(e) =>
                    setChecklistFormData({ ...checklistFormData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowChecklistModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  {editingChecklist ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
