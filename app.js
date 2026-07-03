/**
 * ============================================================
 * CHESS APP - app.js
 * Main Application: UI, Game Logic, Board Rendering
 * ============================================================
 */

'use strict';

// ─── APP STATE ───────────────────────────────────────────────
const App = {
  board: null,
  ai: null,
  gameMode: 'pvp',    // 'pvp' | 'pva' | 'ava'
  aiColor: 'b',
  aiDifficulty: 'medium',
  ai2Difficulty: 'medium',
  selectedSquare: null,
  legalMoves: [],
  flipped: false,
  theme: { board: 'classic', pieces: 'classic' },
  stats: { wins: 0, losses: 0, draws: 0, games: 0, totalMoves: 0 },
  redoStack: [],
  gameOver: false,
  aiThinking: false,
  aiTimer: null,
  sounds: {},
  animating: false,
  dragState: null,
  hints: false,
  analysisMode: false,
  currentScreen: 'menu',
  playerName: ['Player 1', 'Player 2'],
  boardThemes: {
    classic: { light: '#f0d9b5', dark: '#b58863' },
    marble:  { light: '#e8e0d0', dark: '#7a6652' },
    carbon:  { light: '#2d2d2d', dark: '#1a1a1a' },
    neon:    { light: '#0a2744', dark: '#051428' },
    emerald: { light: '#4a7c59', dark: '#2d5016' },
    royal:   { light: '#c9b99a', dark: '#8b6914' }
  }
};

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const { ChessBoard, ChessAI } = window.ChessEngine;
  App.board = new ChessBoard();
  App.ai = new ChessAI();

  loadStats();
  loadSettings();
  initSounds();
  initParticles();
  renderMainMenu();
  bindGlobalEvents();
  updateStatsDisplay();

  // Splash animation
  setTimeout(() => document.getElementById('splash')?.classList.add('hidden'), 1800);
});

// ─── SOUND SYSTEM ─────────────────────────────────────────────
function initSounds() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  function tone(freq, type, duration, vol = 0.3) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    o.start(ctx.currentTime); o.stop(ctx.currentTime + duration);
  }

  App.sounds = {
    move: () => tone(440, 'sine', 0.1, 0.2),
    capture: () => { tone(200, 'sawtooth', 0.15, 0.3); tone(150, 'square', 0.1, 0.15); },
    check: () => { tone(600, 'square', 0.2, 0.4); setTimeout(() => tone(500, 'square', 0.15, 0.2), 100); },
    checkmate: () => [400,300,200].forEach((f,i) => setTimeout(() => tone(f,'sawtooth',0.3,0.5), i*150)),
    castle: () => { tone(330, 'sine', 0.1); setTimeout(() => tone(440, 'sine', 0.1), 80); },
    promote: () => [440,550,660,880].forEach((f,i) => setTimeout(() => tone(f,'sine',0.2,0.4), i*60)),
    victory: () => [523,659,784,1047].forEach((f,i) => setTimeout(() => tone(f,'sine',0.3,0.5), i*120)),
    click: () => tone(800, 'sine', 0.05, 0.1),
    invalid: () => tone(150, 'sawtooth', 0.1, 0.15),
    draw: () => [400,400,350].forEach((f,i) => setTimeout(() => tone(f,'sine',0.2,0.3), i*200))
  };
}

