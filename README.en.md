<div align="center">
  <h1>RootPass</h1>
  <p>A local, offline password manager for Windows, macOS and Linux.</p>
</div>

<!-- README-I18N:START -->

[Français](./README.md) | **English**

<!-- README-I18N:END -->

---

RootPass stores your passwords in an AES-256-GCM encrypted SQLite database on your machine. No account required, no server, no telemetry. Your master password is never written anywhere, it only derives the encryption key at unlock time.

## Features

- **Encrypted vault**: AES-256-GCM with a PBKDF2-derived key
- **TOTP / 2FA**: Generates live 6-digit codes from stored secrets, no external app needed
- **Security audit**: Flags weak, duplicate, and old passwords (> 90 days)
- **Password generator**: Configurable length and character sets, with strength indicator
- **Spotlight launcher**: Global shortcut to search your vault from anywhere on the desktop
- **Sync**: Point the vault at a cloud folder (OneDrive, Dropbox…), a USB drive, or export an encrypted `.enc` snapshot
- **Custom fields**: Add key/value pairs to any account, encrypted at rest
- **Categories and favorites**: Organize accounts, filter in one click
- **JSON import/export**: Easy migration from another manager
- **French and English**: Switch language in settings

## Built with

| Layer    | Tech                                                                       |
| -------- | -------------------------------------------------------------------------- |
| Shell    | [Electron](https://electronjs.org)                                         |
| UI       | [React 19](https://react.dev) + [Tailwind CSS v4](https://tailwindcss.com) |
| Build    | [electron-vite](https://electron-vite.org)                                 |
| Database | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)               |
| Crypto   | Native Node.js (AES-256-GCM, PBKDF2)                                       |
| 2FA      | [otplib](https://github.com/yeojz/otplib)                                  |
| State    | [Zustand](https://zustand-demo.pmnd.rs)                                    |
| i18n     | [i18next](https://www.i18next.com)                                         |

## Tests

```bash
npm test              # 193 unit + integration tests
npm run test:coverage # Coverage (~98% statements, 100% functions)
npm run test:e2e      # End-to-end tests (requires npm run build first)
```

Coverage includes `src/main/` and `src/renderer/src/utils/` — crypto, database, accounts, authentication, password generation, and security audit.

## Security model

- The master password is never stored. Setup writes a random salt and a "canary" string encrypted with the derived key. Unlock re-derives the key and succeeds only if the canary decrypts correctly.
- Every password and TOTP secret is stored as `iv:authTag:ciphertext` (hex). The key never leaves the main process, only decrypted plaintext crosses IPC to the renderer.
- The vault file is a standard SQLite database at `<userData>/vault_V2.db`. You can point it to a cloud-synced or USB folder in Settings → Sync; the file stays AES-256 encrypted at rest.

> [!WARNING]
> If you forget your master password, the vault cannot be recovered. No reset mechanism exists by design. Keep backups and pick a memorable password.

## Open Source & Download

RootPass is 100% open source and free. You can audit the code to verify the security model, build it yourself, or download ready-to-use releases (Windows, macOS, Linux) from the **[website](https://root-pass-website.vercel.app/)**.

## Contributing

Bug reports and feature requests go through [GitHub Issues](https://github.com/xkddn/RootPass-App/issues).

## Use of AI

This project was built with the assistance of AI tools to speed up certain phases of development:

- **Claude Code:** Used primarily as a creative and technical assistant on the front end. It helped define the visual direction (color palette, fonts, UI/UX ideas) and provided valuable support for day-to-day debugging.
- **Gemini:** Used for project management and planning. It helped structure the roadmap, organize the different development phases, and validate high-level architectural decisions.

_Note: AI acted as a productivity tool. All business logic, the security model, encryption, and code validation remain strictly human (with reference to official documentation) to guarantee an absolute level of reliability._

## Downloads

![Downloads](https://img.shields.io/github/downloads/xkddn/RootPass-App/total?style=flat-square&color=10B981&label=Téléchargements)

## License

[MIT](LICENSE) - © 2026 xkddn
