/**
 * GameLogViewerPanel — Browse and replay turn-by-turn logs from completed Elemental Hunter games.
 * 
 * Features:
 * - Search games by matchId, player, date range
 * - View turn sequence with game state after each action
 * - Step through replay with navigation controls
 * - Visualize element queue, HP changes, combos, kicks
 * 
 * REST endpoints: /api/admin/elemental-hunter/logs
 */

import React, { useState, useEffect } from 'react';

interface GameLog {
  matchId: string;
  status: 'completed' | 'aborted';
  players: {
    playerId: string;
    characterId?: string;
    finalHp: number;
  }[];
  winner: string | null;
  endReason: 'ko' | 'round_limit' | 'disconnect' | null;
  totalRounds: number;
  createdAt: string;
  turns: GameTurn[];
}

interface GameTurn {
  turnNumber: number;
  round: number;
  playerId: 'P1' | 'P2';
  action: 'ROLL' | 'SELECT_TOKEN' | 'MOVE' | 'ARTIFACT' | 'ULTIMATE' | 'END_TURN';
  details: Record<string, any>;
  gameStateSnapshot: GameStateSnapshot;
  timestamp: string;
}

interface GameStateSnapshot {
  players: {
    playerId: string;
    hp: number;
    mag: number;
    elementQueue: string[];
    comboCount: number;
    doubleRollCooldown: number;
    consecutiveRollsThisTurn: number;
  }[];
  tokens: Array<{
    tokenId: string;
    owner: string;
    tileId: number;
    atk: number;
    frozenRounds: number;
  }>;
  currentTurn: 'P1' | 'P2';
}