// ─── PARTICLES ───────────────────────────────────────────────
function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.5,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    alpha: Math.random() * 0.5 + 0.1,
    color: Math.random() > 0.7 ? '#FFD700' : Math.random() > 0.5 ? '#00D4FF' : '#00FF99'
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// ─── MAIN MENU ────────────────────────────────────────────────
function renderMainMenu() {
  App.currentScreen = 'menu';
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="menu-screen fade-in">
      <div class="menu-header">
        <div class="crown-icon">♛</div>
        <h1 class="menu-title">GRAND<span class="gold">MASTER</span></h1>
        <p class="menu-subtitle">Chess · Strategy · Excellence</p>
      </div>

      <div class="player-cards">
        <div class="player-card white-player">
          <div class="player-avatar">♔</div>
          <input class="player-name-input" id="p1name" value="${App.playerName[0]}" placeholder="White Player" maxlength="16">
          <div class="player-rating">Rating: <span class="gold">1200</span></div>
        </div>
        <div class="vs-divider">VS</div>
        <div class="player-card black-player">
          <div class="player-avatar">♚</div>
          <input class="player-name-input" id="p2name" value="${App.playerName[1]}" placeholder="Black Player" maxlength="16">
          <div class="player-rating">Rating: <span class="gold">1200</span></div>
        </div>
      </div>

      <div class="mode-selector">
        <h3 class="section-title">GAME MODE</h3>
        <div class="mode-grid">
          <button class="mode-btn ${App.gameMode==='pvp'?'active':''}" onclick="setMode('pvp')">
            <span class="mode-icon">⚔️</span>
            <span class="mode-label">Player vs Player</span>
          </button>
          <button class="mode-btn ${App.gameMode==='pva'?'active':''}" onclick="setMode('pva')">
            <span class="mode-icon">🤖</span>
            <span class="mode-label">Player vs AI</span>
          </button>
          <button class="mode-btn ${App.gameMode==='ava'?'active':''}" onclick="setMode('ava')">
            <span class="mode-icon">🧠</span>
            <span class="mode-label">AI vs AI</span>
          </button>
        </div>
      </div>

      <div id="aiSettings" class="${App.gameMode!=='pvp'?'':'hidden'}">
        <h3 class="section-title">AI DIFFICULTY</h3>
        <div class="diff-grid">
          ${['beginner','easy','medium','hard','expert','master'].map(d => `
            <button class="diff-btn ${App.aiDifficulty===d?'active':''}" onclick="setDifficulty('${d}')">
              <span class="diff-name">${d.toUpperCase()}</span>
              <span class="diff-elo">${{beginner:'~600',easy:'~900',medium:'~1200',hard:'~1500',expert:'~1800',master:'~2200'}[d]}</span>
              <div class="diff-bar"><div class="diff-fill" style="width:${{beginner:10,easy:25,medium:45,hard:65,expert:82,master:100}[d]}%"></div></div>
            </button>
          `).join('')}
        </div>
        ${App.gameMode==='pva'?`
        <div class="color-choice">
          <span>Play as:</span>
          <button class="color-btn ${App.aiColor==='b'?'active':''}" onclick="setAIColor('b')">⬜ White</button>
          <button class="color-btn ${App.aiColor==='w'?'active':''}" onclick="setAIColor('w')">⬛ Black</button>
        </div>`:''}
      </div>

      <div class="board-themes-section">
        <h3 class="section-title">BOARD THEME</h3>
        <div class="theme-grid">
          ${Object.keys(App.boardThemes).map(t => `
            <button class="theme-btn ${App.theme.board===t?'active':''}" onclick="setBoardTheme('${t}')" title="${t}">
              <div class="theme-preview">
                <div class="tp-sq" style="background:${App.boardThemes[t].light}"></div>
                <div class="tp-sq" style="background:${App.boardThemes[t].dark}"></div>
                <div class="tp-sq" style="background:${App.boardThemes[t].dark}"></div>
                <div class="tp-sq" style="background:${App.boardThemes[t].light}"></div>
              </div>
              <span>${t}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="menu-actions">
        <button class="btn-primary btn-play" onclick="startGame()">
          <span class="btn-glow"></span>
          ▶ START GAME
        </button>
        <div class="secondary-actions">
          <button class="btn-secondary" onclick="showStats()">📊 Statistics</button>
          <button class="btn-secondary" onclick="showImportPGN()">📥 Import PGN</button>
          <button class="btn-secondary" onclick="showSettings()">⚙️ Settings</button>
        </div>
      </div>

      <div class="stats-bar">
        <div class="stat-item"><span class="stat-val gold">${App.stats.wins}</span><span class="stat-lbl">Wins</span></div>
        <div class="stat-item"><span class="stat-val ruby">${App.stats.losses}</span><span class="stat-lbl">Losses</span></div>
        <div class="stat-item"><span class="stat-val">${App.stats.draws}</span><span class="stat-lbl">Draws</span></div>
        <div class="stat-item"><span class="stat-val neon">${App.stats.games}</span><span class="stat-lbl">Games</span></div>
      </div>
    </div>
  `;

  document.getElementById('p1name').addEventListener('change', e => App.playerName[0] = e.target.value || 'Player 1');
  document.getElementById('p2name').addEventListener('change', e => App.playerName[1] = e.target.value || 'Player 2');
}

function setMode(mode) {
  App.gameMode = mode;
  renderMainMenu();
}

function setDifficulty(d) {
  App.aiDifficulty = d;
  renderMainMenu();
}

function setAIColor(c) {
  App.aiColor = c;
  renderMainMenu();
}

function setBoardTheme(t) {
  App.theme.board = t;
  saveSettings();
  renderMainMenu();
}

// ─── GAME START ───────────────────────────────────────────────
function startGame(fen = null) {
  const { ChessBoard } = window.ChessEngine;
  App.board = new ChessBoard();
  if (fen) App.board.loadFEN(fen);
  App.selectedSquare = null;
  App.legalMoves = [];
  App.redoStack = [];
  App.gameOver = false;
  App.aiThinking = false;
  if (App.aiTimer) clearTimeout(App.aiTimer);
  App.playerName[0] = document.getElementById('p1name')?.value || App.playerName[0];
  App.playerName[1] = document.getElementById('p2name')?.value || App.playerName[1];

  renderGameScreen();

  // If AI goes first
  if (App.gameMode === 'ava' || (App.gameMode === 'pva' && App.aiColor === 'w'))
    scheduleAI();
}

// ─── GAME SCREEN ─────────────────────────────────────────────
function renderGameScreen() {
  App.currentScreen = 'game';
  const app = document.getElementById('app');
  const isWhiteTurn = App.board.turn === 'w';
  const theme = App.boardThemes[App.theme.board];

  app.innerHTML = `
    <div class="game-screen fade-in">
      <!-- TOP BAR -->
      <div class="game-topbar">
        <button class="topbar-btn" onclick="renderMainMenu()" title="Menu">⬅</button>
        <div class="game-title">GRANDMASTER <span class="gold">CHESS</span></div>
        <div class="topbar-controls">
          <button class="topbar-btn" onclick="toggleHints()" title="Hints" id="hintBtn">💡</button>
          <button class="topbar-btn" onclick="flipBoard()" title="Flip Board">🔄</button>
          <button class="topbar-btn" onclick="showGameMenu()" title="Menu">☰</button>
        </div>
      </div>

      <div class="game-layout">
        <!-- LEFT PANEL -->
        <div class="side-panel left-panel">
          <div class="player-info-card ${!isWhiteTurn?'active-player':''} black-info">
            <div class="pi-avatar">♚</div>
            <div class="pi-details">
              <div class="pi-name">${App.gameMode==='pva'&&App.aiColor==='b'?'AI ('+App.aiDifficulty+')':(App.gameMode==='ava'?'AI Black':App.playerName[1])}</div>
              <div class="pi-status" id="blackStatus">${!isWhiteTurn?'<span class="thinking-dot"></span>thinking...':''}</div>
            </div>
            <div class="captured-pieces" id="capturedByBlack"></div>
          </div>

          <div class="eval-bar-container">
            <div class="eval-label" id="evalLabel">0.0</div>
            <div class="eval-bar">
              <div class="eval-fill white-eval" id="evalFill" style="height:50%"></div>
            </div>
          </div>

          <div class="player-info-card ${isWhiteTurn?'active-player':''} white-info">
            <div class="pi-avatar">♔</div>
            <div class="pi-details">
              <div class="pi-name">${App.gameMode==='pva'&&App.aiColor==='w'?'AI ('+App.aiDifficulty+')':(App.gameMode==='ava'?'AI White':App.playerName[0])}</div>
              <div class="pi-status" id="whiteStatus">${isWhiteTurn?'<span class="thinking-dot"></span>thinking...':''}</div>
            </div>
            <div class="captured-pieces" id="capturedByWhite"></div>
          </div>

          <div class="move-controls">
            <button class="ctrl-btn" onclick="undoMove()" title="Undo">⟪</button>
            <button class="ctrl-btn" onclick="redoMove()" title="Redo">⟫</button>
            <button class="ctrl-btn" onclick="getHint()" title="Hint">💡</button>
            <button class="ctrl-btn" onclick="restartGame()" title="Restart">↺</button>
          </div>
        </div>

        <!-- BOARD -->
        <div class="board-container">
          <canvas id="gameCanvas"></canvas>
          <div id="promotionModal" class="promotion-modal hidden"></div>
          <div id="thinkingOverlay" class="thinking-overlay hidden">
            <div class="thinking-spinner"></div>
            <div class="thinking-text">AI is thinking...</div>
          </div>
        </div>

        <!-- RIGHT PANEL -->
        <div class="side-panel right-panel">
          <div class="panel-section">
            <div class="panel-title">MOVE HISTORY</div>
            <div class="move-list" id="moveList"></div>
          </div>

          <div class="panel-section">
            <div class="panel-title">GAME STATUS</div>
            <div class="status-display" id="gameStatus">
              <div class="status-icon">♛</div>
              <div class="status-text">${isWhiteTurn?'White':'Black'} to move</div>
            </div>
          </div>

          <div class="panel-section">
            <div class="panel-title">POSITION</div>
            <div class="fen-display" id="fenDisplay"></div>
          </div>

          <div class="panel-section extra-controls">
            <button class="ctrl-btn-wide" onclick="savePGN()">💾 Save PGN</button>
            <button class="ctrl-btn-wide" onclick="exportFEN()">📋 Copy FEN</button>
            <button class="ctrl-btn-wide" onclick="toggleAnalysis()">🔍 Analysis</button>
            <button class="ctrl-btn-wide" onclick="newGame()">🆕 New Game</button>
          </div>
        </div>
      </div>
    </div>
  `;

  initCanvas();
  renderBoard();
  updateMoveHistory();
  updateCapturedPieces();
  updateFENDisplay();
  updateEvalBar();
}

// ─── CANVAS & BOARD RENDERING ─────────────────────────────────
let canvas, ctx, CELL;

function initCanvas() {
  canvas = document.getElementById('gameCanvas');
  if (!canvas) return;

  function resize() {
    const container = canvas.parentElement;
    const size = Math.min(container.clientWidth, container.clientHeight, window.innerHeight * 0.8);
    canvas.width = size;
    canvas.height = size;
    CELL = size / 8;
    renderBoard();
  }

  resize();
  window.addEventListener('resize', resize);
  canvas.addEventListener('click', handleCanvasClick);
  canvas.addEventListener('contextmenu', e => { e.preventDefault(); clearSelection(); });

  // Drag and drop
  canvas.addEventListener('mousedown', handleDragStart);
  canvas.addEventListener('mousemove', handleDragMove);
  canvas.addEventListener('mouseup', handleDragEnd);
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd);
}

const PIECE_SYMBOLS = {
  wk:'♔', wq:'♕', wr:'♖', wb:'♗', wn:'♘', wp:'♙',
  bk:'♚', bq:'♛', br:'♜', bb:'♝', bn:'♞', bp:'♟'
};

function renderBoard() {
  if (!canvas || !ctx) { canvas = document.getElementById('gameCanvas'); if (!canvas) return; ctx = canvas.getContext('2d'); CELL = canvas.width / 8; }
  const theme = App.boardThemes[App.theme.board];
  const board = App.board;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw squares
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = App.flipped ? (7-r)*8+(7-c) : r*8+c;
      const isLight = (r+c)%2===0;
      let color = isLight ? theme.light : theme.dark;

      // Highlights
      const lastMove = board.moveHistory[board.moveHistory.length-1];
      if (lastMove && (sq===lastMove.from || sq===lastMove.to))
        color = isLight ? adjustColor(theme.light, 40) : adjustColor(theme.dark, 40);

      // Check highlight
      if (board.isInCheck(board.turn)) {
        const kIdx = board.squares.findIndex(p => p && p.type==='k' && p.color===board.turn);
        if (sq === kIdx) color = '#e74c3c';
      }

      ctx.fillStyle = color;
      ctx.fillRect(c*CELL, r*CELL, CELL, CELL);

      // Selected square
      if (sq === App.selectedSquare) {
        ctx.fillStyle = 'rgba(255,215,0,0.4)';
        ctx.fillRect(c*CELL, r*CELL, CELL, CELL);
      }

      // Legal move dots
      if (App.legalMoves.some(m => m.to === sq)) {
        const hasCapture = App.legalMoves.find(m => m.to===sq && (m.captured||m.flags.enPassant));
        if (hasCapture) {
          ctx.strokeStyle = 'rgba(255,60,60,0.7)';
          ctx.lineWidth = 3;
          ctx.strokeRect(c*CELL+2, r*CELL+2, CELL-4, CELL-4);
        } else {
          ctx.beginPath();
          ctx.arc(c*CELL+CELL/2, r*CELL+CELL/2, CELL*0.16, 0, Math.PI*2);
          ctx.fillStyle = 'rgba(20,20,20,0.25)';
          ctx.fill();
        }
      }

      // Hint highlight
      if (App.hintSquare === sq) {
        ctx.fillStyle = 'rgba(0,212,255,0.35)';
        ctx.fillRect(c*CELL, r*CELL, CELL, CELL);
      }

      // Coordinates
      ctx.font = `${CELL*0.13}px "Cinzel", serif`;
      ctx.fillStyle = isLight ? theme.dark : theme.light;
      ctx.globalAlpha = 0.55;
      if (c === 0) ctx.fillText(8-(App.flipped?7-r:r), c*CELL+2, r*CELL+CELL*0.2);
      if (r === 7) ctx.fillText('abcdefgh'[App.flipped?7-c:c], c*CELL+CELL-CELL*0.18, r*CELL+CELL-2);
      ctx.globalAlpha = 1;
    }
  }

  // Draw pieces
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = App.flipped ? (7-r)*8+(7-c) : r*8+c;
      if (App.dragState && App.dragState.from === sq) continue;
      const piece = board.squares[sq];
      if (!piece) continue;
      drawPiece(piece, c*CELL, r*CELL, CELL);
    }
  }

  // Draw dragged piece
  if (App.dragState) {
    const { piece, x, y } = App.dragState;
    drawPiece(piece, x - CELL/2, y - CELL/2, CELL);
  }

  // Board border glow
  const borderColor = board.isInCheck(board.turn) ? '#e74c3c' : '#FFD700';
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.globalAlpha = board.isInCheck(board.turn) ? 0.9 : 0.3;
  ctx.strokeRect(1, 1, canvas.width-2, canvas.height-2);
  ctx.globalAlpha = 1;
}

