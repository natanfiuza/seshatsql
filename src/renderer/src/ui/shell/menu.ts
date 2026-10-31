/**
 * Menu structure for the provisional shell. Every item is inert in this stage;
 * the entries exist so the desktop layout can be reviewed with real labels.
 */
export interface MenuItemDefinition {
  id: string
  labelKey: string
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
      { id: 'new', labelKey: 'shell.menu.fileNew' },
      { id: 'open', labelKey: 'shell.menu.fileOpen' },
      { id: 'save', labelKey: 'shell.menu.fileSave' },
      { id: 'save-as', labelKey: 'shell.menu.fileSaveAs' },
      { id: 'close', labelKey: 'shell.menu.fileClose' },
      { id: 'exit', labelKey: 'shell.menu.fileExit' }
    ]
  },
  {
    id: 'edit',
    labelKey: 'shell.menu.edit',
    items: [
      { id: 'undo', labelKey: 'shell.menu.editUndo' },
      { id: 'redo', labelKey: 'shell.menu.editRedo' },
      { id: 'cut', labelKey: 'shell.menu.editCut' },
      { id: 'copy', labelKey: 'shell.menu.editCopy' },
      { id: 'paste', labelKey: 'shell.menu.editPaste' },
      { id: 'find', labelKey: 'shell.menu.editFind' },
      { id: 'replace', labelKey: 'shell.menu.editReplace' }
    ]
  },
  {
    id: 'query',
    labelKey: 'shell.menu.query',
    items: [
      { id: 'execute', labelKey: 'shell.menu.queryExecute' },
      { id: 'execute-selection', labelKey: 'shell.menu.queryExecuteSelection' },
      { id: 'stop', labelKey: 'shell.menu.queryStop' },
      { id: 'explain', labelKey: 'shell.menu.queryExplain' }
    ]
  },
  {
    id: 'view',
    labelKey: 'shell.menu.view',
    items: [
      { id: 'object-browser', labelKey: 'shell.menu.viewObjectBrowser' },
      { id: 'sql-log', labelKey: 'shell.menu.viewSqlLog' },
      { id: 'helpers', labelKey: 'shell.menu.viewHelpers' }
    ]
  },
  {
    id: 'tools',
    labelKey: 'shell.menu.tools',
    items: [{ id: 'preferences', labelKey: 'shell.menu.toolsPreferences' }]
  },
  {
    id: 'help',
    labelKey: 'shell.menu.help',
    items: [{ id: 'about', labelKey: 'shell.menu.helpAbout' }]
  }
]
