document.addEventListener('DOMContentLoaded', () => {
  ensureLoggedIn();
  updateNav();
  initGame();
});

const game = { mode: 'pvp', board: [], turn: 'w', selected: null, history: [], redo: [], castling: { wK:true,wQ:true,bK:true,bQ:true }, enPassant: null };
const PIECES = { wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙', bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟' };

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
  game.castling = { wK:true,wQ:true,bK:true,bQ:true };
  game.enPassant = null;
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
      const piece = game.board[r][c];
      if (piece) {
        const el = document.createElement('div');
        el.className = 'piece';
        el.textContent = PIECES[piece];
        el.draggable = true;
        el.addEventListener('dragstart', e => {
          e.dataTransfer.setData('text/plain', JSON.stringify({ r, c }));
        });
        sq.appendChild(el);
      }
      sq.addEventListener('dragover', e => e.preventDefault());
      sq.addEventListener('drop', e => {
        e.preventDefault();
        const { r: sr, c: sc } = JSON.parse(e.dataTransfer.getData('text/plain'));
        attemptMove(sr, sc, r, c);
      });
      sq.addEventListener('click', () => onSquareClick(r, c));
      boardEl.appendChild(sq);
    }
  }
}

function onSquareClick(r, c) {
  const sel = game.selected;
  const piece = game.board[r][c];
  if (sel && (sel.r !== r || sel.c !== c)) { attemptMove(sel.r, sel.c, r, c); return; }
  if (piece && piece[0] === game.turn) { game.selected = { r, c }; highlightSelection(r, c); }
  else { clearHighlights(); game.selected = null; }
}

function highlightSelection(r, c) {
  clearHighlights();
  const boardEl = document.getElementById('board');
  const idx = r*8 + c;
  const sq = boardEl.children[idx]; if (sq) sq.classList.add('selected');
  const moves = legalMoves(r, c);
  moves.forEach(m => {
    const i = m.r*8 + m.c; const target = boardEl.children[i]; if (target) target.classList.add('legal');
  });
}

function clearHighlights() {
  document.querySelectorAll('.square.selected,.square.legal').forEach(el => el.classList.remove('selected','legal'));
}

function attemptMove(sr, sc, tr, tc) {
  const moves = legalMoves(sr, sc);
  if (!moves.find(m => m.r === tr && m.c === tc)) { game.selected = null; clearHighlights(); return; }
  const piece = game.board[sr][sc];
  const capture = game.board[tr][tc];
  pushHistory();
  if (piece[1] === 'P' && !capture && game.enPassant && tr === game.enPassant.r && tc === game.enPassant.c) {
    game.board[sr][tc] = null;
  }
  game.board[tr][tc] = piece;
  game.board[sr][sc] = null;
  if (piece[1] === 'K' && Math.abs(tc - sc) === 2) {
    if (tc > sc) {
      const rr = sr, rcFrom = 7, rcTo = 5; game.board[rr][rcTo] = game.board[rr][rcFrom]; game.board[rr][rcFrom] = null;
    } else {
      const rr = sr, rcFrom = 0, rcTo = 3; game.board[rr][rcTo] = game.board[rr][rcFrom]; game.board[rr][rcFrom] = null;
    }
  }
  if (piece[1] === 'P' && (tr === 0 || tr === 7)) {
    const ch = prompt('Promote to Q/R/B/N', 'Q');
    const map = { 'Q':'Q','R':'R','B':'B','N':'N','q':'Q','r':'R','b':'B','n':'N' };
    const sel = map[ch || 'Q'] || 'Q';
    const color = piece[0];
    game.board[tr][tc] = color + sel;
  }
  if (piece[1] === 'K') {
    if (piece[0] === 'w') { game.castling.wK = false; game.castling.wQ = false; }
    else { game.castling.bK = false; game.castling.bQ = false; }
  }
  if (piece[1] === 'R') {
    if (sr === 7 && sc === 7) game.castling.wK = false;
    if (sr === 7 && sc === 0) game.castling.wQ = false;
    if (sr === 0 && sc === 7) game.castling.bK = false;
    if (sr === 0 && sc === 0) game.castling.bQ = false;
  }
  if (capture === 'wR' && tr === 7 && tc === 7) game.castling.wK = false;
  if (capture === 'wR' && tr === 7 && tc === 0) game.castling.wQ = false;
  if (capture === 'bR' && tr === 0 && tc === 7) game.castling.bK = false;
  if (capture === 'bR' && tr === 0 && tc === 0) game.castling.bQ = false;
  game.enPassant = null;
  if (piece[1] === 'P' && Math.abs(tr - sr) === 2) {
    game.enPassant = { r: sr + (tr > sr ? 1 : -1), c: sc };
  }
  game.selected = null;
  clearHighlights();
  addMoveToList(sr, sc, tr, tc, piece, capture);
  switchTurn();
  renderBoard();
  if (game.mode === 'pvai' && game.turn === 'b') { setTimeout(aiMove, 200); }
}

