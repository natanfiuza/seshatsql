<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { ConnectionFailureReason } from '../../../../application/persistence/connections-service'
import type { ConnectionInput } from '../../../../application/persistence/ipc-contract'
import {
  CONNECTION_COLORS,
  DEFAULT_CONNECTION_COLOR,
  isConnectionColor,
  type ConnectionColor
} from '../../../../domain/persistence/connection-palette'
import {
  CONNECTION_ENVIRONMENTS,
  type ConnectionEnvironment,
  type PublicConnection
} from '../../../../domain/persistence/types'
import {
  connectionColorKey,
  connectionFailureMessageKey,
  environmentMessageKey,
  validationMessageKey
} from './presentation'
import {
  validateConnectionForm,
  type ConnectionField,
  type ConnectionValidationCode
} from './validation'

const props = defineProps<{
  profile: PublicConnection | null
  disabled: boolean
  serverError: ConnectionFailureReason | null
}>()

const emit = defineEmits<{
  submit: [input: ConnectionInput]
  dirty: [dirty: boolean]
}>()

const { t } = useI18n()

const root = ref<HTMLFormElement | null>(null)

const name = ref(props.profile?.name ?? '')
const host = ref(props.profile?.host ?? '')
const port = ref(String(props.profile?.port ?? 3306))
const user = ref(props.profile?.user ?? '')
const password = ref('')
const removePassword = ref(false)
const environment = ref<ConnectionEnvironment>(props.profile?.environment ?? 'development')
const environmentLabel = ref(props.profile?.environmentLabel ?? '')
const color = ref<string>(
  props.profile !== null && isConnectionColor(props.profile.color)
    ? props.profile.color
    : DEFAULT_CONNECTION_COLOR
)

const errors = ref<Partial<Record<ConnectionField, ConnectionValidationCode>>>({})

const isCustom = computed(() => environment.value === 'custom')
const hasSavedPassword = computed(() => props.profile?.hasPassword === true)
const passwordPlaceholder = computed(() =>
  hasSavedPassword.value
    ? t('connections.fields.passwordPlaceholderKeep')
    : t('connections.fields.passwordPlaceholderNone')
)

const initialSnapshot = JSON.stringify(formSnapshot())
const dirty = computed(() => JSON.stringify(formSnapshot()) !== initialSnapshot)

function formSnapshot(): Record<string, unknown> {
  return {
    name: name.value,
    host: host.value,
    port: String(port.value),
    user: user.value,
    password: password.value,
    removePassword: removePassword.value,
    environment: environment.value,
    environmentLabel: environmentLabel.value,
    color: color.value
  }
}

watch(
  dirty,
  (value) => {
    emit('dirty', value)
  },
  { immediate: true }
)

watch(password, (value) => {
  if (value.length > 0 && removePassword.value) {
    removePassword.value = false
  }
})

watch(removePassword, (value) => {
  if (value) {
    password.value = ''
  }
})

function fieldError(field: ConnectionField): ConnectionValidationCode | undefined {
  return errors.value[field]
}

function errorId(field: ConnectionField): string {
  return `connection-error-${field}`
}

function fieldMessage(field: ConnectionField): string {
  const code = errors.value[field]
  return code === undefined ? '' : t(validationMessageKey(code))
}

function clearError(field: ConnectionField): void {
  if (errors.value[field] === undefined) {
    return
  }
  const next = { ...errors.value }
  delete next[field]
  errors.value = next
}

function focusField(field: ConnectionField): void {
  root.value?.querySelector<HTMLElement>(`[data-field="${field}"]`)?.focus()
}

function buildInput(): ConnectionInput {
  const input: ConnectionInput = {
    ...(props.profile !== null ? { id: props.profile.id } : {}),
    name: name.value.trim(),
    color: color.value as ConnectionColor,
    environment: environment.value,
    environmentLabel: isCustom.value ? environmentLabel.value.trim() : null,
    host: host.value.trim(),
    port: Number(String(port.value).trim()),
    user: user.value.trim()
  }
  if (removePassword.value) {
    input.password = null
  } else if (password.value.length > 0) {
    input.password = password.value
  }
  return input
}

