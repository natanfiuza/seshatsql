# 🚀 Sugestão de Pull Request

**Mensagem de Commit Recomendada:**
```text
feat: add read-only workspace explorer prototype
```

---

## Summary

Adds a read-only workspace explorer prototype to validate the navigation model before real database integration. Users can browse a simulated connection, databases, tables, views, and events, open object metadata and sample data in ephemeral workspace tabs, and create/close query tabs. The prototype intentionally uses mock data and avoids persistence or database execution so the UX and component boundaries can be evaluated safely.

## Technical Changes

- Added a mock workspace catalog with connection, database, table, view, event, metadata grids, sample rows, and CREATE/ALTER SQL.
- Added workspace views: `WorkspaceShell`, `ConnectionWorkspace`, `DatabaseWorkspace`, `ObjectWorkspace`, `DataWorkspace`, and `MetadataGrid`.
- Extended `ObjectTree` to support typed node kinds, connection/database/object activation, folder expansion, icons, and status badges.
- Added ephemeral workspace tab helpers and query tab lifecycle logic, including deduplication, close behavior, renumbering, and recreation of `Query 1` when the last query closes.
- Enhanced `AppTabStrip` with closable/addable tabs, secondary variant, close/add events, keyboard navigation, and scrollable tab lists.
- Added `readOnly`, custom `ariaLabel`, and configurable `testId` support to `MonacoEditor`.
- Added row click/double-click events, optional row numbers, and configurable `testId` to `ResultGrid`.
- Updated the status bar to show simulated connection state and connection name.
- Expanded localization catalogs and types for workspace navigation, metadata, formatting, and tab actions across all supported locales.
- Added unit, component, and E2E coverage for the catalog, formatting, tabs, workspace views, tree activation, and explorer flow; refreshed evidence screenshots.

## Impact/Warnings

- No database schema, migration, environment variable, or dependency changes.
- The explorer is explicitly a read-only simulation; the status bar displays `Connected (simulation)` and should not be treated as a real connection.
- Ephemeral workspace tabs are not persisted by design; only query tabs are restored after restart.
- Closing the final query tab recreates `Query 1` to keep the editor usable.
- Tree single-click behavior now activates non-folder nodes while folders continue to expand/collapse.
- New i18n keys must remain synchronized across locale files and the `Messages` type.

close #23

---

[![GitPR](https://img.shields.io/badge/GitPR-12_errors_%C2%B7_0_warnings-red)](https://gitpr.natanfiuza.dev.br/)