# Extension navigateur RootPass

Extension MV3 (Chrome / Edge / Brave) qui remplit vos identifiants RootPass sur la bonne page,
dans le bon champ. Elle parle à l'application RootPass via un canal WebSocket **local**
(`127.0.0.1`). Rien ne sort de votre machine, et la clé de déchiffrement ne quitte jamais
l'application : l'extension reçoit seulement l'identifiant que vous choisissez, sur votre action.

## Installation en mode développeur (sideload)

### Chrome / Edge / Brave

1. Ouvrez `chrome://extensions` (ou `edge://extensions`, `brave://extensions`).
2. Activez le **Mode développeur** (en haut à droite).
3. Cliquez **« Charger l'extension non empaquetée »** et sélectionnez ce dossier `extension/`.
4. L'icône RootPass apparaît dans la barre d'outils.

## Appairage

1. Ouvrez l'application **RootPass** et déverrouillez votre coffre.
2. Allez dans **Réglages → Extension navigateur**. Vérifiez que **« Activer l'extension navigateur »**
   est activé, puis cliquez **« Connecter l'extension »**.
   Un code à 6 chiffres s'affiche (valable 3 minutes).
3. Cliquez sur l'icône RootPass dans le navigateur, saisissez le code, validez.
4. Le statut passe à **Connectée**. L'appairage est mémorisé (token + identité de l'extension).

## Utilisation

- **Depuis le champ de connexion** : cliquez dans le champ identifiant ou mot de passe d'un site.
  Une petite icône RootPass apparaît dans le champ ; cliquez dessus pour voir vos comptes du site
  et en choisir un. RootPass remplit l'identifiant et le mot de passe.
- **Depuis le popup** : cliquez sur l'icône RootPass dans la barre d'outils pour lister vos comptes
  du site courant et remplir en un clic.

## Sécurité

- Connexion liée à `127.0.0.1` uniquement, jamais exposée sur le réseau.
- Appairage par code à usage unique prouvé par HMAC, puis épinglage de l'identité de l'extension.
- Le mot de passe n'est envoyé que lors d'une action explicite de remplissage, jamais à la simple
  recherche de comptes.
- Si le coffre est verrouillé, l'extension ne reçoit aucune donnée.
- Le bouton **« Oublier »** du popup supprime le token côté extension. Le bouton **« Révoquer »**
  côté application coupe l'accès et exige un nouvel appairage.

## Firefox

L'extension est cross-navigateur (même code, manifeste dédié). Pour Firefox :

1. Générez les builds : `npm run build:ext` (produit `dist/extension/chrome` et `dist/extension/firefox`).
2. Ouvrez `about:debugging#/runtime/this-firefox`.
3. Cliquez **« Charger un module complémentaire temporaire »** et sélectionnez
   `dist/extension/firefox/manifest.json`.

Le manifeste Firefox ([manifest.firefox.json](manifest.firefox.json)) utilise `background.scripts`
(event page) au lieu du service worker, et un `browser_specific_settings.gecko.id` stable.
Le code JS partage un shim `api = browser || chrome` pour fonctionner sur les deux moteurs.

Pour Chrome/Edge/Brave en build assemblé, chargez `dist/extension/chrome` (ou directement le
dossier `extension/` comme décrit plus haut).

## Notes

- En mode non empaqueté, l'identité (`chrome-extension://<id>`) de l'extension dépend du dossier.
  Si vous changez le dossier ou réinstallez l'extension et que l'`id` change, ré-appairez via
  Réglages → Extension navigateur → Connecter l'extension.
- L'extension cherche l'application sur les ports `17872` à `17881` (le port réel est choisi par
  l'application au démarrage, avec repli si le port est occupé).

## Firefox

Un build Firefox (MV3) quasi identique est prévu en phase 4.
