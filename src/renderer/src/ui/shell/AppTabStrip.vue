<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface TabDefinition {
  readonly id: string
  readonly label: string
}

const props = withDefaults(
  defineProps<{
    tabs: readonly TabDefinition[]
    activeId: string
    label: string
    closable?: boolean
    addable?: boolean
    variant?: 'primary' | 'secondary'
  }>(),
  { closable: false, addable: false, variant: 'primary' }
)

const emit = defineEmits<{
  select: [id: string]
  close: [id: string]
  add: []
}>()

const { t } = useI18n()
const root = ref<HTMLElement | null>(null)

function selectTab(id: string): void {
  if (id !== props.activeId) {
    emit('select', id)
  }
}

function closeTab(event: MouseEvent, id: string): void {
  event.stopPropagation()
  emit('close', id)
}

function addTab(): void {
  emit('add')
}

async function focusTab(index: number): Promise<void> {
  await nextTick()
  root.value
    ?.querySelector<HTMLElement>(`[data-tab-index="${index}"]`)
    ?.focus()
}

function onTabKeydown(event: KeyboardEvent, index: number): void {
  const last = props.tabs.length - 1
  const tab = props.tabs[index]
  if (tab === undefined) {
    return
  }

  switch (event.key) {
    case 'ArrowRight': {
      event.preventDefault()
      const next = index === last ? 0 : index + 1
      selectTab(props.tabs[next]?.id ?? tab.id)
      void focusTab(next)
      break
    }
    case 'ArrowLeft': {
      event.preventDefault()
      const previous = index === 0 ? last : index - 1
      selectTab(props.tabs[previous]?.id ?? tab.id)
      void focusTab(previous)
      break
    }
    case 'Home': {
      event.preventDefault()
      selectTab(props.tabs[0]?.id ?? tab.id)
      void focusTab(0)
      break
    }
    case 'End': {
      event.preventDefault()
      selectTab(props.tabs[last]?.id ?? tab.id)
      void focusTab(last)
      break
    }
    case 'Delete':
      if (props.closable) {
        event.preventDefault()
        emit('close', tab.id)
      }
      break
    default:
      break
  }
}
</script>

<template>
  <div
    ref="root"
    class="tabstrip"
    :class="`tabstrip--${variant}`"
  >
    <div
      class="tabstrip__list"
      role="tablist"
      :aria-label="label"
    >
      <div
        v-for="(tab, index) in tabs"
        :key="tab.id"
        class="tabstrip__tab"
        :class="{ 'tabstrip__tab--active': tab.id === activeId }"
        role="presentation"
      >
        <button
          type="button"
          role="tab"
          class="tabstrip__label"
          :data-tab-index="index"
          :aria-selected="tab.id === activeId"
          :tabindex="tab.id === activeId ? 0 : -1"
          @click="selectTab(tab.id)"
          @keydown="onTabKeydown($event, index)"
        >
          {{ tab.label }}
        </button>
        <button
          v-if="closable"
          type="button"
          class="tabstrip__close"
          :aria-label="t('shell.tabs.close', { title: tab.label })"
          :title="t('shell.tabs.close', { title: tab.label })"
          tabindex="-1"
          @click="closeTab($event, tab.id)"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>

    <button
      v-if="addable"
      type="button"
      class="tabstrip__add"
      :aria-label="t('shell.tabs.newQuery')"
      :title="t('shell.tabs.newQuery')"
      @click="addTab"
    >
      <span aria-hidden="true">+</span>
    </button>
  </div>
</template>

<style scoped>
.tabstrip {
  display: flex;
  flex: none;
  align-items: stretch;
  height: var(--tabstrip-h);
  background: var(--surface-alt);
  border-bottom: 1px solid var(--border);
  user-select: none;
}

.tabstrip__list {
  display: flex;
  flex: 1 1 auto;
  align-items: stretch;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.tabstrip__list::-webkit-scrollbar {
  display: none;
}

.tabstrip__tab {
  display: flex;
  align-items: center;
  flex: none;
  border-right: 1px solid var(--border-soft);
  background: var(--surface-alt);
}

.tabstrip__tab--active {
  background: var(--surface);
  box-shadow: inset 0 2px 0 var(--accent);
}

.tabstrip--secondary .tabstrip__tab--active {
  box-shadow: inset 0 -2px 0 var(--accent);
}

.tabstrip__label {
  height: 100%;
  padding: 0 8px;
  border: 0;
  background: transparent;
  color: var(--text);
  font-size: var(--font-size-ui);
  line-height: 1;
  white-space: nowrap;
  cursor: default;
}

.tabstrip__label:focus-visible {
  outline: 1px solid var(--focus);
  outline-offset: -2px;
}

.tabstrip__close {
  display: grid;
  place-items: center;
  width: 14px;
  height: 14px;
  margin-right: 3px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1;
  cursor: default;
}

.tabstrip__close:hover {
  background: var(--hover);
  color: var(--text);
}

.tabstrip__close:focus-visible {
  outline: 1px solid var(--focus);
  outline-offset: -1px;
}

.tabstrip__add {
  display: grid;
  place-items: center;
  flex: none;
  width: 20px;
  height: 20px;
  margin: 2px 4px;
  padding: 0;
  border: 1px solid var(--border-soft);
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1;
  cursor: default;
}

.tabstrip__add:hover {
  background: var(--hover);
  color: var(--text);
}

.tabstrip__add:focus-visible {
  outline: 1px solid var(--focus);
  outline-offset: -1px;
}
</style>
