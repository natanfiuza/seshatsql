/**
 * Menu structure for the provisional shell. Most items are still inert; the
 * entries exist so the desktop layout can be reviewed with real labels.
 */

/** Shell actions that have an implementation behind an enabled menu or toolbar entry. */
export type ShellAction = 'open-connections'

export interface MenuItemDefinition {
  id: string
  labelKey: string
  enabled: boolean
  action?: ShellAction
}

export interface MenuDefinition {
  id: string
  labelKey: string
  items: readonly MenuItemDefinition[]
}

export const MENUS: readonly MenuDefinition[] = [
  {
    id: 'file',
    labelKey: 'shell.menu.file',
    items: [
      { id: 'new', labelKey: 'shell.menu.fileNew', enabled: false },
      { id: 'open', labelKey: 'shell.menu.fileOpen', enabled: false },
      { id: 'save', labelKey: 'shell.menu.fileSave', enabled: false },
      { id: 'save-as', labelKey: 'shell.menu.fileSaveAs', enabled: false },
      { id: 'close', labelKey: 'shell.menu.fileClose', enabled: false },
      { id: 'exit', labelKey: 'shell.menu.fileExit', enabled: false }
    ]
  },
  {
    id: 'edit',
    labelKey: 'shell.menu.edit',
    items: [
      { id: 'undo', labelKey: 'shell.menu.editUndo', enabled: false },
      { id: 'redo', labelKey: 'shell.menu.editRedo', enabled: false },
      { id: 'cut', labelKey: 'shell.menu.editCut', enabled: false },
      { id: 'copy', labelKey: 'shell.menu.editCopy', enabled: false },
      { id: 'paste', labelKey: 'shell.menu.editPaste', enabled: false },
      { id: 'find', labelKey: 'shell.menu.editFind', enabled: false },
      { id: 'replace', labelKey: 'shell.menu.editReplace', enabled: false }
    ]
  },
  {
    id: 'query',
    labelKey: 'shell.menu.query',
    items: [
      { id: 'execute', labelKey: 'shell.menu.queryExecute', enabled: false },
      { id: 'execute-selection', labelKey: 'shell.menu.queryExecuteSelection', enabled: false },
      { id: 'stop', labelKey: 'shell.menu.queryStop', enabled: false },
      { id: 'explain', labelKey: 'shell.menu.queryExplain', enabled: false }
    ]
  },
  {
    id: 'view',
    labelKey: 'shell.menu.view',
    items: [
      { id: 'object-browser', labelKey: 'shell.menu.viewObjectBrowser', enabled: false },
      { id: 'sql-log', labelKey: 'shell.menu.viewSqlLog', enabled: false },
      { id: 'helpers', labelKey: 'shell.menu.viewHelpers', enabled: false }
    ]
  },
  {
    id: 'tools',
    labelKey: 'shell.menu.tools',
    items: [
      {
        id: 'connections',
        labelKey: 'shell.menu.toolsConnections',
        enabled: true,
        action: 'open-connections'
      },
      { id: 'preferences', labelKey: 'shell.menu.toolsPreferences', enabled: false }
    ]
  },
  {
    id: 'help',
    labelKey: 'shell.menu.help',
    items: [{ id: 'about', labelKey: 'shell.menu.helpAbout', enabled: false }]
  }
]
