/**
 * ============================================================
 * CHESS ENGINE - engine.js
 * Complete Chess Rules + Minimax AI with Alpha-Beta Pruning
 * ============================================================
 */

'use strict';

// ─── CONSTANTS ───────────────────────────────────────────────
const PIECES = {
  KING: 'k', QUEEN: 'q', ROOK: 'r', BISHOP: 'b', KNIGHT: 'n', PAWN: 'p'
};
const COLORS = { WHITE: 'w', BLACK: 'b' };
const EMPTY = null;

// Piece-Square Tables (for positional evaluation)
const PST = {
  p: {
    w: [
       0,  0,  0,  0,  0,  0,  0,  0,
      50, 50, 50, 50, 50, 50, 50, 50,
      10, 10, 20, 30, 30, 20, 10, 10,
       5,  5, 10, 25, 25, 10,  5,  5,
       0,  0,  0, 20, 20,  0,  0,  0,
       5, -5,-10,  0,  0,-10, -5,  5,
       5, 10, 10,-20,-20, 10, 10,  5,
       0,  0,  0,  0,  0,  0,  0,  0
    ],
    b: [
       0,  0,  0,  0,  0,  0,  0,  0,
       5, 10, 10,-20,-20, 10, 10,  5,
       5, -5,-10,  0,  0,-10, -5,  5,
       0,  0,  0, 20, 20,  0,  0,  0,
       5,  5, 10, 25, 25, 10,  5,  5,
      10, 10, 20, 30, 30, 20, 10, 10,
      50, 50, 50, 50, 50, 50, 50, 50,
       0,  0,  0,  0,  0,  0,  0,  0
    ]
  },
  n: {
    w: [-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,  0,  0,  0,  0,-20,-40,-30,  0, 10, 15, 15, 10,  0,-30,-30,  5, 15, 20, 20, 15,  5,-30,-30,  0, 15, 20, 20, 15,  0,-30,-30,  5, 10, 15, 15, 10,  5,-30,-40,-20,  0,  5,  5,  0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
    b: [-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,  0,  5,  5,  0,-20,-40,-30,  5, 10, 15, 15, 10,  5,-30,-30,  0, 15, 20, 20, 15,  0,-30,-30,  5, 15, 20, 20, 15,  5,-30,-30,  0, 10, 15, 15, 10,  0,-30,-40,-20,  0,  0,  0,  0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50]
  },
  b: {
    w: [-20,-10,-10,-10,-10,-10,-10,-20,-10,  0,  0,  0,  0,  0,  0,-10,-10,  0,  5, 10, 10,  5,  0,-10,-10,  5,  5, 10, 10,  5,  5,-10,-10,  0, 10, 10, 10, 10,  0,-10,-10, 10, 10, 10, 10, 10, 10,-10,-10,  5,  0,  0,  0,  0,  5,-10,-20,-10,-10,-10,-10,-10,-10,-20],
    b: [-20,-10,-10,-10,-10,-10,-10,-20,-10,  5,  0,  0,  0,  0,  5,-10,-10, 10, 10, 10, 10, 10, 10,-10,-10,  0, 10, 10, 10, 10,  0,-10,-10,  5,  5, 10, 10,  5,  5,-10,-10,  0,  5, 10, 10,  5,  0,-10,-10,  0,  0,  0,  0,  0,  0,-10,-20,-10,-10,-10,-10,-10,-10,-20]
  },
  r: {
    w: [  0,  0,  0,  0,  0,  0,  0,  0,  5, 10, 10, 10, 10, 10, 10,  5, -5,  0,  0,  0,  0,  0,  0, -5, -5,  0,  0,  0,  0,  0,  0, -5, -5,  0,  0,  0,  0,  0,  0, -5, -5,  0,  0,  0,  0,  0,  0, -5, -5,  0,  0,  0,  0,  0,  0, -5,  0,  0,  0,  5,  5,  0,  0,  0],
    b: [  0,  0,  0,  5,  5,  0,  0,  0, -5,  0,  0,  0,  0,  0,  0, -5, -5,  0,  0,  0,  0,  0,  0, -5, -5,  0,  0,  0,  0,  0,  0, -5, -5,  0,  0,  0,  0,  0,  0, -5, -5,  0,  0,  0,  0,  0,  0, -5,  5, 10, 10, 10, 10, 10, 10,  5,  0,  0,  0,  0,  0,  0,  0,  0]
  },
  q: {
    w: [-20,-10,-10, -5, -5,-10,-10,-20,-10,  0,  0,  0,  0,  0,  0,-10,-10,  0,  5,  5,  5,  5,  0,-10, -5,  0,  5,  5,  5,  5,  0, -5,  0,  0,  5,  5,  5,  5,  0, -5,-10,  5,  5,  5,  5,  5,  0,-10,-10,  0,  5,  0,  0,  0,  0,-10,-20,-10,-10, -5, -5,-10,-10,-20],
    b: [-20,-10,-10, -5, -5,-10,-10,-20,-10,  0,  5,  0,  0,  0,  0,-10,-10,  5,  5,  5,  5,  5,  0,-10,  0,  0,  5,  5,  5,  5,  0, -5, -5,  0,  5,  5,  5,  5,  0, -5,-10,  0,  5,  5,  5,  5,  0,-10,-10,  0,  0,  0,  0,  0,  0,-10,-20,-10,-10, -5, -5,-10,-10,-20]
  },
  k: {
    w: [-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10, 20, 20,  0,  0,  0,  0, 20, 20, 20, 30, 10,  0,  0, 10, 30, 20],
    b: [ 20, 30, 10,  0,  0, 10, 30, 20, 20, 20,  0,  0,  0,  0, 20, 20,-10,-20,-20,-20,-20,-20,-20,-10,-20,-30,-30,-40,-40,-30,-30,-20,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30]
  }
};

// Endgame king table
const KING_END = {
  w: [-50,-40,-30,-20,-20,-30,-40,-50,-30,-20,-10,  0,  0,-10,-20,-30,-30,-10, 20, 30, 30, 20,-10,-30,-30,-10, 30, 40, 40, 30,-10,-30,-30,-10, 30, 40, 40, 30,-10,-30,-30,-10, 20, 30, 30, 20,-10,-30,-30,-30,  0,  0,  0,  0,-30,-30,-50,-30,-30,-30,-30,-30,-30,-50],
  b: [-50,-30,-30,-30,-30,-30,-30,-50,-30,-30,  0,  0,  0,  0,-30,-30,-30,-10, 20, 30, 30, 20,-10,-30,-30,-10, 30, 40, 40, 30,-10,-30,-30,-10, 30, 40, 40, 30,-10,-30,-30,-10, 20, 30, 30, 20,-10,-30,-30,-20,-10,  0,  0,-10,-20,-30,-50,-40,-30,-20,-20,-30,-40,-50]
};

const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// ─── MOVE CLASS ───────────────────────────────────────────────
class Move {
  constructor(from, to, piece, captured = null, flags = {}) {
    this.from = from;           // index 0-63
    this.to = to;               // index 0-63
    this.piece = piece;         // {type, color}
    this.captured = captured;   // {type, color} or null
    this.flags = {
      castling: flags.castling || null,   // 'k' or 'q'
      enPassant: flags.enPassant || false,
      promotion: flags.promotion || null, // piece type
      ...flags
    };
  }

  toAlgebraic(board) {
    const files = 'abcdefgh';
    const fromFile = files[this.from % 8];
    const fromRank = 8 - Math.floor(this.from / 8);
    const toFile = files[this.to % 8];
    const toRank = 8 - Math.floor(this.to / 8);

    if (this.flags.castling === 'k') return 'O-O';
    if (this.flags.castling === 'q') return 'O-O-O';

    let notation = '';
    const pt = this.piece.type;

    if (pt !== 'p') notation += pt.toUpperCase();
    else if (this.captured || this.flags.enPassant) notation += fromFile;

    if (this.captured || this.flags.enPassant) notation += 'x';
    notation += toFile + toRank;
    if (this.flags.promotion) notation += '=' + this.flags.promotion.toUpperCase();

    return notation;
  }
}

// ─── BOARD CLASS ─────────────────────────────────────────────
class ChessBoard {
  constructor() {
    this.squares = new Array(64).fill(null);
    this.turn = COLORS.WHITE;
    this.castlingRights = { wk: true, wq: true, bk: true, bq: true };
    this.enPassantSquare = null;
    this.halfMoveClock = 0;
    this.fullMoveNumber = 1;
    this.moveHistory = [];
    this.positionHistory = [];
    this.capturedPieces = { w: [], b: [] };
    this.init();
  }

  init() {
    this.loadFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  }

  loadFEN(fen) {
    const parts = fen.split(' ');
    const [position, turn, castling, enPassant, halfMove, fullMove] = parts;

    this.squares = new Array(64).fill(null);
    let idx = 0;
    for (const ch of position) {
      if (ch === '/') continue;
      if (!isNaN(ch)) { idx += parseInt(ch); continue; }
      const color = ch === ch.toUpperCase() ? 'w' : 'b';
      this.squares[idx++] = { type: ch.toLowerCase(), color };
    }

    this.turn = turn || 'w';
    this.castlingRights = {
      wk: castling?.includes('K') ?? true,
      wq: castling?.includes('Q') ?? true,
      bk: castling?.includes('k') ?? true,
      bq: castling?.includes('q') ?? true
    };

    if (enPassant && enPassant !== '-') {
      const file = enPassant.charCodeAt(0) - 97;
      const rank = 8 - parseInt(enPassant[1]);
      this.enPassantSquare = rank * 8 + file;
    } else {
      this.enPassantSquare = null;
    }

    this.halfMoveClock = parseInt(halfMove) || 0;
    this.fullMoveNumber = parseInt(fullMove) || 1;
    this.moveHistory = [];
    this.capturedPieces = { w: [], b: [] };
    this.positionHistory = [this.getPositionKey()];
  }

  toFEN() {
    let fen = '';
    for (let r = 0; r < 8; r++) {
      let empty = 0;
      for (let c = 0; c < 8; c++) {
        const piece = this.squares[r * 8 + c];
        if (!piece) { empty++; continue; }
        if (empty) { fen += empty; empty = 0; }
        const ch = piece.type;
        fen += piece.color === 'w' ? ch.toUpperCase() : ch;
      }
      if (empty) fen += empty;
      if (r < 7) fen += '/';
    }
    const cr = (this.castlingRights.wk ? 'K' : '') + (this.castlingRights.wq ? 'Q' : '') +
               (this.castlingRights.bk ? 'k' : '') + (this.castlingRights.bq ? 'q' : '') || '-';
    const ep = this.enPassantSquare !== null ?
      ('abcdefgh'[this.enPassantSquare % 8] + (8 - Math.floor(this.enPassantSquare / 8))) : '-';
    return `${fen} ${this.turn} ${cr} ${ep} ${this.halfMoveClock} ${this.fullMoveNumber}`;
  }

  getPositionKey() {
    return this.toFEN().split(' ').slice(0, 4).join(' ');
  }

  clone() {
    const b = new ChessBoard();
    b.squares = [...this.squares.map(p => p ? { ...p } : null)];
    b.turn = this.turn;
    b.castlingRights = { ...this.castlingRights };
    b.enPassantSquare = this.enPassantSquare;
    b.halfMoveClock = this.halfMoveClock;
    b.fullMoveNumber = this.fullMoveNumber;
    b.moveHistory = [...this.moveHistory];
    b.positionHistory = [...this.positionHistory];
    b.capturedPieces = { w: [...this.capturedPieces.w], b: [...this.capturedPieces.b] };
    return b;
  }

  idx(row, col) { return row * 8 + col; }
  row(idx) { return Math.floor(idx / 8); }
  col(idx) { return idx % 8; }

  getPseudoLegalMoves(color) {
    const moves = [];
    for (let i = 0; i < 64; i++) {
      const piece = this.squares[i];
      if (!piece || piece.color !== color) continue;
      this._getPieceMoves(i, piece, moves);
    }
    return moves;
  }

  _getPieceMoves(from, piece, moves) {
    switch (piece.type) {
      case 'p': this._pawnMoves(from, piece, moves); break;
      case 'n': this._knightMoves(from, piece, moves); break;
      case 'b': this._slidingMoves(from, piece, moves, [[1,1],[1,-1],[-1,1],[-1,-1]]); break;
      case 'r': this._slidingMoves(from, piece, moves, [[1,0],[-1,0],[0,1],[0,-1]]); break;
      case 'q': this._slidingMoves(from, piece, moves, [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]); break;
      case 'k': this._kingMoves(from, piece, moves); break;
    }
  }

  _pawnMoves(from, piece, moves) {
    const dir = piece.color === 'w' ? -1 : 1;
    const startRank = piece.color === 'w' ? 6 : 1;
    const promRank = piece.color === 'w' ? 0 : 7;
    const r = this.row(from), c = this.col(from);

    // Forward
    const fwd = from + dir * 8;
    if (fwd >= 0 && fwd < 64 && !this.squares[fwd]) {
      if (this.row(fwd) === promRank) {
        for (const pt of ['q','r','b','n'])
          moves.push(new Move(from, fwd, piece, null, { promotion: pt }));
      } else {
        moves.push(new Move(from, fwd, piece));
        // Double push
        if (r === startRank) {
          const dbl = from + dir * 16;
          if (!this.squares[dbl])
            moves.push(new Move(from, dbl, piece));
        }
      }
    }

    // Captures
    for (const dc of [-1, 1]) {
      const nc = c + dc;
      if (nc < 0 || nc > 7) continue;
      const to = from + dir * 8 + dc;
      if (to < 0 || to >= 64) continue;
      const target = this.squares[to];
      if (target && target.color !== piece.color) {
        if (this.row(to) === promRank) {
          for (const pt of ['q','r','b','n'])
            moves.push(new Move(from, to, piece, target, { promotion: pt }));
        } else {
          moves.push(new Move(from, to, piece, target));
        }
      }
      // En passant
      if (this.enPassantSquare === to) {
        moves.push(new Move(from, to, piece, { type: 'p', color: piece.color === 'w' ? 'b' : 'w' }, { enPassant: true }));
      }
    }
  }

  _knightMoves(from, piece, moves) {
    const r = this.row(from), c = this.col(from);
    const offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, dc] of offsets) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
      const to = this.idx(nr, nc);
      const target = this.squares[to];
      if (!target || target.color !== piece.color)
        moves.push(new Move(from, to, piece, target || null));
    }
  }

  _slidingMoves(from, piece, moves, dirs) {
    for (const [dr, dc] of dirs) {
      let r = this.row(from), c = this.col(from);
      while (true) {
        r += dr; c += dc;
        if (r < 0 || r > 7 || c < 0 || c > 7) break;
        const to = this.idx(r, c);
        const target = this.squares[to];
        if (target) {
          if (target.color !== piece.color)
            moves.push(new Move(from, to, piece, target));
          break;
        }
        moves.push(new Move(from, to, piece));
      }
    }
  }

  _kingMoves(from, piece, moves) {
    const r = this.row(from), c = this.col(from);
    for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
      const to = this.idx(nr, nc);
      const target = this.squares[to];
      if (!target || target.color !== piece.color)
        moves.push(new Move(from, to, piece, target || null));
    }

    // Castling
    const isWhite = piece.color === 'w';
    const kingRank = isWhite ? 7 : 0;
    if (this.row(from) !== kingRank) return;

    const rights = this.castlingRights;
    const opp = isWhite ? 'b' : 'w';

    // Kingside
    const kKey = isWhite ? 'wk' : 'bk';
    if (rights[kKey]) {
      const f = this.idx(kingRank, 5), g = this.idx(kingRank, 6);
      if (!this.squares[f] && !this.squares[g] &&
          !this.isAttacked(from, opp) && !this.isAttacked(f, opp) && !this.isAttacked(g, opp))
        moves.push(new Move(from, g, piece, null, { castling: 'k' }));
    }

    // Queenside
    const qKey = isWhite ? 'wq' : 'bq';
    if (rights[qKey]) {
      const b = this.idx(kingRank, 1), c2 = this.idx(kingRank, 2), d = this.idx(kingRank, 3);
      if (!this.squares[b] && !this.squares[c2] && !this.squares[d] &&
          !this.isAttacked(from, opp) && !this.isAttacked(d, opp) && !this.isAttacked(c2, opp))
        moves.push(new Move(from, c2, piece, null, { castling: 'q' }));
    }
  }

  isAttacked(sq, byColor) {
    // Check all pieces of byColor attacking sq
    for (let i = 0; i < 64; i++) {
      const p = this.squares[i];
      if (!p || p.color !== byColor) continue;
      if (this._attacks(i, p, sq)) return true;
    }
    return false;
  }

  _attacks(from, piece, to) {
    const r1 = this.row(from), c1 = this.col(from);
    const r2 = this.row(to), c2 = this.col(to);
    const dr = r2 - r1, dc = c2 - c1;

    switch (piece.type) {
      case 'p': {
        const dir = piece.color === 'w' ? -1 : 1;
        return dr === dir && Math.abs(dc) === 1;
      }
      case 'n':
        return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
      case 'b':
        if (Math.abs(dr) !== Math.abs(dc)) return false;
        return this._clearPath(from, to);
      case 'r':
        if (dr !== 0 && dc !== 0) return false;
        return this._clearPath(from, to);
      case 'q':
        if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return false;
        return this._clearPath(from, to);
      case 'k':
        return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
    }
    return false;
  }

  _clearPath(from, to) {
    const dr = Math.sign(this.row(to) - this.row(from));
    const dc = Math.sign(this.col(to) - this.col(from));
    let r = this.row(from) + dr, c = this.col(from) + dc;
    while (this.idx(r, c) !== to) {
      if (this.squares[this.idx(r, c)]) return false;
      r += dr; c += dc;
    }
    return true;
  }

  getLegalMoves(color) {
    const pseudo = this.getPseudoLegalMoves(color || this.turn);
    return pseudo.filter(m => {
      const b = this.clone();
      b._applyMove(m);
      const kingIdx = b.squares.findIndex(p => p && p.type === 'k' && p.color === (color || this.turn));
      return kingIdx !== -1 && !b.isAttacked(kingIdx, color === 'w' ? 'b' : 'w');
    });
  }

  _applyMove(move) {
    const { from, to, piece, flags } = move;

    this.squares[from] = null;
    this.squares[to] = flags.promotion ? { type: flags.promotion, color: piece.color } : { ...piece };

    if (flags.enPassant) {
      const capSq = to + (piece.color === 'w' ? 8 : -8);
      this.squares[capSq] = null;
    }

    if (flags.castling) {
      const rank = piece.color === 'w' ? 7 : 0;
      if (flags.castling === 'k') {
        this.squares[this.idx(rank, 5)] = { type: 'r', color: piece.color };
        this.squares[this.idx(rank, 7)] = null;
      } else {
        this.squares[this.idx(rank, 3)] = { type: 'r', color: piece.color };
        this.squares[this.idx(rank, 0)] = null;
      }
    }

    // Update castling rights
    if (piece.type === 'k') {
      if (piece.color === 'w') { this.castlingRights.wk = false; this.castlingRights.wq = false; }
      else { this.castlingRights.bk = false; this.castlingRights.bq = false; }
    }
    if (piece.type === 'r') {
      if (from === 63) this.castlingRights.wk = false;
      if (from === 56) this.castlingRights.wq = false;
      if (from === 7) this.castlingRights.bk = false;
      if (from === 0) this.castlingRights.bq = false;
    }

    // En passant square
    this.enPassantSquare = null;
    if (piece.type === 'p' && Math.abs(this.row(to) - this.row(from)) === 2)
      this.enPassantSquare = (from + to) >> 1;

    // Clocks
    if (piece.type === 'p' || move.captured) this.halfMoveClock = 0;
    else this.halfMoveClock++;

    if (this.turn === 'b') this.fullMoveNumber++;
    this.turn = this.turn === 'w' ? 'b' : 'w';
  }

  makeMove(move) {
    const captured = move.captured;
    if (captured) this.capturedPieces[this.turn].push(captured);

    this._applyMove(move);
    this.moveHistory.push(move);
    this.positionHistory.push(this.getPositionKey());
    return true;
  }

  undoMove() {
    if (!this.moveHistory.length) return false;
    // Reload from scratch using history
    const history = [...this.moveHistory];
    history.pop();
    this.loadFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    this.capturedPieces = { w: [], b: [] };
    for (const m of history) this.makeMove(m);
    return true;
  }

  isInCheck(color) {
    const kIdx = this.squares.findIndex(p => p && p.type === 'k' && p.color === color);
    if (kIdx === -1) return false;
    return this.isAttacked(kIdx, color === 'w' ? 'b' : 'w');
  }

  getGameState() {
    const legal = this.getLegalMoves(this.turn);
    const inCheck = this.isInCheck(this.turn);

    if (legal.length === 0) {
      return inCheck ? { status: 'checkmate', winner: this.turn === 'w' ? 'b' : 'w' }
                     : { status: 'stalemate' };
    }

    // 50-move rule
    if (this.halfMoveClock >= 100) return { status: 'draw', reason: '50-move' };

    // Threefold repetition
    const pos = this.getPositionKey();
    const count = this.positionHistory.filter(p => p === pos).length;
    if (count >= 3) return { status: 'draw', reason: 'repetition' };

    // Insufficient material
    if (this._isInsufficientMaterial()) return { status: 'draw', reason: 'insufficient' };

    return { status: inCheck ? 'check' : 'playing' };
  }

  _isInsufficientMaterial() {
    const pieces = this.squares.filter(Boolean);
    if (pieces.length === 2) return true; // K vs K
    if (pieces.length === 3) {
      const minor = pieces.find(p => p.type === 'n' || p.type === 'b');
      if (minor) return true; // K+minor vs K
    }
    if (pieces.length === 4) {
      const bishops = pieces.filter(p => p.type === 'b');
      if (bishops.length === 2 && bishops[0].color !== bishops[1].color) {
        // Bishops on same color
        const b1Sq = this.squares.findIndex(p => p === bishops[0]);
        const b2Sq = this.squares.findIndex(p => p === bishops[1]);
        if ((this.row(b1Sq) + this.col(b1Sq)) % 2 === (this.row(b2Sq) + this.col(b2Sq)) % 2)
          return true;
      }
    }
    return false;
  }

  evaluate() {
    const pieces = this.squares;
    let score = 0;
    let wMaterial = 0, bMaterial = 0;

    // Count material for endgame detection
    for (const p of pieces) {
      if (!p || p.type === 'k') continue;
      if (p.color === 'w') wMaterial += PIECE_VALUES[p.type];
      else bMaterial += PIECE_VALUES[p.type];
    }
    const isEndgame = wMaterial + bMaterial < 1300;

    for (let i = 0; i < 64; i++) {
      const p = pieces[i];
      if (!p) continue;
      const val = PIECE_VALUES[p.type];
      const pstTable = p.type === 'k' && isEndgame ? KING_END[p.color] : PST[p.type]?.[p.color];
      const pst = pstTable ? pstTable[i] : 0;
      const total = val + pst;
      score += p.color === 'w' ? total : -total;
    }

    // Mobility bonus
    const wMoves = this.getPseudoLegalMoves('w').length;
    const bMoves = this.getPseudoLegalMoves('b').length;
    score += (wMoves - bMoves) * 5;

    return score;
  }
}

