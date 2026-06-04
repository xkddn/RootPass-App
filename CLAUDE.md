# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

RootPass is a 100% local, offline password manager built with Electron + React. The master password is never stored; the vault is encrypted with AES-256-GCM and persisted to a local SQLite database.

## Commands

```bash
npm run dev          # Start app with HMR (electron-vite dev)
npm run build        # Type-check + build to out/
npm run start        # Preview a production build (electron-vite preview)
npm run lint         # ESLint over the repo
npm run format       # Prettier --write .
npm run build:win    # Package a Windows installer (also :mac, :linux)
```

There is no test suite. `npm run dev` auto-opens DevTools (see `mainWindow.webContents.openDevTools()` in `src/main/index.js`).

## Architecture

Standard Electron three-context split. Code in `src/main` runs in the Node/main process; `src/renderer` runs in the browser/Chromium context; `src/preload` is the only bridge between them.

**IPC bridge — the one pattern to know.** All privileged work (DB, crypto, clipboard) happens in the main process and is reached from the UI through a single round-trip:

1. `src/main/index.js` registers handlers with `ipcMain.handle('channel', fn)` inside `app.whenReady()`.
2. `src/preload/index.js` exposes `window.api.someMethod = () => ipcRenderer.invoke('channel', ...)` via `contextBridge`.
3. React components call `window.api.someMethod()`.

To add a feature touching data, you must edit all three: implement in a `src/main` module, register the channel in `src/main/index.js`, expose it in the preload, then call it from the renderer.

**Critical constraint: the preload must never import from `src/main`.** `src/main/database.js` calls `app.getPath('userData')` at module load. The `app` API only exists in the main process, so any transitive import from `src/main` into the preload throws "Cannot read properties of undefined (reading 'getPath')", which crashes the whole preload and leaves `window.api` undefined in the renderer. Keep the preload to `electron` imports only.

### Security model (`src/main/auth.js`, `src/main/crypto.js`)

- Master password is **never persisted**. Setup stores a random salt plus a "canary" — the fixed string `CANARY_TEXT` encrypted with the derived key. Unlock re-derives the key from the entered password and the stored salt, then succeeds only if the canary decrypts back to that string.
- Key derivation: PBKDF2, 100k iterations, SHA-256, 32-byte key (`crypto.js`).
- Encryption: AES-256-GCM. Each value is stored as `iv:authTag:ciphertext` (hex).
- The derived key lives only in the `activeKey` module variable in `auth.js`. `lockVault()` nulls it; account operations call `getActiveKey()`, which throws "Vault is locked" if absent. The key never reaches the renderer — only decrypted plaintext crosses IPC on demand.

### Database (`src/main/database.js`)

- `better-sqlite3` (synchronous), stored at `<userData>/vault_V2.db`, WAL mode.
- Two tables: `master_check` (single row, id=1, holds salt + canary) and `accounts` (passwords stored encrypted in the `password` column).
- Schema migrations are done ad hoc: `CREATE TABLE IF NOT EXISTS` plus `try/catch` around `ALTER TABLE ... ADD COLUMN` (swallowing the "column exists" error). Follow this pattern when adding columns.
- Account CRUD lives in `src/main/accounts.js`. Fields: `title`, `url`, `login`, `password`, `category`, `is_favorite`, `custom_fields` (JSON array, encrypted), `totp_secret` (encrypted Base32 TOTP secret, nullable), `created_at`, `password_updated_at`.

### Renderer (`src/renderer/src`)

- `App.jsx` is the gatekeeper: on mount it calls `isVaultInitialized()` to show either the create-master-password or the unlock form; once unlocked it renders `Dashboard`.
- Unlock state is global via a minimal Zustand store (`store/useAuthStore.js`) holding only `isUnlocked` / `unlock` / `lock`. The decryption key itself stays in the main process, never in this store.
- `Dashboard.jsx` owns account CRUD, search, category filter, and favorites; modals live in `components/`.
- Styling is Tailwind CSS v4. `@renderer` is aliased to `src/renderer/src`.

## Conventions

- UI strings use i18next via `src/renderer/src/i18n/i18n.js` with `fr.json` / `en.json` locale files; default locale is French. Add new UI strings to both JSON files. Code comments and console messages remain in French.
- TOTP (2FA): `TotpBadge.jsx` renders live TOTP codes from the decrypted `totp_secret` using `otplib`. The secret is encrypted at rest alongside the password.
