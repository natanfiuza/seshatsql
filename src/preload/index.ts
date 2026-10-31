import { contextBridge, ipcRenderer } from 'electron'

import { IPC_CHANNELS } from '../application/persistence/channels'
import { PRODUCT_NAME } from '../domain/app-info'
import type { CloseFailureInfo, SeshatApi } from './api'

// The annotation must sit on the literal (not on a frozen wrapper) so every
// method parameter is contextually typed.
const api: SeshatApi = {
  productName: PRODUCT_NAME,
  startup: () => ipcRenderer.invoke(IPC_CHANNELS.startup),
  preferences: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.preferencesGet),
    set: (input) => ipcRenderer.invoke(IPC_CHANNELS.preferencesSet, input)
  },
  tabs: {
    load: () => ipcRenderer.invoke(IPC_CHANNELS.tabsLoad),
    save: (state) => ipcRenderer.invoke(IPC_CHANNELS.tabsSave, state),
    flush: (state) => ipcRenderer.invoke(IPC_CHANNELS.tabsFlush, state)
  },
  connections: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.connectionsList),
    save: (input) => ipcRenderer.invoke(IPC_CHANNELS.connectionsSave, input),
    delete: (input) => ipcRenderer.invoke(IPC_CHANNELS.connectionsDelete, input)
  },
  app: {
    onCloseRequested: (callback) => {
      const listener = (): void => callback()
      ipcRenderer.on(IPC_CHANNELS.closeRequested, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.closeRequested, listener)
    },
    onCloseFailed: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, info: CloseFailureInfo): void => {
        callback(info)
      }
      ipcRenderer.on(IPC_CHANNELS.closeFailed, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.closeFailed, listener)
    },
    replyClose: (reply) => ipcRenderer.send(IPC_CHANNELS.replyClose, reply),
    requestClose: () => ipcRenderer.send(IPC_CHANNELS.requestClose)
  }
}

contextBridge.exposeInMainWorld('seshat', api)
