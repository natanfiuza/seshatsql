import { join } from 'node:path'

import { app, BrowserWindow, session } from 'electron'

import { PRODUCT_NAME } from '../domain/app-info'
import { installAppProtocol, registerAppScheme } from './protocol/app-protocol'
import { APP_ENTRY_URL } from './protocol/renderer-path'
import { installRequestLog } from './request-log'

// Must run before app.whenReady().
registerAppScheme()

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

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    title: PRODUCT_NAME,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
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

  const rendererUrl = process.env['ELECTRON_RENDERER_URL']
  if (rendererUrl !== undefined && !app.isPackaged) {
    void window.loadURL(rendererUrl)
  } else {
    void window.loadURL(APP_ENTRY_URL)
  }
}

app.whenReady().then(() => {
  // In a packaged app __dirname is inside the asar archive; the same relative
  // path keeps working there and in `electron-vite preview`.
  installAppProtocol(join(__dirname, '../renderer'))
  installPermissionPolicy()
  installRequestLog()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
