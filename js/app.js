/*
 * PGNClocker JS - versione solo client (JavaScript) di PGNClocker
 *
 * Basato su PGNClocker, Copyright © 2025 Alessio Martorana
 * <https://gitlab.com/deperito/pgnclocker>
 *
 * Questo programma è software libero: puoi redistribuirlo e/o modificarlo
 * secondo i termini della GNU General Public License pubblicata dalla
 * Free Software Foundation, versione 3 della licenza o (a tua scelta)
 * qualsiasi versione successiva.
 *
 * Questo programma è distribuito nella speranza che sia utile, ma SENZA
 * ALCUNA GARANZIA. Vedi la GNU General Public License per maggiori
 * dettagli: <http://www.gnu.org/licenses/>.
 */

/*
 * Interfaccia: una piccola applicazione a pagina singola.
 *
 * Schermate (selezionate dall'hash dell'URL, così funziona il pulsante "indietro"):
 *   #home     caricamento del PGN
 *   #edit     mossa corrente + campi ore / minuti / secondi
 *   #preview  tabella mosse / tempi
 *   #result   PGN generato (copia / scarica)
 *
 * Stato (salvato nel localStorage del browser, così un refresh non fa perdere il lavoro):
 *   pgn      testo PGN originale (non viene mai modificato)
 *   clocks   tempo di ogni mossa della linea principale (secondi oppure null)
 *   current  indice della mossa mostrata nella finestra principale
 */
