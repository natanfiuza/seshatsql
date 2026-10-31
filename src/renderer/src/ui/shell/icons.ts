import bookOpen from '../../assets/icons/nova-line/Book-Open--Streamline-Nova.svg?url'
import clock from '../../assets/icons/nova-line/Clock-Circle-1--Streamline-Nova.svg?url'
import disconnected from '../../assets/icons/nova-line/Cloud-Disable-Disconnected--Streamline-Nova.svg?url'
import database from '../../assets/icons/nova-line/Database--Streamline-Nova.svg?url'
import stop from '../../assets/icons/nova-line/Disable-Remove-Square-1--Streamline-Nova.svg?url'
import eraser from '../../assets/icons/nova-line/Eraser--Streamline-Nova.svg?url'
import newQuery from '../../assets/icons/nova-line/File-Text-1--Streamline-Nova.svg?url'
import filter from '../../assets/icons/nova-line/Filter-1--Streamline-Nova.svg?url'
import save from '../../assets/icons/nova-line/Floppy-Disk-1--Streamline-Nova.svg?url'
import grid from '../../assets/icons/nova-line/Graphic-Grid--Streamline-Nova.svg?url'
import theme from '../../assets/icons/nova-line/Light-Mode-Brightness--Streamline-Nova.svg?url'
import search from '../../assets/icons/nova-line/Magnifier--Streamline-Nova.svg?url'
import refresh from '../../assets/icons/nova-line/Repeat-Track-Arrow--Streamline-Nova.svg?url'
import settings from '../../assets/icons/nova-line/Settings-Double-Cog--Streamline-Nova.svg?url'
import execute from '../../assets/icons/nova-line/Media--Streamline-Nova.svg?url'
import log from '../../assets/icons/nova-line/Task-List-1--Streamline-Nova.svg?url'

/**
 * Free Nova Line icons (CC BY 4.0, see the ATTRIBUTION.md next to the files).
 * Only names used by the shell are imported, so Vite bundles exactly these.
 */
export const ICON_URLS = {
  newQuery,
  open: bookOpen,
  save,
  execute,
  stop,
  refresh,
  filter,
  search,
  database,
  grid,
  settings,
  disconnected,
  theme,
  log,
  history: clock,
  clear: eraser
} as const

export type IconName = keyof typeof ICON_URLS
