/*
 * PGNClocker JS - Texte auf Deutsch.
 * Basierend auf PGNClocker, Copyright © 2025 Alessio Martorana - GNU GPL v3 oder höher.
 */
(function (g) {
    "use strict";
    var ns = g.PgnClocker = g.PgnClocker || {};
    ns.lang = ns.lang || {};
    ns.lang.de = {
        // Layout
        'app.tagline': 'Füge den Zügen einer Schachpartie in einer PGN-Datei die Restzeiten der Uhr hinzu',
        'lang.switch': 'Sprache',
        'footer.based_on': 'Reine Browser-Version (JavaScript) auf Basis von',
        'footer.author': 'von Alessio Martorana',
        'footer.license': 'Freie Software unter der',
        'footer.gpl': 'GNU GPL v3 oder höher',

        // Ladeseite
        'upload.title': 'Partie laden',
        'upload.intro': 'Lade eine PGN-Datei hoch oder füge den Text der Partie ein. Anschließend gehst du die Züge nacheinander durch, gibst für jeden Zug die auf der Uhr verbleibende Zeit ein und exportierst ein PGN mit [%clk]-Annotationen (praktisch zum Beispiel, um die Partie in eine Lichess-Studie zu importieren).',
        'upload.privacy': 'Alles passiert in deinem Browser: Deine Partie wird nie an einen Server gesendet.',
        'upload.resume_text': 'Du hast bereits eine Partie in Bearbeitung.',
        'upload.resume_link': 'Dort weitermachen, wo du aufgehört hast',
        'upload.file_label': 'PGN-Datei',
        'upload.or': 'oder',
        'upload.text_label': 'PGN-Text',
        'upload.submit': 'Weiter',
        'upload.limits': 'Einschränkungen',
        'upload.limit_game': 'Das PGN darf nur eine Partie enthalten (bei mehreren wird die erste verwendet).',
        'upload.limit_main': 'Zeiten können nur für die Züge der Hauptvariante eingetragen werden; Varianten bleiben erhalten, werden aber nicht bearbeitet.',
        'upload.limit_size': 'Maximale Größe: 1 MB.',

        // Hauptfenster (aktueller Zug)
        'edit.move': 'Zug:',
        'edit.position': 'Halbzug {current} von {total}',
        'edit.help': 'Gib die nach diesem Zug auf der Uhr verbleibende Zeit ein. Leere Felder zählen als 0; sind alle drei leer, wird für den Zug keine Zeit gesetzt.',
        'edit.hours': 'Stunden',
        'edit.minutes': 'Minuten',
        'edit.seconds': 'Sekunden',
        'edit.prev': 'Vorheriger Zug',
        'edit.next': 'Nächster Zug',
        'edit.preview': 'PGN-Vorschau',
        'edit.export': 'PGN exportieren',
        'edit.last_reached': 'Letzter Zug erreicht',
        'edit.fix_errors': 'Bitte korrigiere die markierten Felder.',
        'edit.multi_games': 'Die Datei enthält mehr als eine Partie: Es wird nur die erste verwendet.',
        'edit.variations': 'Die Partie enthält Varianten: Sie bleiben erhalten, Zeiten können aber nur in der Hauptvariante gesetzt werden.',
        'edit.new_game': 'Andere Partie laden',

        // Vorschau
        'preview.title': 'PGN-Vorschau',
        'preview.help': 'Klicke auf einen Zug, um seine Zeit zu bearbeiten.',
        'preview.summary': 'Für {set} von {total} Zügen ist eine Zeit gesetzt.',
        'preview.col_move': 'Zug',
        'preview.col_clock': 'Uhr',
        'preview.back': 'Zurück zur Bearbeitung',
        'preview.export': 'PGN exportieren',

        // Ergebnis
        'result.title': 'Fertig!',
        'result.success': 'Das PGN mit den Restzeiten der Uhr ist fertig.',
        'result.pgn_label': 'Erzeugtes PGN',
        'result.file_label': 'Dateiname',
        'result.download': 'Herunterladen',
        'result.copy': 'In die Zwischenablage kopieren',
        'result.copied': 'Kopiert!',
        'result.back': 'Zurück zur Bearbeitung',
        'result.new_game': 'Neue Partie',
        'default_filename': 'partie-mit-zeiten',

        // Fehler
        'err.no_moves': 'Im eingegebenen Text wurde kein Zug gefunden.',
        'err.upload_size': 'Die Datei ist zu groß (maximal 1 MB).',
        'err.upload_failed': 'Die Datei konnte nicht gelesen werden. Bitte versuche es erneut.',
        'err.empty_input': 'Lade eine PGN-Datei hoch oder füge den Text der Partie ein.',
        'err.hours_invalid': 'Stunden müssen eine ganze Zahl sein (0 oder mehr).',
        'err.minutes_invalid': 'Minuten müssen eine ganze Zahl zwischen 0 und 59 sein.',
        'err.seconds_invalid': 'Sekunden müssen eine ganze Zahl zwischen 0 und 59 sein.'
    };
}(typeof globalThis !== "undefined" ? globalThis : window));
