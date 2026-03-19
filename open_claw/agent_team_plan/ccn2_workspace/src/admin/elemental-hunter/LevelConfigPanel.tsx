/**
 * LevelConfigPanel — Admin UI for managing Level difficulty configurations.
 * 
 * Features:
 * - CRUD for level configurations (max rounds, combo tiers, artifact slots)
 * - Built-in levels (Lv1, Lv2, Lv3) are read-only
 * 
 * REST endpoints: /api/admin/elemental-hunter/levels
 */

import React, { useState, useEffect } from 'react';

interface LevelConfig {
  levelId: string;
  maxRounds: number;
  comboTierMax: number;
  artifactSlots: number;
  hpMultiplier: number;
}

const LevelConfigPanel: React.FC = () => {
  const [levels, setLevels] = useState<LevelConfig[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<LevelConfig | null>(null);
  const [editingLevel, setEditingLevel] = useState<LevelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const authHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${(window as any).ADMIN_TOOL_TOKEN || 'demo-token'}`,
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/elemental-hunter/levels', { headers: authHeaders });
      if (!response.ok) throw new Error('Failed to fetch levels');
      const data = await response.json();
      setLevels(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (level: LevelConfig) => {
    setSelectedLevel(level);
    setEditingLevel({ ...level });
    setShowCreateForm(false);
  };

  const handleCreateNew = () => {
    setEditingLevel({
      levelId: '',
      maxRounds: 12,
      comboTierMax: 1,
      artifactSlots: 1,
      hpMultiplier: 100
    });
    setSelectedLevel(null);
    setShowCreateForm(true);
  };

  const handleSave = async () => {
    if (!editingLevel) return;
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const isUpdate = !showCreateForm && levels.some(l => l.levelId === editingLevel.levelId);
      const url = showCreateForm 
        ? '/api/admin/elemental-hunter/levels'
        : `/api/admin/elemental-hunter/levels/${editingLevel.levelId}`;
      const method = showCreateForm ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(editingLevel),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${showCreateForm ? 'create' : 'update'} level`);
      }

      await fetchLevels();
      setSuccess(`Level ${showCreateForm ? 'created' : 'updated'} successfully.`);
      setEditingLevel(null);
      setShowCreateForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (levelId: string) => {
    if (!window.confirm(`Delete level "${levelId}"? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/admin/elemental-hunter/levels/${levelId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!response.ok) {
        throw new Error('Failed to delete level');
      }
      await fetchLevels();
      setSuccess('Level deleted successfully.');
      if (selectedLevel?.levelId === levelId) {
        setSelectedLevel(null);
        setEditingLevel(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateField = <K extends keyof LevelConfig>(field: K, value: LevelConfig[K]) => {
    if (editingLevel) {
      setEditingLevel({ ...editingLevel, [field]: value });
    }
  };

  const isBuiltIn = (levelId: string) => ['Lv1', 'Lv2', 'Lv3'].includes(levelId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Elemental Hunter — Level Configuration</h1>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + Create Custom Level
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Level List */}
        <div className="lg:col-span-1 bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Levels ({levels.length})</h2>
          <div className="space-y-2">
            {levels.map(level => (
              <div
                key={level.levelId}
                className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                  selectedLevel?.levelId === level.levelId ? 'bg-blue-50 border-blue-300' : ''
                }`}
                onClick={() => handleSelect(level)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{level.levelId}</span>
                  {isBuiltIn(level.levelId) && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Built-in</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Max Rounds: {level.maxRounds} | Artifact Slots: {level.artifactSlots}
                </div>
                <div className="text-xs text-gray-400">
                  Combo Tiers: {level.comboTierMax} | HP Multiplier: {level.hpMultiplier}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          {editingLevel ? (
            <div className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  {showCreateForm ? 'Create Custom Level' : `Edit: ${editingLevel.levelId}`}
                </h2>
                <div className="space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  {!showCreateForm && !isBuiltIn(editingLevel.levelId) && (
                    <button
                      onClick={() => handleDelete(editingLevel.levelId)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {isBuiltIn(editingLevel.levelId) && showCreateForm === false && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                  <p className="text-yellow-800 text-sm">Built-in levels are read-only. Create a custom level to modify settings.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Level ID</label>
                    <input
                      type="text"
                      value={editingLevel.levelId}
                      onChange={(e) => updateField('levelId', e.target.value)}
                      disabled={!showCreateForm}
                      placeholder="e.g., Easy, Hard, Extreme"
                      className="mt-1 block w-full border border-gray-300 rounded p-2 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Rounds</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={editingLevel.maxRounds}
                      onChange={(e) => updateField('maxRounds', parseInt(e.target.value) || 1)}
                      disabled={isBuiltIn(editingLevel.levelId) && !showCreateForm}
                      className="mt-1 block w-full border border-gray-300 rounded p-2 disabled:bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Rounds after which game ends if no KO</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Combo Tier Max</label>
                    <input
                      type="number"
                      min={1}
                      max={3}
                      value={editingLevel.comboTierMax}
                      onChange={(e) => updateField('comboTierMax', parseInt(e.target.value) || 1)}
                      disabled={isBuiltIn(editingLevel.levelId) && !showCreateForm}
                      className="mt-1 block w-full border border-gray-300 rounded p-2 disabled:bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Highest combo reward tier available (1-3)</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Artifact Slots</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={editingLevel.artifactSlots}
                      onChange={(e) => updateField('artifactSlots', parseInt(e.target.value) || 1)}
                      disabled={isBuiltIn(editingLevel.levelId) && !showCreateForm}
                      className="mt-1 block w-full border border-gray-300 rounded p-2 disabled:bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Number of artifacts player can equip</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">HP Multiplier (%)</label>
                    <input
                      type="number"
                      min={50}
                      max={200}
                      value={editingLevel.hpMultiplier}
                      onChange={(e) => updateField('hpMultiplier', parseInt(e.target.value) || 100)}
                      disabled={isBuiltIn(editingLevel.levelId) && !showCreateForm}
                      className="mt-1 block w-full border border-gray-300 rounded p-2 disabled:bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">HP scaling multiplier (percentage of base)</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border rounded-lg p-8 text-center">
              <p className="text-gray-500">Select a level from the list to edit, or create a custom level.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LevelConfigPanel;
