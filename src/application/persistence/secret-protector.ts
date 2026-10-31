/**
 * OS-backed secret protection boundary. Implementations never fall back to
 * plaintext; a failure is reported as a typed reason and the stored value is
 * left untouched.
 */
export type SecretFailureReason = 'encryption-unavailable' | 'decryption-failed'

export type SecretResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reason: SecretFailureReason }

export interface SecretProtector {
  isAvailable(): boolean
  /** Returns base64-encoded OS ciphertext. */
  encrypt(plaintext: string): SecretResult<string>
  /** Accepts base64-encoded OS ciphertext. */
  decrypt(data: string): SecretResult<string>
}
