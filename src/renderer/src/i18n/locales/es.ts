import type { Messages } from '../types'

const messages: Messages = {
  app: {
    name: 'SeshatSQL',
    tagline: 'Cliente SQL de escritorio para MySQL'
  },
  lab: {
    title: 'Laboratorio de interfaz',
    intro:
      'Pantalla temporal usada para validar el editor, la cuadrícula, los temas y los idiomas antes de que exista el espacio de trabajo real.',
    themeLabel: 'Tema',
    themeSystem: 'Sistema',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    languageLabel: 'Idioma',
    localeNameEnUS: 'English (United States)',
    localeNamePtBR: 'Português (Brasil)',
    localeNamePtPT: 'Português (Portugal)',
    localeNameFr: 'Français',
    localeNameEs: 'Español',
    editorTitle: 'Editor SQL',
    editorHint: 'SQL de ejemplo. No se usa ninguna conexión.',
    editorLanguageNotice:
      'El idioma del editor se aplica en el próximo inicio; la interfaz y la cuadrícula cambian de inmediato.',
    editorLoadFailure: 'No se pudo cargar el editor SQL.',
    gridTitle: 'Resultado de ejemplo',
    gridHint: 'Filas de ejemplo de solo lectura, incluidos NULL, Unicode y texto largo.',
    copyHint:
      'Seleccione filas y pulse Ctrl+C para copiar con encabezados; sin selección, se copia la celda enfocada.',
    copySuccess: 'Copiado al portapapeles.',
    copyFailure: 'No se pudo copiar al portapapeles.'
  },
  grid: {
    nullValue: 'NULL',
    noRowsToShow: 'No hay filas para mostrar',
    ariaSortableColumn: 'Pulse Intro para ordenar'
  }
}

export default messages
