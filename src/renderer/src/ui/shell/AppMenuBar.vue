<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, type ComponentPublicInstance } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  MENUS,
  type MenuDefinition,
  type MenuItemDefinition,
  type ShellAction
} from './menu'

const emit = defineEmits<{
  activate: [action: ShellAction]
}>()

const { t } = useI18n()

const root = ref<HTMLElement | null>(null)
const menuButtons = ref<HTMLButtonElement[]>([])
const openId = ref<string | null>(null)
const activeMenuIndex = ref(0)

function setMenuButton(el: Element | ComponentPublicInstance | null, index: number): void {
  if (el instanceof HTMLButtonElement) {
    menuButtons.value[index] = el
  }
}

function dropdownItems(): HTMLButtonElement[] {
  return Array.from(
    root.value?.querySelectorAll<HTMLButtonElement>('.menubar__dropdown [role="menuitem"]') ?? []
  )
}

function focusItem(index: number): void {
  const items = dropdownItems()
  if (items.length === 0) {
    return
  }
  const bounded = (index + items.length) % items.length
  items[bounded]?.focus()
}

async function openAt(menu: MenuDefinition): Promise<void> {
  openId.value = menu.id
  await nextTick()
  focusItem(0)
}

function close(restoreFocus: boolean): void {
  const closedId = openId.value
  openId.value = null
  if (!restoreFocus || closedId === null) {
    return
  }
  const index = MENUS.findIndex((menu) => menu.id === closedId)
  menuButtons.value[index]?.focus()
}

function focusMenuButton(index: number): void {
  const bounded = (index + MENUS.length) % MENUS.length
  menuButtons.value[bounded]?.focus()
}

function activateItem(item: MenuItemDefinition): void {
  if (!item.enabled || item.action === undefined) {
    return
  }
  emit('activate', item.action)
  close(false)
}

function onMenuButtonClick(menu: MenuDefinition): void {
  if (openId.value === menu.id) {
    close(false)
    return
  }
  void openAt(menu)
}

function onMenuButtonKeydown(event: KeyboardEvent, menu: MenuDefinition, index: number): void {
  switch (event.key) {
    case 'ArrowDown':
    case 'Enter':
    case ' ':
      event.preventDefault()
      void openAt(menu)
      break
    case 'ArrowRight':
      event.preventDefault()
      focusMenuButton(index + 1)
      break
    case 'ArrowLeft':
      event.preventDefault()
      focusMenuButton(index - 1)
      break
    case 'Home':
      event.preventDefault()
      focusMenuButton(0)
      break
    case 'End':
      event.preventDefault()
      focusMenuButton(MENUS.length - 1)
      break
    case 'Escape':
      if (openId.value !== null) {
        event.preventDefault()
        close(true)
      }
      break
    default:
      break
  }
}

function onDropdownKeydown(event: KeyboardEvent, menuIndex: number): void {
  const items = dropdownItems()
  const current = items.findIndex((item) => item === document.activeElement)

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      focusItem(current + 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      focusItem(current - 1)
      break
    case 'Home':
      event.preventDefault()
      focusItem(0)
      break
    case 'End':
      event.preventDefault()
      focusItem(items.length - 1)
      break
    case 'ArrowRight':
    case 'ArrowLeft': {
      event.preventDefault()
      const step = event.key === 'ArrowRight' ? 1 : -1
      const next = MENUS[(menuIndex + step + MENUS.length) % MENUS.length]
      if (next !== undefined) {
        void openAt(next)
      }
      break
    }
    case 'Escape':
      event.preventDefault()
      close(true)
      break
    case 'Tab':
      close(false)
      break
    case 'Enter':
    case ' ': {
      event.preventDefault()
      const item = MENUS[menuIndex]?.items[current]
      if (item !== undefined) {
        activateItem(item)
      }
      break
    }
    default:
      break
  }
}

function onDocumentPointerDown(event: PointerEvent): void {
  if (openId.value === null) {
    return
  }
  const target = event.target
  if (!(target instanceof Node) || root.value === null || root.value.contains(target)) {
    return
  }
  close(false)
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
})
</script>

<template>
  <nav
    ref="root"
    class="menubar"
    :aria-label="t('shell.menubar.label')"
  >
    <div
      v-for="(menu, menuIndex) in MENUS"
      :key="menu.id"
      class="menubar__entry"
    >
      <button
        :ref="(el) => setMenuButton(el, menuIndex)"
        type="button"
        class="menubar__button"
        role="menuitem"
        aria-haspopup="menu"
        :aria-expanded="openId === menu.id"
        :tabindex="activeMenuIndex === menuIndex ? 0 : -1"
        @focus="activeMenuIndex = menuIndex"
        @click="onMenuButtonClick(menu)"
        @keydown="onMenuButtonKeydown($event, menu, menuIndex)"
      >
        {{ t(menu.labelKey) }}
      </button>

      <div
        v-if="openId === menu.id"
        class="menubar__dropdown"
        role="menu"
        :aria-label="t(menu.labelKey)"
        @keydown="onDropdownKeydown($event, menuIndex)"
      >
        <button
          v-for="item in menu.items"
          :key="item.id"
          type="button"
          class="menubar__item"
          :class="{ 'menubar__item--enabled': item.enabled }"
          role="menuitem"
          :aria-disabled="item.enabled ? undefined : 'true'"
          :title="item.enabled ? undefined : t('shell.disabledHint')"
          tabindex="-1"
          @click.prevent="activateItem(item)"
        >
          {{ t(item.labelKey) }}
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.menubar {
  display: flex;
  flex: none;
  align-items: stretch;
  height: var(--menubar-h);
  background: var(--chrome-bg);
  border-bottom: 1px solid var(--border-soft);
  user-select: none;
}

.menubar__entry {
  position: relative;
  display: flex;
}

.menubar__button {
  min-width: 0;
  padding: 0 8px;
  border: 0;
  background: transparent;
  color: var(--text);
  font-size: var(--font-size-ui);
  line-height: 1;
  white-space: nowrap;
  cursor: default;
}

.menubar__button[aria-expanded='true'],
.menubar__button:focus-visible {
  background: var(--selected-bg);
  color: var(--selected-text);
  outline: none;
}

.menubar__dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 30;
  min-width: 176px;
  padding: 2px;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: 0 2px 6px rgb(0 0 0 / 18%);
}

.menubar__item {
  display: block;
  width: 100%;
  height: 22px;
  padding: 0 20px;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: var(--font-size-ui);
  text-align: left;
  white-space: nowrap;
  cursor: default;
}

.menubar__item--enabled {
  color: var(--text);
}

.menubar__item:focus {
  background: var(--hover);
  color: var(--text);
  outline: none;
}
</style>
