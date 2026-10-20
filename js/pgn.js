/*
 * PGNClocker JS - versione solo client (JavaScript) di PGNClocker
 *
 * Basato su PGNClocker, Copyright © 2025 Alessio Martorana
 * <https://gitlab.com/deperito/pgnclocker>
 *
 * Software libero distribuito secondo i termini della GNU General Public
 * License, versione 3 o (a tua scelta) successiva. SENZA ALCUNA GARANZIA.
 * Vedi il file COPYING o <http://www.gnu.org/licenses/>.
 */

/*
 * Una partita PGN con lettura e scrittura dei tempi [%clk] sulle mosse della
 * linea principale.
 *
 * L'originale Python usa python-chess; qui non serve un motore di scacchi
 * perché le mosse vengono lette e riscritte così come sono nel PGN (SAN):
 * varianti, commenti e NAG vengono conservati. Come nell'originale:
 *  - si gestisce una sola partita (la prima del file);
 *  - i tempi si possono modificare solo sulle mosse della linea principale.
 *
 * Il testo delle mosse viene scomposto in "token" (mossa, commento, NAG,
 * apertura/chiusura variante) che poi vengono riscritti con la numerazione
 * delle mosse rigenerata.
 *
 * Errori: le eccezioni hanno come messaggio una chiave di traduzione (es. 'err.no_moves').
 */
