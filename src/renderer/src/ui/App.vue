<script setup lang="ts">
import type { StartupState } from '../../../domain/persistence/types'
import S05Lab from './S05Lab.vue'

defineProps<{
  startup: StartupState
}>()
</script>

<template>
  <!-- Provisional main screen; the real workspace replaces it in T07/T09. -->
  <S05Lab :startup="startup" />
</template>
