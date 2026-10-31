import { ipcMain, type BrowserWindow, type Event, type IpcMainEvent } from 'electron'

import { closeReplySchema, IPC_CHANNELS } from '../application/persistence/ipc-contract'

const CLOSE_TIMEOUT_MS = 3000

export interface CloseCoordinator {
  dispose: () => void
}

/**
 * Gives the renderer a chance to flush pending state before the window closes.
 * A failed flush (or a timeout) keeps the window open; only an explicit
 * "discard" reply lets the close proceed without saving.
 */
export function createCloseCoordinator(
  window: BrowserWindow,
  timeoutMs: number = CLOSE_TIMEOUT_MS
): CloseCoordinator {
  // Keep the reference: window.webContents throws once the window is destroyed,
  // which is exactly when 'closed' calls dispose().
  const contents = window.webContents
  let allowClose = false
  let pending = false
  let timer: ReturnType<typeof setTimeout> | null = null
  let disposed = false

  function clearTimer(): void {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function isMainFrame(event: IpcMainEvent): boolean {
    return (
      !window.isDestroyed() &&
      event.sender === window.webContents &&
      event.senderFrame === window.webContents.mainFrame
    )
  }

  function onClose(event: Event): void {
    if (allowClose) {
      return
    }
    event.preventDefault()
    if (window.webContents.isDestroyed()) {
      allowClose = true
      window.close()
      return
    }
    if (pending) {
      return
    }
    pending = true
    window.webContents.send(IPC_CHANNELS.closeRequested)
    timer = setTimeout(() => {
      timer = null
      pending = false
      if (!window.isDestroyed() && !window.webContents.isDestroyed()) {
        window.webContents.send(IPC_CHANNELS.closeFailed, { reason: 'timeout' })
      }
    }, timeoutMs)
  }

  function onReply(event: IpcMainEvent, raw: unknown): void {
    if (!isMainFrame(event)) {
      return
    }
    const parsed = closeReplySchema.safeParse(raw)
    if (!parsed.success) {
      return
    }
    clearTimer()
    pending = false
    if (parsed.data.discard === true || parsed.data.ok) {
      allowClose = true
      // Close after this IPC handler returns: re-entering window.close() from
      // inside the reply leaves the app process alive after 'quit'.
      setImmediate(() => {
        if (!window.isDestroyed()) {
          window.close()
        }
      })
    }
  }

  function onRequest(event: IpcMainEvent): void {
    if (!isMainFrame(event)) {
      return
    }
    if (!window.isDestroyed()) {
      window.close()
    }
  }

  function onGone(): void {
    allowClose = true
  }

  function dispose(): void {
    if (disposed) {
      return
    }
    disposed = true
    clearTimer()
    window.removeListener('close', onClose)
    window.removeListener('closed', dispose)
    if (!contents.isDestroyed()) {
      contents.removeListener('render-process-gone', onGone)
    }
    ipcMain.removeListener(IPC_CHANNELS.replyClose, onReply)
    ipcMain.removeListener(IPC_CHANNELS.requestClose, onRequest)
  }

  window.on('close', onClose)
  window.on('closed', dispose)
  window.webContents.on('render-process-gone', onGone)
  ipcMain.on(IPC_CHANNELS.replyClose, onReply)
  ipcMain.on(IPC_CHANNELS.requestClose, onRequest)

  return { dispose }
}
