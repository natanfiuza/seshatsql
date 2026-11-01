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
      toolsConnections: 'Conexiones…',
      toolsPreferences: 'Preferencias',
      helpAbout: 'Acerca de'
    },
    toolbar: {
      label: 'Barra de herramientas',
      connections: 'Conexiones',
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
  persistence: {
    title: 'Almacenamiento',
    warning: {
      recovered: 'El archivo principal estaba dañado; se cargó la última copia de seguridad válida.',
      quarantined: 'Un archivo dañado se conservó en cuarentena.',
      quarantineFailed: 'No se pudo mover un archivo dañado a la cuarentena.',
      futureVersion: 'Un archivo fue escrito por una versión más reciente y no se sobrescribirá.',
      migrated: 'Un archivo antiguo se migró al formato actual.',
      largeFile: 'Un archivo de almacenamiento supera 1 MB.',
      fileTooLarge:
        'Un archivo de almacenamiento supera el límite de seguridad de 16 MB y no se cargó.',
      readFailed: 'No se pudo leer un archivo de almacenamiento.',
      defaultsUsed: 'Se usan valores predeterminados porque no se pudo leer ningún archivo válido.',
      legacyDirectory: 'Se encontró una carpeta de datos heredada y se dejó intacta.',
      saveFailed: 'No se pudieron guardar tus datos.'
    },
    close: {
      failed: 'No se pudo guardar antes de cerrar. La ventana permanece abierta.'
    },
    actions: {
      retry: 'Reintentar',
      exitWithoutSaving: 'Salir sin guardar',
      confirmDiscard: '¿Descartar los cambios sin guardar y salir?',
      confirmExit: 'Salir',
      cancel: 'Cancelar',
      dismiss: 'Descartar'
    }
  },
  connections: {
    title: 'Conexiones',
    listLabel: 'Conexiones guardadas',
    loading: 'Cargando conexiones…',
    empty: 'No hay conexiones guardadas.',
    notice: {
      writeBlocked:
        'No se pueden modificar los perfiles de conexión hasta resolver el problema de almacenamiento anterior.'
    },
    environment: {
      development: 'Desarrollo',
      staging: 'Preproducción',
      production: 'Producción',
      custom: 'Personalizado'
    },
    color: {
      blue: 'Azul',
      green: 'Verde',
      amber: 'Ámbar',
      red: 'Rojo',
      violet: 'Violeta',
      teal: 'Turquesa',
      pink: 'Rosa',
      gray: 'Gris'
    },
    fields: {
      name: 'Nombre',
      host: 'Servidor',
      port: 'Puerto',
      user: 'Usuario',
      password: 'Contraseña',
      passwordSaved: 'Hay una contraseña guardada para esta conexión.',
      removePassword: 'Quitar contraseña guardada',
      environment: 'Entorno',
      environmentLabel: 'Nombre del entorno',
      color: 'Color',
      passwordPlaceholderKeep: 'Deje vacío para conservar la contraseña guardada',
      passwordPlaceholderNone: 'Deje vacío para no guardar contraseña'
    },
    passwordHint:
      'Windows cifra las contraseñas para el usuario y la máquina actuales. Copiar la carpeta de datos a otro lugar no las revela.',
    unsaved: {
      question: '¿Descartar los cambios sin guardar?'
    },
    delete: {
      question: '¿Eliminar «{name}»?',
      warning:
        'Las pestañas se conservan. El SQL guardado que referencia esta conexión no podrá usar el perfil hasta que se asigne otro.'
    },
    actions: {
      new: 'Nuevo',
      delete: 'Eliminar',
      save: 'Guardar',
      cancel: 'Cancelar',
      discard: 'Descartar',
      keepEditing: 'Seguir editando',
      confirmDelete: 'Eliminar conexión',
      cancelDelete: 'Conservar conexión'
    },
    errors: {
      duplicateName: 'Ya existe una conexión con este nombre.',
      notFound: 'Esta conexión ya no existe. Recargue la lista e inténtelo de nuevo.',
      invalid: 'Los datos de la conexión no son válidos.',
      readonlyNewer:
        'El archivo de conexiones fue escrito por una versión más reciente y no se puede modificar.',
      readFailed: 'No se pudo leer el archivo de conexiones.',
      fileTooLarge: 'El archivo de conexiones supera el límite de seguridad.',
      ioError: 'No se pudo guardar el archivo de conexiones.',
      encryptionUnavailable:
        'Windows no pudo cifrar la contraseña. No se guardó nada.',
      decryptionFailed: 'No se pudo descifrar la contraseña guardada.',
      internal: 'Se produjo un error inesperado.',
      required: 'Obligatorio.',
      nameTooLong: 'Use como máximo 100 caracteres.',
      hostTooLong: 'Use como máximo 253 caracteres.',
      userTooLong: 'Use como máximo 128 caracteres.',
      portRange: 'Use un puerto entre 1 y 65535.',
      environmentLabelRequired: 'Describa el entorno personalizado.',
      environmentLabelTooLong: 'Use como máximo 32 caracteres.',
      colorRequired: 'Seleccione uno de los colores disponibles.'
    }
  },
  grid: {
    nullValue: 'NULL',
    noRowsToShow: 'No hay filas para mostrar',
    ariaSortableColumn: 'Pulse Intro para ordenar'
  }
}

export default messages
