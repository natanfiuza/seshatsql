/**
 * Shape shared by all message catalogs.
 * Must be a type alias (not an interface): vue-i18n requires an implicit index
 * signature, which TypeScript only infers for type aliases.
 */
export type Messages = {
  app: {
    name: string
    tagline: string
  }
  lab: {
    title: string
    intro: string
    themeLabel: string
    themeSystem: string
    themeLight: string
    themeDark: string
    languageLabel: string
    localeNameEnUS: string
    localeNamePtBR: string
    localeNamePtPT: string
    localeNameFr: string
    localeNameEs: string
    editorTitle: string
    editorHint: string
    editorLanguageNotice: string
    editorLoadFailure: string
    gridTitle: string
    gridHint: string
    copyHint: string
    copySuccess: string
    copyFailure: string
  }
  /** Strings handed to AG Grid through localeText; only keys we actually use. */
  grid: {
    nullValue: string
    noRowsToShow: string
    ariaSortableColumn: string
  }
}