const GameLogViewerPanel: React.FC = () => {
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<GameLog | null>(null);
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchMatchId, setSearchMatchId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const authHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${(window as any).ADMIN_TOOL_TOKEN || 'demo-token'}`,
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchMatchId) params.append('matchId', searchMatchId);
      if (dateFrom) params.append('from', dateFrom);
      if (dateTo) params.append('to', dateTo);
      
      const response = await fetch(`/api/admin/elemental-hunter/logs?${params.toString()}`, {
        headers: authHeaders,
      });
      if (!response.ok) throw new Error('Failed to fetch game logs');
      const data = await response.json();
      setLogs(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleSelectLog = (log: GameLog) => {
    setSelectedLog(log);
    setCurrentTurnIndex(0);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionColor = (action: GameTurn['action']) => {
    switch (action) {
      case 'ROLL': return 'bg-blue-100 text-blue-800';
      case 'SELECT_TOKEN': return 'bg-green-100 text-green-800';
      case 'MOVE': return 'bg-yellow-100 text-yellow-800';
      case 'ARTIFACT': return 'bg-purple-100 text-purple-800';
      case 'ULTIMATE': return 'bg-red-100 text-red-800';
      case 'END_TURN': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSnapshot = (log: GameLog, turnIdx: number): GameStateSnapshot => {
    if (turnIdx < 0) return null;
    if (turnIdx >= log.turns.length) return null;
    return log.turns[turnIdx].gameStateSnapshot;
  };

  const currentSnapshot = selectedLog ? getSnapshot(selectedLog, currentTurnIndex) : null;
  const currentTurn = selectedLog && currentSnapshot ? selectedLog.turns[currentTurnIndex] : null;

  if (loading && !selectedLog) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Elemental Hunter — Game Log Viewer</h1>
          <p className="text-sm text-gray-500 mt-1">Replay completed matches</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          <p className="text-red-800">{error}</p>
          <p className="text-xs text-red-600 mt-1">
            Note: Game log access requires server-side persistence and API. If unavailable, consult backend team.
          </p>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="bg-white border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Match ID (optional)</label>
            <input
              type="text"
              value={searchMatchId}
              onChange={(e) => setSearchMatchId(e.target.value)}
              placeholder="e.g., EH-12345"
              className="mt-1 block w-full border border-gray-300 rounded p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded p-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Log List */}
        <div className="lg:col-span-1 bg-white border rounded-lg p-4 overflow-y-auto max-h-[700px]">
          <h2 className="text-lg font-semibold mb-4">Completed Games ({logs.length})</h2>
          {logs.length === 0 ? (
            <p className="text-gray-500 italic">No completed games found.</p>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div
                  key={log.matchId}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedLog?.matchId === log.matchId
                      ? 'bg-blue-50 border-blue-300'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelectLog(log)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-sm font-semibold">{log.matchId}</span>
                    {log.winner && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        log.endReason === 'ko' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {log.winner} wins
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      Players: {log.players.map(p => p.playerId).join(' vs ')}
                    </div>
                    <div>
                      Duration: {log.totalRounds} rounds
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatTime(log.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Replay Viewer */}
        <div className="lg:col-span-2">
          {selectedLog ? (
            <div className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Replay: {selectedLog.matchId}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedLog.players.map(p => `${p.playerId}(${p.characterId || 'unknown'})`).join(' vs ')}
                    {selectedLog.winner && ` → Winner: ${selectedLog.winner}`}
                  </p>
                </div>
                <div className="text-sm">
                  <span className={`px-2 py-1 rounded-full ${
                    selectedLog.endReason === 'ko' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedLog.endReason === 'ko' ? 'KO Victory' : 'Round Limit'}
                  </span>
                </div>
              </div>

              {/* Replay Controls */}
              <div className="flex items-center space-x-3 mb-6 pb-4 border-b">
                <button
                  onClick={() => setCurrentTurnIndex(0)}
                  disabled={currentTurnIndex === 0}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50"
                >
                  ⏮ First
                </button>
                <button
                  onClick={() => setCurrentTurnIndex(Math.max(0, currentTurnIndex - 1))}
                  disabled={currentTurnIndex === 0}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50"
                >
                  ◀ Prev
                </button>
                <span className="text-sm font-mono">
                  Turn {currentTurnIndex + 1} / {selectedLog.turns.length}
                </span>
                <button
                  onClick={() => setCurrentTurnIndex(Math.min(selectedLog.turns.length - 1, currentTurnIndex + 1))}
                  disabled={currentTurnIndex >= selectedLog.turns.length - 1}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50"
                >
                  Next ▶
                </button>
                <button
                  onClick={() => setCurrentTurnIndex(selectedLog.turns.length - 1)}
                  disabled={currentTurnIndex >= selectedLog.turns.length - 1}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50"
                >
                  Last ⏭
                </button>
              </div>

              {/* Turn Display */}
              {currentTurn && (
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`text-sm px-3 py-1 rounded-full ${getActionColor(currentTurn.action)}`}>
                      {currentTurn.action}
                    </span>
                    <span className="text-sm text-gray-600">
                      Round {currentTurn.round}, Player {currentTurn.playerId}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(currentTurn.timestamp)}
                    </span>
                  </div>
                  <div className="bg-gray-50 border rounded p-3 text-sm">
                    <strong>Details:</strong>{' '}
                    {Object.entries(currentTurn.details)
                      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
                      .join(', ')}
                  </div>
                </div>
              )}

              {/* Game State Snapshot */}
              {currentSnapshot && (
                <div>
                  <h3 className="text-md font-semibold mb-3">Game State After This Turn</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentSnapshot.players.map(player => (
                      <div key={player.playerId} className="border rounded p-4 bg-gray-50">
                        <div className="font-semibold mb-2">
                          Player {player.playerId}
                          {selectedLog.players.find(p => p.playerId === player.playerId)?.characterId && (
                            <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                              {selectedLog.players.find(p => p.playerId === player.playerId).characterId}
                            </span>
                          )}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>HP: <span className="font-semibold">{player.hp}</span></div>
                          <div>MAG: <span className="font-semibold">{player.mag}</span></div>
                          <div>
                            Queue:{' '}
                            {player.elementQueue.length > 0 ? (
                              <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                                [{player.elementQueue.join(', ')}]
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">empty</span>
                            )}
                          </div>
                          <div>Combo Count: {player.comboCount}</div>
                          <div>Consecutive Rolls: {player.consecutiveRollsThisTurn}</div>
                          <div>Double Roll Cooldown: {player.doubleRollCooldown}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2">Tokens</h4>
                    <div className="space-y-2">
                      {currentSnapshot.tokens.map(token => (
                        <div key={token.tokenId} className="text-sm border-b pb-2">
                          <span className="font-mono">{token.tokenId}</span>
                          <span className="mx-2">•</span>
                          <span>Owner: {token.owner}</span>
                          <span className="mx-2">•</span>
                          <span>Tile: {token.tileId}</span>
                          <span className="mx-2">•</span>
                          <span>ATK: {token.atk}</span>
                          {token.frozenRounds > 0 && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Frozen {token.frozenRounds}r
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentTurnIndex >= selectedLog.turns.length - 1 && (
                <div className="mt-6 pt-4 border-t">
                  <div className="bg-gray-100 rounded p-4">
                    <h4 className="font-semibold mb-2">Game Result</h4>
                    <p>
                      {selectedLog.winner ? (
                        <>
                          <span className="font-bold text-green-700">{selectedLog.winner}</span> wins by{' '}
                          {selectedLog.endReason === 'ko' ? 'Knockout' : 'Round Limit'} after {selectedLog.totalRounds} rounds.
                        </span>
                      ) : (
                        'Game ended without a winner.'
                      )}
                    </p>
                    <div className="mt-2 text-sm text-gray-600">
                      Final HP: {selectedLog.players.map(p => `${p.playerId}: ${p.finalHp}`).join(', ')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 border rounded-lg p-8 text-center">
              <p className="text-gray-500">Select a completed game from the list to view the replay.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameLogViewerPanel;
