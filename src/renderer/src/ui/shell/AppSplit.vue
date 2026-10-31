<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import {
  SPLITTER_SIZE,
  clampStart,
  keyboardStart,
  maxStart,
  moveStart,
  type SplitRange
} from './split'

const props = withDefaults(
  defineProps<{
    direction: 'vertical' | 'horizontal'
    /** Initial extent of the start pane, in pixels. */
    size: number
    /** Which pane the size refers to; the separator is positioned from it. */
    pane?: 'start' | 'end'
    minStart: number
    minEnd: number
    label: string
  }>(),
  { pane: 'start' }
)

const root = ref<HTMLDivElement | null>(null)
const extent = ref(0)
const startSize = ref<number | null>(null)
const dragging = ref(false)
/** Once the user resizes the split, its size stops following the configured one. */
const customized = ref(false)

let observer: ResizeObserver | null = null
let dragOrigin = 0
let dragFrom = 0

const range = computed<SplitRange>(() => ({
  extent: extent.value,
  minStart: props.minStart,
  minEnd: props.minEnd
}))

const startStyle = computed<{ flex: string } | undefined>(() =>
  startSize.value === null ? undefined : { flex: `0 0 ${startSize.value}px` }
)

function initialStart(total: number): number {
  const raw = props.pane === 'start' ? props.size : total - SPLITTER_SIZE - props.size
  return clampStart(raw, { extent: total, minStart: props.minStart, minEnd: props.minEnd })
}

function measure(total: number): void {
  if (total <= 0) {
    return
  }
  extent.value = total
  const nextRange: SplitRange = { extent: total, minStart: props.minStart, minEnd: props.minEnd }
  // A nested split first measures a transient parent extent; before the user
  // customizes it, the configured size must win again once the parent settles.
  startSize.value =
    customized.value && startSize.value !== null
      ? clampStart(startSize.value, nextRange)
      : initialStart(total)
}

function measureElement(): void {
  const element = root.value
  if (element === null) {
    return
  }
  measure(props.direction === 'vertical' ? element.clientWidth : element.clientHeight)
}

function onPointerDown(event: PointerEvent): void {
  if (event.button !== 0 || startSize.value === null) {
    return
  }
  event.preventDefault()
  dragOrigin = props.direction === 'vertical' ? event.clientX : event.clientY
  dragFrom = startSize.value
  dragging.value = true
  customized.value = true
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent): void {
  if (!dragging.value) {
    return
  }
  const position = props.direction === 'vertical' ? event.clientX : event.clientY
  startSize.value = moveStart(dragFrom, position - dragOrigin, range.value)
}

function endDrag(event: PointerEvent): void {
  if (!dragging.value) {
    return
  }
  dragging.value = false
  ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
}

function onKeydown(event: KeyboardEvent): void {
  if (startSize.value === null) {
    return
  }
  const next = keyboardStart(startSize.value, event.key, range.value)
  if (next === null) {
    return
  }
  event.preventDefault()
  customized.value = true
  startSize.value = next
}

onMounted(() => {
  measureElement()
  if (typeof ResizeObserver !== 'function' || root.value === null) {
    return
  }
  observer = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (entry === undefined) {
      return
    }
    measure(props.direction === 'vertical' ? entry.contentRect.width : entry.contentRect.height)
  })
  observer.observe(root.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <div
    ref="root"
    class="app-split"
    :class="`app-split--${direction}`"
  >
    <div
      class="app-split__pane app-split__pane--start"
      :style="startStyle"
    >
      <slot name="start" />
    </div>
    <div
      class="app-split__divider"
      :class="[`app-split__divider--${direction}`, { 'app-split__divider--dragging': dragging }]"
      role="separator"
      tabindex="0"
      :aria-orientation="direction === 'vertical' ? 'vertical' : 'horizontal'"
      :aria-label="label"
      :aria-valuenow="startSize ?? undefined"
      :aria-valuemin="minStart"
      :aria-valuemax="maxStart(range)"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @keydown="onKeydown"
    />
    <div class="app-split__pane app-split__pane--end">
      <slot name="end" />
    </div>
  </div>
</template>

<style scoped>
.app-split {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.app-split--vertical {
  flex-direction: row;
}

.app-split--horizontal {
  flex-direction: column;
}

.app-split__pane {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.app-split__pane--start {
  flex-shrink: 1;
}

.app-split__divider {
  position: relative;
  z-index: 1;
  flex: 0 0 var(--splitter-size);
  background: var(--splitter);
  touch-action: none;
}

.app-split__divider--vertical {
  cursor: col-resize;
  border-left: 1px solid var(--border-soft);
  border-right: 1px solid var(--border-soft);
}

.app-split__divider--horizontal {
  cursor: row-resize;
  border-top: 1px solid var(--border-soft);
  border-bottom: 1px solid var(--border-soft);
}

.app-split__divider:hover,
.app-split__divider--dragging {
  background: var(--accent);
}

.app-split__divider:focus-visible {
  outline: 1px solid var(--focus);
  outline-offset: -1px;
}
</style>
