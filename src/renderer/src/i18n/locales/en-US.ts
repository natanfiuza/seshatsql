import type { Messages } from '../types'

const messages: Messages = {
  app: {
    name: 'SeshatSQL'
  },
  shell: {
    disabledHint: 'Not available in this preview.',
    menubar: {
      label: 'Menu bar'
    },
    menu: {
      file: 'File',
      edit: 'Edit',
      query: 'Query',
      view: 'View',
      tools: 'Tools',
      help: 'Help',
      fileNew: 'New',
      fileOpen: 'Open',
      fileSave: 'Save',
      fileSaveAs: 'Save as',
      fileClose: 'Close',
      fileExit: 'Exit',
      editUndo: 'Undo',
      editRedo: 'Redo',
      editCut: 'Cut',
      editCopy: 'Copy',
      editPaste: 'Paste',
      editFind: 'Find',
      editReplace: 'Replace',
      queryExecute: 'Execute',
      queryExecuteSelection: 'Execute selection',
      queryStop: 'Stop',
      queryExplain: 'Explain',
      viewObjectBrowser: 'Object browser',
      viewSqlLog: 'SQL log',
      viewHelpers: 'Helpers panel',
      toolsPreferences: 'Preferences',
      helpAbout: 'About'
    },
    toolbar: {
      label: 'Application toolbar',
      newQuery: 'New query',
      open: 'Open',
      save: 'Save',
      execute: 'Execute',
      stop: 'Stop',
      refresh: 'Refresh',
      filter: 'Filter',
      search: 'Find',
      settings: 'Settings',
      disconnect: 'Disconnect',
      themeLabel: 'Theme',
      localeLabel: 'Language',
      localeHint:
        'The editor language applies on the next launch; the interface and the grid change immediately.'
    },
    theme: {
      system: 'System',
      light: 'Light',
      dark: 'Dark'
    },
    locale: {
      enUS: 'English (United States)',
      ptBR: 'Português (Brasil)',
      ptPT: 'Português (Portugal)',
      fr: 'Français',
      es: 'Español'
    },
    tree: {
      label: 'Object browser',
      filterLabel: 'Filter objects',
      sampleRoot: 'seshat_lab (sample)',
      tables: 'Tables ({count})',
      views: 'Views ({count})',
      empty: 'No objects',
      noMatches: 'No matching objects'
    },
    tabs: {
      queryOne: 'Query 1',
      resultOne: 'Result 1',
      addTab: 'New tab'
    },
    editor: {
      label: 'SQL editor',
      loadFailure: 'The SQL editor could not be loaded.'
    },
    results: {
      label: 'Results',
      copyHint:
        'Select rows and press Ctrl+C to copy with headers; without a selection, the focused cell is copied.'
    },
    helpers: {
      title: 'History',
      empty: 'No queries executed in this session.'
    },
    log: {
      title: 'SQL log',
      clear: 'Clear log',
      empty: 'No queries executed.'
    },
    status: {
      disconnected: 'Disconnected',
      rows: 'Rows: {count}',
      sample: 'Sample data'
    },
    copy: {
      success: 'Copied to the clipboard.',
      failure: 'Could not copy to the clipboard.'
    },
    split: {
      tree: 'Resize object tree',
      editor: 'Resize editor',
      log: 'Resize SQL log'
    }
  },
  grid: {
    nullValue: 'NULL',
    noRowsToShow: 'No rows to show',
    ariaSortableColumn: 'Press Enter to sort'
  }
}

export default messages
