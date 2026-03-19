/**
 * MetricsDashboardPanel — View behavioral and balance metrics for Elemental Hunter.
 * 
 * Metrics displayed:
 * - KO rate vs Round limit finishes
 * - Average combo count per player per game
 * - Artifact usage distribution
 * - Ultimate (Extra Roll) activation rate
 * - Average HP remaining at game end
 * - Average rounds per match
 * 
 * Data is fetched from server-side metrics collector.
 */

import React, { useState, useEffect } from 'react';

interface BalanceMetrics {
  totalGames: number;
  koRate: number; // percentage of games ending by KO
  avgRounds: number;
  avgHpRemaining: number;
  avgComboCountPerPlayer: number;
  artifactUsage: {
    swap: number;
    change: number;
    charge: number;
  };
  ultimateActivationRate: number;
  winRatesByCharacter: Record<string, number>;
  avgAtkByComboTier: {
    tier1: number;
    tier2: number;
    tier3: number;
  };
}

interface TimeSeriesData {
  date: string;
  games: number;
  avgComboCount: number;
  koRate: number;
}

const MetricsDashboardPanel: React.FC = () => {
  const [metrics, setMetrics] = useState<BalanceMetrics | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<number>(7);

  const authHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${(window as any).ADMIN_TOOL_TOKEN || 'demo-token'}`,
  };

  useEffect(() => {
    fetchMetrics();
  }, [days]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/elemental-hunter/metrics?days=${days}`,
        { headers: authHeaders }
      );
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data.metrics);
      setTimeSeries(data.timeSeries || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderBarChart = (label: string, value: number, max: number = 100, color: string = 'bg-blue-500') => {
    const percentage = (value / max) * 100;
    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-700">{label}</span>
          <span className="font-semibold">{value.toFixed(1)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${color} h-2 rounded-full`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const renderWinRates = () => {
    if (!metrics?.winRatesByCharacter) return null;
    const entries = Object.entries(metrics.winRatesByCharacter).sort((a, b) => b[1] - a[1]);
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Win Rates by Character</h3>
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Character</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Win Rate %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.map(([char, rate]) => (
                <tr key={char}>
                  <td className="px-4 py-3 text-sm text-gray-900">{char}</td>
                  <td className="px-4 py-3 text-sm font-semibold">
                    {rate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTimeSeriesChart = () => {
    if (timeSeries.length === 0) return null;
    
    const maxGames = Math.max(...timeSeries.map(d => d.games));
    
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Daily Trends (Games &amp; Combos)</h3>
        <div className="bg-white border rounded-lg p-4">
          <div className="space-y-3">
            {timeSeries.slice().reverse().map((day, idx) => (
              <div key={idx} className="flex items-center space-x-4">
                <div className="w-24 text-sm text-gray-600">{day.date}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 w-16">Games</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                      <div
                        className="bg-blue-500 h-4 rounded-full"
                        style={{ width: `${(day.games / maxGames) * 100}%` }}
                      ></div>
                      <span className="absolute left-2 top-0 text-xs text-white" style={{ lineHeight: '16px' }}>
                        {day.games}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-24 text-right text-sm">
                  Avg Combos: {day.avgComboCount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Elemental Hunter — Metrics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Behavioral and balance statistics
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="border border-gray-300 rounded p-2 text-sm"
        >
          <option value={1}>Last 24 hours</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          <p className="text-red-800">{error}</p>
          <p className="text-xs text-red-600 mt-1">
            Note: Metrics collection requires server-side implementation. If this is not available, consult your backend team.
          </p>
        </div>
      )}

      {metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Total Games</h3>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalGames.toLocaleString()}</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">KO Rate</h3>
              <p className="text-3xl font-bold text-red-600">{metrics.koRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-2">Games ending by knockout</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Avg Rounds per Game</h3>
              <p className="text-3xl font-bold text-blue-600">{metrics.avgRounds.toFixed(1)}</p>
              <p className="text-xs text-gray-500 mt-2">out of max {metrics.avgRounds > 10 ? '12-15' : '?'}</p>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Combo &amp; Ultimate Metrics</h2>
            {renderBarChart('Avg Combos per Player per Game', metrics.avgComboCountPerPlayer, 10, 'bg-green-500')}
            {renderBarChart('Ultimate Activation Rate (%)', metrics.ultimateActivationRate, 100, 'bg-purple-500')}
            {renderBarChart('Avg HP Remaining at End', metrics.avgHpRemaining, 1000, 'bg-yellow-500')}
          </div>

          <div className="bg-white border rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Artifact Usage Distribution</h2>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(metrics.artifactUsage).map(([artifact, count]) => (
                <div key={artifact} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600 capitalize">{artifact}</div>
                </div>
              ))}
            </div>
          </div>

          {renderWinRates()}
          {renderTimeSeriesChart()}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h3 className="font-semibold text-blue-900 mb-2">Metric Definitions</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><strong>KO Rate:</strong> Percentage of games that end by player HP ≤ 0 rather than round limit.</li>
              <li><strong>Avg Combos:</strong> Average number of combos triggered per player per game.</li>
              <li><strong>Ultimate Activation Rate:</strong> Percentage of MAG≥50 opportunities where player used Extra Roll.</li>
              <li><strong>Artifact Usage:</strong> Total times each artifact type was selected across all games.</li>
              <li><strong>Avg HP Remaining:</strong> Average winner's HP percentage at game end.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default MetricsDashboardPanel;
