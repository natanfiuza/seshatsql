import type { Messages } from '../types'

const messages: Messages = {
  app: {
    name: 'SeshatSQL',
    tagline: 'Desktop SQL client for MySQL'
  },
  lab: {
    title: 'Interface lab',
    intro:
      'Temporary screen used to validate the editor, the grid, the themes and the languages before the real workspace exists.',
    themeLabel: 'Theme',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    languageLabel: 'Language',
    localeNameEnUS: 'English (United States)',
    localeNamePtBR: 'Português (Brasil)',
    localeNamePtPT: 'Português (Portugal)',
    localeNameFr: 'Français',
    localeNameEs: 'Español',
    editorTitle: 'SQL editor',
    editorHint: 'Sample SQL. No connection is used.',
    editorLanguageNotice:
      'The editor language applies on the next launch; the interface and the grid change immediately.',
    editorLoadFailure: 'The SQL editor could not be loaded.',
    gridTitle: 'Sample result',
    gridHint: 'Read-only sample rows, including NULL, Unicode and long text.',
    copyHint:
      'Select rows and press Ctrl+C to copy with headers; without a selection, the focused cell is copied.',
    copySuccess: 'Copied to the clipboard.',
    copyFailure: 'Could not copy to the clipboard.'
  },
  grid: {
    nullValue: 'NULL',
    noRowsToShow: 'No rows to show',
    ariaSortableColumn: 'Press Enter to sort'
  }
}

export default messages
