/*
 * PGNClocker JS - English strings.
 * Based on PGNClocker, Copyright © 2025 Alessio Martorana - GNU GPL v3 or later.
 */
(function (g) {
    "use strict";
    var ns = g.PgnClocker = g.PgnClocker || {};
    ns.lang = ns.lang || {};
    ns.lang.en = {
        // Layout
        'app.tagline': 'Add clock timestamps to the moves of a chess game in a PGN file',
        'lang.switch': 'Language',
        'footer.based_on': 'Browser-only (JavaScript) version based on',
        'footer.author': 'by Alessio Martorana',
        'footer.license': 'Free software released under the',
        'footer.gpl': 'GNU GPL v3 or later',

        // Load page
        'upload.title': 'Load a game',
        'upload.intro': 'Upload a PGN file or paste the text of the game. You will then go through its moves one by one, enter the time left on the clock for each move, and export a PGN with [%clk] annotations (handy, for instance, to import the game into a Lichess study).',
        'upload.privacy': 'Everything happens in your browser: your game is never sent to any server.',
        'upload.resume_text': 'You already have a game in progress.',
        'upload.resume_link': 'Resume where you left off',
        'upload.file_label': 'PGN file',
        'upload.or': 'or',
        'upload.text_label': 'PGN text',
        'upload.submit': 'Continue',
        'upload.limits': 'Limitations',
        'upload.limit_game': 'The PGN must contain a single game (if it contains several, the first one is used).',
        'upload.limit_main': 'Clock times can only be set on the moves of the mainline; variations are kept but not edited.',
        'upload.limit_size': 'Maximum size: 1 MB.',

        // Main window (current move)
        'edit.move': 'Move:',
        'edit.position': 'Half-move {current} of {total}',
        'edit.help': 'Enter the time left on the clock after this move. Empty fields count as 0; if all three are empty, no time is set for the move.',
        'edit.hours': 'Hours',
        'edit.minutes': 'Minutes',
        'edit.seconds': 'Seconds',
        'edit.prev': 'Previous move',
        'edit.next': 'Next move',
        'edit.preview': 'Preview PGN',
        'edit.export': 'Export PGN',
        'edit.last_reached': 'Last move reached',
        'edit.fix_errors': 'Please fix the highlighted fields.',
        'edit.multi_games': 'The file contains more than one game: only the first one is used.',
        'edit.variations': 'The game contains variations: they are kept, but times can only be set on the mainline.',
        'edit.new_game': 'Load another game',

        // Preview
        'preview.title': 'PGN preview',
        'preview.help': 'Click a move to edit its time.',
        'preview.summary': '{set} of {total} moves have a time set.',
        'preview.col_move': 'Move',
        'preview.col_clock': 'Clock',
        'preview.back': 'Back to editing',
        'preview.export': 'Export PGN',

        // Result
        'result.title': 'Done!',
        'result.success': 'The PGN with the clock times is ready.',
        'result.pgn_label': 'Generated PGN',
        'result.file_label': 'File name',
        'result.download': 'Download',
        'result.copy': 'Copy to clipboard',
        'result.copied': 'Copied!',
        'result.back': 'Back to editing',
        'result.new_game': 'New game',
        'default_filename': 'game-with-clocks',

        // Errors
        'err.no_moves': 'No moves were found in the text you entered.',
        'err.upload_size': 'The file is too large (maximum 1 MB).',
        'err.upload_failed': 'The file could not be read. Please try again.',
        'err.empty_input': 'Upload a PGN file or paste the text of the game.',
        'err.hours_invalid': 'Hours must be a whole number (0 or more).',
        'err.minutes_invalid': 'Minutes must be a whole number between 0 and 59.',
        'err.seconds_invalid': 'Seconds must be a whole number between 0 and 59.'
    };
}(typeof globalThis !== "undefined" ? globalThis : window));