function drawPiece(piece, x, y, size) {
  const key = piece.color + piece.type;
  const symbol = PIECE_SYMBOLS[key];
  if (!symbol) return;

  const fs = size * 0.72;
  ctx.font = `${fs}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Shadow
  ctx.shadowColor = piece.color === 'w' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = size * 0.08;
  ctx.shadowOffsetX = size * 0.03;
  ctx.shadowOffsetY = size * 0.03;

  // Glow for white pieces
  if (piece.color === 'w') {
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.strokeText(symbol, x+size/2, y+size/2);
  }

  ctx.fillStyle = piece.color === 'w' ? '#FFFFFF' : '#1a1a1a';
  ctx.fillText(symbol, x+size/2, y+size/2);

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function adjustColor(hex, amount) {
  const r = Math.min(255, parseInt(hex.slice(1,3),16)+amount);
  const g = Math.min(255, parseInt(hex.slice(3,5),16)+amount);
  const b = Math.min(255, parseInt(hex.slice(5,7),16)+amount);
  return `rgb(${r},${g},${b})`;
}

// ─── INPUT HANDLING ───────────────────────────────────────────
function getSquareFromXY(x, y) {
  const c = Math.floor(x / CELL);
  const r = Math.floor(y / CELL);
  if (c < 0 || c > 7 || r < 0 || r > 7) return -1;
  return App.flipped ? (7-r)*8+(7-c) : r*8+c;
}

function handleCanvasClick(e) {
  if (App.gameOver || App.aiThinking || App.animating) return;
  if (isAITurn()) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  const sq = getSquareFromXY(x, y);
  if (sq < 0) return;
  handleSquareSelect(sq);
}

function handleSquareSelect(sq) {
  const board = App.board;
  const piece = board.squares[sq];

  if (App.selectedSquare === null) {
    if (piece && piece.color === board.turn) {
      App.selectedSquare = sq;
      App.legalMoves = board.getLegalMoves().filter(m => m.from === sq);
      App.sounds.click();
      renderBoard();
    }
  } else {
    const move = App.legalMoves.find(m => m.to === sq);
    if (move) {
      if (move.flags.promotion && !move.flags.promotion) {
        showPromotionDialog(move);
      } else if (move.flags.promotion) {
        executeMove(move);
      } else {
        executeMove(move);
      }
    } else if (piece && piece.color === board.turn && sq !== App.selectedSquare) {
      App.selectedSquare = sq;
      App.legalMoves = board.getLegalMoves().filter(m => m.from === sq);
      App.sounds.click();
      renderBoard();
    } else {
      clearSelection();
    }
  }
}

// Handle promotion - find all promotion moves for this from->to
function handleSquareSelectWithPromotion(sq) {
  if (App.selectedSquare === null) return;
  const allMoves = App.legalMoves.filter(m => m.to === sq && m.flags.promotion);
  if (allMoves.length > 0) {
    showPromotionDialog(sq, App.selectedSquare, allMoves[0].piece.color);
  }
}

function clearSelection() {
  App.selectedSquare = null;
  App.legalMoves = [];
  App.hintSquare = null;
  renderBoard();
}

// Drag support
function handleDragStart(e) {
  if (App.gameOver || App.aiThinking || isAITurn()) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  const sq = getSquareFromXY(x, y);
  const piece = sq >= 0 && App.board.squares[sq];
  if (piece && piece.color === App.board.turn) {
    App.dragState = { from: sq, piece, x, y };
    App.selectedSquare = sq;
    App.legalMoves = App.board.getLegalMoves().filter(m => m.from === sq);
    renderBoard();
  }
}

function handleDragMove(e) {
  if (!App.dragState) return;
  const rect = canvas.getBoundingClientRect();
  App.dragState.x = (e.clientX - rect.left) * (canvas.width / rect.width);
  App.dragState.y = (e.clientY - rect.top) * (canvas.height / rect.height);
  renderBoard();
}

function handleDragEnd(e) {
  if (!App.dragState) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  const sq = getSquareFromXY(x, y);
  const from = App.dragState.from;
  App.dragState = null;

  if (sq >= 0 && sq !== from) {
    const move = App.legalMoves.find(m => m.to === sq);
    if (move) {
      if (move.flags.promotion) {
        showPromotionDialog(sq, from, move.piece.color);
      } else {
        executeMove(move);
        return;
      }
    }
  }
  clearSelection();
  renderBoard();
}

function handleTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  handleDragStart({ clientX: touch.clientX, clientY: touch.clientY });
}
function handleTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  handleDragMove({ clientX: touch.clientX, clientY: touch.clientY });
}
function handleTouchEnd(e) {
  e.preventDefault();
  const touch = e.changedTouches[0];
  handleDragEnd({ clientX: touch.clientX, clientY: touch.clientY });
}

// ─── MOVE EXECUTION ───────────────────────────────────────────
function executeMove(move) {
  const board = App.board;
  App.redoStack = [];
  App.hintSquare = null;

  // Sound
  if (move.flags.castling) App.sounds.castle();
  else if (move.flags.promotion) App.sounds.promote();
  else if (move.captured) App.sounds.capture();
  else App.sounds.move();

  board.makeMove(move);
  App.stats.totalMoves++;
  clearSelection();

  // Check game state
  const state = board.getGameState();
  if (state.status === 'check') App.sounds.check();

  renderBoard();
  updateMoveHistory();
  updateCapturedPieces();
  updateGameStatus(state);
  updateFENDisplay();
  updateEvalBar();
  updatePlayerTurnUI();

  if (state.status === 'checkmate' || state.status === 'stalemate' || state.status === 'draw') {
    handleGameOver(state);
    return;
  }

  // Trigger AI
  if (!App.gameOver && (App.gameMode === 'ava' || isAITurn()))
    scheduleAI();
}

function isAITurn() {
  if (App.gameMode === 'pvp') return false;
  if (App.gameMode === 'ava') return true;
  return App.board.turn === App.aiColor;
}

function scheduleAI() {
  if (App.aiThinking || App.gameOver) return;
  App.aiThinking = true;
  document.getElementById('thinkingOverlay')?.classList.remove('hidden');
  updatePlayerTurnUI();

  App.aiTimer = setTimeout(() => {
    const diff = App.gameMode === 'ava' && App.board.turn === 'b' ? App.ai2Difficulty : App.aiDifficulty;
    const move = App.ai.getBestMove(App.board, diff);
    App.aiThinking = false;
    document.getElementById('thinkingOverlay')?.classList.add('hidden');
    if (move && !App.gameOver) executeMove(move);
  }, App.gameMode === 'ava' ? 400 : 200);
}

// ─── PROMOTION DIALOG ─────────────────────────────────────────
function showPromotionDialog(toSq, fromSq, color) {
  const modal = document.getElementById('promotionModal');
  if (!modal) return;
  const pieces = ['q','r','b','n'];
  const symbols = { wq:'♕',wr:'♖',wb:'♗',wn:'♘', bq:'♛',br:'♜',bb:'♝',bn:'♞' };

  modal.innerHTML = `
    <div class="promo-bg"></div>
    <div class="promo-box">
      <div class="promo-title">Promote Pawn</div>
      <div class="promo-pieces">
        ${pieces.map(p => `
          <button class="promo-piece" onclick="selectPromotion('${p}',${toSq},${fromSq})">
            <span>${symbols[color+p]}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
}

function selectPromotion(type, to, from) {
  document.getElementById('promotionModal').classList.add('hidden');
  const move = App.board.getLegalMoves().find(m => m.from===from && m.to===to && m.flags.promotion===type);
  if (move) executeMove(move);
  else clearSelection();
}

// ─── GAME OVER ────────────────────────────────────────────────
function handleGameOver(state) {
  App.gameOver = true;
  App.stats.games++;

  if (state.status === 'checkmate') {
    App.sounds.checkmate();
    setTimeout(() => App.sounds.victory(), 400);
    const winner = state.winner;
    if (App.gameMode === 'pva') {
      if (winner !== App.aiColor) { App.stats.wins++; }
      else { App.stats.losses++; }
    } else {
      App.stats.wins++;
    }
    showGameOverModal('checkmate', winner);
  } else {
    App.sounds.draw();
    App.stats.draws++;
    showGameOverModal(state.status, null, state.reason);
  }
  saveStats();
}

function showGameOverModal(type, winner, reason) {
  const app = document.getElementById('app');
  const overlay = document.createElement('div');
  overlay.className = 'game-over-overlay';

  let title, subtitle, icon;
  if (type === 'checkmate') {
    icon = winner === 'w' ? '♔' : '♚';
    const winnerName = winner === 'w' ?
      (App.gameMode==='pva'&&App.aiColor==='w'?'AI':App.playerName[0]) :
      (App.gameMode==='pva'&&App.aiColor==='b'?'AI':App.playerName[1]);
    title = `${winnerName} Wins!`;
    subtitle = 'Checkmate!';
  } else if (type === 'stalemate') {
    icon = '⚖️'; title = 'Draw!'; subtitle = 'Stalemate';
  } else {
    icon = '🤝'; title = 'Draw!';
    subtitle = { '50-move':'50-Move Rule', repetition:'Threefold Repetition', insufficient:'Insufficient Material' }[reason] || 'Draw';
  }

  overlay.innerHTML = `
    <div class="game-over-card ${type==='checkmate'?'checkmate-card':'draw-card'}">
      <div class="go-particles"></div>
      <div class="go-icon">${icon}</div>
      <div class="go-title">${title}</div>
      <div class="go-subtitle">${subtitle}</div>
      <div class="go-stats">
        <div class="go-stat"><span>${App.board.fullMoveNumber-1}</span><small>Moves</small></div>
        <div class="go-stat"><span>${App.board.capturedPieces.w.length+App.board.capturedPieces.b.length}</span><small>Captures</small></div>
      </div>
      <div class="go-actions">
        <button class="btn-primary" onclick="newGame()">🎮 Play Again</button>
        <button class="btn-secondary" onclick="renderMainMenu()">🏠 Main Menu</button>
        <button class="btn-secondary" onclick="savePGN()">💾 Save Game</button>
      </div>
    </div>
  `;
  app.appendChild(overlay);
  setTimeout(() => overlay.classList.add('visible'), 10);
}

// ─── UI UPDATES ───────────────────────────────────────────────
function updateMoveHistory() {
  const list = document.getElementById('moveList');
  if (!list) return;
  const moves = App.board.moveHistory;
  let html = '';
  for (let i = 0; i < moves.length; i += 2) {
    const num = Math.floor(i/2)+1;
    const wMove = moves[i]?.toAlgebraic(App.board) || '';
    const bMove = moves[i+1]?.toAlgebraic(App.board) || '';
    const wActive = i === moves.length-1 ? 'active-move' : '';
    const bActive = i+1 === moves.length-1 ? 'active-move' : '';
    html += `<div class="move-row"><span class="move-num">${num}.</span>
      <span class="move-white ${wActive}">${wMove}</span>
      <span class="move-black ${bActive}">${bMove}</span></div>`;
  }
  list.innerHTML = html || '<div class="no-moves">No moves yet</div>';
  list.scrollTop = list.scrollHeight;
}

function updateCapturedPieces() {
  const byW = document.getElementById('capturedByWhite');
  const byB = document.getElementById('capturedByBlack');
  if (!byW || !byB) return;

  const pieceSymbols = { q:'♛',r:'♜',b:'♝',n:'♞',p:'♟' };
  byW.innerHTML = App.board.capturedPieces.w.map(p => `<span class="cap-piece">${pieceSymbols[p.type]||''}</span>`).join('');
  byB.innerHTML = App.board.capturedPieces.b.map(p => `<span class="cap-piece">${{q:'♕',r:'♖',b:'♗',n:'♘',p:'♙'}[p.type]||''}</span>`).join('');

  // Material advantage
  const wMat = App.board.capturedPieces.w.reduce((s,p) => s + ({q:9,r:5,b:3,n:3,p:1}[p.type]||0), 0);
  const bMat = App.board.capturedPieces.b.reduce((s,p) => s + ({q:9,r:5,b:3,n:3,p:1}[p.type]||0), 0);
  if (wMat > bMat) byB.innerHTML += `<span class="material-adv">+${wMat-bMat}</span>`;
  else if (bMat > wMat) byW.innerHTML += `<span class="material-adv">+${bMat-wMat}</span>`;
}

function updateGameStatus(state) {
  const el = document.getElementById('gameStatus');
  if (!el) return;

  const icons = { check:'⚠️', playing:'♟', checkmate:'🏆', stalemate:'⚖️', draw:'🤝' };
  const messages = {
    check: `${App.board.turn==='w'?'White':'Black'} is in <strong>check!</strong>`,
    playing: `${App.board.turn==='w'?'White':'Black'} to move`,
    checkmate: `Checkmate!`,
    stalemate: `Stalemate — Draw`,
    draw: `Draw — ${state.reason||''}`
  };

  el.innerHTML = `<div class="status-icon ${state.status}">${icons[state.status]||'♟'}</div>
    <div class="status-text">${messages[state.status]||''}</div>`;
}

function updatePlayerTurnUI() {
  const isWhite = App.board.turn === 'w';
  document.querySelectorAll('.white-info').forEach(e => e.classList.toggle('active-player', isWhite));
  document.querySelectorAll('.black-info').forEach(e => e.classList.toggle('active-player', !isWhite));

  const wStatus = document.getElementById('whiteStatus');
  const bStatus = document.getElementById('blackStatus');

  const isWAI = App.gameMode==='ava' || (App.gameMode==='pva'&&App.aiColor==='w');
  const isBAI = App.gameMode==='ava' || (App.gameMode==='pva'&&App.aiColor==='b');

  if (wStatus) wStatus.innerHTML = isWhite ? (isWAI&&App.aiThinking ? '<span class="thinking-dot"></span> thinking...' : '<span class="your-turn">▶ Your Turn</span>') : '';
  if (bStatus) bStatus.innerHTML = !isWhite ? (isBAI&&App.aiThinking ? '<span class="thinking-dot"></span> thinking...' : '<span class="your-turn">▶ Your Turn</span>') : '';
}

function updateFENDisplay() {
  const el = document.getElementById('fenDisplay');
  if (el) el.textContent = App.board.toFEN();
}

function updateEvalBar() {
  const score = App.ai.evaluatePosition(App.board);
  const fill = document.getElementById('evalFill');
  const label = document.getElementById('evalLabel');
  if (!fill || !label) return;

  // Convert to percentage (clamped)
  const clamped = Math.max(-10, Math.min(10, score));
  const pct = 50 + (clamped * 4);
  fill.style.height = pct + '%';
  label.textContent = score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1);
  label.style.color = score > 0.5 ? '#fff' : score < -0.5 ? '#FFD700' : '#aaa';
}

function updateStatsDisplay() {
  // Update any stats shown in menus
}

// ─── GAME CONTROLS ────────────────────────────────────────────
function undoMove() {
  if (App.gameOver) App.gameOver = false;
  const lastMove = App.board.moveHistory[App.board.moveHistory.length - 1];
  if (!lastMove) return;
  App.redoStack.push(lastMove);

  // If playing vs AI, undo two moves
  if (App.gameMode === 'pva' && App.board.moveHistory.length >= 2) {
    const m2 = App.board.moveHistory[App.board.moveHistory.length - 2];
    App.redoStack.push(m2);
    App.board.undoMove();
  }
  App.board.undoMove();
  clearSelection();
  renderBoard();
  updateMoveHistory();
  updateCapturedPieces();
  updateGameStatus({ status: 'playing' });
  updateFENDisplay();
  updateEvalBar();
  updatePlayerTurnUI();
  App.sounds.click();
}

function redoMove() {
  const move = App.redoStack.pop();
  if (!move) return;
  App.board.makeMove(move);
  clearSelection();
  renderBoard();
  updateMoveHistory();
  updateCapturedPieces();
  updateGameStatus(App.board.getGameState());
  updateFENDisplay();
  updateEvalBar();
  updatePlayerTurnUI();
  if (isAITurn() && !App.gameOver) {
    const m2 = App.redoStack.pop();
    if (m2) { App.board.makeMove(m2); renderBoard(); updateMoveHistory(); updateCapturedPieces(); }
  }
  App.sounds.click();
}

function flipBoard() {
  App.flipped = !App.flipped;
  renderBoard();
  App.sounds.click();
}

function restartGame() {
  if (!confirm('Restart this game?')) return;
  const { ChessBoard } = window.ChessEngine;
  App.board = new ChessBoard();
  App.selectedSquare = null;
  App.legalMoves = [];
  App.redoStack = [];
  App.gameOver = false;
  App.aiThinking = false;
  clearTimeout(App.aiTimer);
  // Remove game over overlay
  document.querySelectorAll('.game-over-overlay').forEach(e => e.remove());
  renderBoard();
  updateMoveHistory();
  updateCapturedPieces();
  updateGameStatus({ status: 'playing' });
  updateFENDisplay();
  updateEvalBar();
  updatePlayerTurnUI();
  if (App.gameMode==='ava' || (App.gameMode==='pva'&&App.aiColor==='w')) scheduleAI();
}

function newGame() {
  clearTimeout(App.aiTimer);
  App.aiThinking = false;
  renderMainMenu();
}

function toggleHints() {
  App.hints = !App.hints;
  const btn = document.getElementById('hintBtn');
  if (btn) btn.style.opacity = App.hints ? '1' : '0.5';
}

function getHint() {
  if (App.gameOver) return;
  const move = App.ai.getBestMove(App.board, 'medium');
  if (move) {
    App.hintSquare = move.to;
    App.selectedSquare = move.from;
    App.legalMoves = App.board.getLegalMoves().filter(m => m.from === move.from);
    renderBoard();
    setTimeout(() => { App.hintSquare = null; clearSelection(); }, 2000);
  }
}

function toggleAnalysis() {
  App.analysisMode = !App.analysisMode;
  alert(App.analysisMode ? 'Analysis Mode ON' : 'Analysis Mode OFF');
}

// ─── PGN / FEN ────────────────────────────────────────────────
function generatePGN() {
  const now = new Date();
  let pgn = `[Event "Grandmaster Chess"]\n`;
  pgn += `[Date "${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}"]\n`;
  pgn += `[White "${App.playerName[0]}"]\n`;
  pgn += `[Black "${App.playerName[1]}"]\n`;

  const state = App.board.getGameState();
  const result = state.status==='checkmate' ? (state.winner==='w'?'1-0':'0-1') : state.status==='draw'||state.status==='stalemate' ? '1/2-1/2' : '*';
  pgn += `[Result "${result}"]\n\n`;

  const moves = App.board.moveHistory;
  for (let i = 0; i < moves.length; i++) {
    if (i%2===0) pgn += `${Math.floor(i/2)+1}. `;
    pgn += moves[i].toAlgebraic(App.board) + ' ';
    if (i%10===9) pgn += '\n';
  }
  pgn += result;
  return pgn;
}

function savePGN() {
  const pgn = generatePGN();
  const saved = JSON.parse(localStorage.getItem('chessSaves') || '[]');
  saved.push({ date: new Date().toISOString(), pgn, moves: App.board.moveHistory.length });
  localStorage.setItem('chessSaves', JSON.stringify(saved.slice(-20)));

  const blob = new Blob([pgn], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `chess_${Date.now()}.pgn`;
  a.click();
  App.sounds.click();
}

function exportFEN() {
  const fen = App.board.toFEN();
  navigator.clipboard?.writeText(fen).then(() => {
    showToast('FEN copied to clipboard!');
  }).catch(() => {
    prompt('Copy this FEN:', fen);
  });
}

function showImportPGN() {
  const pgn = prompt('Paste PGN or FEN to load:');
  if (!pgn) return;

  if (pgn.trim().startsWith('[') || pgn.trim().match(/^\d+\./)) {
    try {
      parsePGNAndStart(pgn);
    } catch(e) { alert('Invalid PGN: ' + e.message); }
  } else if (pgn.includes('/')) {
    try {
      startGame(pgn.trim());
    } catch(e) { alert('Invalid FEN'); }
  }
}

function parsePGNAndStart(pgn) {
  const { ChessBoard } = window.ChessEngine;
  App.board = new ChessBoard();
  // Simple PGN move parser
  const moveText = pgn.replace(/\[.*?\]/gs,'').replace(/\{.*?\}/gs,'').replace(/\d+\./g,'').trim();
  const tokens = moveText.split(/\s+/).filter(t => t && !['1-0','0-1','1/2-1/2','*'].includes(t));

  for (const token of tokens) {
    const legal = App.board.getLegalMoves();
    const match = legal.find(m => m.toAlgebraic(App.board) === token || m.toAlgebraic(App.board) === token.replace('+','').replace('#',''));
    if (match) App.board.makeMove(match);
  }
  renderGameScreen();
}

// ─── STATS & SETTINGS ─────────────────────────────────────────
function loadStats() {
  const s = JSON.parse(localStorage.getItem('chessStats') || '{}');
  App.stats = { wins: s.wins||0, losses: s.losses||0, draws: s.draws||0, games: s.games||0, totalMoves: s.totalMoves||0 };
}

function saveStats() {
  localStorage.setItem('chessStats', JSON.stringify(App.stats));
}

function loadSettings() {
  const s = JSON.parse(localStorage.getItem('chessSettings') || '{}');
  if (s.theme) App.theme = s.theme;
  if (s.difficulty) App.aiDifficulty = s.difficulty;
  if (s.playerName) App.playerName = s.playerName;
}

function saveSettings() {
  localStorage.setItem('chessSettings', JSON.stringify({
    theme: App.theme, difficulty: App.aiDifficulty, playerName: App.playerName
  }));
}

function showStats() {
  const app = document.getElementById('app');
  const s = App.stats;
  const winRate = s.games ? Math.round((s.wins/s.games)*100) : 0;

  app.innerHTML = `
    <div class="stats-screen fade-in">
      <button class="back-btn" onclick="renderMainMenu()">⬅ Back</button>
      <h2 class="screen-title">STATISTICS</h2>

      <div class="stats-hero">
        <div class="win-circle">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#1a1a1a" stroke-width="10"/>
            <circle cx="60" cy="60" r="50" fill="none" stroke="#FFD700" stroke-width="10"
              stroke-dasharray="${winRate * 3.14} 314" stroke-linecap="round"
              transform="rotate(-90 60 60)"/>
          </svg>
          <div class="wr-text">${winRate}%<br><small>Win Rate</small></div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card gold-card"><div class="sc-val">${s.wins}</div><div class="sc-lbl">Wins</div></div>
        <div class="stat-card ruby-card"><div class="sc-val">${s.losses}</div><div class="sc-lbl">Losses</div></div>
        <div class="stat-card blue-card"><div class="sc-val">${s.draws}</div><div class="sc-lbl">Draws</div></div>
        <div class="stat-card"><div class="sc-val">${s.games}</div><div class="sc-lbl">Total Games</div></div>
        <div class="stat-card"><div class="sc-val">${s.totalMoves}</div><div class="sc-lbl">Total Moves</div></div>
        <div class="stat-card emerald-card"><div class="sc-val">${s.games-s.wins-s.losses-s.draws}</div><div class="sc-lbl">Ongoing</div></div>
      </div>

      <button class="btn-secondary" onclick="resetStats()">Reset Statistics</button>
    </div>
  `;
}

function resetStats() {
  if (!confirm('Reset all statistics?')) return;
  App.stats = { wins: 0, losses: 0, draws: 0, games: 0, totalMoves: 0 };
  saveStats();
  showStats();
}

function showSettings() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="settings-screen fade-in">
      <button class="back-btn" onclick="renderMainMenu()">⬅ Back</button>
      <h2 class="screen-title">SETTINGS</h2>

      <div class="settings-list">
        <div class="settings-group">
          <div class="sg-title">GAME</div>
          <div class="setting-item">
            <span>Show Legal Moves</span>
            <input type="checkbox" checked class="toggle-check">
          </div>
          <div class="setting-item">
            <span>AI Move Delay</span>
            <select class="setting-select">
              <option>Fast (0.2s)</option>
              <option selected>Normal (0.5s)</option>
              <option>Slow (1s)</option>
            </select>
          </div>
        </div>

        <div class="settings-group">
          <div class="sg-title">AI DIFFICULTY</div>
          ${['beginner','easy','medium','hard','expert','master'].map(d => `
            <div class="setting-item">
              <span>${d.charAt(0).toUpperCase()+d.slice(1)}</span>
              <button class="diff-tag ${App.aiDifficulty===d?'active-tag':''}" onclick="App.aiDifficulty='${d}';saveSettings();showSettings()">${d}</button>
            </div>
          `).join('')}
        </div>

        <div class="settings-group">
          <div class="sg-title">ABOUT</div>
          <div class="setting-item"><span>Version</span><span class="setting-val">2.0.0</span></div>
          <div class="setting-item"><span>Engine</span><span class="setting-val">Minimax + α-β</span></div>
          <div class="setting-item"><span>FIDE Rules</span><span class="setting-val emerald">✓ Complete</span></div>
        </div>
      </div>
    </div>
  `;
}

function showGameMenu() {
  showToast('Game Options');
}

// ─── TOAST NOTIFICATION ───────────────────────────────────────
function showToast(msg, duration = 2500) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('visible'), 10);
  setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 400); }, duration);
}

// ─── GLOBAL EVENTS ────────────────────────────────────────────
function bindGlobalEvents() {
  document.addEventListener('keydown', e => {
    if (App.currentScreen !== 'game') return;
    if (e.key === 'ArrowLeft' || e.key === 'z' && e.ctrlKey) undoMove();
    if (e.key === 'ArrowRight' || e.key === 'y' && e.ctrlKey) redoMove();
    if (e.key === 'f') flipBoard();
    if (e.key === 'n' && e.ctrlKey) { e.preventDefault(); newGame(); }
    if (e.key === 'Escape') clearSelection();
    if (e.key === 'h') getHint();
  });
}