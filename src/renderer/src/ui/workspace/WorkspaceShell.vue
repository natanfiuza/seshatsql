<script setup lang="ts">
import AppTabStrip from '../shell/AppTabStrip.vue'

interface WorkspaceTabDefinition {
  readonly id: string
  readonly label: string
}

defineProps<{
  tabs: readonly WorkspaceTabDefinition[]
  activeId: string
  label: string
}>()

const emit = defineEmits<{
  select: [id: string]
  close: [id: string]
  add: []
}>()
</script>

<template>
  <section class="workspace">
    <AppTabStrip
      :tabs="tabs"
      :active-id="activeId"
      :label="label"
      closable
      addable
      @select="emit('select', $event)"
      @close="emit('close', $event)"
      @add="emit('add')"
    />
    <div class="workspace__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.workspace {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  background: var(--surface);
}

.workspace__body {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}
</style>
