<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { ConnectionFailureReason } from '../../../../application/persistence/connections-service'
import type { ConnectionInput } from '../../../../application/persistence/ipc-contract'
import type {
  PersistenceWarning,
  PersistenceWarningCode,
  PublicConnection
} from '../../../../domain/persistence/types'
import { toWarningViews } from '../../persistence/presentation'
import AppDialog from '../shell/AppDialog.vue'
import ConnectionForm from './ConnectionForm.vue'
import {
  connectionColorKey,
  connectionFailureMessageKey,
  environmentMessageKey,
  sortConnections
} from './presentation'

const props = defineProps<{
  open: boolean
  returnFocus?: HTMLElement | null
}>()

const emit = defineEmits<{
  close: []
}>()

type PendingAction =
  | { readonly type: 'select'; readonly id: string }
  | { readonly type: 'new' }
  | { readonly type: 'delete'; readonly id: string }
  | { readonly type: 'close' }

const BLOCKING_WARNINGS: ReadonlySet<PersistenceWarningCode> = new Set([
  'future-version',
  'read-failed',
  'file-too-large'
])

const { t } = useI18n()

const profiles = ref<PublicConnection[]>([])
const warnings = ref<PersistenceWarning[]>([])
const loading = ref(false)
const loadFailed = ref(false)
const selectedId = ref<string | null>(null)
const creating = ref(true)
const formVersion = ref(0)
const formDirty = ref(false)
const pendingAction = ref<PendingAction | null>(null)
const deleteConfirmId = ref<string | null>(null)
const serverError = ref<ConnectionFailureReason | null>(null)
const actionError = ref<ConnectionFailureReason | null>(null)
const busy = ref(false)

const warningViews = computed(() => toWarningViews(warnings.value))
const writeBlocked = computed(
  () => loadFailed.value || warnings.value.some((warning) => BLOCKING_WARNINGS.has(warning.code))
)
const selectedProfile = computed<PublicConnection | null>(
  () => profiles.value.find((profile) => profile.id === selectedId.value) ?? null
)
const formProfile = computed<PublicConnection | null>(() => (creating.value ? null : selectedProfile.value))
const formKey = computed(
  () => `${creating.value ? 'new' : (selectedId.value ?? 'none')}:${formVersion.value}`
)
const formDisabled = computed(() => busy.value || loading.value || writeBlocked.value)
const deleteTarget = computed<PublicConnection | null>(
  () => profiles.value.find((profile) => profile.id === deleteConfirmId.value) ?? null
)
const discardQuestion = computed(() => pendingAction.value !== null)

watch(
  () => props.open,
  (open) => {
    if (open) {
      void openDialog()
      return
    }
    resetDialog()
  },
  { immediate: true }
)

function resetDialog(): void {
  pendingAction.value = null
  deleteConfirmId.value = null
  serverError.value = null
  actionError.value = null
  formDirty.value = false
}

async function openDialog(): Promise<void> {
  resetDialog()
  selectedId.value = null
  creating.value = true
  formVersion.value += 1
  await loadProfiles()
}

async function loadProfiles(preferredId?: string): Promise<void> {
  loading.value = true
  loadFailed.value = false
  try {
    const snapshot = await window.seshat.connections.list()
    profiles.value = sortConnections(snapshot.profiles)
    warnings.value = [...snapshot.warnings]
    const targetId = preferredId ?? selectedId.value
    const target = profiles.value.find((profile) => profile.id === targetId)
    if (target !== undefined) {
      selectedId.value = target.id
      creating.value = false
    } else if (profiles.value.length > 0) {
      selectedId.value = profiles.value[0]?.id ?? null
      creating.value = false
    } else {
      selectedId.value = null
      creating.value = true
    }
  } catch {
    profiles.value = []
    warnings.value = [{ code: 'read-failed', paths: [] }]
    loadFailed.value = true
    selectedId.value = null
    creating.value = true
  } finally {
    loading.value = false
    formVersion.value += 1
    formDirty.value = false
  }
}

function environmentText(profile: PublicConnection): string {
  if (profile.environment === 'custom') {
    return profile.environmentLabel ?? t('connections.environment.custom')
  }
  return t(environmentMessageKey(profile.environment))
}

function profileAriaLabel(profile: PublicConnection): string {
  return `${profile.name}, ${environmentText(profile)}, ${t(connectionColorKey(profile.color))}, ${profile.host}:${profile.port}`
}

function requestAction(action: PendingAction): void {
  if (formDirty.value) {
    pendingAction.value = action
    return
  }
  performAction(action)
}

