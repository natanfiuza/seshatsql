import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  resolveDataDirectory,
  resolveLegacyDataDirectory,
  resolvePersistencePaths
} from '../../src/infrastructure/persistence/data-directory'
import { isTrustedRendererUrl } from '../../src/main/ipc-guard'

describe('persistence paths', () => {
  it('uses the approved home-relative data directory and legacy location', () => {
    const home = join('C:', 'Users', 'sample')

    expect(resolveDataDirectory(home)).toBe(join(home, '.seshatsql', 'data'))
    expect(resolveLegacyDataDirectory(home)).toBe(join(home, '.sqlseshat', 'data'))
  })

  it('names the three versioned YAML files', () => {
    const dataDirectory = join('C:', 'Users', 'sample', '.seshatsql', 'data')
    const paths = resolvePersistencePaths(dataDirectory)

    expect(paths).toEqual({
      preferences: join(dataDirectory, 'preferences.yml'),
      tabs: join(dataDirectory, 'tabs_states.yml'),
      connections: join(dataDirectory, 'connections.yml')
    })
  })
})

describe('isTrustedRendererUrl', () => {
  it('accepts the packaged app scheme only', () => {
    expect(isTrustedRendererUrl('app://seshat/index.html')).toBe(true)
    expect(isTrustedRendererUrl('app://seshat/')).toBe(true)
    expect(isTrustedRendererUrl('app://evil/index.html')).toBe(false)
    expect(isTrustedRendererUrl('file:///index.html')).toBe(false)
    expect(isTrustedRendererUrl('https://example.com/')).toBe(false)
  })

  it('accepts the dev server origin when one is configured', () => {
    expect(isTrustedRendererUrl('http://localhost:5173/', 'http://localhost:5173')).toBe(true)
    expect(isTrustedRendererUrl('http://localhost:5174/', 'http://localhost:5173')).toBe(false)
    expect(isTrustedRendererUrl('not a url', 'http://localhost:5173')).toBe(false)
  })

  it('rejects every other origin when no dev server is configured', () => {
    expect(isTrustedRendererUrl('http://localhost:5173/')).toBe(false)
  })
})
