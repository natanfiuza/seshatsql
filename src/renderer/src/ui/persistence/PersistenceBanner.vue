<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { PersistenceWarning } from '../../../../domain/persistence/types'
import { toWarningViews } from '../../persistence/presentation'

const props = defineProps<{
  warnings: readonly PersistenceWarning[]
  closeFailure: boolean
  canRetry: boolean
  dismissible: boolean
}>()

const emit = defineEmits<{
  retry: []
  discard: []
  dismiss: []
}>()

const { t } = useI18n()

const views = computed(() => toWarningViews(props.warnings))
const confirmingDiscard = ref(false)

watch(
  () => props.closeFailure,
  (failed) => {
    if (!failed) {
      confirmingDiscard.value = false
    }
  }
)

function confirmDiscard(): void {
  confirmingDiscard.value = false
  emit('discard')
}
</script>

<template>
  <section
    v-if="views.length > 0 || closeFailure"
    class="notice"
    :class="{ 'notice--error': closeFailure }"
    role="region"
    :aria-label="t('persistence.title')"
  >
    <ul
      class="notice__list"
      aria-live="polite"
    >
      <li
        v-for="view in views"
        :key="view.id"
        class="notice__item"
      >
        <span class="notice__text">
          {{ t(view.messageKey) }}<template v-if="view.version !== null"> (v{{ view.version }})</template>
        </span>
        <code
          v-for="path in view.paths"
          :key="path"
          class="notice__path"
        >{{ path }}</code>
      </li>
      <li
        v-if="closeFailure"
        class="notice__item notice__item--error"
      >
        {{ t('persistence.close.failed') }}
      </li>
    </ul>

    <div class="notice__actions">
      <button
        v-if="canRetry"
        type="button"
        class="notice__button"
        @click="emit('retry')"
      >
        {{ t('persistence.actions.retry') }}
      </button>

      <template v-if="closeFailure">
        <template v-if="confirmingDiscard">
          <span class="notice__question">{{ t('persistence.actions.confirmDiscard') }}</span>
          <button
            type="button"
            class="notice__button notice__button--danger"
            @click="confirmDiscard"
          >
            {{ t('persistence.actions.confirmExit') }}
          </button>
          <button
            type="button"
            class="notice__button"
            @click="confirmingDiscard = false"
          >
            {{ t('persistence.actions.cancel') }}
          </button>
        </template>
        <button
          v-else
          type="button"
          class="notice__button notice__button--danger"
          @click="confirmingDiscard = true"
        >
          {{ t('persistence.actions.exitWithoutSaving') }}
        </button>
      </template>

      <button
        v-else-if="dismissible"
        type="button"
        class="notice__button"
        @click="emit('dismiss')"
      >
        {{ t('persistence.actions.dismiss') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.notice {
  display: flex;
  flex: none;
  align-items: flex-start;
  gap: 8px;
  padding: 3px 8px 3px 6px;
  background: var(--surface-alt);
  border-bottom: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  font-size: var(--font-size-data);
  color: var(--text);
}

.notice--error {
  border-left-color: var(--danger);
}

.notice__list {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.notice__item {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px;
  padding: 1px 0;
}

.notice__item--error {
  color: var(--danger);
}

.notice__path {
  padding: 0 3px;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  font-family: var(--font-mono);
  font-size: 10px;
  overflow-wrap: anywhere;
}

.notice__actions {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.notice__question {
  color: var(--text-muted);
}

.notice__button {
  height: 18px;
  padding: 0 6px;
  border: 1px solid var(--border);
  border-radius: 0;
  background: var(--surface);
  color: var(--text);
  font-size: var(--font-size-data);
  cursor: default;
}

.notice__button:hover {
  background: var(--hover);
}

.notice__button:focus-visible {
  outline: 1px solid var(--focus);
  outline-offset: -1px;
}

.notice__button--danger {
  color: var(--danger);
}
</style>
