<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface TabDefinition {
  readonly id: string
  readonly label: string
}

const props = defineProps<{
  tabs: readonly TabDefinition[]
  activeId: string
  label: string
}>()

const emit = defineEmits<{ select: [id: string] }>()

const { t } = useI18n()

function selectTab(id: string): void {
  if (id !== props.activeId) {
    emit('select', id)
  }
}
</script>

<template>
  <div class="tabstrip">
    <div
      class="tabstrip__list"
      role="tablist"
      :aria-label="label"
    >
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="tabstrip__tab"
        :class="{ 'tabstrip__tab--active': tab.id === activeId }"
        role="presentation"
      >
        <button
          type="button"
          role="tab"
          class="tabstrip__label"
          :aria-selected="tab.id === activeId"
          :tabindex="tab.id === activeId ? 0 : -1"
          @click="selectTab(tab.id)"
        >
          {{ tab.label }}
        </button>
        <button
          type="button"
          class="tabstrip__close"
          aria-disabled="true"
          :title="t('shell.disabledHint')"
          tabindex="-1"
          @click.stop.prevent
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>

    <button
      type="button"
      class="tabstrip__add"
      aria-disabled="true"
      :title="`${t('shell.tabs.addTab')} — ${t('shell.disabledHint')}`"
      tabindex="-1"
      @click.prevent
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
  align-items: stretch;
  min-width: 0;
  overflow: hidden;
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
  width: 16px;
  height: 16px;
  margin-right: 4px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1;
  cursor: default;
}

.tabstrip__add {
  display: grid;
  place-items: center;
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
</style>
