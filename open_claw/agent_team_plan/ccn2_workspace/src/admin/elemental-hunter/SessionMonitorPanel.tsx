/**
 * SessionMonitorPanel — Real-time view of active Elemental Hunter game sessions.
 * 
 * Features:
 * - List active game matches (matchId, players, current turn, round)
 * - Join as spectator to view live game state
 * - Filter by status (active, ended)
 * 
 * Note: This panel connects to server-side game room manager to fetch session data.
 */

import React, { useState, useEffect } from 'react';

interface GameSession {
  matchId: string;
  status: 'playing' | 'ended' | 'waiting';
  currentTurn: 'P1' | 'P2' | null;
  currentRound: number;
  players: {
    playerId: string;
    characterId?: string;
    hp: number;
    mag: number;
    elementQueue: string[];
    score?: number;
  }[];
  maxRounds: number;
  createdAt: string;
  lastActiveAt: string;
}

const SessionMonitorPanel: React.FC = () => {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'playing' | 'ended'>('all');
  const [selectedSession, setSelectedSession] = useState<GameSession | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(3000); // ms

  const authHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${(window as any).ADMIN_TOOL_TOKEN || 'demo-token'}`,
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      // This endpoint would be implemented on the server to expose active game rooms
      const response = await fetch('/api/admin/elemental-hunter/sessions', { headers: authHeaders });
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      setSessions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (session: GameSession) => {
    setSelectedSession(session);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = (status: GameSession['status']) => {
    switch (status) {
      case 'playing': return 'bg-green-100 text-green-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSessions = sessions.filter(s => 
    filter === 'all' || s.status === filter
  );

  if (loading && sessions.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-800">Elemental Hunter — Session Monitor</h1>
          <p className="text-sm text-gray-500 mt-1">Live view of active game sessions</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-gray-300 rounded p-2 text-sm"
          >
            <option value="all">All Sessions</option>
            <option value="playing">Playing</option>
            <option value="ended">Ended</option>
            <option value="waiting">Waiting</option>
          </select>
          <button
            onClick={fetchSessions}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          <p className="text-red-800">{error}</p>
          <p className="text-xs text-red-600 mt-1">
            Note: Session monitoring requires server-side API exposure. If this is not implemented, consult your backend team.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session List */}
        <div className="lg:col-span-1 bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">
            Sessions ({filteredSessions.length})
            <span className="text-sm font-normal text-gray-500 ml-2">
              (refreshing every {refreshInterval/1000}s)
            </span>
          </h2>
          {filteredSessions.length === 0 ? (
            <p className="text-gray-500 italic">No sessions found.</p>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[600px]">
              {filteredSessions.map(session => (
                <div
                  key={session.matchId}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedSession?.matchId === session.matchId
                      ? 'bg-blue-50 border-blue-300'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleView(session)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-sm font-semibold">{session.matchId}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(session.status)}`}>
                      {session.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Round: {session.currentRound} / {session.maxRounds}</div>
                    <div>Turn: {session.currentTurn || 'N/A'}</div>
                    <div>Players: {session.players.map(p => p.playerId).join(', ')}</div>
                    <div className="text-xs text-gray-400">
                      Created: {formatTime(session.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Session Details */}
        <div className="lg:col-span-2">
          {selectedSession ? (
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">
                Session Details: {selectedSession.matchId}
                <span className={`ml-2 text-xs px-2 py-1 rounded-full ${getStatusColor(selectedSession.status)}`}>
                  {selectedSession.status.toUpperCase()}
                </span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-semibold mb-3">Game State</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Turn:</span>
                      <span className="font-mono font-semibold">{selectedSession.currentTurn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Round:</span>
                      <span>{selectedSession.currentRound} / {selectedSession.maxRounds}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="capitalize">{selectedSession.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span>{formatTime(selectedSession.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Active:</span>
                      <span>{formatTime(selectedSession.lastActiveAt)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-semibold mb-3">Players</h3>
                  <div className="space-y-3">
                    {selectedSession.players.map((player, idx) => (
                      <div key={idx} className="border rounded p-3 bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{player.playerId}</span>
                          {player.characterId && (
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                              {player.characterId}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>HP: {player.hp}</div>
                          <div>MAG: {player.mag}</div>
                          {player.elementQueue.length > 0 && (
                            <div>
                              Queue: [{player.elementQueue.join(', ')}]
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <p className="text-sm text-gray-500 italic">
                  Spectator view and detailed turn replay would require additional WebSocket integration with game server.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border rounded-lg p-8 text-center">
              <p className="text-gray-500">Select a session from the list to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionMonitorPanel;
