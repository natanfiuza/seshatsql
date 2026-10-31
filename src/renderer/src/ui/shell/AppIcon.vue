<script setup lang="ts">
import { computed } from 'vue'

import { ICON_URLS, type IconName } from './icons'

const props = defineProps<{
  name: IconName
  size?: number
}>()

const style = computed(() => {
  const size = `${props.size ?? 16}px`
  const image = `url("${ICON_URLS[props.name]}")`
  return {
    width: size,
    height: size,
    maskImage: image,
    WebkitMaskImage: image
  }
})
</script>

<template>
  <span
    class="app-icon"
    aria-hidden="true"
    :style="style"
  />
</template>

<style scoped>
.app-icon {
  display: inline-block;
  flex: none;
  background-color: currentColor;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
}
</style>
