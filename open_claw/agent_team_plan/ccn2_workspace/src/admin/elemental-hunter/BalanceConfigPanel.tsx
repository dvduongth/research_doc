/**
 * BalanceConfigPanel — Admin UI for managing Elemental Hunter balance configuration.
 * 
 * Features:
 * - Edit all balance parameters with validation
 * - View audit history of changes
 * - Reset to defaults
 * 
 * REST endpoints: /api/admin/elemental-hunter/balance
 */

import React, { useState, useEffect } from 'react';

interface BalanceConfig {
  magCap: number;
  maxElementQueue: number;
  doubleRollCooldownRounds: number;
  maxConsecutiveRolls: number;
  comboT1AtkBonus: number;
  comboT3AtkMultiplier: number;
  ultimateCostExtraRoll: number;
  powerRollAccuracy: number;
  tileRewardAtk: number;
  tileRewardMag: number;
  tokenCount: number;
}

interface AuditEntry {
  timestamp: string;
  adminId: string;
  action: 'UPDATE' | 'RESET';
  oldConfig: BalanceConfig | null;
  newConfig: BalanceConfig | null;
  notes: string;
}

const BalanceConfigPanel: React.FC = () => {
  const [config, setConfig] = useState<BalanceConfig | null>(null);
  const [defaultConfig, setDefaultConfig] = useState<BalanceConfig | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auth token from admintool config (should be injected via props/env)
  const authHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    // TODO: Read actual admin auth token from admintool/config/*.properties
    'Authorization': `Bearer ${(window as any).ADMIN_TOOL_TOKEN || 'demo-token'}`,
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [configRes, defaultRes, historyRes] = await Promise.all([
        fetch('/api/admin/elemental-hunter/balance', { headers: authHeaders }),
        fetch('/api/admin/elemental-hunter/balance/default', { headers: authHeaders }),
        fetch('/api/admin/elemental-hunter/balance/history?limit=20', { headers: authHeaders }),
      ]);

      if (!configRes.ok || !defaultRes.ok || !historyRes.ok) {
        throw new Error('Failed to fetch balance data. Check authentication.');
      }

      const configData = await configRes.json();
      const defaultData = await defaultRes.json();
      const historyData = await historyRes.json();

      setConfig(configData);
      setDefaultConfig(defaultData);
      setAuditHistory(historyData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Unknown error loading balance config');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/elemental-hunter/balance', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save balance config');
      }

      const updated = await response.json();
      setConfig(updated);
      setSuccess('Balance configuration saved successfully.');
      // Refresh audit history
      fetchHistory();
    } catch (err: any) {
      setError(err.message || 'Unknown error saving balance config');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!defaultConfig) return;
    if (!window.confirm('Reset balance configuration to defaults? This cannot be undone.')) {
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/elemental-hunter/balance/default', {
        method: 'PUT', // or a dedicated reset endpoint if implemented
        headers: authHeaders,
      });

      if (!response.ok) {
        throw new Error('Failed to reset balance config');
      }

      await fetchData();
      setSuccess('Balance configuration reset to defaults.');
    } catch (err: any) {
      setError(err.message || 'Unknown error resetting balance config');
    } finally {
      setSaving(false);
    }
  };

  const fetchHistory = async () => {
    const response = await fetch('/api/admin/elemental-hunter/balance/history?limit=20', { headers: authHeaders });
    if (response.ok) {
      const data = await response.json();
      setAuditHistory(data);
    }
  };

  const updateField = <K extends keyof BalanceConfig>(field: K, value: BalanceConfig[K]) => {
    if (config) {
      setConfig({ ...config, [field]: value });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Elemental Hunter — Balance Configuration</h1>
        <div className="space-x-3">
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {config && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">MAG &amp; Queue</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">MAG Cap</label>
                <input
                  type="number"
                  min={0}
                  value={config.magCap}
                  onChange={(e) => updateField('magCap', parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum MAG a player can store</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Element Queue Size</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={config.maxElementQueue}
                  onChange={(e) => updateField('maxElementQueue', parseInt(e.target.value) || 1)}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum number of elements in queue</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tile Reward ATK (base)</label>
                <input
                  type="number"
                  min={0}
                  value={config.tileRewardAtk}
                  onChange={(e) => updateField('tileRewardAtk', parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                />
                <p className="text-xs text-gray-500 mt-1">ATK gained when landing on affinity element</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tile Reward MAG (base)</label>
                <input
                  type="number"
                  min={0}
                  value={config.tileRewardMag}
                  onChange={(e) => updateField('tileRewardMag', parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                />
                <p className="text-xs text-gray-500 mt-1">MAG gained when landing on non-affinity element</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Dice &amp; Roll Mechanics</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Double Roll Cooldown Rounds</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={config.doubleRollCooldownRounds}
                  onChange={(e) => updateField('doubleRollCooldownRounds', parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                />
                <p className="text-xs text-gray-500 mt-1">Rounds where roll double won't grant extra turn</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Consecutive Rolls</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={config.maxConsecutiveRolls}
                  onChange={(e) => updateField('maxConsecutiveRolls', parseInt(e.target.value) || 1)}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum rolls per turn (cap on extras)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Power Roll Accuracy</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={config.powerRollAccuracy}
                  onChange={(e) => updateField('powerRollAccuracy', parseFloat(e.target.value) || 0)}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                />
                <p className="text-xs text-gray-500 mt-1">Probability (0-1) that Power Roll hits target range</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Combo Rewards</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Combo T1 ATK Bonus</label>
                <input
                  type="number"
                  min={0}
                  value={config.comboT1AtkBonus}
                  onChange={(e) => updateField('comboT1AtkBonus', parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                />
                <p className="text-xs text-gray-500 mt-1">Flat ATK bonus applied to all tokens on every combo (Power Surge)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Combo T3 ATK Multiplier</label>
                <input
                  type="number"
                  min={1.0}
                  max={5.0}
                  step={0.1}
                  value={config.comboT3AtkMultiplier}
                  onChange={(e) => updateField('comboT3AtkMultiplier', parseFloat(e.target.value) || 1.0)}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                />
                <p className="text-xs text-gray-500 mt-1">ATK multiplier at milestone 3 (Absolute Might)</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Ultimate &amp; Game Parameters</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ultimate Cost (Extra Roll)</label>
                <input
                  type="number"
                  min={0}
                  value={config.ultimateCostExtraRoll}
                  onChange={(e) => updateField('ultimateCostExtraRoll', parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                />
                <p className="text-xs text-gray-500 mt-1">MAG cost to activate Extra Roll ultimate</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Token Count</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={config.tokenCount}
                  onChange={(e) => updateField('tokenCount', parseInt(e.target.value) || 1)}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                />
                <p className="text-xs text-gray-500 mt-1">Number of tokens per player</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Change History (Audit Log)</h2>
        {auditHistory.length === 0 ? (
          <p className="text-gray-500 italic">No changes recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {auditHistory.slice().reverse().map((entry, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm text-gray-700">{new Date(entry.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{entry.adminId}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        entry.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">{entry.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceConfigPanel;
