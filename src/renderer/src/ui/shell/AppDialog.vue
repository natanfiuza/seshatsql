<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
  returnFocus?: HTMLElement | null
}>()

const emit = defineEmits<{
  'request-close': []
}>()

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const panel = ref<HTMLElement | null>(null)
const titleId = useId()
let lastFocused: HTMLElement | null = null

function focusableElements(): HTMLElement[] {
  const nodes = panel.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []
  return Array.from(nodes).filter(
    (element) =>
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-hidden') !== 'true' &&
      element.closest('[hidden]') === null
  )
}

function focusFirst(): void {
  const first = focusableElements()[0]
  ;(first ?? panel.value)?.focus()
}

function restoreFocus(): void {
  const target = lastFocused?.isConnected === true ? lastFocused : props.returnFocus
  lastFocused = null
  if (target !== null && target !== undefined && target.isConnected) {
    target.focus()
  }
}

function onFocusIn(event: FocusEvent): void {
  if (panel.value === null) {
    return
  }
  const target = event.target
  if (target instanceof Node && !panel.value.contains(target)) {
    focusFirst()
  }
}

function stopFocusGuard(): void {
  document.removeEventListener('focusin', onFocusIn)
}

function onPanelKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    emit('request-close')
    return
  }
  if (event.key !== 'Tab') {
    return
  }

  const items = focusableElements()
  if (items.length === 0) {
    event.preventDefault()
    panel.value?.focus()
    return
  }

  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement
  if (active === null || !items.includes(active as HTMLElement)) {
    event.preventDefault()
    ;(event.shiftKey ? last : first)?.focus()
    return
  }
  if (event.shiftKey && active === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first?.focus()
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      const active = document.activeElement
      lastFocused = props.returnFocus ?? (active instanceof HTMLElement ? active : null)
      await nextTick()
      focusFirst()
      document.addEventListener('focusin', onFocusIn)
      return
    }
    stopFocusGuard()
    restoreFocus()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  stopFocusGuard()
  restoreFocus()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="dialog"
    >
      <div
        class="dialog__backdrop"
        aria-hidden="true"
      />
      <section
        ref="panel"
        class="dialog__panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        @keydown="onPanelKeydown"
      >
        <header class="dialog__header">
          <h2
            :id="titleId"
            class="dialog__title"
          >
            {{ title }}
          </h2>
        </header>
        <div class="dialog__body">
          <slot />
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.dialog {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
}

.dialog__backdrop {
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 35%);
}

.dialog__panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(720px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: 0 4px 16px rgb(0 0 0 / 30%);
  outline: none;
}

.dialog__header {
  flex: none;
  padding: 4px 8px;
  background: var(--surface-alt);
  border-bottom: 1px solid var(--border);
}

.dialog__title {
  margin: 0;
  color: var(--text);
  font-size: var(--font-size-ui);
  font-weight: 600;
  line-height: 18px;
}

.dialog__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 8px;
  color: var(--text);
  font-size: var(--font-size-data);
}
</style>
