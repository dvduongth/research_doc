// ============================================================
// ws-client.js — WebSocket protocol + state + controls
// PROTECTED: do not overwrite (agent_dev_client writes to src/)
// ============================================================

// ===== Global State =====
var ws = null;
var myPlayerId = '';
var lastRoll = 0;
var selectedToken = null;
var currentTurn = '';
var gamePhase = 'LOBBY';
var boardData = [];
var playersData = [];

// ===== Connection =====
function connect() {
  var roomId = document.getElementById('inp-room').value.trim() || 'room1';
  myPlayerId = document.getElementById('inp-player').value.trim() || 'p1';
  var url = 'ws://localhost:8181/game/ws/' + roomId + '/' + myPlayerId;
  log('Connecting to ' + url + '...');
  ws = new WebSocket(url);
  ws.onopen = function() {
    setStatus(true);
    log('Connected as ' + myPlayerId, 'event');
    document.getElementById('connect-overlay').style.display = 'none';
    document.getElementById('controls').style.display = 'flex';
  };
  ws.onclose = function() { setStatus(false); log('Disconnected', 'error'); };
  ws.onerror = function() { log('WebSocket error — is the server running on :8181?', 'error'); };
  ws.onmessage = function(evt) {
    try { handleEvent(JSON.parse(evt.data)); }
    catch(e) { log('Parse error: ' + e, 'error'); }
  };
}

function send(obj) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

// ===== Event Handling =====
function handleEvent(msg) {
  var event = msg.event;
  var data = msg.data;
  switch (event) {
    case 'GAME_STATE':
      boardData = data.board || [];
      playersData = data.players || [];
      var room = data.room || {};
      gamePhase = room.phase || 'LOBBY';
      currentTurn = room.currentTurn || '';
      renderPlayers();
      renderBoard();
      updateControls();
      document.getElementById('turn-indicator').textContent =
        gamePhase === 'PLAYING'
          ? 'Turn: ' + currentTurn + (currentTurn === myPlayerId ? ' \u2190 YOUR TURN' : '')
          : 'Phase: ' + gamePhase;
      log('Game state received \u2014 phase: ' + gamePhase + ', turn: ' + currentTurn, 'event');
      break;
    case 'DICE_RESULT':
      lastRoll = data.sum;
      var diceStr = data.dice ? data.dice.join('+') : '?';
      document.getElementById('roll-display').textContent =
        '\uD83C\uDFB2 ' + diceStr + ' = ' + data.sum + (data.isDouble ? ' (Double!)' : '');
      log(data.playerId + ' rolled ' + data.sum + (data.isDouble ? ' (double!)' : ''), 'event');
      if (data.playerId === myPlayerId) {
        document.getElementById('btn-tokenA').disabled = false;
        document.getElementById('btn-tokenB').disabled = false;
        document.getElementById('btn-roll').disabled = true;
      }
      break;
    case 'TOKEN_SELECTED':
      selectedToken = data.tokenId;
      log(data.playerId + ' selected ' + data.tokenId, 'event');
      if (data.playerId === myPlayerId) document.getElementById('btn-move').disabled = false;
      break;
    case 'MOVE_RESULT':
      log(data.playerId + ': ' + data.tokenId + ' moved tile ' + data.from + ' \u2192 ' + data.to, 'event');
      break;
    case 'KICK':
      log('\u2694\uFE0F ' + data.kickerId + ' kicked ' + data.kickedId + "'s " + data.tokenId + ' \u2192 tile ' + data.returnedTo, 'event');
      break;
    case 'TURN_CHANGE':
      currentTurn = data.currentPlayer;
      lastRoll = 0;
      selectedToken = null;
      document.getElementById('roll-display').textContent = '';
      document.getElementById('turn-indicator').textContent =
        'Turn: ' + currentTurn + (currentTurn === myPlayerId ? ' \u2190 YOUR TURN' : '');
      updateControls();
      log('Turn \u2192 ' + data.currentPlayer, 'event');
      break;
    case 'WIN':
      log('\uD83C\uDFC6\uD83C\uDFC6\uD83C\uDFC6 ' + data.winnerId + ' WINS! \uD83C\uDFC6\uD83C\uDFC6\uD83C\uDFC6', 'win');
      document.getElementById('turn-indicator').textContent = '\uD83C\uDFC6 ' + data.winnerId + ' wins!';
      disableAll();
      break;
    case 'ERROR':
      log('\u26A0\uFE0F ' + data.message, 'error');
      break;
  }
}

// ===== Send Actions =====
function sendRoll()       { send({ action: 'ROLL_DICE',     playerId: myPlayerId }); }
function sendSelect(tid)  { send({ action: 'SELECT_TOKEN',  playerId: myPlayerId, tokenId: tid }); }
function sendMove()       { send({ action: 'MOVE',          playerId: myPlayerId }); }
