/**
 * Only the packaged app:// renderer (or the dev server origin) may call IPC.
 * The URL check is pure so it can be unit-tested without Electron.
 */
export function isTrustedRendererUrl(url: string, devRendererUrl?: string): boolean {
  if (url.startsWith('app://seshat/')) {
    return true
  }
  if (devRendererUrl !== undefined) {
    try {
      return new URL(url).origin === new URL(devRendererUrl).origin
    } catch {
      return false
    }
  }
  return false
}
