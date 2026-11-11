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

  'app.navPrimary': 'Principal',
  'app.footer':
    'Light Scheduler — un planificador semanal de turnos solo de frontend. Recomendamos respaldar tu trabajo localmente a través de Archivo.',

  'nav.home': 'Inicio',
  'nav.scheduler': 'Planificador',
  'nav.employees': 'Empleados',
  'nav.summary': 'Horario',
  'nav.archive': 'Archivo',

  'languageSwitcher.changeLanguage': 'Cambiar idioma (actualmente {language})',
  'languageSwitcher.menuLabel': 'Seleccionar idioma',

  'home.description':
    'Un planificador semanal de turnos ligero y moderno para equipos. Es solo de frontend: todos los datos permanecen en tu navegador y se intercambian mediante archivos CSV para que puedas continuar donde lo dejaste.',
  'home.intro':
    'Planifica turnos diarios durante una semana para muchos empleados y revisa el resultado sin backend.',
  'home.feature.scheduler.title': 'Planificador',
  'home.feature.scheduler.description': 'Crea turnos semanales para cada empleado de tu equipo.',
  'home.feature.employees.title': 'Empleados',
  'home.feature.employees.description':
    'Mantén los registros de empleados que usan todas las planificaciones.',
  'home.feature.summary.title': 'Horario',
  'home.feature.summary.description':
    'Revisa la semana en una tabla imprimible y guárdala como PDF.',
  'home.feature.archive.title': 'Archivo',
  'home.feature.archive.description':
    'Exporta tus datos como archivos o impórtalos para restaurar tu información.',
  'home.cta': 'Empezar a planificar',

  'scheduler.title': 'Planificador',
  'scheduler.description':
    'Haz clic en una celda para un turno de 3 horas, arrastra para elegir un rango personalizado, arrastra los bordes de una barra para ajustarla y haz clic derecho en una barra para eliminarla.',
  'scheduler.previousWeek': 'Semana anterior',
  'scheduler.nextWeek': 'Semana siguiente',
  'scheduler.weekdays': 'Días de la semana',
  'scheduler.clearAll': 'Borrar todo',
  'scheduler.settings': 'Configuración del horario',
  'scheduler.settings.title': 'Configuración del horario',
  'scheduler.settings.description':
    'Elige los límites de tiempo visibles y la franja horaria que usa la tabla.',
  'scheduler.settings.start': 'Hora de inicio',
  'scheduler.settings.end': 'Hora de fin',
  'scheduler.settings.nextDay': 'Termina al día siguiente',
  'scheduler.settings.rate': 'Franja horaria',
  'scheduler.settings.rate30': '30 min',
  'scheduler.settings.rate15': '15 min',
  'scheduler.settings.hour': 'Hora',
  'scheduler.settings.minutes': 'Minutos',
  'scheduler.settings.outsideWindow':
    'Los turnos fuera de estos límites se guardan pero no se muestran en la tabla.',
  'scheduler.confirm.restartHeader': 'Reiniciar planificación semanal',
  'scheduler.confirm.restartMessage':
    'Esto borra todos los turnos y días libres de la semana actual. Los empleados se conservan. Esta acción no se puede deshacer.',
  'scheduler.confirm.restartLabel': 'Reiniciar',

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
  'shiftBar.removeHint': 'Haz clic derecho para eliminar este turno',
  'shiftBar.aria':
    'Turno de {name}: de {start} a {end}. Usa las flechas para moverlo, Mayús más flechas para cambiar su duración y Suprimir para eliminarlo.',
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
  'employees.count': 'Empleados: {count}',
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
  'calendar.weekLabel': 'Semana {week} — {range}',

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
    'Descarga una copia comprimida de todos los empleados, turnos y días libres, junto con el idioma y los ajustes del planificador, o restaura una copia para reemplazar el espacio de trabajo actual.',
  'archive.exportHeading': 'Copia de seguridad',
  'archive.exportCopy':
    'Descarga un archivo JSON comprimido con gzip con todos los empleados y planificaciones, además del idioma y los ajustes del planificador. Conserva los ID de empleado necesarios para vincular los turnos con las personas.',
  'archive.exportEmployees': 'Exportar empleados',
  'archive.exportSchedule': 'Exportar planificación',
  'archive.importHeading': 'Restaurar',
  'archive.importCopy':
    'Sube un archivo de copia de seguridad para reemplazar todos los empleados, turnos, días libres y ajustes de usuario. Restaurar una copia reemplaza todas las semanas del espacio de trabajo.',
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
    'Esto reemplaza todos los empleados, turnos y días libres, incluidos el idioma y los ajustes del planificador, con el contenido de la copia de seguridad. Esta acción no se puede deshacer.',
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
    'El diálogo de detalles resume rol, contrato, horas, contacto, comentarios y vacaciones.',
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
  'demo.scenario.scheduler.grid':
    'Cada fila es un miembro del equipo y el eje horizontal va de 09:00 a 01:00.',
  'demo.scenario.scheduler.create':
    'Pulsa Enter en una fila, o haz clic y arrastra, para crear un turno.',
  'demo.scenario.scheduler.created': 'Aparece un nuevo turno en la fila.',
  'demo.scenario.scheduler.resize':
    'Arrastra los bordes del turno para redimensionarlo, o usa Mayús con las flechas.',
  'demo.scenario.scheduler.move':
    'Arrastra el turno para moverlo, o usa las flechas. Pulsa Supr para eliminarlo.',
  'demo.scenario.scheduler.removed': 'El turno se ha eliminado.',
  'demo.scenario.scheduler.dayOff': 'Selecciona el nombre del miembro para marcar un día libre.',
  'demo.scenario.scheduler.dayOffMarked':
    'La fila queda deshabilitada y el contador de días libres se actualiza.',
  'demo.scenario.scheduler.dayOffRestored': 'Selecciona el nombre de nuevo para restaurar el día.',
  'demo.scenario.scheduler.hours':
    'La tabla de horas semanales compara las horas planificadas con las del contrato.',
  'demo.scenario.scheduler.settingsOpen':
    'Abre la configuración del horario para cambiar la franja visible y el tamaño del tramo de la cuadrícula.',
  'demo.scenario.scheduler.settingsWindow':
    'Define la hora de inicio y de fin. Si la hora de fin es anterior al inicio, el horario continúa pasada la medianoche.',
  'demo.scenario.scheduler.settingsSlot':
    'Cambia la franja entre 30 y 15 minutos para modificar el detalle de la cuadrícula.',
  'demo.scenario.scheduler.settingsSaved':
    'Guarda para aplicar la nueva franja y el tamaño del tramo al planificador.',
  'demo.scenario.scheduler.restart':
    'Usa Borrar todo para eliminar todos los turnos y días libres de la semana actual.',
  'demo.scenario.scheduler.confirmRestart':
    'Confirma para vaciar la semana. Solo afecta a los datos de la demostración.',
  'demo.scenario.scheduler.restarted': 'La semana actual ya está vacía.',
  'demo.scenario.scheduler.finish':
    'Esto cubre la página del Planificador. Sal para restaurar tus datos.',
  'demo.scenario.summary.intro': 'El resumen muestra la semana de un vistazo.',
  'demo.scenario.summary.week': 'Aquí se muestra la semana actual.',
  'demo.scenario.summary.weekPrevious': 'Pasa a la semana anterior.',
  'demo.scenario.summary.weekNext': 'Pasa a la semana siguiente.',
  'demo.scenario.summary.thisWeek': 'Vuelve a la semana actual.',
  'demo.scenario.summary.table':
    'Cada fila es un miembro del equipo y cada columna es un día, con turnos y vacaciones en un solo lugar.',
  'demo.scenario.summary.print': 'Imprime el resumen con el diálogo de impresión del navegador.',
  'demo.scenario.summary.pdf': 'Guarda el resumen como archivo PDF.',
  'demo.scenario.summary.finish': 'Esto cubre la página de Resumen. Sal para restaurar tus datos.',
}