function performAction(action: PendingAction): void {
  pendingAction.value = null
  switch (action.type) {
    case 'select':
      selectedId.value = action.id
      creating.value = false
      deleteConfirmId.value = null
      serverError.value = null
      actionError.value = null
      formVersion.value += 1
      formDirty.value = false
      break
    case 'new':
      selectedId.value = null
      creating.value = true
      deleteConfirmId.value = null
      serverError.value = null
      actionError.value = null
      formVersion.value += 1
      formDirty.value = false
      break
    case 'delete':
      deleteConfirmId.value = action.id
      serverError.value = null
      break
    case 'close':
      emit('close')
      break
  }
}

function discardChanges(): void {
  const action = pendingAction.value
  if (action !== null) {
    formDirty.value = false
    performAction(action)
  }
}

function keepEditing(): void {
  pendingAction.value = null
}

function requestClose(): void {
  requestAction({ type: 'close' })
}

function onSelect(profile: PublicConnection): void {
  if (!creating.value && selectedId.value === profile.id) {
    return
  }
  requestAction({ type: 'select', id: profile.id })
}

function onNew(): void {
  requestAction({ type: 'new' })
}

function onDeleteRequest(): void {
  if (selectedProfile.value === null) {
    return
  }
  requestAction({ type: 'delete', id: selectedProfile.value.id })
}

function onFormDirty(value: boolean): void {
  formDirty.value = value
  if (value) {
    serverError.value = null
  }
}

async function onSave(input: ConnectionInput): Promise<void> {
  if (formDisabled.value) {
    return
  }
  busy.value = true
  serverError.value = null
  actionError.value = null
  try {
    const result = await window.seshat.connections.save(input)
    if (result.ok) {
      await loadProfiles(result.profile.id)
    } else {
      serverError.value = result.reason
    }
  } catch {
    serverError.value = 'internal'
  } finally {
    busy.value = false
  }
}

async function confirmDelete(): Promise<void> {
  const target = deleteTarget.value
  if (target === null || busy.value) {
    return
  }
  busy.value = true
  actionError.value = null
  try {
    const result = await window.seshat.connections.delete({ id: target.id })
    if (result.ok) {
      deleteConfirmId.value = null
      await loadProfiles()
    } else {
      actionError.value = result.reason
      if (result.reason === 'not-found') {
        deleteConfirmId.value = null
        await loadProfiles()
      }
    }
  } catch {
    actionError.value = 'internal'
  } finally {
    busy.value = false
  }
}

function cancelDelete(): void {
  deleteConfirmId.value = null
}
</script>

<template>
  <AppDialog
    :open="open"
    :title="t('connections.title')"
    :return-focus="returnFocus"
    @request-close="requestClose"
  >
    <div class="connections">
      <div
        v-if="warningViews.length > 0 || writeBlocked"
        class="connections__notices"
      >
        <ul
          class="connections__warning-list"
          aria-live="polite"
        >
          <li
            v-for="view in warningViews"
            :key="view.id"
            class="connections__warning"
          >
            {{ t(view.messageKey) }}<span v-if="view.version !== null"> (v{{ view.version }})</span>
            <code
              v-for="path in view.paths"
              :key="path"
              class="connections__path"
            >{{ path }}</code>
          </li>
        </ul>
        <p
          v-if="writeBlocked"
          class="connections__warning"
        >
          {{ t('connections.notice.writeBlocked') }}
        </p>
      </div>

      <div class="connections__content">
        <section
          class="connections__list"
          :aria-label="t('connections.listLabel')"
        >
          <p
            v-if="loading"
            class="connections__empty"
          >
            {{ t('connections.loading') }}
          </p>
          <p
            v-else-if="profiles.length === 0"
            class="connections__empty"
          >
            {{ t('connections.empty') }}
          </p>
          <ul
            v-else
            class="connections__items"
          >
            <li
              v-for="profile in profiles"
              :key="profile.id"
            >
              <button
                type="button"
                class="connections__item"
                :class="{ 'connections__item--active': !creating && selectedId === profile.id }"
                :aria-pressed="!creating && selectedId === profile.id"
                :aria-label="profileAriaLabel(profile)"
                @click="onSelect(profile)"
              >
                <span
                  class="connections__swatch"
                  :style="{ backgroundColor: profile.color }"
                  aria-hidden="true"
                />
                <span class="connections__name">{{ profile.name }}</span>
                <span class="connections__meta">
                  {{ environmentText(profile) }} · {{ profile.host }}:{{ profile.port }}
                </span>
              </button>
            </li>
          </ul>
        </section>

        <section class="connections__detail">
          <div
            v-if="discardQuestion"
            class="connections__confirm"
            role="alert"
          >
            <p class="connections__confirm-text">
              {{ t('connections.unsaved.question') }}
            </p>
            <button
              type="button"
              class="connections__button connections__button--danger"
              @click="discardChanges"
            >
              {{ t('connections.actions.discard') }}
            </button>
            <button
              type="button"
              class="connections__button"
              @click="keepEditing"
            >
              {{ t('connections.actions.keepEditing') }}
            </button>
          </div>

          <div
            v-if="deleteTarget !== null"
            class="connections__confirm"
            role="alert"
          >
            <p class="connections__confirm-text">
              {{ t('connections.delete.question', { name: deleteTarget.name }) }}
            </p>
            <p class="connections__confirm-warning">
              {{ t('connections.delete.warning') }}
            </p>
            <button
              type="button"
              class="connections__button connections__button--danger"
              :disabled="busy"
              @click="confirmDelete"
            >
              {{ t('connections.actions.confirmDelete') }}
            </button>
            <button
              type="button"
              class="connections__button"
              :disabled="busy"
              @click="cancelDelete"
            >
              {{ t('connections.actions.cancelDelete') }}
            </button>
          </div>

          <p
            v-if="actionError !== null"
            class="connections__alert"
            role="alert"
          >
            {{ t(connectionFailureMessageKey(actionError)) }}
          </p>

          <ConnectionForm
            v-if="!loading"
            :key="formKey"
            :profile="formProfile"
            :disabled="formDisabled"
            :server-error="serverError"
            @submit="onSave"
            @dirty="onFormDirty"
          >
            <template #actions>
              <button
                type="button"
                :disabled="formDisabled"
                @click="onNew"
              >
                {{ t('connections.actions.new') }}
              </button>
              <button
                type="button"
                class="danger"
                :disabled="formDisabled || selectedProfile === null"
                @click="onDeleteRequest"
              >
                {{ t('connections.actions.delete') }}
              </button>
              <button
                type="submit"
                :disabled="formDisabled"
              >
                {{ t('connections.actions.save') }}
              </button>
              <button
                type="button"
                :disabled="busy"
                @click="requestClose"
              >
                {{ t('connections.actions.cancel') }}
              </button>
            </template>
          </ConnectionForm>
        </section>
      </div>
    </div>
  </AppDialog>
