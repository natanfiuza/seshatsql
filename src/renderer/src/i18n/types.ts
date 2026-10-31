/**
 * Shape shared by all message catalogs.
 * Must be a type alias (not an interface): vue-i18n requires an implicit index
 * signature, which TypeScript only infers for type aliases.
 */
export type Messages = {
  app: {
    name: string
  }
  shell: {
    disabledHint: string
    menubar: {
      label: string
    }
    menu: {
      file: string
      edit: string
      query: string
      view: string
      tools: string
      help: string
      fileNew: string
      fileOpen: string
      fileSave: string
      fileSaveAs: string
      fileClose: string
      fileExit: string
      editUndo: string
      editRedo: string
      editCut: string
      editCopy: string
      editPaste: string
      editFind: string
      editReplace: string
      queryExecute: string
      queryExecuteSelection: string
      queryStop: string
      queryExplain: string
      viewObjectBrowser: string
      viewSqlLog: string
      viewHelpers: string
      toolsPreferences: string
      helpAbout: string
    }
    toolbar: {
      label: string
      newQuery: string
      open: string
      save: string
      execute: string
      stop: string
      refresh: string
      filter: string
      search: string
      settings: string
      disconnect: string
      themeLabel: string
      localeLabel: string
      localeHint: string
    }
    theme: {
      system: string
      light: string
      dark: string
    }
    locale: {
      enUS: string
      ptBR: string
      ptPT: string
      fr: string
      es: string
    }
    tree: {
      label: string
      filterLabel: string
      sampleRoot: string
      tables: string
      views: string
      empty: string
      noMatches: string
    }
    tabs: {
      queryOne: string
      resultOne: string
      addTab: string
    }
    editor: {
      label: string
      loadFailure: string
    }
    results: {
      label: string
      copyHint: string
    }
    helpers: {
      title: string
      empty: string
    }
    log: {
      title: string
      clear: string
      empty: string
    }
    status: {
      disconnected: string
      rows: string
      sample: string
    }
    copy: {
      success: string
      failure: string
    }
    split: {
      tree: string
      editor: string
      log: string
    }
  }
  /** Strings handed to AG Grid through localeText; only keys we actually use. */
  grid: {
    nullValue: string
    noRowsToShow: string
    ariaSortableColumn: string
  }
}
