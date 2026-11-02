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
      toolsConnections: string
      toolsPreferences: string
      helpAbout: string
    }
    toolbar: {
      label: string
      connections: string
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
      events: string
      activeBadge: string
      empty: string
      noMatches: string
    }
    tabs: {
      queryOne: string
      queryNumber: string
      resultOne: string
      addTab: string
      close: string
      newQuery: string
      workspaceLabel: string
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
      simulated: string
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
    workspace: {
      demoNotice: string
      notAvailable: string
      openData: string
      sectionsLabel: string
      units: {
        byte: string
        kilobyte: string
        megabyte: string
        gigabyte: string
        terabyte: string
      }
      values: {
        yes: string
        no: string
        global: string
        session: string
        none: string
        never: string
        definer: string
        enabled: string
        recurring: string
        preserve: string
      }
      objectTypes: {
        table: string
        view: string
        event: string
      }
      connection: {
        title: string
        databases: string
        variables: string
        status: string
        processes: string
        commandStats: string
        databasesGrid: {
          name: string
          tables: string
          views: string
          size: string
          collation: string
        }
        variablesGrid: {
          variable: string
          value: string
          scope: string
        }
        statusGrid: {
          variable: string
          value: string
        }
        processesGrid: {
          id: string
          user: string
          host: string
          database: string
          command: string
          time: string
          state: string
          info: string
        }
        commandStatsGrid: {
          command: string
          total: string
          perHour: string
          perSecond: string
        }
      }
      database: {
        title: string
        columns: {
          name: string
          rows: string
          size: string
          createdAt: string
          updatedAt: string
          engine: string
          comment: string
          type: string
        }
        empty: string
      }
      object: {
        tableTitle: string
        viewTitle: string
        eventTitle: string
        dataTitle: string
        createCodeLabel: string
        alterCodeLabel: string
        subTabs: {
          basic: string
          options: string
          indexes: string
          foreignKeys: string
          checks: string
          partitions: string
          createSql: string
          alterSql: string
        }
        fields: {
          name: string
          database: string
          engine: string
          collation: string
          charset: string
          rows: string
          size: string
          createdAt: string
          updatedAt: string
          comment: string
          rowFormat: string
          autoIncrement: string
          compression: string
          tablespace: string
          encryption: string
          definer: string
          security: string
          checkOption: string
          algorithm: string
          updatable: string
          status: string
          type: string
          schedule: string
          starts: string
          ends: string
          onCompletion: string
          lastExecuted: string
        }
        indexes: {
          name: string
          columns: string
          unique: string
          type: string
        }
        foreignKeys: {
          name: string
          column: string
          referencedTable: string
          referencedColumn: string
          onUpdate: string
          onDelete: string
        }
        checks: {
          name: string
          expression: string
          enforced: string
        }
        partitions: {
          name: string
          method: string
          expression: string
          rows: string
          size: string
        }
        emptyGrid: string
      }
      data: {
        gridLabel: string
      }
    }
  }
  persistence: {
    title: string
    warning: {
      recovered: string
      quarantined: string
      quarantineFailed: string
      futureVersion: string
      migrated: string
      largeFile: string
      fileTooLarge: string
      readFailed: string
      defaultsUsed: string
      legacyDirectory: string
      saveFailed: string
    }
    close: {
      failed: string
    }
    actions: {
      retry: string
      exitWithoutSaving: string
      confirmDiscard: string
      confirmExit: string
      cancel: string
      dismiss: string
    }
  }
  connections: {
    title: string
    listLabel: string
    loading: string
    empty: string
    notice: {
      writeBlocked: string
    }
    environment: {
      development: string
      staging: string
      production: string
      custom: string
    }
    color: {
      blue: string
      green: string
      amber: string
      red: string
      violet: string
      teal: string
      pink: string
      gray: string
    }
    fields: {
      name: string
      host: string
      port: string
      user: string
      password: string
      passwordSaved: string
      removePassword: string
      environment: string
      environmentLabel: string
      color: string
      passwordPlaceholderKeep: string
      passwordPlaceholderNone: string
    }
    passwordHint: string
    unsaved: {
      question: string
    }
    delete: {
      question: string
      warning: string
    }
    actions: {
      new: string
      delete: string
      save: string
      cancel: string
      discard: string
      keepEditing: string
      confirmDelete: string
      cancelDelete: string
    }
    errors: {
      duplicateName: string
      notFound: string
      invalid: string
      readonlyNewer: string
      readFailed: string
      fileTooLarge: string
      ioError: string
      encryptionUnavailable: string
      decryptionFailed: string
      internal: string
      required: string
      nameTooLong: string
      hostTooLong: string
      userTooLong: string
      portRange: string
      environmentLabelRequired: string
      environmentLabelTooLong: string
      colorRequired: string
    }
  }
  /** Strings handed to AG Grid through localeText; only keys we actually use. */
  grid: {
    nullValue: string
    noRowsToShow: string
    ariaSortableColumn: string
  }
}
