import { join } from 'node:path'

import { app, BrowserWindow } from 'electron'

import { PRODUCT_NAME } from '../domain/app-info'

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

  // Nenhuma janela nova é aberta pelo conteúdo renderizado.
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  // Navegação só pela URL carregada pelo processo principal.
  window.webContents.on('will-navigate', (event) => {
    event.preventDefault()
  })

  const rendererUrl = process.env['ELECTRON_RENDERER_URL']
  if (rendererUrl !== undefined && !app.isPackaged) {
    void window.loadURL(rendererUrl)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
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
