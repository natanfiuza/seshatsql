import type { Messages } from '../types'

const messages: Messages = {
  app: {
    name: 'SeshatSQL'
  },
  shell: {
    disabledHint: 'No disponible en esta vista previa.',
    menubar: {
      label: 'Barra de menú'
    },
    menu: {
      file: 'Archivo',
      edit: 'Edición',
      query: 'Consulta',
      view: 'Ver',
      tools: 'Herramientas',
      help: 'Ayuda',
      fileNew: 'Nuevo',
      fileOpen: 'Abrir',
      fileSave: 'Guardar',
      fileSaveAs: 'Guardar como',
      fileClose: 'Cerrar',
      fileExit: 'Salir',
      editUndo: 'Deshacer',
      editRedo: 'Rehacer',
      editCut: 'Cortar',
      editCopy: 'Copiar',
      editPaste: 'Pegar',
      editFind: 'Buscar',
      editReplace: 'Reemplazar',
      queryExecute: 'Ejecutar',
      queryExecuteSelection: 'Ejecutar selección',
      queryStop: 'Detener',
      queryExplain: 'Explicar',
      viewObjectBrowser: 'Árbol de objetos',
      viewSqlLog: 'Registro SQL',
      viewHelpers: 'Panel auxiliar',
      toolsPreferences: 'Preferencias',
      helpAbout: 'Acerca de'
    },
    toolbar: {
      label: 'Barra de herramientas',
      newQuery: 'Nueva consulta',
      open: 'Abrir',
      save: 'Guardar',
      execute: 'Ejecutar',
      stop: 'Detener',
      refresh: 'Actualizar',
      filter: 'Filtrar',
      search: 'Buscar',
      settings: 'Configuración',
      disconnect: 'Desconectar',
      themeLabel: 'Tema',
      localeLabel: 'Idioma',
      localeHint:
        'El idioma del editor se aplica en el próximo inicio; la interfaz y la cuadrícula cambian de inmediato.'
    },
    theme: {
      system: 'Sistema',
      light: 'Claro',
      dark: 'Oscuro'
    },
    locale: {
      enUS: 'English (United States)',
      ptBR: 'Português (Brasil)',
      ptPT: 'Português (Portugal)',
      fr: 'Français',
      es: 'Español'
    },
    tree: {
      label: 'Explorador de objetos',
      filterLabel: 'Filtrar objetos',
      sampleRoot: 'seshat_lab (ejemplo)',
      tables: 'Tablas ({count})',
      views: 'Vistas ({count})',
      empty: 'Ningún objeto',
      noMatches: 'Ningún objeto coincidente'
    },
    tabs: {
      queryOne: 'Consulta 1',
      resultOne: 'Resultado 1',
      addTab: 'Nueva pestaña'
    },
    editor: {
      label: 'Editor SQL',
      loadFailure: 'No se pudo cargar el editor SQL.'
    },
    results: {
      label: 'Resultados',
      copyHint:
        'Seleccione filas y pulse Ctrl+C para copiar con encabezados; sin selección, se copia la celda enfocada.'
    },
    helpers: {
      title: 'Historial',
      empty: 'No se ejecutó ninguna consulta en esta sesión.'
    },
    log: {
      title: 'Registro SQL',
      clear: 'Borrar registro',
      empty: 'No se ejecutó ninguna consulta.'
    },
    status: {
      disconnected: 'Desconectado',
      rows: 'Filas: {count}',
      sample: 'Datos de ejemplo'
    },
    copy: {
      success: 'Copiado al portapapeles.',
      failure: 'No se pudo copiar al portapapeles.'
    },
    split: {
      tree: 'Redimensionar el árbol de objetos',
      editor: 'Redimensionar el editor',
      log: 'Redimensionar el registro SQL'
    }
  },
  grid: {
    nullValue: 'NULL',
    noRowsToShow: 'No hay filas para mostrar',
    ariaSortableColumn: 'Pulse Intro para ordenar'
  }
}

export default messages
