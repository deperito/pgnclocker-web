/*
 * PGNClocker JS - stringhe in italiano.
 * Basato su PGNClocker, Copyright © 2025 Alessio Martorana - GNU GPL v3 o successiva.
 */
(function (g) {
    "use strict";
    var ns = g.PgnClocker = g.PgnClocker || {};
    ns.lang = ns.lang || {};
    ns.lang.it = {
        // Layout
        'app.tagline': "Aggiungi i tempi dell'orologio alle mosse di una partita a scacchi in un file PGN",
        'lang.switch': 'Lingua',
        'footer.based_on': 'Versione solo browser (JavaScript) basata su',
        'footer.author': 'di Alessio Martorana',
        'footer.license': 'Software libero con licenza',
        'footer.gpl': 'GNU GPL v3 o successiva',

        // Pagina di caricamento
        'upload.title': 'Carica una partita',
        'upload.intro': "Carica un file PGN o incolla il testo della partita. Poi scorrerai le mosse una alla volta, inserendo per ciascuna il tempo rimasto sull'orologio, ed esporterai un PGN con le annotazioni [%clk] (utile, ad esempio, per importare la partita in uno studio di Lichess).",
        'upload.privacy': 'Tutto avviene nel tuo browser: la partita non viene mai inviata a nessun server.',
        'upload.resume_text': 'Hai già una partita in lavorazione.',
        'upload.resume_link': 'Riprendi da dove eri rimasto',
        'upload.file_label': 'File PGN',
        'upload.or': 'oppure',
        'upload.text_label': 'Testo PGN',
        'upload.submit': 'Continua',
        'upload.limits': 'Limiti',
        'upload.limit_game': 'Il PGN deve contenere una sola partita (se ce ne sono di più viene usata la prima).',
        'upload.limit_main': 'I tempi si possono inserire solo sulle mosse della linea principale; le varianti vengono conservate ma non modificate.',
        'upload.limit_size': 'Dimensione massima: 1 MB.',

        // Finestra principale (mossa corrente)
        'edit.move': 'Mossa:',
        'edit.position': 'Semimossa {current} di {total}',
        'edit.help': "Inserisci il tempo rimasto sull'orologio dopo questa mossa. I campi vuoti valgono 0; se sono vuoti tutti e tre, per la mossa non viene impostato nessun tempo.",
        'edit.hours': 'Ore',
        'edit.minutes': 'Minuti',
        'edit.seconds': 'Secondi',
        'edit.prev': 'Mossa precedente',
        'edit.next': 'Mossa successiva',
        'edit.preview': 'Anteprima PGN',
        'edit.export': 'Esporta PGN',
        'edit.last_reached': "Hai raggiunto l'ultima mossa",
        'edit.fix_errors': 'Correggi i campi evidenziati.',
        'edit.multi_games': 'Il file contiene più partite: viene usata solo la prima.',
        'edit.variations': 'La partita contiene varianti: vengono conservate, ma i tempi si impostano solo sulla linea principale.',
        'edit.new_game': "Carica un'altra partita",

        // Anteprima
        'preview.title': 'Anteprima del PGN',
        'preview.help': 'Clicca su una mossa per modificarne il tempo.',
        'preview.summary': '{set} mosse su {total} hanno un tempo impostato.',
        'preview.col_move': 'Mossa',
        'preview.col_clock': 'Orologio',
        'preview.back': 'Torna alla modifica',
        'preview.export': 'Esporta PGN',

        // Risultato
        'result.title': 'Fatto!',
        'result.success': "Il PGN con i tempi dell'orologio è pronto.",
        'result.pgn_label': 'PGN generato',
        'result.file_label': 'Nome del file',
        'result.download': 'Scarica',
        'result.copy': 'Copia negli appunti',
        'result.copied': 'Copiato!',
        'result.back': 'Torna alla modifica',
        'result.new_game': 'Nuova partita',
        'default_filename': 'partita-con-tempi',

        // Errori
        'err.no_moves': 'Nel testo inserito non è stata trovata nessuna mossa.',
        'err.upload_size': 'Il file è troppo grande (massimo 1 MB).',
        'err.upload_failed': 'Impossibile leggere il file. Riprova.',
        'err.empty_input': 'Carica un file PGN oppure incolla il testo della partita.',
        'err.hours_invalid': 'Le ore devono essere un numero intero (0 o più).',
        'err.minutes_invalid': 'I minuti devono essere un numero intero tra 0 e 59.',
        'err.seconds_invalid': 'I secondi devono essere un numero intero tra 0 e 59.'
    };
}(typeof globalThis !== "undefined" ? globalThis : window));
