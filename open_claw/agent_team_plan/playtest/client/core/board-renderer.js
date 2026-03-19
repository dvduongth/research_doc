// ============================================================
// board-renderer.js — Canvas 61-tile board rendering
// PROTECTED: do not overwrite (agent_dev_client writes to src/)
// ============================================================

// ===== Tile Layout (61 tiles, cross shape, 13x8 grid) =====
var GRID = (function() {
  var g = {};
  // P2 left arm: tiles 0-9, cols 0-9, row 4
  for (var t = 0; t <= 9; t++)  g[t] = { col: t, row: 4 };
  // Main center loop tiles 10-19: cols 0-9, row 3
  for (var t = 10; t <= 19; t++) g[t] = { col: t - 10, row: 3 };
  // Upper section: tiles 20-24, cols 4-8, row 1
  for (var t = 20; t <= 24; t++) g[t] = { col: (t - 20) + 4, row: 1 };
  // Upper-mid: tiles 25-29, cols 3-7, row 2
  for (var t = 25; t <= 29; t++) g[t] = { col: (t - 25) + 3, row: 2 };
  // Lower-mid: tiles 30-35, cols 3-8, row 5
  for (var t = 30; t <= 35; t++) g[t] = { col: (t - 30) + 3, row: 5 };
  // Lower: tiles 36-39, cols 4-7, row 6
  for (var t = 36; t <= 39; t++) g[t] = { col: (t - 36) + 4, row: 6 };
  // Goal area right: tiles 40-44, cols 9-13, row 3
  for (var t = 40; t <= 44; t++) g[t] = { col: (t - 40) + 9, row: 3 };
  // tiles 45-50: lower-right, cols 9-12, row 4 (shifted)
  for (var t = 45; t <= 50; t++) g[t] = { col: (t - 45) + 9, row: 4 };
  // P1 right arm: tiles 51-60, cols 2-11, row 2
  for (var t = 51; t <= 60; t++) g[t] = { col: (t - 51) + 2, row: 2 };
  return g;
})();

// ===== Colors =====
var TILE_COLORS = {
  SAFE_ZONE:  '#78350f',
  ELEMENTAL:  '#1e40af',
  FINAL_GOAL: '#14532d',
  EMPTY:      '#374151',
  NORMAL:     '#1e293b',
  START:      '#78350f'
};

var ELEM_COLORS = {
  FIRE:  '#dc2626',
  ICE:   '#2563eb',
  GRASS: '#16a34a',
  ROCK:  '#78716c',
  NONE:  '#1e40af'
};

var P_COLORS = { p1: '#ef4444', p2: '#3b82f6' };

// ===== Board Render =====
function renderBoard() {
  var canvas = document.getElementById('board');
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, W, H);

  if (!boardData.length) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.fillText('Waiting for game state...', 20, H / 2);
    return;
  }

  var COLS = 13, ROWS = 8;
  var TW = Math.floor(W / COLS), TH = Math.floor(H / ROWS);

  // Token position map: tileId -> [{pid, tid}]
  var tokMap = {};
  playersData.forEach(function(p) {
    if (!p.tokens) return;
    p.tokens.split(';').forEach(function(t) {
      var parts = t.split(':');
      var tid = parts[0], tile = parseInt(parts[1]);
      if (!tokMap[tile]) tokMap[tile] = [];
      tokMap[tile].push({ pid: p.playerId, tid: tid });
    });
  });

  boardData.forEach(function(tile) {
    var tileId = parseInt(tile.tileId);
    var pos = GRID[tileId];
    if (!pos) return;
    var x = pos.col * TW, y = pos.row * TH;

    // Background — priority: SAFE_ZONE > FINAL_GOAL > ELEMENTAL > others
    var bg;
    if (tile.tileType === 'SAFE_ZONE' || tile.tileType === 'START') {
      bg = TILE_COLORS.SAFE_ZONE;
    } else if (tile.tileType === 'FINAL_GOAL') {
      bg = TILE_COLORS.FINAL_GOAL;
    } else if (tile.tileType === 'ELEMENTAL' && tile.element !== 'NONE') {
      bg = ELEM_COLORS[tile.element] || ELEM_COLORS.NONE;
    } else {
      bg = TILE_COLORS[tile.tileType] || TILE_COLORS.NORMAL;
    }

    ctx.fillStyle = bg;
    ctx.fillRect(x + 1, y + 1, TW - 2, TH - 2);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 1, y + 1, TW - 2, TH - 2);

    // Tile ID
    ctx.fillStyle = '#64748b';
    ctx.font = '8px monospace';
    ctx.fillText(tileId, x + 2, y + 9);

    // Icons
    ctx.font = '10px monospace';
    if (tile.tileType === 'SAFE_ZONE' || tile.tileType === 'START') {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('\u2605', x + TW - 13, y + 11);
    }
    if (tile.tileType === 'FINAL_GOAL') {
      ctx.fillStyle = '#4ade80';
      ctx.fillText('\uD83C\uDFC1', x + 2, y + TH - 3);
    }
    if (tile.tileType === 'ELEMENTAL') {
      ctx.fillStyle = '#fff';
      ctx.fillText('\u26A1', x + TW - 14, y + 11);
    }

    // Tokens
    var toks = tokMap[tileId] || [];
    toks.forEach(function(tok, i) {
      var cx = x + 6 + i * 11, cy = y + TH - 6;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = P_COLORS[tok.pid] || '#fff';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });
  });
}
