import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  APP_ENTRY_URL,
  mimeTypeForPath,
  resolveRendererRequest
} from '../../src/main/protocol/renderer-path'

const ROOT = resolve('/app/renderer')

describe('mimeTypeForPath', () => {
  it('maps the extensions the renderer bundle produces', () => {
    expect(mimeTypeForPath('index.html')).toBe('text/html; charset=utf-8')
    expect(mimeTypeForPath('assets/index-abc.js')).toBe('text/javascript; charset=utf-8')
    expect(mimeTypeForPath('assets/index-abc.css')).toBe('text/css; charset=utf-8')
    expect(mimeTypeForPath('assets/editor.worker-abc.js')).toBe('text/javascript; charset=utf-8')
  })

  it('is case insensitive and falls back to a binary type', () => {
    expect(mimeTypeForPath('FONT.WOFF2')).toBe('font/woff2')
    expect(mimeTypeForPath('artifact.bin')).toBe('application/octet-stream')
  })
})

describe('resolveRendererRequest', () => {
  it('points the entry URL at index.html', () => {
    expect(resolveRendererRequest(APP_ENTRY_URL, ROOT)).toEqual({
      filePath: join(ROOT, 'index.html'),
      mimeType: 'text/html; charset=utf-8'
    })
  })

  it('serves the directory root as index.html', () => {
    expect(resolveRendererRequest('app://seshat/', ROOT)?.filePath).toBe(join(ROOT, 'index.html'))
  })

  it('resolves nested assets inside the renderer directory', () => {
    expect(resolveRendererRequest('app://seshat/assets/index-abc.js', ROOT)?.filePath).toBe(
      join(ROOT, 'assets', 'index-abc.js')
    )
  })

  it('decodes percent-encoded asset names', () => {
    expect(resolveRendererRequest('app://seshat/assets/a%20b.css', ROOT)?.filePath).toBe(
      join(ROOT, 'assets', 'a b.css')
    )
  })

  it('rejects other hosts and schemes', () => {
    expect(resolveRendererRequest('app://other/index.html', ROOT)).toBeNull()
    expect(resolveRendererRequest('https://seshat/index.html', ROOT)).toBeNull()
    expect(resolveRendererRequest('file:///C:/index.html', ROOT)).toBeNull()
  })

  it('rejects malformed URLs', () => {
    expect(resolveRendererRequest('not a url', ROOT)).toBeNull()
    expect(resolveRendererRequest('app://seshat/%E0%A4%A', ROOT)).toBeNull()
  })

  it('collapses encoded dot segments instead of escaping the root', () => {
    // The WHATWG parser normalizes %2e%2e, so the request stays under the root.
    expect(resolveRendererRequest('app://seshat/%2e%2e/%2e%2e/secret.txt', ROOT)?.filePath).toBe(
      join(ROOT, 'secret.txt')
    )
  })

  it('rejects encoded separators that would escape the root', () => {
    expect(resolveRendererRequest('app://seshat/%2e%2e%2fsecret.txt', ROOT)).toBeNull()
    expect(resolveRendererRequest('app://seshat/assets/%5c..%5csecret.txt', ROOT)).toBeNull()
    expect(resolveRendererRequest('app://seshat/..%5csecret.txt', ROOT)).toBeNull()
  })

  it('rejects NUL bytes', () => {
    expect(resolveRendererRequest('app://seshat/index%00.html', ROOT)).toBeNull()
  })
})
