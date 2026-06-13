# Chrome Web Store — Confidentialité & justifications

À recopier dans l'onglet "Privacy practices" de la fiche développeur.

## Single purpose (description de la finalité unique)
RootPass fills the user's login credentials, retrieved from the locally installed RootPass
desktop application, into login forms on the websites the user visits. It does nothing else.

## Justification par permission

**host_permissions (`http://*/*`, `https://*/*`)**
Required to detect login forms (username and password fields) and fill them on any website
where the user has an account. The content script reads and writes form fields only locally
in the browser, only on user action. Broad host access is necessary because users can have
accounts on any site.

**tabs**
Used to read the URL of the active tab so the extension can show the accounts that match
the current website. No browsing history is collected or transmitted.

**activeTab**
Used to interact with the current page (fill fields) following an explicit user action in
the popup or the in-field icon.

**storage**
Stores only a local pairing token (to reconnect to the desktop app) and per-site user
preferences. Never contains passwords or vault data.

## Remote code
No. The extension executes no remote code. All code is bundled in the package.

## Data usage / disclosures (cocher)
- Does NOT collect or use personal/sensitive data.
- Does NOT sell or transfer data to third parties.
- Does NOT use data for purposes unrelated to the single purpose.
- Communicates only with the user's own local desktop app over 127.0.0.1; no remote server.

## Privacy policy URL
`<REMPLIR : URL publique hébergeant store-assets/PRIVACY.md>`
