import type { ColumnFormat } from './catalog'

export type Translate = (key: string, params?: Record<string, unknown>) => string

const BYTE_UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'] as const

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value)
}

export function formatEstimatedRows(value: number | null, locale: string): string {
  if (value === null) {
    return '~0'
  }
  return `~${formatNumber(value, locale)}`
}

export function formatBytes(value: number | null, locale: string, translate: Translate): string {
  if (value === null) {
    return translate('shell.workspace.notAvailable')
  }
  if (value === 0) {
    return `0 ${translate('shell.workspace.units.byte')}`
  }

  let unitIndex = 0
  let scaled = value
  while (scaled >= 1024 && unitIndex < BYTE_UNITS.length - 1) {
    scaled /= 1024
    unitIndex += 1
  }

  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: unitIndex === 0 ? 0 : 1
  }).format(scaled)
  return `${formatted} ${translate(`shell.workspace.units.${BYTE_UNITS[unitIndex]}`)}`
}

export function formatDateTime(
  value: string | null,
  locale: string,
  translate: Translate
): string {
  if (value === null) {
    return translate('shell.workspace.notAvailable')
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return translate('shell.workspace.notAvailable')
  }
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC'
  }).format(parsed)
}

export function formatObjectType(value: string, translate: Translate): string {
  return translate(`shell.workspace.objectTypes.${value}`)
}

export function formatScope(value: string, translate: Translate): string {
  return translate(`shell.workspace.values.${value}`)
}

export function formatBoolean(value: boolean, translate: Translate): string {
  return translate(value ? 'shell.workspace.values.yes' : 'shell.workspace.values.no')
}

export function formatValue(
  value: unknown,
  format: ColumnFormat | undefined,
  locale: string,
  translate: Translate
): string {
  if (value === null || value === undefined) {
    return translate('shell.workspace.notAvailable')
  }

  switch (format) {
    case 'number':
      return typeof value === 'number'
        ? formatNumber(value, locale)
        : String(value)
    case 'estimated':
      return typeof value === 'number'
        ? formatEstimatedRows(value, locale)
        : translate('shell.workspace.notAvailable')
    case 'bytes':
      return typeof value === 'number'
        ? formatBytes(value, locale, translate)
        : translate('shell.workspace.notAvailable')
    case 'date':
      return typeof value === 'string'
        ? formatDateTime(value, locale, translate)
        : translate('shell.workspace.notAvailable')
    case 'objectType':
      return formatObjectType(String(value), translate)
    case 'scope':
      return formatScope(String(value), translate)
    case 'boolean':
      return typeof value === 'boolean'
        ? formatBoolean(value, translate)
        : translate('shell.workspace.notAvailable')
    default:
      return String(value)
  }
}

export function formatFieldValue(
  field: { value?: unknown; valueKey?: string; format?: ColumnFormat },
  locale: string,
  translate: Translate
): string {
  if (field.valueKey !== undefined) {
    return translate(field.valueKey)
  }
  return formatValue(field.value, field.format, locale, translate)
}