// ─── AI ENGINE ───────────────────────────────────────────────
class ChessAI {
  constructor() {
    this.transpositionTable = new Map();
    this.killerMoves = Array.from({ length: 64 }, () => []);
    this.historyTable = {};
    this.nodes = 0;
    this.maxTime = 2000;
    this.startTime = 0;
  }

  getDepthForDifficulty(difficulty) {
    const depths = { beginner: 1, easy: 2, medium: 3, hard: 4, expert: 5, master: 6 };
    return depths[difficulty] || 3;
  }

  getRandomMistakeProbability(difficulty) {
    const probs = { beginner: 0.6, easy: 0.35, medium: 0.15, hard: 0.05, expert: 0.01, master: 0 };
    return probs[difficulty] || 0;
  }

  getBestMove(board, difficulty = 'medium') {
    this.nodes = 0;
    this.startTime = Date.now();
    this.transpositionTable.clear();

    const color = board.turn;
    const depth = this.getDepthForDifficulty(difficulty);
    const mistakeProb = this.getRandomMistakeProbability(difficulty);

    const legalMoves = board.getLegalMoves(color);
    if (!legalMoves.length) return null;

    // Random mistake
    if (Math.random() < mistakeProb) {
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }

    // Opening book
    if (board.fullMoveNumber <= 5) {
      const bookMove = this._getOpeningMove(board, legalMoves);
      if (bookMove) return bookMove;
    }

    let bestMove = null;
    let bestScore = color === 'w' ? -Infinity : Infinity;

    // Move ordering
    const ordered = this._orderMoves(legalMoves, board);

    for (const move of ordered) {
      const newBoard = board.clone();
      newBoard.makeMove(move);
      const score = this._minimax(newBoard, depth - 1, -Infinity, Infinity, color === 'w' ? false : true);

      if (color === 'w' ? score > bestScore : score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove || legalMoves[0];
  }

  _minimax(board, depth, alpha, beta, isMaximizing) {
    this.nodes++;
    if (Date.now() - this.startTime > this.maxTime) return board.evaluate();

    const key = board.getPositionKey() + depth;
    if (this.transpositionTable.has(key)) return this.transpositionTable.get(key);

    const state = board.getGameState();
    if (state.status === 'checkmate') return isMaximizing ? -20000 - depth : 20000 + depth;
    if (state.status === 'stalemate' || state.status === 'draw') return 0;
    if (depth === 0) return this._quiescence(board, alpha, beta, isMaximizing);

    const moves = this._orderMoves(board.getLegalMoves(board.turn), board);
    let bestScore = isMaximizing ? -Infinity : Infinity;

    for (const move of moves) {
      const nb = board.clone();
      nb.makeMove(move);
      const score = this._minimax(nb, depth - 1, alpha, beta, !isMaximizing);

      if (isMaximizing) {
        bestScore = Math.max(bestScore, score);
        alpha = Math.max(alpha, score);
      } else {
        bestScore = Math.min(bestScore, score);
        beta = Math.min(beta, score);
      }
      if (beta <= alpha) break;
    }

    this.transpositionTable.set(key, bestScore);
    return bestScore;
  }

  _quiescence(board, alpha, beta, isMaximizing) {
    const standPat = board.evaluate();
    if (isMaximizing) {
      if (standPat >= beta) return beta;
      alpha = Math.max(alpha, standPat);
    } else {
      if (standPat <= alpha) return alpha;
      beta = Math.min(beta, standPat);
    }

    const captures = board.getLegalMoves(board.turn).filter(m => m.captured || m.flags.enPassant);
    for (const move of captures) {
      const nb = board.clone();
      nb.makeMove(move);
      const score = this._quiescence(nb, alpha, beta, !isMaximizing);
      if (isMaximizing) {
        alpha = Math.max(alpha, score);
        if (alpha >= beta) return beta;
      } else {
        beta = Math.min(beta, score);
        if (beta <= alpha) return alpha;
      }
    }
    return isMaximizing ? alpha : beta;
  }

  _orderMoves(moves, board) {
    return moves.sort((a, b) => this._moveScore(b, board) - this._moveScore(a, board));
  }

  _moveScore(move, board) {
    let score = 0;
    if (move.captured) score += 10 * PIECE_VALUES[move.captured.type] - PIECE_VALUES[move.piece.type];
    if (move.flags.promotion) score += PIECE_VALUES[move.flags.promotion];
    if (move.flags.castling) score += 60;
    // Center control bonus
    const r = board.row(move.to), c = board.col(move.to);
    if (r >= 2 && r <= 5 && c >= 2 && c <= 5) score += 10;
    return score;
  }

  _getOpeningMove(board, legalMoves) {
    // Common opening moves
    const openings = {
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq': [
        { from: 52, to: 36 }, // e4
        { from: 51, to: 35 }, // d4
        { from: 50, to: 34 }, // c4
      ],
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq': [
        { from: 12, to: 28 }, // e5
        { from: 11, to: 27 }, // c5
        { from: 12, to: 20 }, // e6
      ]
    };

    const key = board.toFEN().split(' ').slice(0, 3).join(' ');
    const book = openings[key];
    if (book) {
      for (const bm of book) {
        const match = legalMoves.find(m => m.from === bm.from && m.to === bm.to);
        if (match) return match;
      }
    }
    return null;
  }

  evaluatePosition(board) {
    const score = board.evaluate();
    return score / 100; // in pawns
  }
}

// ─── EXPORTS ──────────────────────────────────────────────────
window.ChessEngine = { ChessBoard, ChessAI, Move, PIECES, COLORS };