function legalMoves(r, c) {
  const piece = game.board[r][c]; if (!piece) return [];
  const color = piece[0]; const type = piece[1]; const moves = [];
  function addIf(r1,c1) {
    if (r1<0||r1>7||c1<0||c1>7) return;
    const target = game.board[r1][c1]; if (!target || target[0] !== color) moves.push({ r:r1, c:c1 });
  }
  if (type === 'P') {
    const dir = color === 'w' ? -1 : 1;
    if (!game.board[r+dir]?.[c]) addIf(r+dir, c);
    if ((color==='w' && r===6) || (color==='b' && r===1)) {
      if (!game.board[r+dir]?.[c] && !game.board[r+2*dir]?.[c]) addIf(r+2*dir, c);
    }
    [[dir,-1],[dir,1]].forEach(([dr,dc]) => { const tr=r+dr, tc=c+dc; if (tr>=0&&tr<8&&tc>=0&&tc<8) { const t=game.board[tr][tc]; if (t && t[0] !== color) moves.push({ r:tr, c:tc }); } });
  } else if (type === 'N') {
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => addIf(r+dr,c+dc));
  } else if (type === 'B' || type === 'R' || type === 'Q') {
    const vecs = []; if (type==='B' || type==='Q') vecs.push([-1,-1],[-1,1],[1,-1],[1,1]); if (type==='R' || type==='Q') vecs.push([-1,0],[1,0],[0,-1],[0,1]);
    vecs.forEach(([dr,dc]) => { let tr=r+dr, tc=c+dc; while (tr>=0&&tr<8&&tc>=0&&tc<8) { const t = game.board[tr][tc]; if (!t) { moves.push({ r:tr, c:tc }); tr+=dr; tc+=dc; } else { if (t[0]!==color) moves.push({ r:tr, c:tc }); break; } } });
  } else if (type === 'K') {
    [-1,0,1].forEach(dr => [-1,0,1].forEach(dc => { if (dr||dc) addIf(r+dr,c+dc); }));
    if (color === 'w' && r === 7 && c === 4) {
      if (game.castling.wK && !game.board[7][5] && !game.board[7][6] && game.board[7][7] === 'wR') {
        if (!isSquareAttacked('b', 7, 4) && !isSquareAttacked('b', 7, 5) && !isSquareAttacked('b', 7, 6)) moves.push({ r:7, c:6 });
      }
      if (game.castling.wQ && !game.board[7][1] && !game.board[7][2] && !game.board[7][3] && game.board[7][0] === 'wR') {
        if (!isSquareAttacked('b', 7, 4) && !isSquareAttacked('b', 7, 3) && !isSquareAttacked('b', 7, 2)) moves.push({ r:7, c:2 });
      }
    }
    if (color === 'b' && r === 0 && c === 4) {
      if (game.castling.bK && !game.board[0][5] && !game.board[0][6] && game.board[0][7] === 'bR') {
        if (!isSquareAttacked('w', 0, 4) && !isSquareAttacked('w', 0, 5) && !isSquareAttacked('w', 0, 6)) moves.push({ r:0, c:6 });
      }
      if (game.castling.bQ && !game.board[0][1] && !game.board[0][2] && !game.board[0][3] && game.board[0][0] === 'bR') {
        if (!isSquareAttacked('w', 0, 4) && !isSquareAttacked('w', 0, 3) && !isSquareAttacked('w', 0, 2)) moves.push({ r:0, c:2 });
      }
    }
  }
  return moves;
}

