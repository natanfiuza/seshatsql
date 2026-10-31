import { safeStorage } from 'electron'

import type { SecretProtector, SecretResult } from '../../application/persistence/secret-protector'

/**
 * DPAPI on Windows through Electron safeStorage. There is intentionally no
 * plaintext fallback: when the OS protector is unavailable, the operation
 * fails and the caller keeps the existing ciphertext untouched.
 */
export class ElectronSecretProtector implements SecretProtector {
  isAvailable(): boolean {
    try {
      return safeStorage.isEncryptionAvailable()
    } catch {
      return false
    }
  }

  encrypt(plaintext: string): SecretResult<string> {
    if (!this.isAvailable()) {
      return { ok: false, reason: 'encryption-unavailable' }
    }
    try {
      return { ok: true, value: safeStorage.encryptString(plaintext).toString('base64') }
    } catch {
      return { ok: false, reason: 'encryption-unavailable' }
    }
  }

  decrypt(data: string): SecretResult<string> {
    try {
      return { ok: true, value: safeStorage.decryptString(Buffer.from(data, 'base64')) }
    } catch {
      return { ok: false, reason: 'decryption-failed' }
    }
  }
}
