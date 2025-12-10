const API_BASE = 'http://localhost:8081/api';

const state = {
  token: localStorage.getItem('token') || null,
  user: null,
};

function show(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById(`view-${view}`).classList.remove('hidden');
}

// Nav
document.querySelectorAll('nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    const v = btn.getAttribute('data-view');
    if (v === 'logout') {
      logout();
      return;
    }
    if (v === 'game') {
      if (!state.token) { show('login'); return; }
      show('game');
      initGame();
      return;
    }
    if (v === 'profile') {
      if (!state.token) { show('login'); return; }
      show('profile');
      loadProfile();
      return;
    }
    show(v);
  });
});

// Register
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = Object.fromEntries(fd.entries());
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const data = await res.json();
    document.getElementById('register-result').textContent = JSON.stringify(data, null, 2);
    if (res.ok) {
      show('login');
    }
  } catch (err) {
    document.getElementById('register-result').textContent = String(err);
  }
});

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = Object.fromEntries(fd.entries());
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const data = await res.json();
    document.getElementById('login-result').textContent = JSON.stringify(data, null, 2);
    if (res.ok && data.token) {
      state.token = data.token;
      localStorage.setItem('token', state.token);
      state.user = data.user || null;
      updateNav();
      show('game');
      initGame();
    }
  } catch (err) {
    document.getElementById('login-result').textContent = String(err);
  }
});

// Profile
async function loadProfile() {
  const info = document.getElementById('profile-info');
  if (!state.token) {
    info.textContent = 'Not logged in';
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/profile/me`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const data = await res.json();
    if (!res.ok) {
      info.textContent = data.error || 'Unauthorized';
      return;
    }
    info.textContent = `Logged in as ${data.username} (${data.email})`;
    state.user = data;
    updateUserLabel();
    document.getElementById('pf-username').textContent = data.username || '';
    document.getElementById('pf-email').textContent = data.email || '';
    document.getElementById('pf-fullName').textContent = data.fullName || '';
    document.getElementById('pf-bio').textContent = data.bio || '';
    const form = document.getElementById('profile-form');
    form.email.value = data.email || '';
    form.fullName.value = data.fullName || '';
    form.bio.value = data.bio || '';
  } catch (err) {
    info.textContent = String(err);
  }
}

document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = Object.fromEntries(fd.entries());
  try {
    const res = await fetch(`${API_BASE}/profile/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    document.getElementById('profile-result').textContent = JSON.stringify(data, null, 2);
    if (res.ok) loadProfile();
  } catch (err) {
    document.getElementById('profile-result').textContent = String(err);
  }
});

function updateUserLabel() {
  const label = document.getElementById('user-label');
  if (!label) return;
  if (state.user && state.user.username) {
    label.textContent = `Hello, ${state.user.username}`;
  } else {
    label.textContent = '';
  }
}

function updateNav() {
  const loggedIn = !!state.token;
  const btnRegister = document.querySelector('button[data-view="register"]');
  const btnLogin = document.querySelector('button[data-view="login"]');
  const btnProfile = document.querySelector('button[data-view="profile"]');
  const btnGame = document.querySelector('button[data-view="game"]');
  const btnLogout = document.getElementById('logout-btn');
  if (btnRegister) btnRegister.classList.toggle('hidden', loggedIn);
  if (btnLogin) btnLogin.classList.toggle('hidden', loggedIn);
  if (btnProfile) btnProfile.classList.toggle('hidden', !loggedIn);
  if (btnGame) btnGame.classList.toggle('hidden', !loggedIn);
  if (btnLogout) btnLogout.classList.toggle('hidden', !loggedIn);
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('token');
  updateUserLabel();
  updateNav();
  show('login');
}

// Initial view
updateNav();
if (state.token) {
  show('game');
  initGame();
} else {
  show('login');
}

// Chess Game
const game = {
  mode: 'pvp',
  board: [],
  turn: 'w',
  selected: null,
  history: [],
  redo: [],
};

const PIECES = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

