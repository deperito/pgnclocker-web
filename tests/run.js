/*
 * Test minimali (senza dipendenze). Esecuzione da riga di comando:
 *
 *     node tests/run.js
 */
'use strict';

var path = require('path');
var root = path.join(__dirname, '..');

['clock', 'pgn', 'i18n', 'lang/en', 'lang/it', 'lang/es', 'lang/fr', 'lang/de'].forEach(function (f) {
    require(path.join(root, 'js', f + '.js'));
});

var ns = globalThis.PgnClocker;
var ClockHelper = ns.ClockHelper;
var InvalidClockError = ns.InvalidClockError;
var PgnGame = ns.PgnGame;
var I = ns.i18n;

var failures = 0;
var total = 0;

function same(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

function check(name, expected, actual) {
    total++;
    if (same(expected, actual)) {
        console.log('ok   - ' + name);
        return;
    }
    failures++;
    console.log('FAIL - ' + name + '\n  atteso:   ' + JSON.stringify(expected) + '\n  ottenuto: ' + JSON.stringify(actual));
}

/** Verifica che venga lanciata un'eccezione; la restituisce. */
function throws(name, fn) {
    total++;
    try {
        fn();
    } catch (e) {
        console.log('ok   - ' + name);
        return e;
    }
    failures++;
    console.log('FAIL - ' + name + ' (nessuna eccezione)');
    return null;
}

function errorsOf(e) {
    return e instanceof InvalidClockError ? e.errors : null;
}

// --- ClockHelper: tre campi ore / minuti / secondi ------------------------
check('tre campi pieni', 330, ClockHelper.fromParts('0', '5', '30'));
check('campi vuoti valgono 0 (solo minuti)', 300, ClockHelper.fromParts('', '5', ''));
check('campi vuoti valgono 0 (ore e secondi)', 3630, ClockHelper.fromParts('1', '', '30'));
check('tutti vuoti = nessun tempo', null, ClockHelper.fromParts('', ' ', ''));
check('zero esplicito = tempo 0', 0, ClockHelper.fromParts('0', '', ''));
check('zeri iniziali', 65, ClockHelper.fromParts('00', '01', '05'));

var e = throws('minuti > 59 non validi', function () { ClockHelper.fromParts('0', '75', ''); });
check('errore sul campo minuti', {minutes: 'err.minutes_invalid'}, errorsOf(e));
e = throws('ore non numeriche non valide', function () { ClockHelper.fromParts('x', '', '10'); });
check('errore sul campo ore', {hours: 'err.hours_invalid'}, errorsOf(e));
e = throws('più campi errati', function () { ClockHelper.fromParts('', '60', '99'); });
check('errori su minuti e secondi', {minutes: 'err.minutes_invalid', seconds: 'err.seconds_invalid'}, errorsOf(e));
throws('numero negativo non valido', function () { ClockHelper.fromParts('-1', '', ''); });
throws('numero decimale non valido', function () { ClockHelper.fromParts('', '1.5', ''); });
throws('cifre non ASCII non valide', function () { ClockHelper.fromParts('١', '', ''); });

check('toParts', [1, 2, 3], ClockHelper.toParts(3723));
check('toParts null', [null, null, null], ClockHelper.toParts(null));
check('format', '1:02:03', ClockHelper.format(3723));
check('format 0', '0:00:00', ClockHelper.format(0));
check('format null', '', ClockHelper.format(null));
check('toPgnCommand', '[%clk 0:05:30]', ClockHelper.toPgnCommand(330));

// --- Notazione delle mosse (simboli dei pezzi, uguale in tutte le lingue) ---
check('Bg7 -> ♗g7', '♗g7', I.localizeSan('Bg7'));
check('Nf3 -> ♘f3', '♘f3', I.localizeSan('Nf3'));
check('Qxd5+ -> ♕xd5+', '♕xd5+', I.localizeSan('Qxd5+'));
check('Rae1 -> ♖ae1', '♖ae1', I.localizeSan('Rae1'));
check('Kf1 -> ♔f1', '♔f1', I.localizeSan('Kf1'));
check('promozione e8=Q# -> e8=♕#', 'e8=♕#', I.localizeSan('e8=Q#'));
check('promozione bxa8=N -> bxa8=♘', 'bxa8=♘', I.localizeSan('bxa8=N'));
check('mossa di pedone invariata', 'exd5', I.localizeSan('exd5'));
check('pedone sulla colonna b invariato', 'bxc3', I.localizeSan('bxc3'));
check('arrocco invariato', 'O-O-O', I.localizeSan('O-O-O'));

// --- Traduzioni: stesse chiavi e segnaposto in tutte le lingue --------------
function placeholders(text) {
    return (text.match(/\{\w+\}/g) || []).sort();
}
var english = ns.lang.en;
var englishKeys = Object.keys(english).sort();
Object.keys(I.LANGUAGES).forEach(function (code) {
    var catalog = ns.lang[code];
    check('catalogo presente: ' + code, true, !!catalog);
    check('chiavi di traduzione uguali in en e ' + code, englishKeys, Object.keys(catalog).sort());
    var okPlaceholders = true;
    englishKeys.forEach(function (key) {
        if (!same(placeholders(english[key]), placeholders(catalog[key]))) {
            okPlaceholders = false;
            console.log('  segnaposto diversi per la chiave ' + key + ' (' + code + ')');
        }
    });
    check('stessi segnaposto in en e ' + code, true, okPlaceholders);
    check('nessuna stringa vuota in ' + code, [], Object.keys(catalog).filter(function (k) {
        return String(catalog[k]).trim() === '';
    }));
});

I.setLang('it');
check('t(): lingua scelta', 'Ore', I.t('edit.hours'));
check('t(): segnaposto', 'Semimossa 3 di 10', I.t('edit.position', {current: 3, total: 10}));
check('t(): chiave sconosciuta = la chiave', 'chiave.inesistente', I.t('chiave.inesistente'));
I.setLang('xx');
check('setLang ignora le lingue non valide', 'it', I.getLang());
I.setLang('en');

// --- PgnGame: lettura --------------------------------------------------
var pgn = '[Event "T"]\n[White "A"]\n[Black "B"]\n[Result "*"]\n\n1. e4 {[%clk 0:05:00] bene} e5 2. Nf3 *\n';
var game = PgnGame.fromString(pgn);
check('numero mosse', 3, game.getNumberOfMoves());
check('tag White', 'A', game.getTag('White'));
check('tag assente', null, game.getTag('Nope'));
check('clock letto', 300, game.getClock(0));
check('clock assente', null, game.getClock(1));
check('mosse linea principale', [
    {index: 0, san: 'e4', isBlack: false, moveNumber: 1, clock: 300},
    {index: 1, san: 'e5', isBlack: true, moveNumber: 1, clock: null},
    {index: 2, san: 'Nf3', isBlack: false, moveNumber: 2, clock: null}
], game.getMainlineMoves());

game = PgnGame.fromString('1. e4 {[%clk 1:02:03.9]} e5 *');
check('clock con decimali (troncato)', 3723, game.getClock(0));

// --- PgnGame: scrittura ------------------------------------------------
game = PgnGame.fromString('[Event "T"]\n[Result "*"]\n\n1. e4 e5 2. Nf3 *\n');
game.applyClocks([60, 59, 3599]);
check(
    'inserimento tempi',
    '[Event "T"]\n[Result "*"]\n\n1. e4 {[%clk 0:01:00]} 1... e5 {[%clk 0:00:59]} 2. Nf3 {[%clk 0:59:59]} *\n',
    game.export()
);

game = PgnGame.fromString('1. e4 {[%clk 0:05:00] bene} e5 *');
game.applyClocks([299]);
check('sostituzione tempo esistente', 299, game.getClock(0));
check('commento testuale conservato', true, game.export().indexOf('{[%clk 0:04:59] bene}') !== -1);

game = PgnGame.fromString('1. e4 {[%clk 0:05:00]} e5 *');
game.applyClocks([null]);
check('rimozione tempo', null, game.getClock(0));
check('commento vuoto eliminato', -1, game.export().indexOf('{}'));

game = PgnGame.fromString('1. e4 {bene} e5 *');
game.applyClocks([10]);
check('tempo aggiunto a un commento testuale', true, game.export().indexOf('{bene [%clk 0:00:10]}') !== -1);

game = PgnGame.fromString('1. e4 $1 e5 *');
game.applyClocks([10]);
check('commento dopo i NAG', true, game.export().indexOf('1. e4 $1 {[%clk 0:00:10]} 1... e5') !== -1);

game = PgnGame.fromString('1. e4 e5 *');
game.applyClocks([]);
check('nessuna modifica: PGN uguale', '[Event "?"]\n[Site "?"]\n[Date "????.??.??"]\n[Round "?"]\n[White "?"]\n[Black "?"]\n[Result "*"]\n\n1. e4 e5 *\n', game.export());

game = PgnGame.fromString('1. e4 (1. d4 {x}) e5 *');
check('varianti rilevate', true, game.hasVariations());
check('mosse linea principale con varianti', 2, game.getNumberOfMoves());
game.applyClocks([10]);
check(
    'varianti conservate',
    '[Event "?"]\n[Site "?"]\n[Date "????.??.??"]\n[Round "?"]\n[White "?"]\n[Black "?"]\n[Result "*"]\n\n' +
    '1. e4 {[%clk 0:00:10]} (1. d4 {x}) 1... e5 *\n',
    game.export()
);

game = PgnGame.fromString('1. e4 e5 (1... c5 {[%clk 0:03:00]}) 2. Nf3 *');
check('clk dentro una variante non è della linea principale', null, game.getClock(1));
game.applyClocks([null, 20, null]);
check('il tempo va alla mossa giusta, non alla variante', true, game.export().indexOf('1. e4 e5 {[%clk 0:00:20]} (1... c5 {[%clk 0:03:00]}) 2. Nf3') !== -1);

// --- PgnGame: casi particolari ----------------------------------------
game = PgnGame.fromString('[Event "T"]\r\n\r\n1. e4 ; commento\r\ne5 2. Nf3 1/2-1/2\r\n');
check('CRLF e commento a fine riga', 3, game.getNumberOfMoves());
check('risultato dal testo', true, game.export().trim().endsWith('1/2-1/2'));
check('commento ; riscritto con graffe', true, game.export().indexOf('{commento}') !== -1);

game = PgnGame.fromString('﻿[Event "T"]\n\n1. e4 e5 *');
check('BOM ignorato', 2, game.getNumberOfMoves());

game = PgnGame.fromString('[Event "A"]\n\n1. e4 e5 *\n\n[Event "B"]\n\n1. d4 d5 *\n');
check('più partite: ne usa una sola', 2, game.getNumberOfMoves());
check('più partite: segnalato', true, game.hasMultipleGames());
check('più partite: tag della prima', 'A', game.getTag('Event'));

game = PgnGame.fromString('[FEN "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 5"]\n[SetUp "1"]\n\n5... Nf6 6. Nc3 *');
check('FEN con il nero al tratto: numerazione', [
    {n: 5, b: true}, {n: 6, b: false}
], game.getMainlineMoves().map(function (m) { return {n: m.moveNumber, b: m.isBlack}; }));
game.applyClocks([10, 20]);
check('FEN: numerazione riscritta', true, game.export().indexOf('5... Nf6 {[%clk 0:00:10]} 6. Nc3 {[%clk 0:00:20]}') !== -1);

game = PgnGame.fromString('1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 *');
game.applyClocks(new Array(20).fill(3599));
var lines = game.export().split('\n');
check('righe a capo entro 80 colonne', true, lines.every(function (l) { return l.length <= 80; }));
check('esportazione leggibile di nuovo (stesse mosse)', 20, PgnGame.fromString(game.export()).getNumberOfMoves());
check('esportazione leggibile di nuovo (stessi tempi)', true,
    PgnGame.fromString(game.export()).getMainlineMoves().every(function (m) { return m.clock === 3599; }));

// idempotenza: riapplicare gli stessi tempi non cambia il testo
var once = PgnGame.fromString('[Event "T"]\n\n1. e4 e5 2. Nf3 *');
once.applyClocks([100, 90, 80]);
var text1 = once.export();
var twice = PgnGame.fromString(text1);
twice.applyClocks([100, 90, 80]);
check('applicare due volte gli stessi tempi non cambia nulla', text1, twice.export());

// --- Errori ------------------------------------------------------------
e = throws('nessuna mossa', function () { PgnGame.fromString('[Event "T"]\n\n*'); });
check('messaggio = chiave di traduzione', 'err.no_moves', e && e.message);
throws('testo vuoto', function () { PgnGame.fromString(''); });

console.log('\n' + total + ' test, ' + failures + ' falliti');
process.exit(failures > 0 ? 1 : 0);