function onSubmit(): void {
  const issues = validateConnectionForm({
    name: name.value,
    host: host.value,
    port: String(port.value),
    user: user.value,
    environment: environment.value,
    environmentLabel: environmentLabel.value,
    color: color.value
  })
  if (issues.length > 0) {
    const next: Partial<Record<ConnectionField, ConnectionValidationCode>> = {}
    for (const issue of issues) {
      next[issue.field] ??= issue.code
    }
    errors.value = next
    void nextTick(() => {
      const first = issues[0]
      if (first !== undefined) {
        focusField(first.field)
      }
    })
    return
  }
  errors.value = {}
  emit('submit', buildInput())
}
</script>

<template>
  <form
    ref="root"
    class="form"
    novalidate
    @submit.prevent="onSubmit"
  >
    <fieldset
      class="form__fields"
      :disabled="disabled"
    >
      <div class="form__field">
        <label
          class="form__label"
          for="connection-name"
        >{{ t('connections.fields.name') }}</label>
        <input
          id="connection-name"
          v-model="name"
          data-field="name"
          class="form__input"
          type="text"
          maxlength="100"
          :aria-invalid="fieldError('name') !== undefined"
          :aria-describedby="fieldError('name') !== undefined ? errorId('name') : undefined"
          @input="clearError('name')"
        >
        <span
          v-if="fieldError('name') !== undefined"
          :id="errorId('name')"
          class="form__error"
          role="alert"
        >{{ fieldMessage('name') }}</span>
      </div>

      <div class="form__row">
        <div class="form__field form__field--host">
          <label
            class="form__label"
            for="connection-host"
          >{{ t('connections.fields.host') }}</label>
          <input
            id="connection-host"
            v-model="host"
            data-field="host"
            class="form__input"
            type="text"
            maxlength="253"
            :aria-invalid="fieldError('host') !== undefined"
            :aria-describedby="fieldError('host') !== undefined ? errorId('host') : undefined"
            @input="clearError('host')"
          >
          <span
            v-if="fieldError('host') !== undefined"
            :id="errorId('host')"
            class="form__error"
            role="alert"
          >{{ fieldMessage('host') }}</span>
        </div>

        <div class="form__field form__field--port">
          <label
            class="form__label"
            for="connection-port"
          >{{ t('connections.fields.port') }}</label>
          <input
            id="connection-port"
            v-model="port"
            data-field="port"
            class="form__input"
            type="number"
            min="1"
            max="65535"
            step="1"
            :aria-invalid="fieldError('port') !== undefined"
            :aria-describedby="fieldError('port') !== undefined ? errorId('port') : undefined"
            @input="clearError('port')"
          >
          <span
            v-if="fieldError('port') !== undefined"
            :id="errorId('port')"
            class="form__error"
            role="alert"
          >{{ fieldMessage('port') }}</span>
        </div>
      </div>

      <div class="form__field">
        <label
          class="form__label"
          for="connection-user"
        >{{ t('connections.fields.user') }}</label>
        <input
          id="connection-user"
          v-model="user"
          data-field="user"
          class="form__input"
          type="text"
          maxlength="128"
          autocomplete="username"
          :aria-invalid="fieldError('user') !== undefined"
          :aria-describedby="fieldError('user') !== undefined ? errorId('user') : undefined"
          @input="clearError('user')"
        >
        <span
          v-if="fieldError('user') !== undefined"
          :id="errorId('user')"
          class="form__error"
          role="alert"
        >{{ fieldMessage('user') }}</span>
      </div>

      <div class="form__field">
        <label
          class="form__label"
          for="connection-password"
        >{{ t('connections.fields.password') }}</label>
        <input
          id="connection-password"
          v-model="password"
          class="form__input"
          type="password"
          maxlength="4096"
          autocomplete="new-password"
          spellcheck="false"
          :disabled="disabled || removePassword"
          :placeholder="passwordPlaceholder"
        >
        <p
          v-if="hasSavedPassword"
          class="form__hint"
        >
          {{ t('connections.fields.passwordSaved') }}
        </p>
        <label
          v-if="hasSavedPassword"
          class="form__checkbox"
        >
          <input
            v-model="removePassword"
            type="checkbox"
            :disabled="disabled"
          >
          <span>{{ t('connections.fields.removePassword') }}</span>
        </label>
      </div>

      <div class="form__row">
        <div class="form__field">
          <label
            class="form__label"
            for="connection-environment"
          >{{ t('connections.fields.environment') }}</label>
          <select
            id="connection-environment"
            v-model="environment"
            data-field="environment"
            class="form__input"
            :aria-invalid="fieldError('environment') !== undefined"
            @change="clearError('environment')"
          >
            <option
              v-for="option in CONNECTION_ENVIRONMENTS"
              :key="option"
              :value="option"
            >
              {{ t(environmentMessageKey(option)) }}
            </option>
          </select>
        </div>

        <div
          v-if="isCustom"
          class="form__field"
        >
          <label
            class="form__label"
            for="connection-environment-label"
          >{{ t('connections.fields.environmentLabel') }}</label>
          <input
            id="connection-environment-label"
            v-model="environmentLabel"
            data-field="environmentLabel"
            class="form__input"
            type="text"
            maxlength="32"
            :aria-invalid="fieldError('environmentLabel') !== undefined"
            :aria-describedby="fieldError('environmentLabel') !== undefined ? errorId('environmentLabel') : undefined"
            @input="clearError('environmentLabel')"
          >
          <span
            v-if="fieldError('environmentLabel') !== undefined"
            :id="errorId('environmentLabel')"
            class="form__error"
            role="alert"
          >{{ fieldMessage('environmentLabel') }}</span>
        </div>
      </div>

      <fieldset
        class="form__colors"
        :aria-invalid="fieldError('color') !== undefined"
        :aria-describedby="fieldError('color') !== undefined ? errorId('color') : undefined"
      >
        <legend class="form__label">
          {{ t('connections.fields.color') }}
        </legend>
        <div class="form__color-grid">
          <label
            v-for="option in CONNECTION_COLORS"
            :key="option"
            class="form__color-option"
          >
            <input
              v-model="color"
              data-field="color"
              type="radio"
              name="connection-color"
              :value="option"
              @change="clearError('color')"
            >
            <span
              class="form__swatch"
              :style="{ backgroundColor: option }"
              aria-hidden="true"
            />
            <span>{{ t(connectionColorKey(option)) }}</span>
          </label>
        </div>
        <span
          v-if="fieldError('color') !== undefined"
          :id="errorId('color')"
          class="form__error"
          role="alert"
        >{{ fieldMessage('color') }}</span>
      </fieldset>

      <p class="form__hint">
        {{ t('connections.passwordHint') }}
      </p>
    </fieldset>

    <p
      v-if="serverError !== null"
      class="form__alert"
      role="alert"
    >
      {{ t(connectionFailureMessageKey(serverError)) }}
    </p>

    <div class="form__actions">
      <slot name="actions" />
    </div>
  </form>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.form__fields {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.form__row {
  display: flex;
  gap: 8px;
  min-width: 0;
}

.form__field {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.form__field--host {
  flex: 2 1 auto;
}

.form__field--port {
  flex: 0 0 88px;
}

.form__label {
  color: var(--text-muted);
  font-size: var(--font-size-data);
}

.form__input {
  width: 100%;
  height: 20px;
  padding: 0 4px;
  border: 1px solid var(--border);
  border-radius: 0;
  background: var(--surface);
  color: var(--text);
  font-family: inherit;
  font-size: var(--font-size-data);
}

.form__input:focus-visible {
  outline: 1px solid var(--focus);
  outline-offset: -1px;
}

.form__input[aria-invalid='true'] {
  border-color: var(--danger);
}

.form__error {
  color: var(--danger);
  font-size: 10px;
}

.form__alert {
  margin: 0;
  padding: 3px 5px;
  border-left: 3px solid var(--danger);
  background: var(--surface-alt);
  color: var(--danger);
  font-size: var(--font-size-data);
}

.form__hint {
  margin: 0;
  color: var(--text-muted);
  font-size: 10px;
}

.form__checkbox {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text);
  font-size: var(--font-size-data);
}

.form__colors {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.form__color-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 3px 8px;
}

.form__color-option {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text);
  font-size: var(--font-size-data);
  white-space: nowrap;
}

.form__swatch {
  width: 10px;
  height: 10px;
  border: 1px solid var(--border);
}

.form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  padding-top: 4px;
  border-top: 1px solid var(--border-soft);
}

.form__actions :deep(button) {
  height: 20px;
  padding: 0 8px;
  border: 1px solid var(--border);
  border-radius: 0;
  background: var(--surface);
  color: var(--text);
  font-size: var(--font-size-data);
  cursor: default;
}

.form__actions :deep(button:hover:not(:disabled)) {
  background: var(--hover);
}

.form__actions :deep(button:focus-visible) {
  outline: 1px solid var(--focus);
  outline-offset: -1px;
}

.form__actions :deep(button:disabled) {
  color: var(--text-muted);
}

.form__actions :deep(button.danger) {
  color: var(--danger);
}
</style>
