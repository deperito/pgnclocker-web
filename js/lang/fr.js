/*
 * PGNClocker JS - chaînes en français.
 * Basé sur PGNClocker, Copyright © 2025 Alessio Martorana - GNU GPL v3 ou ultérieure.
 */
(function (g) {
    "use strict";
    var ns = g.PgnClocker = g.PgnClocker || {};
    ns.lang = ns.lang || {};
    ns.lang.fr = {
        // Mise en page
        'app.tagline': "Ajoutez les temps de la pendule aux coups d'une partie d'échecs dans un fichier PGN",
        'lang.switch': 'Langue',
        'footer.based_on': 'Version navigateur uniquement (JavaScript) basée sur',
        'footer.author': 'de Alessio Martorana',
        'footer.license': 'Logiciel libre sous licence',
        'footer.gpl': 'GNU GPL v3 ou ultérieure',

        // Page de chargement
        'upload.title': 'Charger une partie',
        'upload.intro': "Téléversez un fichier PGN ou collez le texte de la partie. Vous parcourrez ensuite les coups un par un, en saisissant pour chacun le temps restant sur la pendule, puis vous exporterez un PGN avec des annotations [%clk] (pratique, par exemple, pour importer la partie dans une étude Lichess).",
        'upload.privacy': "Tout se passe dans votre navigateur : la partie n'est jamais envoyée à un serveur.",
        'upload.resume_text': 'Vous avez déjà une partie en cours.',
        'upload.resume_link': 'Reprendre là où vous vous êtes arrêté',
        'upload.file_label': 'Fichier PGN',
        'upload.or': 'ou',
        'upload.text_label': 'Texte PGN',
        'upload.submit': 'Continuer',
        'upload.limits': 'Limites',
        'upload.limit_game': "Le PGN doit contenir une seule partie (s'il en contient plusieurs, la première est utilisée).",
        'upload.limit_main': 'Les temps ne peuvent être saisis que sur les coups de la ligne principale ; les variantes sont conservées mais non modifiées.',
        'upload.limit_size': 'Taille maximale : 1 Mo.',

        // Fenêtre principale (coup courant)
        'edit.move': 'Coup :',
        'edit.position': 'Demi-coup {current} sur {total}',
        'edit.help': "Saisissez le temps restant sur la pendule après ce coup. Les champs vides comptent pour 0 ; si les trois sont vides, aucun temps n'est défini pour le coup.",
        'edit.hours': 'Heures',
        'edit.minutes': 'Minutes',
        'edit.seconds': 'Secondes',
        'edit.prev': 'Coup précédent',
        'edit.next': 'Coup suivant',
        'edit.preview': 'Aperçu du PGN',
        'edit.export': 'Exporter le PGN',
        'edit.last_reached': 'Dernier coup atteint',
        'edit.fix_errors': 'Veuillez corriger les champs en surbrillance.',
        'edit.multi_games': 'Le fichier contient plusieurs parties : seule la première est utilisée.',
        'edit.variations': 'La partie contient des variantes : elles sont conservées, mais les temps ne peuvent être définis que sur la ligne principale.',
        'edit.new_game': 'Charger une autre partie',

        // Aperçu
        'preview.title': 'Aperçu du PGN',
        'preview.help': 'Cliquez sur un coup pour modifier son temps.',
        'preview.summary': '{set} coups sur {total} ont un temps défini.',
        'preview.col_move': 'Coup',
        'preview.col_clock': 'Pendule',
        'preview.back': 'Retour à la modification',
        'preview.export': 'Exporter le PGN',

        // Résultat
        'result.title': 'Terminé !',
        'result.success': 'Le PGN avec les temps de la pendule est prêt.',
        'result.pgn_label': 'PGN généré',
        'result.file_label': 'Nom du fichier',
        'result.download': 'Télécharger',
        'result.copy': 'Copier dans le presse-papiers',
        'result.copied': 'Copié !',
        'result.back': 'Retour à la modification',
        'result.new_game': 'Nouvelle partie',
        'default_filename': 'partie-avec-temps',

        // Erreurs
        'err.no_moves': "Aucun coup n'a été trouvé dans le texte saisi.",
        'err.upload_size': 'Le fichier est trop volumineux (1 Mo maximum).',
        'err.upload_failed': "Le fichier n'a pas pu être lu. Veuillez réessayer.",
        'err.empty_input': 'Téléversez un fichier PGN ou collez le texte de la partie.',
        'err.hours_invalid': 'Les heures doivent être un nombre entier (0 ou plus).',
        'err.minutes_invalid': 'Les minutes doivent être un nombre entier compris entre 0 et 59.',
        'err.seconds_invalid': 'Les secondes doivent être un nombre entier compris entre 0 et 59.'
    };
}(typeof globalThis !== "undefined" ? globalThis : window));
