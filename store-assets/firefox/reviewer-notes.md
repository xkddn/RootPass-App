# Firefox AMO — Notes to reviewer

(Champ "Notes for reviewers" lors de la soumission. En anglais.)

This extension is the browser companion of the RootPass desktop password manager.

How it works and what to test:
- The extension connects to the RootPass desktop app via a local WebSocket on
  127.0.0.1 (ports 17872-17881). It never connects to any remote server.
- An explicit CSP `connect-src ws://127.0.0.1:*` is declared because Firefox would
  otherwise upgrade the local ws:// connection to wss://.
- The background page communicates with the desktop app; without the desktop app running
  and unlocked, the extension simply shows an "offline" / "not connected" state.

To fully test, the RootPass desktop application must be installed, running and unlocked,
then paired via a one-time 6-digit code shown in the app (Settings > Browser extension).
If you cannot run the desktop app, the extension safely degrades to an offline state.

Data & privacy:
- No data is collected or sent to any remote server.
- The encryption key and the password vault remain in the desktop app and are never sent
  to the extension. Only the credential the user explicitly selects is transmitted, locally.
- Local storage holds only a pairing token and per-site preferences.

No remote code is loaded; all code is bundled.
