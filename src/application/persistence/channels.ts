/**
 * Runtime-safe channel names. This module must not import zod or Node APIs:
 * the sandboxed preload bundle imports it and can only require Electron.
 */
export const IPC_CHANNELS = {
  startup: 'app:startup',
  preferencesGet: 'preferences:get',
  preferencesSet: 'preferences:set',
  tabsLoad: 'tabs:load',
  tabsSave: 'tabs:save',
  tabsFlush: 'tabs:flush',
  connectionsList: 'connections:list',
  connectionsSave: 'connections:save',
  connectionsDelete: 'connections:delete',
  closeRequested: 'app:close-requested',
  closeFailed: 'app:close-failed',
  replyClose: 'app:reply-close',
  requestClose: 'app:request-close'
} as const
