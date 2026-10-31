<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { PersistedCursor, PersistedSelection } from '../../../domain/persistence/types'
import type { SupportedLocale } from '../i18n'
import type { ResolvedTheme } from '../theme/theme'
import { loadMonaco, type MonacoApi, type MonacoEditor, type MonacoModel, type MonacoViewState } from './monaco'

const props = withDefaults(
  defineProps<{
    modelId: string
    value: string
    theme: ResolvedTheme
    locale: SupportedLocale
    cursor?: PersistedCursor | null
    selection?: PersistedSelection | null
  }>(),
  { cursor: null, selection: null }
)

const emit = defineEmits<{
  change: [value: string]
  view: [cursor: PersistedCursor, selection: PersistedSelection | null]
}>()

const { t } = useI18n()

const host = ref<HTMLDivElement | null>(null)
const loadError = ref(false)
// Reflects the language Monaco actually attached, so the DOM stays truthful.
const modelLanguage = ref('')

let api: MonacoApi | null = null
let editor: MonacoEditor | null = null
let model: MonacoModel | null = null
let disposed = false

const modelUri = computed(() => `inmemory://seshat/tab/${props.modelId}`)

function monacoTheme(theme: ResolvedTheme): string {
  return theme === 'dark' ? 'vs-dark' : 'vs'
}

onMounted(async () => {
  try {
    const loaded = await loadMonaco(props.locale)
    if (disposed || host.value === null) {
      return
    }

    api = loaded
    const uri = loaded.Uri.parse(modelUri.value)
    loaded.editor.getModel(uri)?.dispose()
    model = loaded.editor.createModel(props.value, 'mysql', uri)
    modelLanguage.value = model.getLanguageId()
    editor = loaded.editor.create(host.value, {
      model,
      theme: monacoTheme(props.theme),
      ariaLabel: t('shell.editor.label'),
      automaticLayout: true,
      fontFamily: "'Consolas', 'Courier New', monospace",
      fontSize: 12,
      lineHeight: 16,
      lineNumbersMinChars: 3,
      glyphMargin: false,
      folding: false,
      minimap: { enabled: false },
      padding: { top: 3, bottom: 3 },
      scrollBeyondLastLine: false,
      fixedOverflowWidgets: true,
      renderLineHighlight: 'none',
      scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
      renderWhitespace: 'selection'
    })

    model.onDidChangeContent(() => {
      if (model !== null) {
        emit('change', model.getValue())
      }
    })

    // Restoring before subscribing keeps the saved state from being re-saved
    // as if the user had just moved the caret.
    applySavedView()
    editor.onDidChangeCursorSelection(() => {
      if (editor === null) {
        return
      }
      const position = editor.getPosition()
      if (position === null) {
        return
      }
      const selection = editor.getSelection()
      emit(
        'view',
        { lineNumber: position.lineNumber, column: position.column },
        selection === null || selection.isEmpty()
          ? null
          : {
              startLineNumber: selection.startLineNumber,
              startColumn: selection.startColumn,
              endLineNumber: selection.endLineNumber,
              endColumn: selection.endColumn
            }
      )
    })
  } catch {
    loadError.value = true
  }
})

function applySavedView(): void {
  if (editor === null) {
    return
  }
  if (props.selection !== null) {
    editor.setSelection(props.selection)
  } else if (props.cursor !== null) {
    editor.setPosition(props.cursor)
  }
}

watch(
  () => props.value,
  (value) => {
    if (model !== null && model.getValue() !== value) {
      model.setValue(value)
    }
  }
)

watch(
  () => props.theme,
  (theme) => {
    api?.editor.setTheme(monacoTheme(theme))
  }
)

onBeforeUnmount(() => {
  disposed = true
  editor?.dispose()
  model?.dispose()
  editor = null
  model = null
  api = null
})

function getViewState(): MonacoViewState | null {
  return editor?.saveViewState() ?? null
}

function setViewState(state: MonacoViewState | null): void {
  if (state !== null) {
    editor?.restoreViewState(state)
  }
}

function getValue(): string {
  return model?.getValue() ?? props.value
}

function focus(): void {
  editor?.focus()
}

defineExpose({ getViewState, setViewState, getValue, focus })
</script>

<template>
  <div
    class="monaco-editor"
    data-testid="monaco-editor"
    :data-language="modelLanguage"
    :data-model-uri="modelUri"
  >
    <div
      ref="host"
      class="monaco-editor__host"
    />
    <p
      v-if="loadError"
      class="monaco-editor__error"
      role="alert"
    >
      {{ t('shell.editor.loadFailure') }}
    </p>
  </div>
</template>

<style scoped>
.monaco-editor {
  height: 100%;
  min-height: 0;
}

.monaco-editor__host {
  height: 100%;
}

.monaco-editor__error {
  margin: 8px;
  color: var(--danger);
}
</style>