(function (g) {
    'use strict';

    var ns = g.PgnClocker = g.PgnClocker || {};
    var ClockHelper = ns.ClockHelper;

    var HEADER_RE = /^\s*\[\s*([A-Za-z0-9_]+)\s+"((?:[^"\\]|\\.)*)"\s*\]\s*$/;
    var CLK_ANY_RE = /\[%clk\s[^\]]*\]/;
    var CLK_ANY_RE_ALL = /\[%clk\s[^\]]*\]/g;
    var CLK_VALUE_RE = /\[%clk\s+(\d+):(\d+):(\d+(?:\.\d*)?)\]/;
    var LINE_WIDTH = 80;
    var RESULTS = ['1-0', '0-1', '1/2-1/2', '*'];

    function PgnGame() {
        /** righe di intestazione originali, es. [Event "..."] */
        this.headerLines = [];
        this.tags = Object.create(null);

        /*
         * Token del testo delle mosse. Forme possibili:
         *  {t: 'move', san: string}
         *  {t: 'comment', text: string}
         *  {t: 'nag', n: string}
         *  {t: 'open'} / {t: 'close'}  (varianti)
         */
        this.tokens = [];

        /** indice nel vettore dei token di ogni mossa della linea principale */
        this.mainline = [];

        this.result = '*';
        this.startBlack = 0;       // 1 se la posizione iniziale (FEN) vede muovere il nero
        this.startFullMove = 1;
        this._hasVariations = false;
        this._hasMultipleGames = false;
    }

    /** Lancia Error('err.no_moves') se nel testo non c'è nessuna mossa. */
    PgnGame.fromString = function (text) {
        var game = new PgnGame();
        game._parse(text);

        return game;
    };

    // ------------------------------------------------------------------
    // Informazioni sulla partita
    // ------------------------------------------------------------------

    PgnGame.prototype.getTag = function (name) {
        return name in this.tags ? this.tags[name] : null;
    };

    PgnGame.prototype.hasVariations = function () {
        return this._hasVariations;
    };

    PgnGame.prototype.hasMultipleGames = function () {
        return this._hasMultipleGames;
    };

    PgnGame.prototype.getNumberOfMoves = function () {
        return this.mainline.length;
    };

    /**
     * Mosse (semi-mosse) della linea principale:
     * [{index, san, isBlack, moveNumber, clock}, ...]
     */
    PgnGame.prototype.getMainlineMoves = function () {
        var moves = [];
        for (var i = 0; i < this.mainline.length; i++) {
            moves.push({
                index: i,
                san: this.tokens[this.mainline[i]].san,
                isBlack: this._isBlackPly(i),
                moveNumber: this._fullMoveNumber(i),
                clock: this.getClock(i)
            });
        }

        return moves;
    };

    /** Tempo (in secondi interi) letto da [%clk ...] per la mossa i, null se assente. */
    PgnGame.prototype.getClock = function (i) {
        var indexes = this._commentIndexes(i);
        for (var k = 0; k < indexes.length; k++) {
            var m = CLK_VALUE_RE.exec(this.tokens[indexes[k]].text);
            if (m !== null) {
                return parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + Math.floor(parseFloat(m[3]));
            }
        }

        return null;
    };

    // ------------------------------------------------------------------
    // Modifica dei tempi
    // ------------------------------------------------------------------

    /**
     * Imposta i tempi delle mosse della linea principale.
     * `clocks`: indice della mossa => secondi (null = nessun tempo).
     */
    PgnGame.prototype.applyClocks = function (clocks) {
        // Dall'ultima alla prima: inserire/rimuovere token dopo una mossa
        // non sposta gli indici delle mosse precedenti.
        for (var i = this.mainline.length - 1; i >= 0; i--) {
            if (typeof clocks[i] === 'undefined') {
                continue;
            }
            var value = clocks[i];
            if (value === this.getClock(i)) {
                continue; // invariato: non si tocca il PGN originale
            }
            this._applyClock(i, value);
        }
        this._reindex();
    };

    PgnGame.prototype._applyClock = function (i, seconds) {
        var indexes = this._commentIndexes(i);
        var k;

        // commento che contiene già un [%clk ...]
        var target = null;
        for (k = 0; k < indexes.length; k++) {
            if (CLK_ANY_RE.test(this.tokens[indexes[k]].text)) {
                target = indexes[k];
                break;
            }
        }

        if (seconds === null) {
            if (target === null) {
                return;
            }
            var text = this.tokens[target].text.replace(CLK_ANY_RE_ALL, '');
            text = text.replace(/[ \t]+/g, ' ').trim();
            if (text === '') {
                this.tokens.splice(target, 1);
            } else {
                this.tokens[target].text = text;
            }

            return;
        }

        var clk = ClockHelper.toPgnCommand(seconds);

        if (target !== null) {
            this.tokens[target].text = this.tokens[target].text.replace(CLK_ANY_RE, function () {
                return clk;
            });

            return;
        }

        if (indexes.length > 0) {
            var first = indexes[0];
            this.tokens[first].text = this.tokens[first].text + ' ' + clk;

            return;
        }

        // nessun commento: ne creo uno subito dopo la mossa (e i suoi NAG)
        var position = this.mainline[i] + 1;
        while (position < this.tokens.length && this.tokens[position].t === 'nag') {
            position++;
        }
        this.tokens.splice(position, 0, {t: 'comment', text: clk});
    };

    /**
     * Indici dei token-commento che appartengono alla mossa i della linea
     * principale (esclusi quelli dentro le varianti).
     */
    PgnGame.prototype._commentIndexes = function (i) {
        var start = this.mainline[i];
        var end = i + 1 < this.mainline.length ? this.mainline[i + 1] : this.tokens.length;
        var depth = 0;
        var found = [];

        for (var t = start + 1; t < end; t++) {
            var type = this.tokens[t].t;
            if (type === 'open') {
                depth++;
            } else if (type === 'close') {
                depth--;
            } else if (depth === 0 && type === 'comment') {
                found.push(t);
            }
        }

        return found;
    };

    PgnGame.prototype._reindex = function () {
        this.mainline = [];
        var depth = 0;
        for (var k = 0; k < this.tokens.length; k++) {
            var type = this.tokens[k].t;
            if (type === 'open') {
                depth++;
            } else if (type === 'close') {
                depth--;
            } else if (type === 'move' && depth === 0) {
                this.mainline.push(k);
            }
        }
    };

    // ------------------------------------------------------------------
    // Esportazione
    // ------------------------------------------------------------------

    PgnGame.prototype.export = function () {
        var lines = [];

        if (this.headerLines.length > 0) {
            for (var k = 0; k < this.headerLines.length; k++) {
                lines.push(this.headerLines[k]);
            }
        } else {
            lines.push('[Event "?"]');
            lines.push('[Site "?"]');
            lines.push('[Date "????.??.??"]');
            lines.push('[Round "?"]');
            lines.push('[White "?"]');
            lines.push('[Black "?"]');
            lines.push('[Result "' + this.result + '"]');
        }

        lines.push('');
        lines.push(this._buildMovetext());

        return lines.join('\n') + '\n';
    };

    PgnGame.prototype._buildMovetext = function () {
        var words = [];
        var prefix = '';
        var stack = [];
        var ply = 0;
        var needNumber = true;

        for (var k = 0; k < this.tokens.length; k++) {
            var token = this.tokens[k];
            switch (token.t) {
                case 'move': {
                    var isBlack = this._isBlackPly(ply);
                    var number = this._fullMoveNumber(ply);
                    var word;
                    if (!isBlack) {
                        word = number + '. ' + token.san;
                    } else if (needNumber) {
                        word = number + '... ' + token.san;
                    } else {
                        word = token.san;
                    }
                    words.push(prefix + word);
                    prefix = '';
                    needNumber = false;
                    ply++;
                    break;
                }

                case 'nag':
                    words.push(prefix + '$' + token.n);
                    prefix = '';
                    break;

                case 'comment':
                    words.push(prefix + '{' + token.text + '}');
                    prefix = '';
                    needNumber = true;
                    break;

                case 'open':
                    // la variante è un'alternativa all'ultima mossa giocata
                    stack.push(ply);
                    ply = Math.max(0, ply - 1);
                    prefix += '(';
                    needNumber = true;
                    break;

                case 'close':
                    if (stack.length > 0) {
                        ply = stack.pop();
                    }
                    if (prefix !== '') {
                        prefix = prefix.slice(0, -1);
                    } else if (words.length > 0) {
                        words[words.length - 1] += ')';
                    }
                    needNumber = true;
                    break;
            }
        }

        words.push(this.result);

        var out = [];
        var line = '';
        for (var w = 0; w < words.length; w++) {
            var next = words[w];
            if (line === '') {
                line = next;
            } else if (line.length + 1 + next.length <= LINE_WIDTH) {
                line += ' ' + next;
            } else {
                out.push(line);
                line = next;
            }
        }
        if (line !== '') {
            out.push(line);
        }

        return out.join('\n');
    };

    PgnGame.prototype._isBlackPly = function (ply) {
        return ((ply + this.startBlack) % 2) === 1;
    };

    PgnGame.prototype._fullMoveNumber = function (ply) {
        return this.startFullMove + Math.floor((ply + this.startBlack) / 2);
    };

    // ------------------------------------------------------------------
    // Lettura
    // ------------------------------------------------------------------

    PgnGame.prototype._parse = function (text) {
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1); // BOM
        }
        text = text.replace(/\r\n?/g, '\n');

        var movetextLines = [];
        var inHeaders = true;
        var firstGameEnded = false;
        var lines = text.split('\n');

        for (var n = 0; n < lines.length; n++) {
            var line = lines[n];
            var m = HEADER_RE.exec(line);
            if (m !== null) {
                if (firstGameEnded) {
                    continue;
                }
                if (inHeaders) {
                    this.headerLines.push(line.trim());
                    this.tags[m[1]] = m[2];
                    continue;
                }
                // intestazione dopo le mosse: inizia un'altra partita
                firstGameEnded = true;
                this._hasMultipleGames = true;
                continue;
            }

            if (firstGameEnded) {
                continue;
            }
            if (line.trim() === '') {
                if (!inHeaders) {
                    movetextLines.push('');
                }
                continue;
            }

            inHeaders = false;
            movetextLines.push(line);
        }

        this._readStartingPosition();
        var resultFound = this._tokenize(movetextLines.join('\n'));

        if (this.mainline.length === 0) {
            throw new Error('err.no_moves');
        }

        if (!resultFound) {
            var tagResult = 'Result' in this.tags ? this.tags.Result : '*';
            this.result = RESULTS.indexOf(tagResult) !== -1 ? tagResult : '*';
        }
    };

    PgnGame.prototype._readStartingPosition = function () {
        if (!('FEN' in this.tags)) {
            return;
        }

        var fields = this.tags.FEN.trim().split(/\s+/);
        if (fields[1] === 'b') {
            this.startBlack = 1;
        }
        if (typeof fields[5] !== 'undefined' && /^\d+$/.test(fields[5]) && parseInt(fields[5], 10) > 0) {
            this.startFullMove = parseInt(fields[5], 10);
        }
    };

    function isWhitespace(c) {
        return c === ' ' || c === '\t' || c === '\n' || c === '\r';
    }

    PgnGame.prototype._addComment = function (text) {
        text = text.replace(/[ \t\r\n]+/g, ' ').trim();
        text = text.split('}').join(')');
        if (text !== '') {
            this.tokens.push({t: 'comment', text: text});
        }
    };

    /**
     * Scompone il testo delle mosse in token.
     * Restituisce true se è stato trovato il risultato (1-0, 0-1, 1/2-1/2, *).
     */
    PgnGame.prototype._tokenize = function (s) {
        var len = s.length;
        var i = 0;
        var depth = 0;
        var resultFound = false;
        var nl, end, text, j;

        while (i < len) {
            var c = s.charAt(i);

            if (isWhitespace(c)) {
                i++;
                continue;
            }

            // riga di "escape" PGN (inizia con %): ignorata
            if (c === '%' && (i === 0 || s.charAt(i - 1) === '\n')) {
                nl = s.indexOf('\n', i);
                i = nl === -1 ? len : nl + 1;
                continue;
            }

            // commento tra graffe
            if (c === '{') {
                end = s.indexOf('}', i + 1);
                if (end === -1) {
                    text = s.slice(i + 1);
                    i = len;
                } else {
                    text = s.slice(i + 1, end);
                    i = end + 1;
                }
                this._addComment(text);
                continue;
            }

            // commento fino a fine riga
            if (c === ';') {
                nl = s.indexOf('\n', i);
                if (nl === -1) {
                    text = s.slice(i + 1);
                    i = len;
                } else {
                    text = s.slice(i + 1, nl);
                    i = nl + 1;
                }
                this._addComment(text);
                continue;
            }

            if (c === '(') {
                depth++;
                this._hasVariations = true;
                this.tokens.push({t: 'open'});
                i++;
                continue;
            }

            if (c === ')') {
                if (depth > 0) {
                    depth--;
                    this.tokens.push({t: 'close'});
                }
                i++;
                continue;
            }

            // NAG: $1, $2, ...
            if (c === '$') {
                j = i + 1;
                while (j < len && s.charAt(j) >= '0' && s.charAt(j) <= '9') {
                    j++;
                }
                var n = s.slice(i + 1, j);
                if (n !== '') {
                    this.tokens.push({t: 'nag', n: n});
                }
                i = j;
                continue;
            }

            // parola generica: numero di mossa, mossa o risultato
            j = i;
            while (j < len && !isWhitespace(s.charAt(j)) && '{}();'.indexOf(s.charAt(j)) === -1) {
                j++;
            }
            var word = s.slice(i, j);
            i = j;

            if (RESULTS.indexOf(word) !== -1) {
                if (depth === 0) {
                    this.result = word;
                    resultFound = true;
                    break; // fine della partita
                }
                continue;
            }

            var numbered = /^\d+\.+([\s\S]*)$/.exec(word);
            if (numbered !== null) {
                word = numbered[1];
            } else if (/^\d+$/.test(word)) {
                continue;
            }
            word = word.replace(/^\.+/, '');
            if (word === '') {
                continue;
            }

            if (depth === 0) {
                this.mainline.push(this.tokens.length);
            }
            this.tokens.push({t: 'move', san: word});
        }

        // varianti non chiuse
        while (depth > 0) {
            this.tokens.push({t: 'close'});
            depth--;
        }

        return resultFound;
    };

    ns.PgnGame = PgnGame;
}(typeof globalThis !== 'undefined' ? globalThis : window));
