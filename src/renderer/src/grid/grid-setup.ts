import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'

/**
 * AG Grid 36 only auto-registers the core module: locale, row selection and the
 * theming API are feature modules. Without this registration localeText and
 * enableClickSelection are ignored (validation error 200: missing module).
 * Registering the Community bundle keeps the grid Community-only.
 */
ModuleRegistry.registerModules([AllCommunityModule])
