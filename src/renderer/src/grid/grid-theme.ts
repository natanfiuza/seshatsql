import { themeQuartz } from 'ag-grid-community'

import { PALETTES } from '../theme/palette'
import type { ResolvedTheme } from '../theme/theme'

/**
 * The grid uses the same concrete palette as the chrome (theme/palette.ts), so a
 * theme change cannot leave it on stale colors. Density follows the observed
 * desktop reference: 20 px rows, 1 px borders on both axes, no zebra striping.
 */
export function createGridTheme(theme: ResolvedTheme) {
  const palette = PALETTES[theme]

  return themeQuartz.withParams({
    accentColor: palette.accent,
    backgroundColor: palette.surface,
    foregroundColor: palette.text,
    borderColor: palette.gridLine,
    headerBackgroundColor: palette.gridHeaderBg,
    headerTextColor: palette.text,
    oddRowBackgroundColor: palette.surface,
    selectedRowBackgroundColor: palette.selectedBg,
    browserColorScheme: theme,
    fontFamily: "Tahoma, 'Segoe UI', sans-serif",
    fontSize: 11,
    rowHeight: 20,
    cellHorizontalPadding: 6,
    wrapperBorderRadius: 0,
    rowBorder: true,
    columnBorder: true
  })
}
