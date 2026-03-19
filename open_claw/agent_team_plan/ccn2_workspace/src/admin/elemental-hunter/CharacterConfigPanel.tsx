/**
 * CharacterConfigPanel — Admin UI for managing Character (Pillow) configurations.
 * 
 * Features:
 * - View, create, update, delete character configurations
 * - Default character (pillow) is read-only
 * - Validation on input fields
 * 
 * REST endpoints: /api/admin/elemental-hunter/characters
 */

import React, { useState, useEffect } from 'react';

interface CharacterConfig {
  characterId: string;
  affinity: string; // Fire, Ice, Grass, Rock
  baseAtk: number;
  baseMag: number;
  baseHp: number;
  ultimateType: string;
  ultimateCost: number;
}

const AFFINITIES = ['Fire', 'Ice', 'Grass', 'Rock'] as const;

const CharacterConfigPanel: React.FC = () => {
  const [characters, setCharacters] = useState<CharacterConfig[]>([]);
  const [selectedChar, setSelectedChar] = useState<CharacterConfig | null>(null);
  const [editingChar, setEditingChar] = useState<CharacterConfig | null>(null);
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
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/elemental-hunter/characters', { headers: authHeaders });
      if (!response.ok) throw new Error('Failed to fetch characters');
      const data = await response.json();
      setCharacters(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (char: CharacterConfig) => {
    setSelectedChar(char);
    setEditingChar({ ...char });
    setShowCreateForm(false);
  };

  const handleCreateNew = () => {
    setEditingChar({
      characterId: '',
      affinity: 'Fire',
      baseAtk: 30,
      baseMag: 10,
      baseHp: 1000,
      ultimateType: 'Extra Roll',
      ultimateCost: 50
    });
    setSelectedChar(null);
    setShowCreateForm(true);
  };

  const handleSave = async () => {
    if (!editingChar) return;
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const isUpdate = !showCreateForm && characters.some(c => c.characterId === editingChar.characterId);
      const url = showCreateForm 
        ? '/api/admin/elemental-hunter/characters'
        : `/api/admin/elemental-hunter/characters/${editingChar.characterId}`;
      
      const method = showCreateForm ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(editingChar),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${showCreateForm ? 'create' : 'update'} character`);
      }

      const saved = await response.json();
      await fetchCharacters();
      setSuccess(`Character ${showCreateForm ? 'created' : 'updated'} successfully.`);
      setEditingChar(null);
      setShowCreateForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (characterId: string) => {
    if (!window.confirm(`Delete character "${characterId}"? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/admin/elemental-hunter/characters/${characterId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!response.ok) {
        throw new Error('Failed to delete character');
      }
      await fetchCharacters();
      setSuccess('Character deleted successfully.');
      if (selectedChar?.characterId === characterId) {
        setSelectedChar(null);
        setEditingChar(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateField = <K extends keyof CharacterConfig>(field: K, value: CharacterConfig[K]) => {
    if (editingChar) {
      setEditingChar({ ...editingChar, [field]: value });
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-800">Elemental Hunter — Character Configuration</h1>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + Create New Character
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
        {/* Character List */}
        <div className="lg:col-span-1 bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Characters ({characters.length})</h2>
          <div className="space-y-2">
            {characters.map(char => (
              <div
                key={char.characterId}
                className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                  selectedChar?.characterId === char.characterId ? 'bg-blue-50 border-blue-300' : ''
                }`}
                onClick={() => handleSelect(char)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{char.characterId}</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{char.affinity}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ATK: {char.baseAtk} | MAG: {char.baseMag} | HP: {char.baseHp}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          {editingChar ? (
            <div className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  {showCreateForm ? 'Create New Character' : `Edit: ${editingChar.characterId}`}
                </h2>
                <div className="space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  {!showCreateForm && editingChar.characterId !== 'pillow' && (
                    <button
                      onClick={() => handleDelete(editingChar.characterId)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {editingChar.characterId === 'pillow' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                  <p className="text-yellow-800 text-sm">Default character "pillow" is read-only.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Character ID</label>
                    <input
                      type="text"
                      value={editingChar.characterId}
                      onChange={(e) => updateField('characterId', e.target.value)}
                      disabled={showCreateForm ? false : editingChar.characterId === 'pillow'}
                      className="mt-1 block w-full border border-gray-300 rounded p-2 disabled:bg-gray-100"
                      placeholder="e.g., warrior, mage"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Element Affinity</label>
                    <select
                      value={editingChar.affinity}
                      onChange={(e) => updateField('affinity', e.target.value)}
                      disabled={editingChar.characterId === 'pillow'}
                      className="mt-1 block w-full border border-gray-300 rounded p-2 disabled:bg-gray-100"
                    >
                      {AFFINITIES.map(aff => (
                        <option key={aff} value={aff}>{aff}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Base ATK</label>
                    <input
                      type="number"
                      min={0}
                      value={editingChar.baseAtk}
                      onChange={(e) => updateField('baseAtk', parseInt(e.target.value) || 0)}
                      disabled={editingChar.characterId === 'pillow'}
                      className="mt-1 block w-full border border-gray-300 rounded p-2 disabled:bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Initial attack power for tokens</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Base MAG</label>
                    <input
                      type="number"
                      min={0}
                      value={editingChar.baseMag}
                      onChange={(e) => updateField('baseMag', parseInt(e.target.value) || 0)}
                      disabled={editingChar.characterId === 'pillow'}
                      className="mt-1 block w-full border border-gray-300 rounded p-2 disabled:bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Initial magic capacity</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Base HP</label>
                    <input
                      type="number"
                      min={1}
                      value={editingChar.baseHp}
                      onChange={(e) => updateField('baseHp', parseInt(e.target.value) || 1)}
                      disabled={editingChar.characterId === 'pillow'}
                      className="mt-1 block w-full border border-gray-300 rounded p-2 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ultimate Type</label>
                    <input
                      type="text"
                      value={editingChar.ultimateType}
                      onChange={(e) => updateField('ultimateType', e.target.value)}
                      disabled={editingChar.characterId === 'pillow'}
                      className="mt-1 block w-full border border-gray-300 rounded p-2 disabled:bg-gray-100"
                      placeholder="e.g., Extra Roll, Mega Heal"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ultimate Cost</label>
                    <input
                      type="number"
                      min={0}
                      value={editingChar.ultimateCost}
                      onChange={(e) => updateField('ultimateCost', parseInt(e.target.value) || 0)}
                      disabled={editingChar.characterId === 'pillow'}
                      className="mt-1 block w-full border border-gray-300 rounded p-2 disabled:bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Resource cost to activate ultimate</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border rounded-lg p-8 text-center">
              <p className="text-gray-500">Select a character from the list to edit, or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterConfigPanel;
