/*
 * PGNClocker JS - cadenas en español.
 * Basado en PGNClocker, Copyright © 2025 Alessio Martorana - GNU GPL v3 o posterior.
 */
(function (g) {
    "use strict";
    var ns = g.PgnClocker = g.PgnClocker || {};
    ns.lang = ns.lang || {};
    ns.lang.es = {
        // Layout
        'app.tagline': 'Añade los tiempos del reloj a las jugadas de una partida de ajedrez en un archivo PGN',
        'lang.switch': 'Idioma',
        'footer.based_on': 'Versión solo navegador (JavaScript) basada en',
        'footer.author': 'de Alessio Martorana',
        'footer.license': 'Software libre con licencia',
        'footer.gpl': 'GNU GPL v3 o posterior',

        // Página de carga
        'upload.title': 'Cargar una partida',
        'upload.intro': 'Sube un archivo PGN o pega el texto de la partida. Después recorrerás las jugadas una a una, introduciendo para cada una el tiempo que queda en el reloj, y exportarás un PGN con anotaciones [%clk] (útil, por ejemplo, para importar la partida en un estudio de Lichess).',
        'upload.privacy': 'Todo ocurre en tu navegador: la partida no se envía nunca a ningún servidor.',
        'upload.resume_text': 'Ya tienes una partida en curso.',
        'upload.resume_link': 'Continúa donde lo dejaste',
        'upload.file_label': 'Archivo PGN',
        'upload.or': 'o',
        'upload.text_label': 'Texto PGN',
        'upload.submit': 'Continuar',
        'upload.limits': 'Limitaciones',
        'upload.limit_game': 'El PGN debe contener una sola partida (si contiene varias, se usa la primera).',
        'upload.limit_main': 'Los tiempos solo se pueden establecer en las jugadas de la línea principal; las variantes se conservan pero no se editan.',
        'upload.limit_size': 'Tamaño máximo: 1 MB.',

        // Ventana principal (jugada actual)
        'edit.move': 'Jugada:',
        'edit.position': 'Media jugada {current} de {total}',
        'edit.help': 'Introduce el tiempo que queda en el reloj después de esta jugada. Los campos vacíos cuentan como 0; si los tres están vacíos, no se establece ningún tiempo para la jugada.',
        'edit.hours': 'Horas',
        'edit.minutes': 'Minutos',
        'edit.seconds': 'Segundos',
        'edit.prev': 'Jugada anterior',
        'edit.next': 'Jugada siguiente',
        'edit.preview': 'Vista previa del PGN',
        'edit.export': 'Exportar PGN',
        'edit.last_reached': 'Has llegado a la última jugada',
        'edit.fix_errors': 'Corrige los campos resaltados.',
        'edit.multi_games': 'El archivo contiene más de una partida: solo se usa la primera.',
        'edit.variations': 'La partida contiene variantes: se conservan, pero los tiempos solo se pueden establecer en la línea principal.',
        'edit.new_game': 'Cargar otra partida',

        // Vista previa
        'preview.title': 'Vista previa del PGN',
        'preview.help': 'Haz clic en una jugada para editar su tiempo.',
        'preview.summary': '{set} de {total} jugadas tienen un tiempo establecido.',
        'preview.col_move': 'Jugada',
        'preview.col_clock': 'Reloj',
        'preview.back': 'Volver a la edición',
        'preview.export': 'Exportar PGN',

        // Resultado
        'result.title': '¡Listo!',
        'result.success': 'El PGN con los tiempos del reloj está listo.',
        'result.pgn_label': 'PGN generado',
        'result.file_label': 'Nombre del archivo',
        'result.download': 'Descargar',
        'result.copy': 'Copiar al portapapeles',
        'result.copied': '¡Copiado!',
        'result.back': 'Volver a la edición',
        'result.new_game': 'Nueva partida',
        'default_filename': 'partida-con-tiempos',

        // Errores
        'err.no_moves': 'No se encontró ninguna jugada en el texto introducido.',
        'err.upload_size': 'El archivo es demasiado grande (máximo 1 MB).',
        'err.upload_failed': 'No se pudo leer el archivo. Inténtalo de nuevo.',
        'err.empty_input': 'Sube un archivo PGN o pega el texto de la partida.',
        'err.hours_invalid': 'Las horas deben ser un número entero (0 o más).',
        'err.minutes_invalid': 'Los minutos deben ser un número entero entre 0 y 59.',
        'err.seconds_invalid': 'Los segundos deben ser un número entero entre 0 y 59.'
    };
}(typeof globalThis !== "undefined" ? globalThis : window));
