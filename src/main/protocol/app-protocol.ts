import { readFile } from 'node:fs/promises'

import { protocol } from 'electron'

import { PRODUCTION_CSP } from './csp'
import { APP_SCHEME, resolveRendererRequest } from './renderer-path'

/**
 * Must run before app.whenReady(): a privileged, standard and secure scheme is
 * required for ES modules, workers and fetch to work from the packaged renderer.
 */
export function registerAppScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: APP_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true
      }
    }
  ])
}

function notFound(): Response {
  return new Response('Not found', {
    status: 404,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'x-content-type-options': 'nosniff'
    }
  })
}

/**
 * Serves only files under rendererRoot through app://, with a strict CSP header
 * on HTML documents. Unknown hosts, paths and traversal attempts return 404.
 */
export function installAppProtocol(rendererRoot: string): void {
  protocol.handle(APP_SCHEME, async (request) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', {
        status: 405,
        headers: { 'content-type': 'text/plain; charset=utf-8' }
      })
    }

    const resolved = resolveRendererRequest(request.url, rendererRoot)
    if (resolved === null) {
      return notFound()
    }

    let body: Buffer
    try {
      body = await readFile(resolved.filePath)
    } catch {
      return notFound()
    }

    const headers: Record<string, string> = {
      'content-type': resolved.mimeType,
      'x-content-type-options': 'nosniff'
    }

    if (resolved.mimeType === 'text/html; charset=utf-8') {
      headers['content-security-policy'] = PRODUCTION_CSP
    }

    if (request.method === 'HEAD') {
      return new Response(null, { status: 200, headers })
    }

    // Buffer is not accepted directly by the BodyInit types used by Electron.
    return new Response(new Uint8Array(body), { status: 200, headers })
  })
}
