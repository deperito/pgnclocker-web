/*
 * Test end-to-end in un browser headless (Playwright + Chromium), aprendo la pagina da file://
 * come farebbe l'utente con un doppio clic.
 *
 *     node tests/e2e.js [percorso/della/pagina.html] [cartella-screenshot]
 *
 * Richiede il pacchetto "playwright" (npm i playwright) con un Chromium installato.
 */
'use strict';

var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var playwright = require('playwright');

var page_path = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
var shots = process.argv[3] || null;
var url = 'file://' + page_path;

var passed = 0;

function ok(name) {
    passed++;
    console.log('ok   - ' + name);
}

async function text(page, selector) {
    return (await page.locator(selector).first().innerText()).replace(/\s+/g, ' ').trim();
}

async function activeId(page) {
    return page.evaluate(function () { return document.activeElement && document.activeElement.id; });
}

async function shot(page, name) {
    if (shots) {
        fs.mkdirSync(shots, {recursive: true});
        await page.screenshot({path: path.join(shots, name + '.png'), fullPage: true});
    }
}

(async function () {
    var browser = await playwright.chromium.launch();
    var context = await browser.newContext({acceptDownloads: true, viewport: {width: 1000, height: 800}});
    var page = await context.newPage();

    var problems = [];
    page.on('pageerror', function (e) { problems.push('pageerror: ' + e.message); });
    page.on('console', function (m) {
        if (m.type() === 'error') { problems.push('console.error: ' + m.text()); }
    });
    page.on('request', function (r) {
        if (!r.url().startsWith('file://') && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) {
            problems.push('richiesta di rete inattesa: ' + r.url());
        }
    });

    // ---- 1. pagina iniziale, inglese di default -----------------------
    await page.goto(url);
    assert.strictEqual(await page.locator('.flag').count(), 5);
    ok('5 bandiere');
    assert.strictEqual(await text(page, '.tagline'), 'Add clock timestamps to the moves of a chess game in a PGN file');
    assert.strictEqual(await page.getAttribute('html', 'lang'), 'en');
    ok('interfaccia in inglese di default');
    await shot(page, '01-home-en');

    // ---- 2. caricamento da testo incollato ------------------------------
    await page.fill('#pgn_text', '[Event "Test"]\n[White "Alice"]\n[Black "Bob"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 *');
    await page.click('#load-form button[type=submit]');
    await page.waitForSelector('#move-form');
    assert.strictEqual(await text(page, '.move-san'), '1. e4');
    assert.strictEqual(await text(page, '.progress'), 'Half-move 1 of 6');
    ok('la prima mossa è mostrata');
    assert.strictEqual(await activeId(page), 'next-btn');
    ok('il focus è automaticamente su "Next move"');
    await shot(page, '02-edit-en');

    // ---- 3. inserimento dei tempi -----------------------------------------
    await page.fill('#f-minutes', '5');              // solo minuti: ore e secondi vuoti = 0
    await page.click('#next-btn');
    assert.strictEqual(await text(page, '.move-san'), '1... e5');
    assert.strictEqual(await activeId(page), 'next-btn');
    ok('"Next move" salva e avanza, il focus resta su "Next move"');

    await page.fill('#f-minutes', '4');
    await page.fill('#f-seconds', '59');
    await page.press('#f-seconds', 'Enter');         // Invio = mossa successiva
    assert.strictEqual(await text(page, '.move-san'), '2. ♘f3');
    ok('Invio in un campo = mossa successiva; cavallo con il simbolo');

    await page.click('[data-action=next]');          // mossa 3 senza tempo
    assert.strictEqual(await text(page, '.move-san'), '2... ♞c6'.replace('♞', '♘'));
    await page.click('[data-action=prev]');
    assert.strictEqual(await text(page, '.move-san'), '2. ♘f3');
    assert.strictEqual(await page.inputValue('#f-minutes'), '');
    ok('"Previous move" torna indietro');
    await page.click('[data-action=prev]');
    assert.strictEqual(await page.inputValue('#f-minutes'), '4');
    assert.strictEqual(await page.inputValue('#f-seconds'), '59');
    assert.strictEqual(await page.inputValue('#f-hours'), '0');
    ok('i tempi salvati vengono ricaricati nei tre campi (ore 0 mostrate)');

    // ---- 4. validazione -------------------------------------------------
    await page.fill('#f-minutes', '75');
    assert.ok((await page.getAttribute('#f-minutes', 'class')).includes('invalid'));
    await page.click('#next-btn');
    assert.strictEqual(await text(page, '.move-san'), '1... e5');
    assert.strictEqual(await text(page, '#err-minutes'), 'Minutes must be a whole number between 0 and 59.');
    assert.strictEqual(await activeId(page), 'f-minutes');
    ok('valore non valido: resta sulla mossa, errore sul campo, focus sul campo');
    await shot(page, '03-error-en');

    // cambio lingua con l'errore a schermo: i valori digitati restano e l'errore viene tradotto
    await page.click('.flag[data-lang=it]');
    assert.strictEqual(await page.inputValue('#f-minutes'), '75');
    assert.strictEqual(await text(page, '#err-minutes'), 'I minuti devono essere un numero intero tra 0 e 59.');
    assert.strictEqual(await text(page, 'label[for=f-hours]'), 'Ore');
    ok('cambio lingua: valori conservati ed errore tradotto');
    await page.click('.flag[data-lang=en]');

    await page.fill('#f-minutes', '4');
    await page.fill('#f-seconds', '59');
    await page.click('#next-btn');
    assert.strictEqual(await text(page, '.move-san'), '2. ♘f3');
    ok('corretto l\'errore si può proseguire');

    // ---- 5. anteprima -------------------------------------------------------
    await page.click('#preview-btn');
    await page.waitForSelector('.preview-table');
    var rows = await page.$$eval('.preview-table tbody tr', function (trs) {
        return trs.map(function (tr) { return [tr.cells[0].innerText.trim(), tr.cells[1].innerText.trim()]; });
    });
    assert.deepStrictEqual(rows, [
        ['1. e4', '0:05:00'], ['1... e5', '0:04:59'], ['2. ♘f3', ''],
        ['2... ♘c6', ''], ['3. ♗b5', ''], ['3... a6', '']
    ].map(function (r) { return r; }));
    ok('anteprima: mosse con i simboli e tempi (vuoto se assente)');
    await shot(page, '04-preview-en');

    await page.click('text=3. ♗b5');
    await page.waitForSelector('#move-form');
    assert.strictEqual(await text(page, '.move-san'), '3. ♗b5');
    ok('clic su una mossa dell\'anteprima: si apre quella mossa');

    // ---- 6. lingue: interfaccia e persistenza ----------------------------
    await page.click('.flag[data-lang=de]');
    assert.strictEqual(await text(page, 'label[for=f-hours]'), 'Stunden');
    assert.strictEqual(await text(page, '.move-san'), '3. ♗b5');
    assert.strictEqual(await page.getAttribute('html', 'lang'), 'de');
    assert.strictEqual(await activeId(page), '');
    ok('tedesco: interfaccia tradotta, mossa con gli stessi simboli');
    await page.click('.flag[data-lang=fr]');
    assert.strictEqual(await text(page, 'label[for=f-hours]'), 'Heures');
    await page.click('.flag[data-lang=es]');
    assert.strictEqual(await text(page, 'label[for=f-hours]'), 'Horas');
    await page.click('.flag[data-lang=it]');
    assert.strictEqual(await text(page, 'label[for=f-hours]'), 'Ore');
    assert.strictEqual(await text(page, '.tagline'), "Aggiungi i tempi dell'orologio alle mosse di una partita a scacchi in un file PGN");
    ok('francese, spagnolo e italiano');
    await shot(page, '05-edit-it');

    // ---- 7. ripristino dopo il ricaricamento ------------------------------
    await page.reload();
    await page.waitForSelector('#move-form');
    assert.strictEqual(await text(page, 'label[for=f-hours]'), 'Ore');
    assert.strictEqual(await text(page, '.move-san'), '3. ♗b5');
    ok('dopo un refresh restano partita, mossa corrente e lingua');

    // ---- 8. risultato ----------------------------------------------------
    await page.click('[data-action=export]');
    await page.waitForSelector('#pgn_out');
    var pgn = await page.inputValue('#pgn_out');
    assert.strictEqual(pgn, [
        '[Event "Test"]', '[White "Alice"]', '[Black "Bob"]', '',
        '1. e4 {[%clk 0:05:00]} 1... e5 {[%clk 0:04:59]} 2. Nf3 Nc6 3. Bb5 a6 *', ''
    ].join('\n'));
    ok('PGN esportato in notazione inglese standard, con i [%clk]');
    await shot(page, '06-result-it');

    await page.fill('#filename', 'la mia partita!.pgn');
    var downloadPromise = page.waitForEvent('download');
    await page.click('#download-btn');
    var download = await downloadPromise;
    assert.strictEqual(download.suggestedFilename(), 'la_mia_partita.pgn');
    var downloaded = fs.readFileSync(await download.path(), 'utf8');
    assert.strictEqual(downloaded, pgn);
    ok('download: nome file ripulito e contenuto uguale all\'anteprima');

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.click('#copy-btn');
    var copied = await page.evaluate(function () { return navigator.clipboard.readText(); }).catch(function () { return null; });
    if (copied !== null) {
        assert.strictEqual(copied, pgn);
        ok('copia negli appunti');
    } else {
        console.log('skip - copia negli appunti (lettura della clipboard non consentita da file://)');
    }

    // ---- 9. caricamento da file, anche non UTF-8 -----------------------
    await page.click('[data-action=new-game]');
    await page.waitForSelector('#load-form');
    assert.strictEqual(await page.locator('.alert-info').count(), 0);
    var latin1 = path.join(os.tmpdir(), 'pgnclocker-latin1.pgn');
    fs.writeFileSync(latin1, Buffer.from('[Event "Caf\xe9"]\n\n1. e4 {bella mossa, perch\xe9} e5 *\n', 'latin1'));
    await page.setInputFiles('#pgn_file', latin1);

    await page.click('.flag[data-lang=en]');         // il file scelto non deve andare perso
    assert.strictEqual(await page.evaluate(function () { return document.getElementById('pgn_file').files.length; }), 1);
    ok('cambio lingua nella pagina iniziale: il file scelto resta');

    await page.click('#load-form button[type=submit]');
    await page.waitForSelector('#move-form');
    await page.click('[data-action=export]');
    await page.waitForSelector('#pgn_out');
    var latinOut = await page.inputValue('#pgn_out');
    assert.ok(latinOut.includes('[Event "Café"]'), latinOut);
    assert.ok(latinOut.includes('{bella mossa, perché}'), latinOut);
    ok('file ISO-8859-1 letto correttamente');

    // ---- 10. errori nel caricamento --------------------------------------
    await page.click('[data-action=new-game]');
    await page.click('#load-form button[type=submit]');
    assert.strictEqual(await text(page, '.alert-error'), 'Upload a PGN file or paste the text of the game.');
    await page.fill('#pgn_text', '[Event "x"]\n\n*');
    await page.click('#load-form button[type=submit]');
    assert.strictEqual(await text(page, '.alert-error'), 'No moves were found in the text you entered.');
    assert.strictEqual(await page.inputValue('#pgn_text'), '[Event "x"]\n\n*');
    ok('errori di caricamento mostrati, testo conservato');
    await page.fill('#pgn_text', '<img src=x onerror=alert(1)>\n1. e4 e5 *');
    await page.click('#load-form button[type=submit]');
    await page.waitForSelector('#move-form');
    assert.strictEqual(await page.locator('#root img').count(), 0);
    ok('nessuna iniezione HTML dal testo del PGN');

    // senza partita le altre schermate rimandano alla pagina iniziale
    await page.click('[data-action=new-game]');
    await page.goto(url + '#result');
    await page.waitForSelector('#load-form');
    ok('senza partita, #result mostra la pagina di caricamento');

    // ---- 11. ultima mossa e partita con varianti --------------------------
    await page.fill('#pgn_text', '1. e4 (1. d4 d5) e5 *');
    await page.click('#load-form button[type=submit]');
    await page.waitForSelector('#move-form');
    assert.ok(await page.locator('.alert-info').count() >= 1);
    await page.click('#next-btn');
    assert.ok(await page.isDisabled('#next-btn'));
    assert.strictEqual(await activeId(page), 'preview-btn');
    ok('ultima mossa: "Next" disabilitato e focus su "Preview PGN"; avviso sulle varianti');
    await page.fill('#f-seconds', '7');
    await page.press('#f-seconds', 'Enter');          // sull'ultima mossa Invio apre l'anteprima
    await page.waitForSelector('.preview-table');
    ok('Invio sull\'ultima mossa apre l\'anteprima');

    assert.deepStrictEqual(problems, []);
    ok('nessun errore in console e nessuna richiesta di rete');

    await browser.close();
    console.log('\n' + passed + ' controlli superati');
}()).catch(function (error) {
    console.error('\nFALLITO:', error && error.stack || error);
    process.exit(1);
});
