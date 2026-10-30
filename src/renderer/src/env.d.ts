import type { SeshatApi } from '../../preload/api'

declare global {
  interface Window {
    readonly seshat: SeshatApi
  }
}

export {}
