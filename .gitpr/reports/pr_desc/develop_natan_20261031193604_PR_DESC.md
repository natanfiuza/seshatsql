# 🚀 Sugestão de Pull Request

**Mensagem de Commit Recomendada:**
```text
feat: add versioned YAML persistence with encrypted secrets
```

---

## Summary

SeshatSQL had no durable state: theme, language, open tabs and connection profiles were lost on every restart. This change introduces the persistence layer (S06) that stores that state in versioned YAML files under `<home>/.seshatsql/data`, with recovery from corruption and OS-level encryption for passwords.

The guiding constraint is that secrets and file contents never leave the main process. The renderer only ever receives typed results and stable warning codes, so plaintext, ciphertext and file paths are handled exclusively on the trusted side of the IPC boundary.

## Technical Changes

- **Domain model and codecs** (`src/domain/persistence`): versioned types plus Zod schemas for preferences, tabs and connections. Parsing distinguishes `valid`, `older`, `future` and `invalid`, validates ordered selections, unique tab/profile ids and an `activeTabId` that references a real tab, and formats validation issues as `path:code` only, so a mis-shaped file cannot echo a plaintext password into logs or the UI.
- **`YamlFileStore`** (infrastructure): write path is tmp + `fsync` + rename, copying the current valid file to `.bak` first; corrupt primaries are quarantined (`.corrupt-<timestamp>-<n>`) and the backup is restored, falling back to defaults when both are unusable. Includes 1 MB warning / 16 MB hard limit, retry on Windows `EPERM`/`EBUSY` renames, a serialized operation queue, and a hard refusal to overwrite files written by a newer schema version.
- **`ConnectionsService`**: encrypts passwords through a `SecretProtector` boundary (Electron `safeStorage`/DPAPI) before they touch the store, exposes only `PublicConnection` (with a `hasPassword` flag) to the renderer, and keeps `resolvePassword` as a main-process-only use case for future connection code.
- **IPC contract** (`src/application/persistence`): named channels in a runtime-safe module (no Node/Zod imports) so the sandboxed preload stays loadable, with input schemas shared between main and preload. The main process validates every payload and verifies both the sender frame and its origin (`app://seshat/` or the configured dev server).
- **Close coordinator** (`src/main/close-coordinator.ts`): intercepts window close, asks the renderer to flush, and keeps the window open on failure or after a 3 s timeout. Closing proceeds only on an explicit save acknowledgement or user-confirmed discard.
- **Renderer integration**: startup state is fetched before the first mount so theme and locale apply without a flash; tab edits and cursor/selection moves are persisted through a 500 ms debounce scheduler with a flush-on-close path; `MonacoEditor` restores saved view state without re-emitting it as a user change; a new `PersistenceBanner` surfaces warnings with retry, dismiss and discard-confirmation flows.
- **i18n**: new `persistence` namespace (warnings, close failure, actions) added to `en-US`, `pt-BR`, `pt-PT`, `fr` and `es`, with the message type updated accordingly.
- **Build and test harness**: `yaml` and `zod` are excluded from `externalizeDepsPlugin` because electron-builder omits `node_modules` from the asar, so an external `require` would fail in the packaged app. E2E launch now injects fresh `SESHAT_DATA_DIR` and `SESHAT_USER_DATA_DIR` temp directories so runs never touch the real profile or share the Chromium process singleton.
- **Tests**: unit coverage for the store (atomic writes, backup recovery, quarantine, future-version lock, size limits, rename retries, concurrency), schemas, redaction, connection service, debounce scheduler, path resolution, IPC origin guard and warning presentation; component tests for tab restore, debounce, rejected saves, close handshake and banner actions; new E2E suite covering first run, restart restore, damaged backup recovery, double corruption, future-version refusal and DPAPI round-trip.

## Impact/Warnings

- **New files written to disk**: `preferences.yml`, `tabs_states.yml` and `connections.yml` in `<home>/.seshatsql/data`. The legacy `~/.sqlseshat/data` folder is detected and reported as a warning but is never migrated or deleted.
- **Credentials**: passwords are stored only as DPAPI ciphertext. There is intentionally no plaintext fallback — if the OS protector is unavailable, the save fails with `encryption-unavailable` and existing ciphertext is left untouched.
- **New environment variables** (test/CI only, never exposed to the renderer): `SESHAT_DATA_DIR` overrides the persistence directory and `SESHAT_USER_DATA_DIR` overrides Electron's `userData`.
- **Dependencies/build**: `yaml` and `zod` are now bundled into the main process bundle rather than externalized; verify the packaged build still resolves them.
- **Breaking for existing dev data**: the editor model id changed from `s05-lab` to the tab id (`query-1`), which shifts Monaco model URIs and required updating an existing E2E assertion.
- **Migrations**: no v0 → v1 migration ships with this change. Files with an older schema version are quarantined unless a migration function is registered, so future schema bumps must supply one.


close #19

---

[![GitPR](https://img.shields.io/badge/GitPR-10_errors_%C2%B7_16_warnings-red)](https://gitpr.natanfiuza.dev.br/)