(function (g) {
    'use strict';

    var ns = g.PgnClocker;
    var ClockHelper = ns.ClockHelper;
    var InvalidClockError = ns.InvalidClockError;
    var PgnGame = ns.PgnGame;
    var I = ns.i18n;
    var t = I.t;

    var STORAGE_KEY = 'pgnclocker.state.v1';
    var MAX_PGN_BYTES = 1048576; // 1 MB
    var VIEWS = ['home', 'edit', 'preview', 'result'];

    /** Partita in lavorazione: {pgn, game, clocks, current} oppure null. */
    var state = null;

    /** Stato transitorio dell'interfaccia (non salvato). */
    var ui = {
        errorKey: null,   // chiave di traduzione dell'errore mostrato nella pagina di caricamento
        pgnText: '',      // testo incollato (si conserva in caso di errore o cambio lingua)
        posted: null,     // {hours, minutes, seconds} inseriti ma non ancora salvati
        postedFor: -1,    // mossa a cui si riferiscono i valori in `posted`
        errors: {},       // campo => chiave di traduzione
        lastField: null,  // ultimo campo dei tempi modificato ('hours' | 'minutes' | 'seconds'): riceve il focus a ogni mossa
        filename: null    // nome del file scelto dall'utente per il download
    };

    var root = null;

    // ------------------------------------------------------------------
    // Utilità
    // ------------------------------------------------------------------

    /** Escape HTML. */
    function esc(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function $(selector) {
        return root.querySelector(selector);
    }

    /** Nome file sicuro per il download. */
    function safeFilename(name, fallback) {
        name = String(name).trim().replace(/\.pgn$/i, '');
        name = name.replace(/[^A-Za-z0-9._-]+/g, '_');
        name = name.replace(/^[._-]+|[._-]+$/g, '');

        return (name === '' ? fallback : name.slice(0, 80)) + '.pgn';
    }

    /**
     * Etichetta di una mossa, come nell'originale: "12. ♘f3" per il Bianco, "12... ♞f6" per il Nero.
     * La mossa è mostrata con i simboli dei pezzi.
     */
    function moveLabel(move) {
        return move.moveNumber + (move.isBlack ? '...' : '.') + ' ' + I.localizeSan(move.san);
    }

    function currentView() {
        var name = g.location.hash.replace(/^#/, '');
        if (VIEWS.indexOf(name) === -1) {
            name = 'home';
        }
        // senza una partita si può stare solo nella pagina di caricamento
        return (name !== 'home' && state === null) ? 'home' : name;
    }

    /** Va a una schermata: se l'hash non cambia, ridisegna direttamente. */
    function go(view) {
        if (g.location.hash.replace(/^#/, '') === view) {
            render();
        } else {
            g.location.hash = view;
        }
    }

    // ------------------------------------------------------------------
    // Stato e salvataggio
    // ------------------------------------------------------------------

    function clocksFromGame(game) {
        return game.getMainlineMoves().map(function (move) {
            return move.clock;
        });
    }

    function saveState() {
        if (state === null) {
            return;
        }
        try {
            g.localStorage.setItem(STORAGE_KEY, JSON.stringify({
                pgn: state.pgn,
                clocks: state.clocks,
                current: state.current
            }));
        } catch (e) {
            // localStorage non disponibile o pieno: l'app funziona lo stesso, ma senza ripristino
        }
    }

    function clearState() {
        state = null;
        ui.errors = {};
        ui.posted = null;
        ui.filename = null;
        try {
            g.localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            // niente da fare
        }
    }

    function loadState() {
        var data;
        try {
            data = JSON.parse(g.localStorage.getItem(STORAGE_KEY));
        } catch (e) {
            return null;
        }
        if (!data || typeof data.pgn !== 'string' || data.pgn === '') {
            return null;
        }

        var game;
        try {
            game = PgnGame.fromString(data.pgn);
        } catch (e) {
            return null;
        }

        var total = game.getNumberOfMoves();
        var clocks = data.clocks;
        var valid = Array.isArray(clocks) && clocks.length === total && clocks.every(function (c) {
            return c === null || (typeof c === 'number' && isFinite(c) && c >= 0);
        });
        if (!valid) {
            clocks = clocksFromGame(game);
        }

        var current = typeof data.current === 'number' ? Math.floor(data.current) : 0;
        current = Math.max(0, Math.min(total - 1, current));

        return {pgn: data.pgn, game: game, clocks: clocks, current: current};
    }

    // ------------------------------------------------------------------
    // Pagina: struttura comune
    // ------------------------------------------------------------------

    function layout(content) {
        var lang = I.getLang();
        var flags = Object.keys(I.LANGUAGES).map(function (code) {
            var active = code === lang;

            return '<button type="button" class="flag' + (active ? ' active' : '') + '"' +
                ' data-action="lang" data-lang="' + esc(code) + '" lang="' + esc(code) + '"' +
                ' title="' + esc(I.LANGUAGES[code]) + '" aria-label="' + esc(I.LANGUAGES[code]) + '"' +
                ' aria-pressed="' + (active ? 'true' : 'false') + '">' + I.flagSvg(code) + '</button>';
        }).join('');

        return '<header class="site-header"><div class="wrap header-row">' +
            '<div class="brand-block">' +
            '<a class="brand" href="#home">&#9822; PGN Clocker</a>' +
            '<span class="tagline">' + esc(t('app.tagline')) + '</span>' +
            '</div>' +
            '<nav class="lang-switch" aria-label="' + esc(t('lang.switch')) + '">' + flags + '</nav>' +
            '</div></header>' +
            '<main class="wrap">' + content + '</main>' +
            '<footer class="site-footer"><div class="wrap">' +
            esc(t('footer.based_on')) + ' ' +
            '<a href="https://gitlab.com/deperito/pgnclocker" rel="noopener">PGNClocker</a> ' +
            esc(t('footer.author')) + ' &middot; ' +
            esc(t('footer.license')) + ' ' +
            '<a href="https://www.gnu.org/licenses/gpl-3.0.html" rel="noopener">' + esc(t('footer.gpl')) + '</a>' +
            '</div></footer>';
    }

    // ------------------------------------------------------------------
    // Schermata: caricamento
    // ------------------------------------------------------------------

    function viewHome() {
        var html = '<section class="card">' +
            '<h1>' + esc(t('upload.title')) + '</h1>' +
            '<p>' + esc(t('upload.intro')) + '</p>' +
            '<p class="help">' + esc(t('upload.privacy')) + '</p>';

        if (ui.errorKey) {
            html += '<p class="alert alert-error" role="alert">' + esc(t(ui.errorKey)) + '</p>';
        }

        if (state !== null) {
            html += '<p class="alert alert-info">' + esc(t('upload.resume_text')) + ' ' +
                '<a href="#edit">' + esc(t('upload.resume_link')) + '</a></p>';
        }

        html += '<form id="load-form" novalidate>' +
            '<div class="field"><label for="pgn_file">' + esc(t('upload.file_label')) + '</label>' +
            '<input type="file" id="pgn_file" accept=".pgn,.txt,text/plain"></div>' +
            '<p class="or">' + esc(t('upload.or')) + '</p>' +
            '<div class="field"><label for="pgn_text">' + esc(t('upload.text_label')) + '</label>' +
            '<textarea id="pgn_text" rows="10" spellcheck="false" placeholder="[Event &quot;...&quot;]&#10;&#10;1. e4 e5 2. Nf3 Nc6 ...">' +
            esc(ui.pgnText) + '</textarea></div>' +
            '<button type="submit" class="btn btn-primary">' + esc(t('upload.submit')) + '</button>' +
            '</form>' +
            '<h2>' + esc(t('upload.limits')) + '</h2>' +
            '<ul class="notes">' +
            '<li>' + esc(t('upload.limit_game')) + '</li>' +
            '<li>' + esc(t('upload.limit_main')) + '</li>' +
            '<li>' + esc(t('upload.limit_size')) + '</li>' +
            '</ul></section>';

        return html;
    }

    /** Legge il PGN dal file scelto (se c'è) o dal testo incollato. Restituisce una Promise<string>. */
    function readSubmittedPgn() {
        var fileInput = $('#pgn_file');
        var file = fileInput && fileInput.files && fileInput.files[0];

        if (file) {
            if (file.size > MAX_PGN_BYTES) {
                return Promise.reject(new Error('err.upload_size'));
            }

            return file.arrayBuffer().then(function (buffer) {
                try {
                    return new TextDecoder('utf-8', {fatal: true}).decode(buffer);
                } catch (e) {
                    // non è UTF-8 valido: si assume ISO-8859-1 (comune nei vecchi PGN)
                    return new TextDecoder('iso-8859-1').decode(buffer);
                }
            }, function () {
                throw new Error('err.upload_failed');
            });
        }

        var text = $('#pgn_text').value;
        if (text.length > MAX_PGN_BYTES) {
            return Promise.reject(new Error('err.upload_size'));
        }
        if (text.trim() === '') {
            return Promise.reject(new Error('err.empty_input'));
        }

        return Promise.resolve(text);
    }

    function onLoadSubmit() {
        ui.pgnText = $('#pgn_text').value;

        readSubmittedPgn().then(function (text) {
            if (text.trim() === '') {
                throw new Error('err.empty_input');
            }

            return {text: text, game: PgnGame.fromString(text)};
        }).then(function (loaded) {
            state = {
                pgn: loaded.text,
                game: loaded.game,
                clocks: clocksFromGame(loaded.game),
                current: 0
            };
            ui.errorKey = null;
            ui.pgnText = '';
            ui.posted = null;
            ui.errors = {};
            ui.filename = null;
            saveState();
            go('edit');
        }).catch(function (error) {
            ui.errorKey = /^err\./.test(error.message) ? error.message : 'err.upload_failed';
            render();
        });
    }

    // ------------------------------------------------------------------
    // Schermata: mossa corrente
    // ------------------------------------------------------------------

    var TIME_FIELDS = [
        {name: 'hours', label: 'edit.hours', max: 5},
        {name: 'minutes', label: 'edit.minutes', max: 2},
        {name: 'seconds', label: 'edit.seconds', max: 2}
    ];

    function viewEdit() {
        var game = state.game;
        var moves = game.getMainlineMoves();
        var total = moves.length;
        var cur = state.current;

        var isFirst = cur === 0;
        var isLast = cur === total - 1;

        var draft = ui.posted !== null && ui.postedFor === cur;
        var values;
        if (draft) {
            values = ui.posted;
        } else {
            var parts = ClockHelper.toParts(state.clocks[cur]);
            values = {
                hours: parts[0] === null ? '' : String(parts[0]),
                minutes: parts[1] === null ? '' : String(parts[1]),
                seconds: parts[2] === null ? '' : String(parts[2])
            };
        }
        var errors = draft ? ui.errors : {};
        var hasErrors = Object.keys(errors).length > 0;

        var html = '<section class="card window" aria-labelledby="move-heading">' +
            '<p class="progress">' + esc(t('edit.position', {current: cur + 1, total: total})) + '</p>' +
            '<h1 id="move-heading" class="current-move">' +
            '<span class="move-caption">' + esc(t('edit.move')) + '</span> ' +
            '<span class="move-san">' + esc(moveLabel(moves[cur])) + '</span></h1>';

        if (hasErrors) {
            html += '<p class="alert alert-error" role="alert">' + esc(t('edit.fix_errors')) + '</p>';
        }

        html += '<div id="move-form">' +
            '<p class="help">' + esc(t('edit.help')) + '</p>' +
            '<div class="time-fields">';

        TIME_FIELDS.forEach(function (field) {
            var error = errors[field.name];
            html += '<div class="time-field">' +
                '<label for="f-' + field.name + '">' + esc(t(field.label)) + '</label>' +
                '<input type="text" id="f-' + field.name + '" data-field="' + field.name + '"' +
                ' class="time-input' + (error ? ' invalid' : '') + '"' +
                ' value="' + esc(values[field.name]) + '" placeholder="0" maxlength="' + field.max + '"' +
                ' inputmode="numeric" autocomplete="off" spellcheck="false"' +
                (error ? ' aria-invalid="true" aria-describedby="err-' + field.name + '"' : '') + '>' +
                (error ? '<span class="field-error" id="err-' + field.name + '">' + esc(t(error)) + '</span>' : '') +
                '</div>';
        });

        html += '</div>';

        if (isLast) {
            html += '<p class="last-reached">' + esc(t('edit.last_reached')) + '</p>';
        }

        html += '<div class="actions">' +
            '<button type="button" class="btn" data-action="prev"' + (isFirst ? ' disabled' : '') + '>&larr; ' + esc(t('edit.prev')) + '</button>' +
            '<button type="button" class="btn btn-primary" id="next-btn" data-action="next"' + (isLast ? ' disabled' : '') + '>' + esc(t('edit.next')) + ' &rarr;</button>' +
            '</div>' +
            '<div class="actions">' +
            '<button type="button" class="btn" id="preview-btn" data-action="preview">' + esc(t('edit.preview')) + '</button>' +
            '<button type="button" class="btn" data-action="export">' + esc(t('edit.export')) + '</button>' +
            '</div></div>';

        // avvisi mostrati solo sulla prima mossa
        if (cur === 0 && game.hasMultipleGames()) {
            html += '<p class="alert alert-info">' + esc(t('edit.multi_games')) + '</p>';
        }
        if (cur === 0 && game.hasVariations()) {
            html += '<p class="alert alert-info">' + esc(t('edit.variations')) + '</p>';
        }

        html += '<p class="inline-form"><button type="button" class="btn btn-link" data-action="new-game">' +
            esc(t('edit.new_game')) + '</button></p></section>';

        return html;
    }

    /** Valori attualmente scritti nei tre campi. */
    function readFormValues() {
        var values = {};
        TIME_FIELDS.forEach(function (field) {
            var input = $('#f-' + field.name);
            values[field.name] = input ? input.value : '';
        });

        return values;
    }

    /**
     * Salva il tempo della mossa corrente e naviga (prev / next / preview / export).
     * Se i valori non sono validi resta sulla mossa e mostra gli errori.
     */
    function navigate(action) {
        var values = readFormValues();
        var clock;
        try {
            clock = ClockHelper.fromParts(values.hours, values.minutes, values.seconds);
        } catch (e) {
            if (e instanceof InvalidClockError) {
                ui.posted = values;
                ui.postedFor = state.current;
                ui.errors = e.errors;
                render();

                return;
            }
            throw e;
        }

        var total = state.game.getNumberOfMoves();
        state.clocks[state.current] = clock;
        ui.posted = null;
        ui.errors = {};

        if (action === 'prev') {
            state.current = Math.max(0, state.current - 1);
        } else if (action === 'next') {
            state.current = Math.min(total - 1, state.current + 1);
        }
        saveState();

        if (action === 'preview') {
            go('preview');
        } else if (action === 'export') {
            go('result');
        } else {
            render();
        }
    }

    // ------------------------------------------------------------------
    // Schermata: anteprima
    // ------------------------------------------------------------------

    function viewPreview() {
        var moves = state.game.getMainlineMoves();
        var setCount = state.clocks.filter(function (c) {
            return c !== null;
        }).length;

        var rows = moves.map(function (move) {
            return '<tr' + (move.index === state.current ? ' class="current"' : '') + '>' +
                '<td class="san"><a href="#edit" data-move="' + move.index + '">' + esc(moveLabel(move)) + '</a></td>' +
                '<td class="time">' + esc(ClockHelper.format(state.clocks[move.index])) + '</td></tr>';
        }).join('');

        return '<section class="card">' +
            '<h1>' + esc(t('preview.title')) + '</h1>' +
            '<p class="help">' + esc(t('preview.summary', {set: setCount, total: moves.length})) + ' ' +
            esc(t('preview.help')) + '</p>' +
            '<div class="actions">' +
            '<a class="btn btn-primary" id="back-btn" href="#edit">' + esc(t('preview.back')) + '</a>' +
            '<a class="btn" href="#result">' + esc(t('preview.export')) + '</a>' +
            '</div>' +
            '<div class="table-scroll"><table class="preview-table"><thead><tr>' +
            '<th scope="col">' + esc(t('preview.col_move')) + '</th>' +
            '<th scope="col">' + esc(t('preview.col_clock')) + '</th>' +
            '</tr></thead><tbody>' + rows + '</tbody></table></div></section>';
    }

    // ------------------------------------------------------------------
    // Schermata: risultato
    // ------------------------------------------------------------------

    /** PGN con i tempi applicati: si parte sempre dal testo originale. */
    function buildOutputPgn() {
        var game = PgnGame.fromString(state.pgn);
        game.applyClocks(state.clocks);

        return game.export();
    }

    function viewResult() {
        var filename = ui.filename !== null ? ui.filename : t('default_filename');

        return '<section class="card">' +
            '<h1>' + esc(t('result.title')) + '</h1>' +
            '<p class="alert alert-success">' + esc(t('result.success')) + '</p>' +
            '<div class="field"><label for="pgn_out">' + esc(t('result.pgn_label')) + '</label>' +
            '<textarea id="pgn_out" rows="16" readonly spellcheck="false">' + esc(buildOutputPgn()) + '</textarea></div>' +
            '<div class="field"><label for="filename">' + esc(t('result.file_label')) + '</label>' +
            '<input type="text" id="filename" value="' + esc(filename) + '" maxlength="80" autocomplete="off"></div>' +
            '<div class="actions">' +
            '<button type="button" class="btn btn-primary" id="download-btn" data-action="download">' + esc(t('result.download')) + '</button>' +
            '<button type="button" class="btn" id="copy-btn" data-action="copy">' + esc(t('result.copy')) + '</button>' +
            '<a class="btn" href="#edit">' + esc(t('result.back')) + '</a>' +
            '</div>' +
            '<p class="inline-form"><button type="button" class="btn btn-link" data-action="new-game">' +
            esc(t('result.new_game')) + '</button></p></section>';
    }

    function downloadPgn() {
        var name = safeFilename($('#filename').value, t('default_filename'));
        var blob = new Blob([buildOutputPgn()], {type: 'application/x-chess-pgn;charset=utf-8'});
        var url = g.URL.createObjectURL(blob);
        var link = g.document.createElement('a');
        link.href = url;
        link.download = name;
        g.document.body.appendChild(link);
        link.click();
        link.remove();
        g.setTimeout(function () {
            g.URL.revokeObjectURL(url);
        }, 1000);
    }

    function copyPgn(button) {
        var target = $('#pgn_out');
        var original = button.textContent;
        var done = function () {
            button.textContent = t('result.copied');
            g.setTimeout(function () {
                button.textContent = original;
            }, 1500);
        };
        var fallback = function () {
            target.select();
            try {
                g.document.execCommand('copy');
                done();
            } catch (e) {
                // il testo resta selezionato: l'utente può copiarlo a mano
            }
        };

        if (g.navigator.clipboard && g.navigator.clipboard.writeText) {
            g.navigator.clipboard.writeText(target.value).then(done, fallback);
        } else {
            fallback();
        }
    }

    // ------------------------------------------------------------------
    // Disegno della pagina
    // ------------------------------------------------------------------

    /** Dà il focus all'elemento giusto dopo ogni disegno. */
    function applyFocus(view, focusSelector) {
        var el = null;

        if (focusSelector) {
            el = $(focusSelector);
        } else if (view === 'edit') {
            // primo campo errato; altrimenti l'ultimo campo modificato (così si può scrivere subito);
            // se non ne è stato modificato nessuno, "Next move" (o l'anteprima sull'ultima mossa)
            el = $('input.invalid');
            if (!el && ui.lastField) {
                el = $('#f-' + ui.lastField);
            }
            if (!el) {
                var next = $('#next-btn');
                el = (next && !next.disabled) ? next : $('#preview-btn');
            }
        } else if (view === 'preview') {
            el = $('#back-btn');
        } else if (view === 'result') {
            el = $('#download-btn');
        }

        if (el) {
            el.focus();
        }
    }

    function render(focusSelector) {
        var view = currentView();
        var content;

        if (view === 'edit') {
            content = viewEdit();
        } else if (view === 'preview') {
            content = viewPreview();
        } else if (view === 'result') {
            content = viewResult();
        } else {
            content = viewHome();
        }

        g.document.documentElement.lang = I.getLang();
        root.innerHTML = layout(content);
        applyFocus(view, focusSelector);
        g.scrollTo(0, 0);
    }

    /** Cambia lingua senza perdere quello che l'utente sta scrivendo. */
    function changeLanguage(code) {
        var view = currentView();
        var keptFile = null;

        if (view === 'edit') {
            ui.posted = readFormValues();
            ui.postedFor = state.current;
            // mantiene eventuali errori già mostrati (sono chiavi, quindi vengono tradotte)
        } else if (view === 'home') {
            ui.pgnText = $('#pgn_text').value;
            var fileInput = $('#pgn_file');
            if (fileInput && fileInput.files && fileInput.files.length > 0) {
                keptFile = fileInput;
            }
        } else if (view === 'result') {
            ui.filename = $('#filename').value;
        }

        I.setLang(code);
        render('.flag[data-lang="' + code + '"]');

        if (keptFile) {
            // rimette il vecchio campo file, che ricorda il file già scelto
            var fresh = $('#pgn_file');
            if (fresh) {
                fresh.replaceWith(keptFile);
            }
        }
    }

    // ------------------------------------------------------------------
    // Eventi (un solo gestore per tipo, sul contenitore principale)
    // ------------------------------------------------------------------

    function onClick(event) {
        var link = event.target.closest('a[data-move]');
        if (link) {
            // dall'anteprima: apre la mossa scelta (poi il link cambia l'hash)
            state.current = parseInt(link.getAttribute('data-move'), 10);
            ui.posted = null;
            ui.errors = {};
            saveState();

            return;
        }

        var button = event.target.closest('button[data-action]');
        if (!button || button.disabled) {
            return;
        }

        switch (button.getAttribute('data-action')) {
            case 'lang':
                changeLanguage(button.getAttribute('data-lang'));
                break;
            case 'prev':
            case 'next':
            case 'preview':
            case 'export':
                navigate(button.getAttribute('data-action'));
                break;
            case 'download':
                downloadPgn();
                break;
            case 'copy':
                copyPgn(button);
                break;
            case 'new-game':
                clearState();
                ui.errorKey = null;
                ui.pgnText = '';
                go('home');
                break;
        }
    }

    function onSubmit(event) {
        if (event.target.id === 'load-form') {
            event.preventDefault();
            onLoadSubmit();
        }
    }

    function onKeydown(event) {
        // Invio = sempre "Next move", ovunque ci si trovi nella finestra della mossa corrente.
        // Sull'ultima mossa, dove "Next move" è disattivato, si salva solo il tempo e si resta lì.
        // Fanno eccezione i pulsanti, i link e le altre caselle di testo: lì Invio mantiene il suo
        // significato normale (per esempio su "Previous move" esegue "Previous move").
        if (event.key !== 'Enter' || event.isComposing || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }
        if (state === null || currentView() !== 'edit') {
            return;
        }
        var target = event.target;
        if (target && target.closest && target.closest('button, a, textarea, select, input:not([data-field])')) {
            return;
        }

        event.preventDefault();
        navigate('next');
    }

    function onInput(event) {
        var input = event.target;

        if (input.matches && input.matches('input[data-field]')) {
            ui.lastField = input.getAttribute('data-field');

            // solo cifre; minuti e secondi oltre 59 vengono evidenziati (la validazione vera è in ClockHelper)
            var cleaned = input.value.replace(/\D+/g, '');
            if (cleaned !== input.value) {
                input.value = cleaned;
            }
            var max = input.getAttribute('data-field') === 'hours' ? null : 59;
            var bad = max !== null && cleaned !== '' && parseInt(cleaned, 10) > max;
            input.classList.toggle('invalid', bad);
            if (bad) {
                input.setAttribute('aria-invalid', 'true');
            } else {
                input.removeAttribute('aria-invalid');
                var message = input.parentNode.querySelector('.field-error');
                if (message) {
                    message.remove();
                }
            }
        } else if (input.id === 'filename') {
            ui.filename = input.value;
        }
    }

    function onFocusIn(event) {
        if (event.target.matches && event.target.matches('input[data-field]')) {
            event.target.select();
        }
    }

    function init() {
        root = g.document.getElementById('root');
        I.loadLang();
        state = loadState();

        root.addEventListener('click', onClick);
        root.addEventListener('submit', onSubmit);
        g.document.addEventListener('keydown', onKeydown);
        root.addEventListener('input', onInput);
        root.addEventListener('focusin', onFocusIn);
        g.addEventListener('hashchange', function () {
            render();
        });

        render();
    }

    if (g.document.readyState === 'loading') {
        g.document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}(window));