function initGame() {
  const radios = document.querySelectorAll('input[name="mode"]');
  radios.forEach(r => r.addEventListener('change', () => {
    game.mode = document.querySelector('input[name="mode"]:checked').value;
  }));
  document.getElementById('new-game-btn').addEventListener('click', newGame);
  document.getElementById('undo-btn').addEventListener('click', undoMove);
  document.getElementById('redo-btn').addEventListener('click', redoMove);
  if (!game.board.length) newGame();
  renderBoard();
}

function newGame() {
  game.board = [
    ['bR','bN','bB','bQ','bK','bB','bN','bR'],
    ['bP','bP','bP','bP','bP','bP','bP','bP'],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    ['wP','wP','wP','wP','wP','wP','wP','wP'],
    ['wR','wN','wB','wQ','wK','wB','wN','wR'],
  ];
  game.turn = 'w';
  game.selected = null;
  game.history = [];
  game.redo = [];
  document.getElementById('move-list').innerHTML = '';
  updateTurnIndicator();
}

function renderBoard() {
  const boardEl = document.getElementById('board');
  if (!boardEl) return;
  boardEl.innerHTML = '';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = document.createElement('div');
      sq.className = `square ${(r+c)%2===0? 'light':'dark'}`;
      sq.dataset.r = r; sq.dataset.c = c;
      const piece = game.board[r][c];
      if (piece) {
        const el = document.createElement('div');
        el.className = 'piece';
        el.textContent = PIECES[piece];
        el.draggable = true;
        el.addEventListener('dragstart', e => {
          e.dataTransfer.setData('text/plain', JSON.stringify({ r, c }));
        });
        sq.addEventListener('dragover', e => e.preventDefault());
        sq.addEventListener('drop', e => {
          e.preventDefault();
          const { r: sr, c: sc } = JSON.parse(e.dataTransfer.getData('text/plain'));
          attemptMove(sr, sc, r, c);
        });
        sq.appendChild(el);
      } else {
        sq.addEventListener('dragover', e => e.preventDefault());
        sq.addEventListener('drop', e => {
          e.preventDefault();
          const { r: sr, c: sc } = JSON.parse(e.dataTransfer.getData('text/plain'));
          attemptMove(sr, sc, r, c);
        });
      }
      sq.addEventListener('click', () => onSquareClick(r, c));
      boardEl.appendChild(sq);
    }
  }
}

function onSquareClick(r, c) {
  const sel = game.selected;
  const piece = game.board[r][c];
  if (sel && (sel.r !== r || sel.c !== c)) {
    attemptMove(sel.r, sel.c, r, c);
    return;
  }
  if (piece && piece[0] === game.turn) {
    game.selected = { r, c };
    highlightSelection(r, c);
  } else {
    clearHighlights();
    game.selected = null;
  }
}

function highlightSelection(r, c) {
  clearHighlights();
  const boardEl = document.getElementById('board');
  const idx = r*8 + c;
  const sq = boardEl.children[idx];
  if (sq) sq.classList.add('selected');
  const moves = legalMoves(r, c);
  moves.forEach(m => {
    const i = m.r*8 + m.c; const target = boardEl.children[i];
    if (target) target.classList.add('legal');
  });
}

function clearHighlights() {
  document.querySelectorAll('.square.selected,.square.legal').forEach(el => el.classList.remove('selected','legal'));
}

function attemptMove(sr, sc, tr, tc) {
  const moves = legalMoves(sr, sc);
  if (!moves.find(m => m.r === tr && m.c === tc)) {
    game.selected = null; clearHighlights(); return;
  }
  const piece = game.board[sr][sc];
  const capture = game.board[tr][tc];
  pushHistory();
  game.board[tr][tc] = piece;
  game.board[sr][sc] = null;
  game.selected = null;
  clearHighlights();
  addMoveToList(sr, sc, tr, tc, piece, capture);
  switchTurn();
  renderBoard();
  if (game.mode === 'pvai' && game.turn === 'b') {
    setTimeout(aiMove, 200);
  }
}

