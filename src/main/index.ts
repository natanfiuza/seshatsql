import { join } from 'node:path'

import { app, BrowserWindow, Menu, session } from 'electron'

import { PRODUCT_NAME } from '../domain/app-info'
import { createCloseCoordinator, type CloseCoordinator } from './close-coordinator'
import { createPersistenceRuntime, type PersistenceRuntime } from './persistence'
import { installAppProtocol, registerAppScheme } from './protocol/app-protocol'
import { APP_ENTRY_URL } from './protocol/renderer-path'
import { installRequestLog } from './request-log'

let mainWindow: BrowserWindow | null = null
let closeCoordinator: CloseCoordinator | null = null
let persistenceRuntime: PersistenceRuntime | null = null
let disposePersistenceIpc: (() => void) | null = null

// Must run before app.whenReady().
registerAppScheme()

// Test-only override so end-to-end runs never share the real Electron profile
// (or its Chromium process singleton) with each other or with the user.
const userDataOverride = process.env['SESHAT_USER_DATA_DIR']
if (userDataOverride !== undefined && userDataOverride !== '') {
  app.setPath('userData', userDataOverride)
}

/** Renderer permissions granted to content; everything else is denied. */
const ALLOWED_PERMISSIONS: ReadonlySet<string> = new Set(['clipboard-sanitized-write'])

function installPermissionPolicy(): void {
  session.defaultSession.setPermissionRequestHandler((_contents, permission, callback) => {
    callback(ALLOWED_PERMISSIONS.has(permission))
  })
  session.defaultSession.setPermissionCheckHandler((_contents, permission) => {
    return ALLOWED_PERMISSIONS.has(permission)
  })
}

/** Keeps DevTools reachable in development now that the native menu is gone. */
function installDevShortcuts(window: BrowserWindow): void {
  if (app.isPackaged) {
    return
  }
  window.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') {
      return
    }
    if (input.key === 'F12') {
      event.preventDefault()
      window.webContents.toggleDevTools()
      return
    }
    const chord = (input.control || input.meta) && input.shift
    if (!chord) {
      return
    }
    if (input.key.toLowerCase() === 'i') {
      event.preventDefault()
      window.webContents.toggleDevTools()
    } else if (input.key.toLowerCase() === 'r') {
      event.preventDefault()
      window.webContents.reload()
    }
  })
}

function createWindow(): void {
  const window = new BrowserWindow({
    width: 950,
    height: 600,
    minWidth: 865,
    minHeight: 480,
    show: false,
    title: PRODUCT_NAME,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  })

  mainWindow = window
  closeCoordinator = createCloseCoordinator(window)
  window.on('closed', () => {
    closeCoordinator?.dispose()
    closeCoordinator = null
    if (mainWindow === window) {
      mainWindow = null
    }
  })

  window.once('ready-to-show', () => {
    window.show()
  })

  // Rendered content cannot open a new window.
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  // Navigation only to the URL loaded by the main process.
  window.webContents.on('will-navigate', (event) => {
    event.preventDefault()
  })

  installDevShortcuts(window)

  const rendererUrl = process.env['ELECTRON_RENDERER_URL']
  if (rendererUrl !== undefined && !app.isPackaged) {
    void window.loadURL(rendererUrl)
  } else {
    void window.loadURL(APP_ENTRY_URL)
  }
}

app.whenReady().then(async () => {
  // The shell draws its own menu bar inside the window.
  Menu.setApplicationMenu(null)

  // In a packaged app __dirname is inside the asar archive; the same relative
  // path keeps working there and in `electron-vite preview`.
  installAppProtocol(join(__dirname, '../renderer'))
  installPermissionPolicy()
  installRequestLog()

  const dataDirectoryOverride = process.env['SESHAT_DATA_DIR']
  persistenceRuntime = await createPersistenceRuntime(
    dataDirectoryOverride === undefined || dataDirectoryOverride === ''
      ? { home: app.getPath('home') }
      : { home: app.getPath('home'), dataDirectory: dataDirectoryOverride }
  )
  disposePersistenceIpc = persistenceRuntime.installIpc(
    () => mainWindow,
    process.env['ELECTRON_RENDERER_URL']
  )

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('will-quit', () => {
  disposePersistenceIpc?.()
  disposePersistenceIpc = null
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
