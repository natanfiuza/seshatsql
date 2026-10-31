import EditorWorker from 'monaco-editor/editor/editor.worker?worker'

import { monacoNlsLocale, type SupportedLocale } from '../i18n'

export type MonacoApi = typeof import('monaco-editor/editor/editor.api')
export type MonacoEditor = import('monaco-editor/editor/editor.api').editor.IStandaloneCodeEditor
export type MonacoModel = import('monaco-editor/editor/editor.api').editor.ITextModel
export type MonacoViewState = import('monaco-editor/editor/editor.api').editor.ICodeEditorViewState

let pending: Promise<MonacoApi> | null = null

/**
 * Loads Monaco once, with the NLS bundle selected at start-up.
 *
 * The SQL and MySQL language definitions are imported explicitly instead of the
 * full editor bundle, and the worker is a bundled module worker. That keeps
 * "worker-src 'self'" sufficient: Monaco's default path creates a blob worker.
 */
async function bootstrap(locale: SupportedLocale): Promise<MonacoApi> {
  const nls = monacoNlsLocale(locale)
  if (nls === 'es') {
    await import('monaco-editor/nls/lang/es')
  } else if (nls === 'fr') {
    await import('monaco-editor/nls/lang/fr')
  }

  const api = await import('monaco-editor/editor/editor.api')
  await import('monaco-editor/languages/definitions/sql/register')
  await import('monaco-editor/languages/definitions/mysql/register')

  globalThis.MonacoEnvironment = {
    getWorker: () => new EditorWorker()
  }

  return api
}

export function loadMonaco(locale: SupportedLocale): Promise<MonacoApi> {
  pending ??= bootstrap(locale)
  return pending
}
