// ============================================================
// game-ui.js — Players panel, controls, log, status
// PROTECTED: do not overwrite (agent_dev_client writes to src/)
// ============================================================

// ===== Players Panel =====
function renderPlayers() {
  var area = document.getElementById('players-area');
  if (!playersData.length) {
    area.innerHTML = '<div style="color:var(--muted);font-size:12px">Waiting for players...</div>';
    return;
  }
  area.innerHTML = playersData.map(function(p) {
    var isActive = p.playerId === currentTurn;
    var toks = '-';
    if (p.tokens) {
      toks = p.tokens.split(';').map(function(t) {
        var parts = t.split(':');
        return parts[0] + '@' + parts[1];
      }).join(' \u00B7 ');
    }
    return '<div class="player-card ' + (isActive ? 'active' : '') + '">'
      + '<h3>' + (p.playerId === myPlayerId ? '\uD83D\uDC64' : '\uD83E\uDD16') + ' '
      + p.playerId + ' ' + (isActive ? '\u25C4 ACTIVE' : '') + '</h3>'
      + '<div class="row"><span>HP</span><span>' + p.hp + '</span></div>'
      + '<div class="row"><span>Tokens</span><span style="font-size:10px">' + toks + '</span></div>'
      + '</div>';
  }).join('');
}

// ===== Controls =====
function updateControls() {
  var mine = currentTurn === myPlayerId && gamePhase === 'PLAYING';
  document.getElementById('btn-roll').disabled   = !mine || lastRoll > 0;
  document.getElementById('btn-tokenA').disabled = !mine || lastRoll === 0;
  document.getElementById('btn-tokenB').disabled = !mine || lastRoll === 0;
  document.getElementById('btn-move').disabled   = !mine || !selectedToken;
}

function disableAll() {
  ['btn-roll', 'btn-tokenA', 'btn-tokenB', 'btn-move'].forEach(function(id) {
    document.getElementById(id).disabled = true;
  });
}

// ===== Log =====
function log(msg, type) {
  type = type || '';
  var el = document.getElementById('log');
  var t = new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  var d = document.createElement('div');
  d.className = 'log-entry ' + type;
  d.innerHTML = '<span class="time">' + t + '</span>' + msg;
  el.prepend(d);
  if (el.children.length > 150) el.removeChild(el.lastChild);
}

// ===== Status indicator =====
function setStatus(ok) {
  document.getElementById('dot').className = 'dot' + (ok ? ' connected' : '');
  document.getElementById('status-text').textContent =
    ok ? 'Connected as ' + myPlayerId : 'Disconnected';
}
