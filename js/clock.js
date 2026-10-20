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
 * ALCUNA GARANZIA; senza neppure la garanzia implicita di COMMERCIABILITÀ
 * o IDONEITÀ PER UNO SCOPO PARTICOLARE. Vedi la GNU General Public License
 * per maggiori dettagli: <http://www.gnu.org/licenses/>.
 */

/*
 * Conversione e validazione dei tempi dell'orologio.
 *
 * Il tempo si inserisce in tre campi (ore, minuti, secondi). Un campo vuoto
 * vale 0; se sono vuoti tutti e tre, per la mossa non viene impostato nessun
 * tempo. Le ore sono un intero >= 0, minuti e secondi sono interi tra 0 e 59.
 */
(function (g) {
    'use strict';

    var ns = g.PgnClocker = g.PgnClocker || {};

    var SECONDS_IN_HOUR = 3600;
    var SECONDS_IN_MINUTE = 60;

    /**
     * Uno o più campi del tempo (hours, minutes, seconds) non sono validi.
     * `errors` associa a ogni campo errato la chiave di traduzione del messaggio.
     */
    function InvalidClockError(errors) {
        this.name = 'InvalidClockError';
        this.message = 'err.clock_invalid';
        this.errors = errors;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidClockError);
        }
    }
    InvalidClockError.prototype = Object.create(Error.prototype);
    InvalidClockError.prototype.constructor = InvalidClockError;

    function pad2(n) {
        return (n < 10 ? '0' : '') + n;
    }

    /**
     * Converte i tre campi inseriti dall'utente in secondi.
     * Restituisce null se i tre campi sono vuoti (nessun tempo per la mossa);
     * lancia InvalidClockError se uno o più campi non sono validi.
     */
    function fromParts(hours, minutes, seconds) {
        hours = String(hours).trim();
        minutes = String(minutes).trim();
        seconds = String(seconds).trim();

        if (hours === '' && minutes === '' && seconds === '') {
            return null;
        }

        var errors = {};
        var hasErrors = false;
        if (hours !== '' && !/^\d{1,5}$/.test(hours)) {
            errors.hours = 'err.hours_invalid';
            hasErrors = true;
        }
        if (minutes !== '' && (!/^\d{1,2}$/.test(minutes) || parseInt(minutes, 10) > 59)) {
            errors.minutes = 'err.minutes_invalid';
            hasErrors = true;
        }
        if (seconds !== '' && (!/^\d{1,2}$/.test(seconds) || parseInt(seconds, 10) > 59)) {
            errors.seconds = 'err.seconds_invalid';
            hasErrors = true;
        }
        if (hasErrors) {
            throw new InvalidClockError(errors);
        }

        // i campi vuoti contano come 0
        var h = hours === '' ? 0 : parseInt(hours, 10);
        var m = minutes === '' ? 0 : parseInt(minutes, 10);
        var s = seconds === '' ? 0 : parseInt(seconds, 10);

        return h * SECONDS_IN_HOUR + m * SECONDS_IN_MINUTE + s;
    }

    /** Scompone i secondi in [ore, minuti, secondi] ([null, null, null] se non c'è nessun tempo). */
    function toParts(totalSeconds) {
        if (totalSeconds === null || totalSeconds === undefined) {
            return [null, null, null];
        }

        return [
            Math.floor(totalSeconds / SECONDS_IN_HOUR),
            Math.floor(totalSeconds / SECONDS_IN_MINUTE) % 60,
            totalSeconds % SECONDS_IN_MINUTE
        ];
    }

    /** Formatta i secondi come "h:mm:ss" (stringa vuota se non c'è nessun tempo). */
    function format(totalSeconds) {
        if (totalSeconds === null || totalSeconds === undefined) {
            return '';
        }
        var p = toParts(totalSeconds);

        return p[0] + ':' + pad2(p[1]) + ':' + pad2(p[2]);
    }

    /** Commento PGN standard per l'orologio: [%clk h:mm:ss] */
    function toPgnCommand(totalSeconds) {
        return '[%clk ' + format(totalSeconds) + ']';
    }

    ns.InvalidClockError = InvalidClockError;
    ns.ClockHelper = {
        fromParts: fromParts,
        toParts: toParts,
        format: format,
        toPgnCommand: toPgnCommand
    };
}(typeof globalThis !== 'undefined' ? globalThis : window));