function legalMoves(r, c) {
  const piece = game.board[r][c];
  if (!piece) return [];
  const color = piece[0];
  const type = piece[1];
  const dirs = [];
  const moves = [];
  function addIf(r1,c1) {
    if (r1<0||r1>7||c1<0||c1>7) return;
    const target = game.board[r1][c1];
    if (!target || target[0] !== color) moves.push({ r:r1, c:c1 });
  }
  if (type === 'P') {
    const dir = color === 'w' ? -1 : 1;
    if (!game.board[r+dir]?.[c]) addIf(r+dir, c);
    if ((color==='w' && r===6) || (color==='b' && r===1)) {
      if (!game.board[r+dir]?.[c] && !game.board[r+2*dir]?.[c]) addIf(r+2*dir, c);
    }
    [[dir,-1],[dir,1]].forEach(([dr,dc]) => {
      const tr = r+dr, tc = c+dc;
      if (tr>=0&&tr<8&&tc>=0&&tc<8) {
        const t = game.board[tr][tc];
        if (t && t[0] !== color) moves.push({ r:tr, c:tc });
      }
    });
  } else if (type === 'N') {
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => addIf(r+dr,c+dc));
  } else if (type === 'B' || type === 'R' || type === 'Q') {
    const vecs = [];
    if (type==='B' || type==='Q') vecs.push([-1,-1],[-1,1],[1,-1],[1,1]);
    if (type==='R' || type==='Q') vecs.push([-1,0],[1,0],[0,-1],[0,1]);
    vecs.forEach(([dr,dc]) => {
      let tr=r+dr, tc=c+dc;
      while (tr>=0&&tr<8&&tc>=0&&tc<8) {
        const t = game.board[tr][tc];
        if (!t) { moves.push({ r:tr, c:tc }); tr+=dr; tc+=dc; }
        else { if (t[0]!==color) moves.push({ r:tr, c:tc }); break; }
      }
    });
  } else if (type === 'K') {
    [-1,0,1].forEach(dr => [-1,0,1].forEach(dc => { if (dr||dc) addIf(r+dr,c+dc); }));
  }
  return moves;
}

function aiMove() {
  const moves = allMoves('b');
  if (!moves.length) return;
  const pick = moves[Math.floor(Math.random()*moves.length)];
  attemptMove(pick.sr, pick.sc, pick.tr, pick.tc);
}

function allMoves(color) {
  const moves = [];
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    const p = game.board[r][c];
    if (p && p[0]===color) {
      legalMoves(r,c).forEach(m => moves.push({ sr:r, sc:c, tr:m.r, tc:m.c }));
    }
  }
  return moves;
}

function addMoveToList(sr, sc, tr, tc, piece, capture) {
  const list = document.getElementById('move-list');
  const from = toCoord(sr, sc), to = toCoord(tr, tc);
  const li = document.createElement('li');
  li.textContent = `${piece} ${from}-${to}${capture? ' x':''}`;
  list.appendChild(li);
}

function toCoord(r,c) { return String.fromCharCode('a'.charCodeAt(0)+c) + (8-r); }

function switchTurn() {
  game.turn = game.turn === 'w' ? 'b' : 'w';
  updateTurnIndicator();
}

function updateTurnIndicator() {
  const el = document.getElementById('turn-indicator');
  if (el) el.textContent = (game.turn === 'w' ? 'White' : 'Black') + ' to move';
}

function pushHistory() {
  game.history.push(JSON.stringify({ board: game.board, turn: game.turn }));
  game.redo = [];
}

function undoMove() {
  if (!game.history.length) return;
  game.redo.push(JSON.stringify({ board: game.board, turn: game.turn }));
  const prev = JSON.parse(game.history.pop());
  game.board = prev.board; game.turn = prev.turn;
  renderBoard(); updateTurnIndicator();
}

function redoMove() {
  if (!game.redo.length) return;
  game.history.push(JSON.stringify({ board: game.board, turn: game.turn }));
  const next = JSON.parse(game.redo.pop());
  game.board = next.board; game.turn = next.turn;
  renderBoard(); updateTurnIndicator();
}
