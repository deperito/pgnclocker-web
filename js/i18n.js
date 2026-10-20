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
 * Lingue, traduzioni, notazione delle mosse con i simboli dei pezzi e bandiere.
 * I cataloghi delle stringhe stanno in js/lang/<codice>.js e si registrano in
 * PgnClocker.lang[<codice>].
 */
(function (g) {
    'use strict';

    var ns = g.PgnClocker = g.PgnClocker || {};
    ns.lang = ns.lang || {};

    /** Lingue disponibili: codice => nome nella lingua stessa. */
    var LANGUAGES = {
        en: 'English',
        it: 'Italiano',
        es: 'Español',
        fr: 'Français',
        de: 'Deutsch'
    };
    var DEFAULT_LANG = 'en';
    var STORAGE_KEY = 'pgnclocker.lang';

    /**
     * Simboli dei pezzi (notazione "figurine"): Re, Donna, Torre, Alfiere, Cavallo.
     * Valgono per tutte le lingue. Si usano le figure "bianche" (contorno) per le mosse di entrambi i colori.
     * Il PGN usa le lettere inglesi (K Q R B N), che sono la chiave di questa tabella.
     */
    var FIGURINES = {K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘'};

    var currentLang = DEFAULT_LANG;

    function has(obj, key) {
        return Object.prototype.hasOwnProperty.call(obj, key);
    }

    /** Legge la lingua salvata nel browser (inglese se non impostata). */
    function loadLang() {
        try {
            var saved = g.localStorage.getItem(STORAGE_KEY);
            if (saved && has(LANGUAGES, saved)) {
                currentLang = saved;
            }
        } catch (e) {
            // localStorage non disponibile: si resta sull'inglese
        }

        return currentLang;
    }

    function getLang() {
        return currentLang;
    }

    /** Imposta la lingua e la salva nel browser. */
    function setLang(lang) {
        if (!has(LANGUAGES, lang)) {
            return;
        }
        currentLang = lang;
        try {
            g.localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) {
            // non è un problema: la scelta vale solo fino alla chiusura della pagina
        }
    }

    /**
     * Restituisce la stringa tradotta (testo semplice, da passare a esc() prima di stamparla in HTML).
     * Se manca nella lingua corrente si usa l'inglese; se manca anche lì, la chiave stessa.
     * I segnaposto {nome} vengono sostituiti con i valori di `params`.
     */
    function t(key, params) {
        var order = [currentLang, DEFAULT_LANG];
        for (var k = 0; k < order.length; k++) {
            var catalog = ns.lang[order[k]];
            if (catalog && has(catalog, key)) {
                var text = catalog[key];
                if (params) {
                    Object.keys(params).forEach(function (name) {
                        text = text.split('{' + name + '}').join(String(params[name]));
                    });
                }

                return text;
            }
        }

        return key;
    }

    /**
     * Mossa nella notazione con i simboli dei pezzi, uguale in tutte le lingue.
     *
     * Il PGN usa le lettere inglesi; per la visualizzazione la lettera del pezzo
     * viene sostituita dal suo simbolo. Il PGN esportato resta invece in notazione
     * inglese standard.
     *
     * Esempi: "Bg7" diventa "♗g7"; "Nf3" diventa "♘f3"; "e8=Q+" diventa "e8=♕+".
     * Pedoni, catture, scacchi e arrocco non cambiano.
     */
    function localizeSan(san) {
        // lettera del pezzo a inizio mossa, oppure pezzo di promozione dopo "="
        return san.replace(/^[KQRBN]|=[KQRBN]/g, function (m) {
            return m.length === 1 ? FIGURINES[m] : '=' + FIGURINES[m.charAt(1)];
        });
    }

    /** Bandiera (SVG inline, markup statico e fidato) per il selettore della lingua. */
    function flagSvg(lang) {
        function open(viewBox, width) {
            return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + viewBox + '" width="' + width +
                '" height="20" aria-hidden="true" focusable="false">';
        }

        switch (lang) {
            case 'it':
                return open('0 0 3 2', 30) +
                    '<rect width="1" height="2" fill="#009246"/>' +
                    '<rect x="1" width="1" height="2" fill="#ffffff"/>' +
                    '<rect x="2" width="1" height="2" fill="#ce2b37"/>' +
                    '</svg>';

            case 'es':
                // bandiera della Spagna (senza lo stemma)
                return open('0 0 3 2', 30) +
                    '<rect width="3" height="2" fill="#aa151b"/>' +
                    '<rect y="0.5" width="3" height="1" fill="#f1bf00"/>' +
                    '</svg>';

            case 'fr':
                return open('0 0 3 2', 30) +
                    '<rect width="1" height="2" fill="#0055a4"/>' +
                    '<rect x="1" width="1" height="2" fill="#ffffff"/>' +
                    '<rect x="2" width="1" height="2" fill="#ef4135"/>' +
                    '</svg>';

            case 'de':
                return open('0 0 5 3', 33) +
                    '<rect width="5" height="1" fill="#000000"/>' +
                    '<rect y="1" width="5" height="1" fill="#dd0000"/>' +
                    '<rect y="2" width="5" height="1" fill="#ffce00"/>' +
                    '</svg>';

            default:
                // Union Jack (inglese)
                return open('0 0 60 30', 40) +
                    '<clipPath id="uk-a"><path d="M0,0 v30 h60 v-30 z"/></clipPath>' +
                    '<clipPath id="uk-b"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>' +
                    '<g clip-path="url(#uk-a)">' +
                    '<path d="M0,0 v30 h60 v-30 z" fill="#012169"/>' +
                    '<path d="M0,0 L60,30 M60,0 L0,30" stroke="#ffffff" stroke-width="6"/>' +
                    '<path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#uk-b)" stroke="#c8102e" stroke-width="4"/>' +
                    '<path d="M30,0 v30 M0,15 h60" stroke="#ffffff" stroke-width="10"/>' +
                    '<path d="M30,0 v30 M0,15 h60" stroke="#c8102e" stroke-width="6"/>' +
                    '</g></svg>';
        }
    }

    ns.i18n = {
        LANGUAGES: LANGUAGES,
        DEFAULT_LANG: DEFAULT_LANG,
        FIGURINES: FIGURINES,
        loadLang: loadLang,
        getLang: getLang,
        setLang: setLang,
        t: t,
        localizeSan: localizeSan,
        flagSvg: flagSvg
    };
}(typeof globalThis !== 'undefined' ? globalThis : window));