</template>

<style scoped>
.connections {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.connections__notices {
  padding: 3px 5px;
  border-left: 3px solid var(--accent);
  background: var(--surface-alt);
}

.connections__warning-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.connections__warning {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px;
  margin: 0;
  color: var(--text);
  font-size: 10px;
}

.connections__path {
  padding: 0 3px;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  font-family: var(--font-mono);
  overflow-wrap: anywhere;
}

.connections__content {
  display: flex;
  gap: 8px;
  min-height: 300px;
}

.connections__list {
  flex: 0 0 230px;
  min-width: 0;
  padding: 2px;
  background: var(--surface-alt);
  border: 1px solid var(--border-soft);
  overflow: auto;
}

.connections__empty {
  margin: 4px;
  color: var(--text-muted);
  font-size: var(--font-size-data);
}

.connections__items {
  margin: 0;
  padding: 0;
  list-style: none;
}

.connections__item {
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr);
  gap: 0 4px;
  width: 100%;
  padding: 2px 4px;
  border: 0;
  background: transparent;
  color: var(--text);
  font-size: var(--font-size-data);
  text-align: left;
  cursor: default;
}

.connections__item:hover,
.connections__item:focus-visible {
  background: var(--hover);
  outline: none;
}

.connections__item--active {
  background: var(--selected-bg);
  color: var(--selected-text);
}

.connections__swatch {
  grid-row: 1 / span 2;
  align-self: center;
  width: 10px;
  height: 10px;
  border: 1px solid var(--border);
}

.connections__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.connections__meta {
  overflow: hidden;
  color: var(--text-muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.connections__item--active .connections__meta {
  color: inherit;
}

.connections__detail {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.connections__confirm {
  padding: 4px 6px;
  border-left: 3px solid var(--danger);
  background: var(--surface-alt);
}

.connections__confirm-text,
.connections__confirm-warning {
  margin: 0 0 3px;
  color: var(--text);
  font-size: var(--font-size-data);
}

.connections__confirm-warning {
  color: var(--text-muted);
  font-size: 10px;
}

.connections__alert {
  margin: 0;
  padding: 3px 5px;
  border-left: 3px solid var(--danger);
  background: var(--surface-alt);
  color: var(--danger);
  font-size: var(--font-size-data);
}

.connections__button {
  height: 20px;
  padding: 0 8px;
  border: 1px solid var(--border);
  border-radius: 0;
  background: var(--surface);
  color: var(--text);
  font-size: var(--font-size-data);
  cursor: default;
}

.connections__button:hover:not(:disabled) {
  background: var(--hover);
}

.connections__button:focus-visible {
  outline: 1px solid var(--focus);
  outline-offset: -1px;
}

.connections__button:disabled {
  color: var(--text-muted);
}

.connections__button--danger {
  color: var(--danger);
}
</style>
