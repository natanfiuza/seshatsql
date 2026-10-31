import { extname, resolve, sep } from 'node:path'

/** Custom scheme used instead of file:// for the packaged renderer. */
export const APP_SCHEME = 'app'

/** Single host allowed on the custom scheme. */
export const APP_HOST = 'seshat'

export const APP_ENTRY_URL = `${APP_SCHEME}://${APP_HOST}/index.html`

export interface ResolvedRendererRequest {
  /** Absolute path inside the renderer directory. */
  readonly filePath: string
  readonly mimeType: string
}

const MIME_TYPES: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8'
}

const DEFAULT_MIME_TYPE = 'application/octet-stream'

export function mimeTypeForPath(filePath: string): string {
  return MIME_TYPES[extname(filePath).toLowerCase()] ?? DEFAULT_MIME_TYPE
}

function isInside(root: string, candidate: string): boolean {
  return candidate === root || candidate.startsWith(root + sep)
}

/**
 * Maps an app:// request to a file inside the renderer directory.
 * Returns null for other hosts, malformed URLs and path traversal attempts.
 */
export function resolveRendererRequest(
  requestUrl: string,
  rendererRoot: string
): ResolvedRendererRequest | null {
  let url: URL
  try {
    url = new URL(requestUrl)
  } catch {
    return null
  }

  if (url.protocol !== `${APP_SCHEME}:` || url.hostname !== APP_HOST) {
    return null
  }

  let pathname: string
  try {
    pathname = decodeURIComponent(url.pathname)
  } catch {
    return null
  }

  // NUL bytes and backslashes never appear in a legitimate asset path.
  if (pathname.includes('\0') || pathname.includes('\\')) {
    return null
  }

  const relative = pathname.replace(/^\/+/, '')
  const segments = relative.split('/')
  if (segments.some((segment) => segment === '..' || segment === '.')) {
    return null
  }

  const candidate = relative === '' || relative.endsWith('/') ? `${relative}index.html` : relative
  const root = resolve(rendererRoot)
  const filePath = resolve(root, candidate)

  if (!isInside(root, filePath)) {
    return null
  }

  return { filePath, mimeType: mimeTypeForPath(filePath) }
}
