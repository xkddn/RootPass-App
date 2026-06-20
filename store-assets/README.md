# Pack d'assets pour la publication de l'extension RootPass

Tout ce qu'il faut pour soumettre l'extension au Chrome Web Store et à Firefox AMO.
Quand tu seras prêt : crée les comptes développeur, remplis les `<REMPLIR ...>`, héberge la
politique de confidentialité, uploade les zips, colle les textes.

## Contenu du dossier

```
store-assets/
├── README.md                       (ce fichier : carte + étapes de soumission)
├── PRIVACY.md                      politique de confidentialité (FR + EN)
├── SCREENSHOTS.md                  checklist des captures à prendre
├── rootpass-chrome-1.0.0.zip       paquet prêt à uploader (Chrome Web Store)
├── rootpass-firefox-1.0.0.zip      paquet prêt à uploader (Firefox AMO)
├── chrome/
│   ├── listing.md                  nom, résumé, description longue (FR + EN), catégorie
│   └── permissions.md              single purpose + justification des permissions + data
└── firefox/
    ├── listing.md                  nom, résumé, description, catégories
    └── reviewer-notes.md           notes pour le relecteur AMO (WebSocket local, etc.)
```

Les zips sont régénérés par `npm run build:ext` puis compression de `dist/extension/chrome`
et `dist/extension/firefox` (manifest.json à la racine du zip).

## À remplir avant soumission (placeholders `<REMPLIR ...>`)
1. **Email de contact** dans `PRIVACY.md`.
2. **URL publique de la politique de confidentialité** : héberge `PRIVACY.md` (ou son texte)
   quelque part de public. Le plus simple et gratuit : une page **GitHub Pages** du repo, ou
   un Gist, ou une page de ton site. Reporte l'URL dans `chrome/permissions.md`.

## Chrome Web Store (couvre Chrome, Edge, Brave, Opera, Vivaldi)
1. Crée un compte développeur : https://chrome.google.com/webstore/devconsole (frais
   uniques de 5 $, vérification d'identité possible).
2. "New item" → uploade `rootpass-chrome-1.0.0.zip`.
3. Remplis la fiche avec `chrome/listing.md` (nom, résumé, description, catégorie, langues).
4. Onglet Privacy : colle `chrome/permissions.md` (single purpose, justification de chaque
   permission, "no remote code"), coche les déclarations data, mets l'URL de la politique.
5. Ajoute les captures (voir `SCREENSHOTS.md`).
6. Soumets. Review : généralement quelques jours.

## Firefox AMO
1. Compte : https://addons.mozilla.org/developers/ (gratuit).
2. "Submit a New Add-on" → uploade `rootpass-firefox-1.0.0.zip`.
3. Fiche avec `firefox/listing.md`.
4. Colle `firefox/reviewer-notes.md` dans "Notes for reviewers" (important : explique la
   connexion WebSocket locale et que l'app de bureau doit tourner pour tester).
5. Politique de confidentialité : colle `PRIVACY.md` ou son URL.
6. Soumets. Review : de quelques heures à quelques jours.

## Après publication (je peux le faire)
Une fois les URLs des fiches connues, je branche dans l'app (Réglages → Extension
navigateur) des **liens directs vers les stores**, pour que tes utilisateurs installent en
1 clic au lieu de sideloader.

## Notes
- Permission `scripting` retirée des manifestes (inutilisée) pour une review plus propre.
  Permissions finales : `activeTab`, `tabs`, `storage` + host permissions justifiées.
- Version actuelle : 1.0.0 (champ `version` des manifestes). Incrémente-la à chaque
  nouvelle soumission.
- Les zips et `dist/` ne sont pas forcément à committer ; à toi de voir (tu gères les
  commits).