function isSquareAttacked(byColor, r, c) {
  const dirsB = [[-1,-1],[-1,1],[1,-1],[1,1]];
  const dirsR = [[-1,0],[1,0],[0,-1],[0,1]];
  const knight = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  const pawnDir = byColor === 'w' ? -1 : 1;
  const pr1 = r + pawnDir, pc1 = c - 1, pc2 = c + 1;
  if (pr1>=0&&pr1<8&&pc1>=0&&pc1<8 && game.board[pr1][pc1] === (byColor+'P')) return true;
  if (pr1>=0&&pr1<8&&pc2>=0&&pc2<8 && game.board[pr1][pc2] === (byColor+'P')) return true;
  for (const [dr,dc] of knight) { const rr=r+dr, cc=c+dc; if (rr>=0&&rr<8&&cc>=0&&cc<8 && game.board[rr][cc] === (byColor+'N')) return true; }
  for (const [dr,dc] of dirsB) { let rr=r+dr, cc=c+dc; while (rr>=0&&rr<8&&cc>=0&&cc<8) { const t=game.board[rr][cc]; if (t) { if (t === (byColor+'B') || t === (byColor+'Q')) return true; else break; } rr+=dr; cc+=dc; } }
  for (const [dr,dc] of dirsR) { let rr=r+dr, cc=c+dc; while (rr>=0&&rr<8&&cc>=0&&cc<8) { const t=game.board[rr][cc]; if (t) { if (t === (byColor+'R') || t === (byColor+'Q')) return true; else break; } rr+=dr; cc+=dc; } }
  for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++) { if (dr||dc) { const rr=r+dr, cc=c+dc; if (rr>=0&&rr<8&&cc>=0&&cc<8 && game.board[rr][cc] === (byColor+'K')) return true; } }
  return false;
}

function aiMove() { const moves = allMoves('b'); if (!moves.length) return; const pick = moves[Math.floor(Math.random()*moves.length)]; attemptMove(pick.sr, pick.sc, pick.tr, pick.tc); }
function allMoves(color) { const moves = []; for (let r=0;r<8;r++) for (let c=0;c<8;c++) { const p=game.board[r][c]; if (p && p[0]===color) legalMoves(r,c).forEach(m => moves.push({ sr:r, sc:c, tr:m.r, tc:m.c })); } return moves; }

function addMoveToList(sr, sc, tr, tc, piece, capture) { const list=document.getElementById('move-list'); const from=toCoord(sr,sc), to=toCoord(tr,tc); const li=document.createElement('li'); li.textContent = `${piece} ${from}-${to}${capture? ' x':''}`; list.appendChild(li); }
function toCoord(r,c) { return String.fromCharCode('a'.charCodeAt(0)+c) + (8-r); }

function switchTurn() { game.turn = game.turn === 'w' ? 'b' : 'w'; updateTurnIndicator(); }
function updateTurnIndicator() { const el=document.getElementById('turn-indicator'); if (el) el.textContent = (game.turn === 'w' ? 'White' : 'Black') + ' to move'; }
function pushHistory() { game.history.push(JSON.stringify({ board: game.board, turn: game.turn, castling: game.castling, enPassant: game.enPassant })); game.redo = []; }
function undoMove() { if (!game.history.length) return; game.redo.push(JSON.stringify({ board: game.board, turn: game.turn, castling: game.castling, enPassant: game.enPassant })); const prev=JSON.parse(game.history.pop()); game.board=prev.board; game.turn=prev.turn; game.castling=prev.castling; game.enPassant=prev.enPassant; renderBoard(); updateTurnIndicator(); }
function redoMove() { if (!game.redo.length) return; game.history.push(JSON.stringify({ board: game.board, turn: game.turn, castling: game.castling, enPassant: game.enPassant })); const next=JSON.parse(game.redo.pop()); game.board=next.board; game.turn=next.turn; game.castling=next.castling; game.enPassant=next.enPassant; renderBoard(); updateTurnIndicator(); }
