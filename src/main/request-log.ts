import { appendFile } from 'node:fs/promises'

import { session } from 'electron'

/**
 * Offline evidence helper. When SESHAT_REQUEST_LOG points to a file, every
 * renderer request is appended as "timestamp METHOD url". Only the URL and the
 * method are recorded: never bodies, headers or SQL text. Disabled by default.
 */
export function installRequestLog(): void {
  const target = process.env['SESHAT_REQUEST_LOG']
  if (target === undefined || target === '') {
    return
  }

  let queue: Promise<void> = Promise.resolve()

  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const line = `${new Date().toISOString()} ${details.method} ${details.url}\n`
    queue = queue.then(() => appendFile(target, line, 'utf8')).catch(() => undefined)
    callback({})
  })
}
