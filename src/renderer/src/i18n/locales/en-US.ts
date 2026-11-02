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
      toolsConnections: 'Connections…',
      toolsPreferences: 'Preferences',
      helpAbout: 'About'
    },
    toolbar: {
      label: 'Application toolbar',
      connections: 'Connections',
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
      sampleRoot: 'Seshat Lab',
      tables: 'Tables ({count})',
      views: 'Views ({count})',
      events: 'Events ({count})',
      activeBadge: 'Active',
      empty: 'No objects',
      noMatches: 'No matching objects'
    },
    tabs: {
      queryOne: 'Query 1',
      queryNumber: 'Query {number}',
      resultOne: 'Result 1',
      addTab: 'New tab',
      close: 'Close {title}',
      newQuery: 'New query',
      workspaceLabel: 'Workspace tabs'
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
      simulated: 'Connected (simulation)',
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
    },
    workspace: {
      demoNotice: 'Demonstration — read-only',
      notAvailable: 'n/a',
      openData: 'Open data',
      sectionsLabel: 'Sections',
      units: {
        byte: 'B',
        kilobyte: 'KB',
        megabyte: 'MB',
        gigabyte: 'GB',
        terabyte: 'TB'
      },
      values: {
        yes: 'Yes',
        no: 'No',
        global: 'Global',
        session: 'Session',
        none: 'None',
        never: 'Never',
        definer: 'Definer',
        enabled: 'Enabled',
        recurring: 'Recurring',
        preserve: 'Preserve'
      },
      objectTypes: {
        table: 'Table',
        view: 'View',
        event: 'Event'
      },
      connection: {
        title: 'Connection: {name}',
        databases: 'Databases ({count})',
        variables: 'Variables ({count})',
        status: 'Status ({count})',
        processes: 'Processes ({count})',
        commandStats: 'Command statistics ({count})',
        databasesGrid: {
          name: 'Name',
          tables: 'Tables',
          views: 'Views',
          size: 'Size',
          collation: 'Collation'
        },
        variablesGrid: {
          variable: 'Variable',
          value: 'Value',
          scope: 'Scope'
        },
        statusGrid: {
          variable: 'Variable',
          value: 'Value'
        },
        processesGrid: {
          id: 'ID',
          user: 'User',
          host: 'Host',
          database: 'Database',
          command: 'Command',
          time: 'Time',
          state: 'State',
          info: 'Info'
        },
        commandStatsGrid: {
          command: 'Command',
          total: 'Total',
          perHour: 'Per hour',
          perSecond: 'Per second'
        }
      },
      database: {
        title: 'Database: {name}',
        columns: {
          name: 'Name',
          rows: 'Rows',
          size: 'Size',
          createdAt: 'Created at',
          updatedAt: 'Updated at',
          engine: 'Engine',
          comment: 'Comment',
          type: 'Type'
        },
        empty: 'No objects'
      },
      object: {
        tableTitle: 'Table: {name}',
        viewTitle: 'View: {name}',
        eventTitle: 'Event: {name}',
        dataTitle: 'Data: {name}',
        createCodeLabel: 'CREATE code for {name}',
        alterCodeLabel: 'ALTER code for {name}',
        subTabs: {
          basic: 'Basic',
          options: 'Options',
          indexes: 'Indexes',
          foreignKeys: 'Foreign keys',
          checks: 'CHECK constraints',
          partitions: 'Partitions',
          createSql: 'CREATE code',
          alterSql: 'ALTER code'
        },
        fields: {
          name: 'Name',
          database: 'Database',
          engine: 'Engine',
          collation: 'Collation',
          charset: 'Character set',
          rows: 'Rows',
          size: 'Size',
          createdAt: 'Created at',
          updatedAt: 'Updated at',
          comment: 'Comment',
          rowFormat: 'Row format',
          autoIncrement: 'Auto increment',
          compression: 'Compression',
          tablespace: 'Tablespace',
          encryption: 'Encryption',
          definer: 'Definer',
          security: 'SQL security',
          checkOption: 'Check option',
          algorithm: 'Algorithm',
          updatable: 'Updatable',
          status: 'Status',
          type: 'Type',
          schedule: 'Schedule',
          starts: 'Starts',
          ends: 'Ends',
          onCompletion: 'On completion',
          lastExecuted: 'Last executed'
        },
        indexes: {
          name: 'Name',
          columns: 'Columns',
          unique: 'Unique',
          type: 'Type'
        },
        foreignKeys: {
          name: 'Name',
          column: 'Column',
          referencedTable: 'Referenced table',
          referencedColumn: 'Referenced column',
          onUpdate: 'On update',
          onDelete: 'On delete'
        },
        checks: {
          name: 'Name',
          expression: 'Expression',
          enforced: 'Enforced'
        },
        partitions: {
          name: 'Name',
          method: 'Method',
          expression: 'Expression',
          rows: 'Rows',
          size: 'Size'
        },
        emptyGrid: 'No rows'
      },
      data: {
        gridLabel: 'Data for {name}'
      }
    }
  },
  persistence: {
    title: 'Storage',
    warning: {
      recovered: 'The main file was damaged; the last valid backup was loaded.',
      quarantined: 'A damaged file was preserved in quarantine.',
      quarantineFailed: 'A damaged file could not be moved to quarantine.',
      futureVersion: 'A file was written by a newer version and will not be overwritten.',
      migrated: 'An older file was migrated to the current format.',
      largeFile: 'A storage file is larger than 1 MB.',
      fileTooLarge: 'A storage file exceeds the 16 MB safety limit and was not loaded.',
      readFailed: 'A storage file could not be read.',
      defaultsUsed: 'Default settings are in use because no valid file could be read.',
      legacyDirectory: 'A legacy data folder was found and left untouched.',
      saveFailed: 'Could not save your data.'
    },
    close: {
      failed: 'Could not save before closing. The window stays open.'
    },
    actions: {
      retry: 'Retry',
      exitWithoutSaving: 'Exit without saving',
      confirmDiscard: 'Discard unsaved changes and exit?',
      confirmExit: 'Exit',
      cancel: 'Cancel',
      dismiss: 'Dismiss'
    }
  },
  connections: {
    title: 'Connections',
    listLabel: 'Saved connections',
    loading: 'Loading connections…',
    empty: 'No saved connections.',
    notice: {
      writeBlocked:
        'Connection profiles cannot be changed until the storage issue above is resolved.'
    },
    environment: {
      development: 'Development',
      staging: 'Staging',
      production: 'Production',
      custom: 'Custom'
    },
    color: {
      blue: 'Blue',
      green: 'Green',
      amber: 'Amber',
      red: 'Red',
      violet: 'Violet',
      teal: 'Teal',
      pink: 'Pink',
      gray: 'Gray'
    },
    fields: {
      name: 'Name',
      host: 'Host',
      port: 'Port',
      user: 'User',
      password: 'Password',
      passwordSaved: 'A password is saved for this connection.',
      removePassword: 'Remove saved password',
      environment: 'Environment',
      environmentLabel: 'Environment name',
      color: 'Color',
      passwordPlaceholderKeep: 'Leave blank to keep the saved password',
      passwordPlaceholderNone: 'Leave blank to save no password'
    },
    passwordHint:
      'Passwords are encrypted by Windows for the current user and machine. Copying the data folder elsewhere does not reveal them.',
    unsaved: {
      question: 'Discard unsaved changes?'
    },
    delete: {
      question: 'Delete “{name}”?',
      warning:
        'Tabs are kept. Saved SQL that references this connection cannot use the profile until another one is assigned.'
    },
    actions: {
      new: 'New',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      discard: 'Discard',
      keepEditing: 'Keep editing',
      confirmDelete: 'Delete connection',
      cancelDelete: 'Keep connection'
    },
    errors: {
      duplicateName: 'A connection with this name already exists.',
      notFound: 'This connection no longer exists. Reload the list and try again.',
      invalid: 'The connection data is invalid.',
      readonlyNewer:
        'The connection file was written by a newer version and cannot be changed.',
      readFailed: 'The connection file could not be read.',
      fileTooLarge: 'The connection file exceeds the safety limit.',
      ioError: 'Could not save the connection file.',
      encryptionUnavailable:
        'Windows could not encrypt the password. Nothing was saved.',
      decryptionFailed: 'The saved password could not be decrypted.',
      internal: 'An unexpected error occurred.',
      required: 'Required.',
      nameTooLong: 'Use at most 100 characters.',
      hostTooLong: 'Use at most 253 characters.',
      userTooLong: 'Use at most 128 characters.',
      portRange: 'Use a port from 1 to 65535.',
      environmentLabelRequired: 'Describe the custom environment.',
      environmentLabelTooLong: 'Use at most 32 characters.',
      colorRequired: 'Select one of the available colors.'
    }
  },
  grid: {
    nullValue: 'NULL',
    noRowsToShow: 'No rows to show',
    ariaSortableColumn: 'Press Enter to sort'
  }
}

export default messages
