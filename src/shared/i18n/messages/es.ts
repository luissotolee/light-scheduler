import type { Messages } from './en'

export const es: Messages = {
  'common.cancel': 'Cancelar',
  'common.save': 'Guardar',
  'common.close': 'Cerrar',
  'common.edit': 'Editar',
  'common.remove': 'Eliminar',
  'common.deactivate': 'Desactivar',
  'common.reactivate': 'Reactivar',
  'common.holidays': 'Vacaciones',
  'common.dash': '—',
  'common.back': 'Volver',

  'app.navPrimary': 'Principal',
  'app.footer':
    'Light Scheduler — un planificador semanal de turnos ligero y moderno. Recomendamos respaldar tu trabajo localmente a través de Archivo.',
  'app.contact': 'Contacta al creador',
  'app.supportOnKoFi': 'Apóyame en Ko-fi',

  'nav.home': 'Inicio',
  'nav.scheduler': 'Planificador',
  'nav.calendar': 'Calendario',
  'nav.employees': 'Empleados',
  'nav.summary': 'Horario',
  'nav.archive': 'Archivo',

  'languageSwitcher.changeLanguage': 'Cambiar idioma (actualmente {language})',
  'languageSwitcher.menuLabel': 'Seleccionar idioma',

  'home.description':
    'Un planificador semanal de turnos ligero y moderno para equipos. Todos tus datos permanecen en tu navegador para que puedas continuar justo donde lo dejaste.',
  'home.intro':
    'Planifica turnos diarios durante una semana para muchos empleados y revisa el resultado en un solo lugar.',
  'home.demo.badge': 'Primer paso recomendado',
  'home.demo.title': 'Empieza con la demo guiada',
  'home.demo.cta': 'Iniciar demo',
  'home.feature.scheduler.title': 'Planificador',
  'home.feature.scheduler.description': 'Crea turnos semanales para cada empleado de tu equipo.',
  'home.feature.calendar.title': 'Calendario',
  'home.feature.calendar.description':
    'Guarda días festivos y eventos personalizados para las semanas que planificas.',
  'home.feature.employees.title': 'Empleados',
  'home.feature.employees.description':
    'Mantén los registros de empleados que usan todas las planificaciones.',
  'home.feature.summary.title': 'Horario',
  'home.feature.summary.description':
    'Revisa la semana en una tabla imprimible y guárdala como PDF.',
  'home.feature.archive.title': 'Archivo',
  'home.feature.archive.description':
    'Exporta tus datos como archivos o impórtalos para restaurar tu información.',
  'home.cta': 'Empezar añadiendo empleados',

  'scheduler.title': 'Planificador',
  'scheduler.description':
    'Haz clic en una celda para un turno de 3 horas, arrastra para elegir un rango personalizado, arrastra los bordes de una barra para ajustarla y haz clic derecho en una barra para eliminarla.',
  'scheduler.descriptionPhone':
    'Toca una celda para un turno de 3 horas. Arrastra la tabla para desplazarte. Haz doble toque en un turno y arrástralo para moverlo. Arrastra los bordes de un turno para cambiar su duración, o mantén pulsado un turno y toca × para eliminarlo.',
  'scheduler.gridScrollAria': 'Tabla del horario desplazable. Arrastra para desplazarte.',
  'scheduler.previousWeek': 'Semana anterior',
  'scheduler.nextWeek': 'Semana siguiente',
  'scheduler.weekdays': 'Días de la semana',
  'scheduler.clearAll': 'Borrar todo',
  'scheduler.settings': 'Configuración del horario',
  'scheduler.settings.title': 'Configuración del horario',
  'scheduler.settings.start': 'Hora de inicio',
  'scheduler.settings.startTooltip':
    'Primera hora que se muestra en la tabla. Los turnos fuera de la ventana visible se guardan pero no se muestran.',
  'scheduler.settings.end': 'Hora de fin',
  'scheduler.settings.endTooltip':
    'Última hora que se muestra en la tabla. Si es anterior a la hora de inicio, la planificación continúa al día siguiente.',
  'scheduler.settings.nextDay': 'Termina al día siguiente',
  'scheduler.settings.rate': 'Franja horaria',
  'scheduler.settings.rateTooltip':
    'Intervalo de tiempo que usa la tabla. Las franjas más pequeñas permiten turnos más precisos pero añaden más columnas.',
  'scheduler.settings.rate30': '30 min',
  'scheduler.settings.rate15': '15 min',
  'scheduler.settings.hour': 'Hora',
  'scheduler.settings.minutes': 'Minutos',
  'scheduler.settings.showHeadcount': 'Mostrar empleados por hora',
  'scheduler.settings.showHeadcountTooltip':
    'Añade una insignia junto a cada hora con el mayor número de empleados trabajando al mismo tiempo durante esa hora.',
  'scheduler.confirm.restartHeader': 'Reiniciar planificación semanal',
  'scheduler.confirm.restartMessage':
    'Esto borra todos los turnos y días libres de la semana actual. Los empleados se conservan. Esta acción no se puede deshacer.',
  'scheduler.confirm.restartLabel': 'Reiniciar',
  'scheduler.calendar.markerAria': 'Entradas del calendario: {entries}',
  'scheduler.calendar.multiple': '{count} entradas',

  'weekday.monday': 'Lunes',
  'weekday.tuesday': 'Martes',
  'weekday.wednesday': 'Miércoles',
  'weekday.thursday': 'Jueves',
  'weekday.friday': 'Viernes',
  'weekday.saturday': 'Sábado',
  'weekday.sunday': 'Domingo',

  'duty.manager': 'Encargado',
  'duty.employee': 'Empleado',
  'duty.assistant': 'Asistente',
  'duty.head_manager': 'Gerente',

  'contract.fulltime': 'Jornada completa',
  'contract.part_time': 'Media jornada',
  'contract.weekends': 'Fines de semana',

  'shiftGrid.employee': 'Empleado',
  'shiftGrid.hours': 'Horas',
  'shiftGrid.empty': 'No hay empleados activos disponibles para este día.',
  'shiftGrid.headcountTooltipOne': '{count} empleado programado a las {hour}:00',
  'shiftGrid.headcountTooltipMany': '{count} empleados programados a las {hour}:00',
  'shiftBar.removeHint': 'Haz clic derecho para eliminar este turno',
  'shiftBar.removeHintPhone':
    'Haz doble toque y arrastra para mover; mantén pulsado y toca × para eliminar',
  'shiftBar.removeAction': 'Eliminar este turno',
  'shiftBar.aria':
    'Turno de {name}: de {start} a {end}. Usa las flechas para moverlo, Mayús más flechas para cambiar su duración y Suprimir para eliminarlo.',
  'shiftBar.ariaTouch':
    'Turno de {name}: de {start} a {end}. Haz doble toque y arrastra para moverlo, arrastra sus bordes para cambiar la duración, o mantén pulsado y toca el botón de eliminar para borrarlo.',
  'shiftRow.trackAria': 'Pista de turnos de {name}. Pulsa Intro para añadir un turno de 3 horas.',
  'shiftRow.markOff': 'Marcar a {name} como libre este día',
  'shiftRow.markOn': 'Marcar a {name} como disponible este día',
  'shiftRow.daysOffTooltip':
    '{count} días libres programados para {name} esta semana (mínimo {min}).',

  'weeklyHours.title': 'Horas semanales',
  'weeklyHours.caption': 'Horas semanales planificadas y contratadas por empleado',
  'weeklyHours.metric': 'Métrica',
  'weeklyHours.current': 'Actual',
  'weeklyHours.contract': 'Contrato',
  'weeklyHours.diff': 'Diferencia',
  'weeklyHours.empty': 'No hay empleados disponibles esta semana.',
  'hours.group.head_manager': 'Gerentes',
  'hours.group.manager': 'Encargados',
  'hours.group.assistant': 'Asistentes',
  'hours.group.employee': 'Empleados',

  'employees.title': 'Empleados',
  'employees.description':
    'Gestiona los registros de empleados que se usan al crear planificaciones semanales.',
  'employees.add': 'Añadir empleado',
  'employees.searchLabel': 'Buscar empleados',
  'employees.searchPlaceholder': 'Buscar por nombre',
  'employees.count': 'Empleados activos: {active}/{total}',
  'employees.emptyTitle': 'Aún no hay empleados',
  'employees.emptyDescription': 'Añade tu primer empleado para empezar a crear planificaciones.',
  'employees.noMatchTitle': 'No hay empleados coincidentes',
  'employees.noMatchDescription': 'Prueba con otro nombre.',
  'employees.thisEmployee': 'este empleado',
  'employees.confirm.removeHeader': 'Eliminar empleado',
  'employees.confirm.removeMessage': '¿Eliminar a {name}? Esta acción no se puede deshacer.',
  'employees.confirm.deactivateHeader': 'Desactivar empleado',
  'employees.confirm.deactivateMessage':
    '¿Desactivar a {name}? Su fecha de fin se establecerá a hoy y se excluirá de las planificaciones.',
  'employees.confirm.holidaysHeader': 'Eliminar turnos por vacaciones',
  'employees.confirm.holidaysMessage':
    '{name} ya tiene turnos en las semanas de vacaciones seleccionadas. Guardar las vacaciones eliminará esos turnos.',
  'employees.confirm.removeShifts': 'Eliminar turnos y guardar',
  'employees.hideInactive': 'Solo activos',
  'employees.hideInactive.tooltip':
    'Mostrar solo empleados activos (aquellos no desactivados). Los empleados desactivados se excluyen de las planificaciones.',
  'employees.allInactiveTitle': 'No hay empleados activos',
  'employees.allInactiveDescription':
    'Todos los empleados están desactivados. Desactiva «Solo activos» para verlos.',
  'employees.column.name': 'Nombre',
  'employees.column.duty': 'Puesto',
  'employees.column.contract': 'Contrato',
  'employees.column.weeklyHours': 'Horas semanales',
  'employees.column.contact': 'Contacto',
  'employees.column.actions': 'Acciones',
  'employees.detailsFor': 'Ver detalles de {name}',
  'employees.detailsForInactive': 'Ver detalles de {name} (inactivo)',
  'employees.phone': 'Teléfono: {phone}',
  'employees.email': 'Correo: {email}',
  'employees.editAria': 'Editar {name}',
  'employees.holidaysAria': 'Vacaciones de {name}',
  'employees.deactivateAria': 'Desactivar {name}',
  'employees.reactivateAria': 'Reactivar {name}',
  'employees.removeAria': 'Eliminar {name}',
  'employees.form.addTitle': 'Añadir empleado',
  'employees.form.editTitle': 'Editar empleado',
  'employees.form.name': 'Nombre *',
  'employees.form.duty': 'Puesto *',
  'employees.form.phone': 'Teléfono',
  'employees.form.email': 'Correo electrónico',
  'employees.form.comment': 'Comentario',
  'employees.form.weeklyHours': 'Horas semanales *',
  'employees.form.startDate': 'Fecha de inicio',
  'employees.form.contract': 'Contrato *',
  'employees.form.contractGroup': 'Contrato',
  'employees.form.namePlaceholder': 'p. ej. Juana Pérez',
  'employees.form.phonePlaceholder': 'p. ej. 612 345 678 o +34 612 345 678',
  'employees.form.emailPlaceholder': 'p. ej. juana@example.com',
  'employees.form.commentPlaceholder': 'p. ej. Sin turnos de mañana',
  'employees.form.hoursPlaceholder': 'p. ej. 40',
  'employees.details.title': 'Detalles del empleado',
  'employees.details.empId': 'ID de empleado',
  'employees.details.duty': 'Puesto',
  'employees.details.contract': 'Contrato',
  'employees.details.weeklyHours': 'Horas semanales',
  'employees.details.email': 'Correo electrónico',
  'employees.details.phone': 'Teléfono',
  'employees.details.comment': 'Comentario',
  'employees.details.status': 'Estado',
  'employees.details.startDate': 'Fecha de inicio',
  'employees.details.endDate': 'Fecha de fin',
  'employees.details.holidays': 'Vacaciones',
  'employees.details.noHolidays': 'Sin vacaciones',
  'employees.details.holidayItem': 'Semana {week} ({range})',
  'employees.status.active': 'Activo',
  'employees.status.inactive': 'Inactivo',

  'holidays.title': 'Semanas de vacaciones — {name}',
  'holidays.previousYear': 'Año anterior',
  'holidays.nextYear': 'Año siguiente',
  'holidays.counter': '{count} de {max} seleccionadas en {year}',
  'holidays.group': 'Semanas ISO',
  'weekPicker.title': 'Seleccionar semana',
  'weekPicker.open': 'Seleccionar semana para ver',
  'calendar.weekLabel': 'Semana {week} — {range}',
  'calendar.title': 'Calendario',
  'calendar.description':
    'Importa días festivos de un país y una región y añade festivos o eventos personalizados que aparecen en el planificador.',
  'calendar.importTitle': 'Gestionar días festivos',
  'calendar.country': 'País',
  'calendar.countryPlaceholder': 'Selecciona un país',
  'calendar.region': 'Región',
  'calendar.regionNone': 'Todo el país',
  'calendar.regionPlaceholder': 'Selecciona una región',
  'calendar.year': 'Año',
  'calendar.fetch': 'Importar',
  'calendar.fetching': 'Importando festivos…',
  'calendar.fetchTooltip':
    'Importa los días festivos públicos del país, la región y el año seleccionados',
  'calendar.clearFetchedTooltip': 'Borra todos los días festivos importados',
  'calendar.publicHolidayYearCount': '{year}: {count}',
  'calendar.fetched': 'Se importaron {count} días festivos públicos para {year}.',
  'calendar.noneFound': 'No se encontraron días festivos para ese país, región y año.',
  'calendar.fetchFailed':
    'No se pudieron cargar los festivos. Revisa el país y la región e inténtalo de nuevo.',
  'calendar.noCountry': 'Selecciona primero un país.',
  'calendar.clearFetched': 'Borrar todo',
  'calendar.cleared': 'Se borraron los días festivos importados.',
  'calendar.clearFetchedHeader': 'Borrar festivos importados',
  'calendar.clearFetchedMessage':
    'Esto elimina todos los días festivos importados. Los festivos y eventos personalizados se conservan.',
  'calendar.clearFetchedLabel': 'Borrar',
  'calendar.emptyTitle': 'No hay entradas en el calendario',
  'calendar.emptyDescription':
    'Importa días festivos públicos o añade un festivo o evento personalizado.',
  'calendar.addEntry': 'Añadir festivo o evento',
  'calendar.month.previous': 'Mes anterior',
  'calendar.month.next': 'Mes siguiente',
  'calendar.list.title': 'Entradas de {month}',
  'calendar.list.empty': 'No hay entradas este mes.',
  'calendar.countOne': '{count} entrada',
  'calendar.countMany': '{count} entradas',
  'calendar.kind.public_holiday': 'Día festivo',
  'calendar.kind.custom_holiday': 'Festivo personalizado',
  'calendar.kind.custom_event': 'Evento personalizado',
  'calendar.entry.editAria': 'Editar {name}',
  'calendar.entry.removeAria': 'Eliminar {name}',
  'calendar.importedSuccessfully': 'Importado correctamente',
  'calendar.fetchedBadge': 'Importado',
  'calendar.dayAria': '{date}: {entries}',
  'calendar.touchHint': 'Selecciona un día y toca Añadir festivo o evento.',
  'calendar.loadingOptions': 'Cargando opciones…',
  'calendar.form.addTitle': 'Añadir festivo o evento',
  'calendar.form.editTitle': 'Editar festivo o evento',
  'calendar.form.date': 'Fecha *',
  'calendar.form.name': 'Nombre *',
  'calendar.form.namePlaceholder': 'p. ej. Aniversario de la empresa',
  'calendar.form.kind': 'Tipo *',
  'calendar.form.kindHoliday': 'Festivo',
  'calendar.form.kindEvent': 'Evento',
  'calendar.confirm.removeHeader': 'Eliminar entrada del calendario',
  'calendar.confirm.removeMessage': '¿Eliminar {name} del calendario?',
  'calendar.confirm.removeLabel': 'Eliminar',

  'summary.title': 'Horario',

  'summary.employee': 'Empleado',
  'summary.off': 'LIBRE',
  'summary.vacations': 'VACACIONES',
  'summary.previousWeek': 'Semana anterior',
  'summary.previousWeekTooltip': 'Ver resumen de la semana anterior',
  'summary.nextWeek': 'Semana siguiente',
  'summary.nextWeekTooltip': 'Ver resumen de la semana siguiente',
  'summary.thisWeek': 'Esta semana',
  'summary.caption': 'Horario semanal de {range}',
  'summary.emptyTitle': 'No hay empleados esta semana',
  'summary.emptyDescription':
    'Añade empleados en la página de Empleados para que aparezcan en el horario semanal.',
  'summary.description':
    'Revisa la semana en una tabla imprimible. Imprímela o descárgala como archivo PDF sin abrir el diálogo de impresión.',
  'summary.print': 'Imprimir',
  'summary.savePdf': 'Guardar como PDF',
  'summary.pdfFileLabel': 'Horario',

  'archive.title': 'Archivo',
  'archive.description':
    'Descarga una copia comprimida de todos los empleados, turnos, días libres, festivos y eventos, junto con tu idioma y la configuración del planificador, o restaura una copia para reemplazar tu espacio de trabajo actual.',
  'archive.exportHeading': 'Copia de seguridad',
  'archive.exportCopy':
    'Descarga un archivo JSON comprimido con gzip con todos los empleados, planificaciones, festivos y eventos, además de tu idioma y la configuración del planificador. Conserva los IDs de empleado necesarios para vincular los turnos con las personas.',
  'archive.exportEmployees': 'Exportar empleados',
  'archive.exportSchedule': 'Exportar planificación',
  'archive.importHeading': 'Restaurar',
  'archive.importCopy':
    'Sube un archivo de copia de seguridad para reemplazar todos los empleados, turnos, días libres, festivos, eventos y ajustes de usuario. Restaurar una copia reemplaza todas las semanas del espacio de trabajo.',
  'archive.uploadEmployees': 'Subir empleados',
  'archive.uploadSchedule': 'Subir planificación',
  'archive.noEmployees': 'No hay empleados para exportar',
  'archive.employeesExported': 'Empleados exportados',
  'archive.noShifts': 'No hay turnos para exportar',
  'archive.scheduleExported': 'Planificaciones exportadas',
  'archive.noScheduleRows': 'El archivo de planificación no contiene turnos',
  'archive.schedulesImportedOne': 'Se importó {count} turno',
  'archive.schedulesImportedMany': 'Se importaron {count} turnos',
  'archive.confirm.importHeader': 'Importar planificaciones',
  'archive.confirm.importMessage':
    'Esto reemplaza todos los turnos y días libres de todas las semanas con el contenido del archivo. Esta acción no se puede deshacer.',
  'archive.confirm.importLabel': 'Importar',
  'archive.exportBackup': 'Descargar copia',
  'archive.uploadBackup': 'Restaurar copia',
  'archive.noData': 'No hay datos para respaldar',
  'archive.backupExported': 'Copia de seguridad descargada',
  'archive.backupImported': 'Copia de seguridad restaurada',
  'archive.invalidBackup': 'Este archivo no es una copia de seguridad válida de Light Scheduler',
  'archive.invalidWeek': 'La copia de seguridad contiene un año o semana no válidos',
  'archive.unsupportedVersion': 'Esta versión de copia de seguridad no es compatible',
  'archive.backupTooLarge': 'El archivo de copia de seguridad es demasiado grande (máx. 25 MB)',
  'archive.compressionUnsupported': 'Este navegador no puede leer copias de seguridad comprimidas',
  'archive.confirm.backupHeader': 'Restaurar copia de seguridad',
  'archive.confirm.backupMessage':
    'Esto reemplaza todos los empleados, turnos, días libres, festivos, eventos y ajustes, incluidos el idioma y la configuración del planificador, con el contenido de la copia de seguridad. Esta acción no se puede deshacer.',
  'archive.confirm.backupLabel': 'Restaurar',
  'archive.importedOne': 'Se importó {count} empleado',
  'archive.importedMany': 'Se importaron {count} empleados',
  'archive.rowError': 'Fila {row}: {message}',
  'archive.importFailed': 'La importación falló',
  'csv.tooLarge': 'El archivo CSV es demasiado grande (máx. 5 MB)',
  'csv.unreadable': 'No se pudo leer el archivo seleccionado',
  'csv.empty': 'El archivo CSV está vacío',
  'csv.unterminated': 'Campo entre comillas sin cerrar',

  'errors.requiredName': 'El nombre es obligatorio',
  'errors.invalidDuty': 'El puesto no es válido',
  'errors.invalidContract': 'El contrato no es válido',
  'errors.weeklyHours': 'Las horas semanales deben ser un número mayor que 0 y como máximo 168',
  'errors.invalidEmail': 'El correo electrónico no es válido',
  'errors.invalidPhone': 'El teléfono no es válido',
  'errors.invalidComment': 'El comentario no es válido',
  'errors.maxHolidays': 'Se permiten como máximo 6 semanas de vacaciones por año',
  'errors.invalidStartDate': 'La fecha de inicio no es válida',
  'errors.invalidEndDate': 'La fecha de fin no es válida',
  'errors.endBeforeStart': 'La fecha de fin no puede ser anterior a la fecha de inicio',
  'errors.endRequiredInactive': 'La fecha de fin es obligatoria para los empleados inactivos',
  'errors.endNotAllowedActive': 'La fecha de fin no está permitida para los empleados activos',
  'errors.invalidActive': 'El estado activo no es válido',
  'errors.invalidHolidays': 'Las vacaciones no son válidas',
  'errors.invalidCalendarDate': 'La fecha no es válida',
  'errors.invalidCalendarKind': 'El tipo no es válido',
  'errors.invalidCalendarEntry': 'La entrada del calendario no es válida',
  'errors.duplicateCalendarEntry': 'Esta entrada ya existe en esa fecha',
  'errors.invalidCalendarYear': 'El año no es válido',
  'errors.invalidCountry': 'El país no es válido',
  'errors.invalidRegion': 'La región no es válida',
  'errors.calendarNameTooLong': 'El nombre es demasiado largo',
  'errors.unexpectedHeaders': 'Encabezados CSV inesperados',
  'errors.invalidEmployee': 'Empleado no válido',
  'errors.invalidEmpId': 'El ID de empleado no es válido',
  'errors.duplicateEmpId': 'El ID de empleado está duplicado',
  'errors.missingEmpId': 'El ID de empleado es obligatorio',
  'errors.unknownEmpId': 'El ID de empleado no coincide con ningún empleado',
  'errors.invalidScheduleWeek': 'La semana debe usar el formato Y2026W1',
  'errors.invalidShiftCell': 'La celda de turno no es válida',
  'errors.duplicateScheduleRow': 'Fila de empleado duplicada para esta semana',
  'errors.shiftTimes': 'Las horas del turno deben ser válidas y la de inicio anterior a la de fin',
  'errors.shiftRange': 'El turno debe durar al menos {min} minutos dentro de {start}–{end}',
  'errors.settingsStartTime': 'La hora de inicio no es válida',
  'errors.settingsEndTime': 'La hora de fin no es válida',
  'errors.settingsSlot': 'La franja horaria no es válida',
  'errors.settingsAligned': 'Las horas deben coincidir con la franja horaria seleccionada',
  'errors.settingsSameTimes': 'Las horas de inicio y fin deben ser diferentes',
  'errors.settingsWindow': 'El horario debe cubrir al menos una franja horaria',
  'errors.settingsMaxEnd': 'El horario no puede extenderse más allá de la 01:00 del día siguiente',
  'errors.settingsHeadcount': 'La opción de empleados por hora debe estar activada o desactivada',

  'demo.start': 'Demo',
  'demo.startAria': 'Iniciar la demostración guiada',
  'demo.exit': 'Salir de la demostración',
  'demo.exitAria': 'Salir de la demostración y restaurar tus datos guardados',
  'demo.badge': 'Modo demostración',
  'demo.banner': 'Estás viendo datos de ejemplo. Tus datos guardados se restaurarán al salir.',
  'demo.progress': 'Paso {current} de {total}',
  'demo.narrationAria': 'Narración de la demostración',
  'demo.restored': 'Tus datos guardados se han restaurado.',
  'demo.error.start': 'No se pudo iniciar la demostración. Tus datos guardados no se modificaron.',
  'demo.error.storage':
    'El almacenamiento del navegador no está disponible, por lo que la demostración no puede ejecutarse.',
  'demo.error.restore':
    'No se pudieron restaurar tus datos guardados. Recarga la página para reintentar desde la copia de seguridad.',
  'demo.error.target': 'La demostración se pausó porque no se encontró el siguiente paso.',
  'demo.picker.title': 'Iniciar una demostración guiada',
  'demo.picker.description':
    'Elige una página para explorar con datos de ejemplo. Tus datos guardados se restauran al salir de la demostración.',
  'demo.picker.optionsAria': 'Páginas de la demostración',
  'demo.picker.calendar': 'Calendario',
  'demo.picker.calendarDescription':
    'Importa días festivos por país y región, añade festivos o eventos personalizados y vélos en el planificador.',
  'demo.picker.employees': 'Empleados',
  'demo.picker.employeesDescription':
    'Busca, añade, edita, desactiva, reactiva y elimina miembros del equipo, y gestiona sus semanas de vacaciones.',
  'demo.picker.scheduler': 'Planificador',
  'demo.picker.schedulerDescription':
    'Navega por semanas y días, crea, mueve, redimensiona y elimina turnos, marca días libres y revisa las horas semanales.',
  'demo.picker.summary': 'Resumen',
  'demo.picker.summaryDescription':
    'Revisa el resumen semanal, cambia de semana e imprímelo o guárdalo como PDF.',
  'demo.scenario.employees.intro':
    'Gestiona tu equipo aquí. Las planificaciones usan estos registros.',
  'demo.scenario.employees.search':
    'Escribe un nombre en el buscador para filtrar la lista al instante.',
  'demo.scenario.employees.searchTyping':
    'La lista ahora muestra solo los empleados que coinciden.',
  'demo.scenario.employees.searchClear': 'Borra la búsqueda para ver de nuevo todo el equipo.',
  'demo.scenario.employees.sortDuty':
    'Haz clic en la cabecera de una columna para ordenar la lista, por ejemplo por rol.',
  'demo.scenario.employees.sortName':
    'Haz clic en la cabecera del nombre para volver a ordenar por nombre.',
  'demo.scenario.employees.add':
    'Selecciona Añadir empleado para crear un nuevo miembro del equipo.',
  'demo.scenario.employees.formIntro':
    'Este formulario recopila los datos que usa el planificador.',
  'demo.scenario.employees.formName':
    'Introduce el nombre completo del empleado. Este campo es obligatorio.',
  'demo.scenario.employees.fillName': 'Escribe el nombre aquí.',
  'demo.scenario.employees.formPhone': 'Añade un número de teléfono opcional.',
  'demo.scenario.employees.formEmail': 'Añade un correo electrónico opcional.',
  'demo.scenario.employees.formDuty':
    'Elige el rol que determina el color y la agrupación en las planificaciones.',
  'demo.scenario.employees.formContract': 'Selecciona el tipo de contrato.',
  'demo.scenario.employees.formHours': 'Define las horas semanales. Este campo es obligatorio.',
  'demo.scenario.employees.formStartDate':
    'Elige la fecha de inicio que decide cuándo se puede planificar al empleado.',
  'demo.scenario.employees.formComment':
    'Añade un comentario opcional para notas como disponibilidad o preferencias de turno.',
  'demo.scenario.employees.save': 'Guarda el empleado para añadirlo al equipo.',
  'demo.scenario.employees.saved': 'El nuevo empleado ya aparece en la lista.',
  'demo.scenario.employees.details':
    'Selecciona un nombre para abrir los detalles del empleado y sus semanas de vacaciones.',
  'demo.scenario.employees.detailsDialog':
    'La vista de detalles resume rol, contrato, horas, contacto, comentarios y vacaciones.',
  'demo.scenario.employees.detailsComment':
    'Los comentarios guardados del empleado aparecen al final de los detalles.',
  'demo.scenario.employees.closeDetails': 'Cierra los detalles para volver a la lista.',
  'demo.scenario.employees.holidays': 'Abre el calendario de vacaciones de un empleado.',
  'demo.scenario.employees.holidaysPick':
    'Elige las semanas en las que este empleado está de vacaciones.',
  'demo.scenario.employees.holidaysNextYear':
    'Avanza al año siguiente para elegir una semana sin turnos planificados.',
  'demo.scenario.employees.holidaysSelected':
    'Las semanas seleccionadas aparecen resaltadas. Guarda cuando termines.',
  'demo.scenario.employees.holidaysSaved':
    'Las semanas de vacaciones se guardan para este empleado.',
  'demo.scenario.employees.edit': 'Usa la acción del lápiz para editar un empleado existente.',
  'demo.scenario.employees.editForm': 'El formulario se abre con los valores actuales.',
  'demo.scenario.employees.editName': 'Cambia cualquier campo, por ejemplo el nombre.',
  'demo.scenario.employees.editSaved': 'Al guardar se actualiza el empleado en toda la aplicación.',
  'demo.scenario.employees.deactivate':
    'Usa la acción de desactivar para dejar de planificar a un empleado sin eliminarlo.',
  'demo.scenario.employees.confirmDeactivate':
    'Confirma para desactivar. El empleado sigue en la lista pero queda inactivo.',
  'demo.scenario.employees.deactivated': 'Los empleados inactivos se muestran con su fecha de fin.',
  'demo.scenario.employees.hideInactive':
    'Activa Solo activos para ocultar de la lista a los empleados desactivados.',
  'demo.scenario.employees.hideInactiveOn':
    'La lista ahora muestra solo empleados activos y el contador refleja el filtro.',
  'demo.scenario.employees.hideInactiveOff':
    'Desactívalo para volver a ver a todos los empleados antes de reactivar a uno.',
  'demo.scenario.employees.reactivate':
    'Usa la acción de reactivar para volver a activar al empleado.',
  'demo.scenario.employees.remove':
    'Usa la acción de eliminar para borrar un empleado de forma permanente.',
  'demo.scenario.employees.confirmRemove':
    'Confirma la eliminación. También se eliminan sus turnos.',
  'demo.scenario.employees.removed': 'El empleado se elimina del equipo.',
  'demo.scenario.employees.finish':
    'Esto cubre la página de Empleados. Sal para restaurar tus datos.',
  'demo.scenario.scheduler.intro':
    'Este es el planificador. Cada fila es un miembro del equipo y cada columna es un tramo horario.',
  'demo.scenario.scheduler.week': 'Cambia de semana con estos controles.',
  'demo.scenario.scheduler.weekNext': 'El botón de semana siguiente vuelve a la semana posterior.',
  'demo.scenario.scheduler.weekdayTabs': 'Elige un día de la semana para planificar.',
  'demo.scenario.scheduler.calendarMarkers':
    'Los marcadores del calendario junto a cada día señalan festivos públicos y eventos personalizados.',
  'demo.scenario.scheduler.dayEntries':
    'El día seleccionado también muestra sus festivos y eventos en una etiqueta azul bajo la fecha.',
  'demo.scenario.scheduler.grid':
    'Cada fila es un miembro del equipo y el eje horizontal va de 09:00 a 01:00. En el móvil, arrastra la tabla para desplazarte.',
  'demo.scenario.scheduler.create':
    'Pulsa Enter en una fila, o haz clic y arrastra, para crear un turno. En el móvil, toca una celda.',
  'demo.scenario.scheduler.created': 'Aparece un nuevo turno en la fila.',
  'demo.scenario.scheduler.resize':
    'Arrastra los bordes del turno para redimensionarlo, o usa Mayús con las flechas.',
  'demo.scenario.scheduler.resizeApplied':
    'Mayús con la flecha derecha amplía el final del turno una franja.',
  'demo.scenario.scheduler.move':
    'Arrastra el turno para moverlo dentro de la fila, o usa las flechas. Pulsa Supr para eliminarlo. En el móvil, haz doble toque en el turno y arrástralo; mantén pulsado y toca × para eliminarlo.',
  'demo.scenario.scheduler.moveBetweenRows':
    'Arrastra un turno a la fila de otro empleado para reasignarlo. El turno sale del empleado original y se combina con la agenda del empleado de destino. Las filas deshabilitadas, como días libres y vacaciones, no lo aceptan.',
  'demo.scenario.scheduler.removed': 'El turno se ha eliminado.',
  'demo.scenario.scheduler.dayOff': 'Selecciona el nombre del miembro para marcar un día libre.',
  'demo.scenario.scheduler.dayOffMarked':
    'La fila queda deshabilitada y el contador de días libres se actualiza.',
  'demo.scenario.scheduler.dayOffRestored': 'Selecciona el nombre de nuevo para restaurar el día.',
  'demo.scenario.scheduler.holiday':
    'Los miembros de vacaciones aparecen deshabilitados y se excluyen de la tabla de horas semanales.',
  'demo.scenario.scheduler.hours':
    'La tabla de horas semanales compara las horas planificadas con las del contrato.',
  'demo.scenario.scheduler.hoursDiff':
    'La fila de diferencia resalta las horas planificadas por debajo y por encima de cada empleado.',
  'demo.scenario.scheduler.settingsOpen':
    'Abre la configuración del horario. Cada opción tiene un icono de información con los detalles.',
  'demo.scenario.scheduler.settingsWindow':
    'La vista de configuración se abre con la franja horaria y el tramo actuales.',
  'demo.scenario.scheduler.settingsStart':
    'Elige la hora de inicio con los selectores de hora y minutos.',
  'demo.scenario.scheduler.settingsEnd':
    'Elige la hora de fin de la misma forma. La cuadrícula se amplía o se reduce según el rango.',
  'demo.scenario.scheduler.settingsTooltips':
    'Toca o enfoca el icono de información junto a un ajuste para leer qué hace. En el móvil, la pista también se muestra en línea.',
  'demo.scenario.scheduler.settingsOvernight':
    'Si la hora de fin es anterior al inicio, el horario continúa pasada la medianoche.',
  'demo.scenario.scheduler.settingsSlot':
    'Cambia la franja entre 30 y 15 minutos para modificar el detalle de la cuadrícula.',
  'demo.scenario.scheduler.settingsHeadcount':
    'El interruptor de empleados por hora está junto a su etiqueta, y su icono de información explica la insignia por hora.',
  'demo.scenario.scheduler.settingsHeadcountToggle':
    'Activa el interruptor de empleados por hora para mostrar cuántos empleados trabajan en cada hora.',
  'demo.scenario.scheduler.settingsSaved':
    'Guarda para aplicar la nueva franja y el tamaño del tramo al planificador.',
  'demo.scenario.scheduler.headcount':
    'Cada insignia por hora muestra ahora cuántos empleados están planificados en esa hora.',
  'demo.scenario.scheduler.restart':
    'Usa Borrar todo para eliminar todos los turnos y días libres de la semana actual.',
  'demo.scenario.scheduler.confirmRestart':
    'Confirma para vaciar la semana. Solo afecta a los datos de la demostración.',
  'demo.scenario.scheduler.restarted': 'La semana actual ya está vacía.',
  'demo.scenario.scheduler.weekPicker':
    'Abre el selector de semanas para saltar directamente a cualquier semana del año.',
  'demo.scenario.scheduler.weekPickerDialog':
    'Elige cualquier semana del calendario. La semana actual aparece resaltada.',
  'demo.scenario.scheduler.weekPickerSelected': 'El planificador ahora muestra la semana elegida.',
  'demo.scenario.scheduler.finish':
    'Esto cubre la página del Planificador. Sal para restaurar tus datos.',
  'demo.scenario.calendar.intro':
    'El calendario guarda días festivos y eventos personalizados para tu planificación.',
  'demo.scenario.calendar.toolbar':
    'En la sección de días festivos, elige un país, una región y un año, y luego importa los días festivos.',
  'demo.scenario.calendar.region':
    'Elige una región para acotar los festivos o mantén todo el país.',
  'demo.scenario.calendar.year': 'Elige el año para el que quieres importar los días festivos.',
  'demo.scenario.calendar.fetch': 'Importa los festivos para guardarlos en tu espacio de trabajo.',
  'demo.scenario.calendar.fetched':
    'Los festivos importados aparecen en el calendario y la insignia de estrella muestra el total importado por año.',
  'demo.scenario.calendar.month':
    'Usa las flechas junto al nombre del mes para recorrer el calendario.',
  'demo.scenario.calendar.monthPrevious': 'Pasa al mes anterior.',
  'demo.scenario.calendar.monthNext': 'Vuelve al mes siguiente.',
  'demo.scenario.calendar.selectDay':
    'Selecciona un día para fijarlo y usa Añadir festivo o evento. En escritorio también funciona el doble clic.',
  'demo.scenario.calendar.clear':
    'Usa Borrar todo para eliminar los festivos importados y conservar tus propias entradas.',
  'demo.scenario.calendar.clearConfirm':
    'Confirma la eliminación. Los festivos y eventos personalizados permanecen en el calendario.',
  'demo.scenario.calendar.cleared':
    'Solo quedan tus entradas personalizadas. Ahora añade una nueva.',
  'demo.scenario.calendar.add': 'Añade un festivo o evento personalizado.',
  'demo.scenario.calendar.form':
    'El formulario recopila la fecha, el nombre y el tipo de la entrada.',
  'demo.scenario.calendar.date':
    'La fecha parte del día seleccionado. Puedes elegir cualquier otro día.',
  'demo.scenario.calendar.name': 'Escribe el nombre del festivo o evento.',
  'demo.scenario.calendar.kind':
    'Elige si la entrada es un festivo personalizado o un evento personalizado.',
  'demo.scenario.calendar.save': 'Guarda la entrada para añadirla al calendario.',
  'demo.scenario.calendar.saved': 'La entrada ya está guardada y aparecerá en el planificador.',
  'demo.scenario.calendar.edit': 'Usa la acción del lápiz para editar una entrada personalizada.',
  'demo.scenario.calendar.editForm': 'El formulario se abre con los valores actuales.',
  'demo.scenario.calendar.editName': 'Cambia el nombre, el tipo o la fecha, y luego guarda.',
  'demo.scenario.calendar.editSaved':
    'La entrada actualizada se refleja en el calendario y en el planificador.',
  'demo.scenario.calendar.remove': 'Usa la acción de la papelera para eliminar una entrada personalizada.',
  'demo.scenario.calendar.confirmRemove':
    'Confirma la eliminación. Los festivos importados no se pueden editar de esta forma.',
  'demo.scenario.calendar.removed':
    'La entrada desaparece de la vista del mes y del planificador.',
  'demo.scenario.calendar.finish': 'Eso cubre la página Calendario. Sal para restaurar tus datos.',
  'demo.scenario.summary.intro': 'El resumen muestra la semana de un vistazo.',
  'demo.scenario.summary.week': 'Aquí se muestra la semana actual.',
  'demo.scenario.summary.weekPrevious': 'Pasa a la semana anterior.',
  'demo.scenario.summary.weekNext': 'Pasa a la semana siguiente.',
  'demo.scenario.summary.thisWeek': 'Vuelve a la semana actual.',
  'demo.scenario.summary.weekPicker': 'Abre el selector de semanas para saltar a cualquier semana.',
  'demo.scenario.summary.weekPickerDialog':
    'Elige una semana del calendario. El resumen se actualiza al instante.',
  'demo.scenario.summary.weekPickerSelected': 'El resumen ahora muestra la semana seleccionada.',
  'demo.scenario.summary.backToThisWeek': 'Usa Esta semana para volver a la semana actual.',
  'demo.scenario.summary.table':
    'Cada fila es un miembro del equipo y cada columna es un día, con turnos y vacaciones en un solo lugar.',
  'demo.scenario.summary.vacation':
    'Los empleados de vacaciones toda la semana aparecen como una única fila de vacaciones.',
  'demo.scenario.summary.details':
    'Selecciona un nombre para abrir los detalles del empleado desde el resumen.',
  'demo.scenario.summary.detailsDialog':
    'La misma vista de detalles se abre aquí, con la información de contacto y vacaciones.',
  'demo.scenario.summary.detailsClose': 'Ciérralo para volver al resumen.',
  'demo.scenario.summary.print': 'Imprime el resumen con el diálogo de impresión del navegador.',
  'demo.scenario.summary.pdf': 'Guarda el resumen como archivo PDF.',
  'demo.scenario.summary.finish': 'Esto cubre la página de Resumen. Sal para restaurar tus datos.',
}
