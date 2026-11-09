# Politique de sécurité / Security Policy

**Français** | [English](#english)

---

RootPass est un gestionnaire de mots de passe. La sécurité est la priorité absolue du
projet, et les signalements responsables sont les bienvenus.

## Versions prises en charge

Seule la dernière version publiée reçoit des correctifs de sécurité.

| Version | Prise en charge |
| ------- | --------------- |
| 1.0.x   | ✅              |
| < 1.0   | ❌              |

## Signaler une vulnérabilité

> [!IMPORTANT]
> **N'ouvrez pas d'issue publique** pour une faille de sécurité. Cela exposerait le
> problème avant qu'un correctif ne soit disponible.

Utilisez le **signalement privé de GitHub** :

1. Allez sur l'onglet **Security** du dépôt :
   <https://github.com/xkddn/RootPass-App/security>
2. Cliquez sur **Report a vulnerability**.
3. Décrivez la faille, les étapes pour la reproduire, et l'impact potentiel.

Vous pouvez écrire votre rapport en français ou en anglais.

### Ce à quoi vous attendre

- **Accusé de réception** sous 72 heures.
- Une **évaluation** de la sévérité et un échange sur les étapes de reproduction.
- Un **correctif** publié dès que possible selon la gravité, suivi d'une nouvelle
  release. Les utilisateurs sont mis à jour automatiquement via le mécanisme de mise à
  jour intégré.
- Un **crédit** dans les notes de version si vous le souhaitez.

Merci de laisser un délai raisonnable pour le correctif avant toute divulgation
publique.

## Périmètre

RootPass est une application **100% locale et hors ligne** : aucun serveur, aucun
compte, aucune télémétrie, aucune requête réseau (hormis la vérification des mises à
jour depuis les GitHub Releases). Le modèle de menace se concentre donc sur :

- le chiffrement au repos (AES-256-GCM, clé dérivée par PBKDF2) ;
- la non-persistance du mot de passe maître ;
- l'isolation de la clé de déchiffrement dans le processus principal Electron ;
- l'intégrité du canal IPC entre le renderer et le main.

Sont **hors périmètre** : un appareil déjà compromis (malware, keylogger), un mot de
passe maître faible choisi par l'utilisateur, ou un accès physique à une session
déverrouillée.

Pour les détails d'implémentation, voir la section **Modèle de sécurité** du
[README](./README.md).

---

## English

RootPass is a password manager. Security is the project's top priority, and responsible
disclosure is welcome.

### Supported versions

Only the latest released version receives security fixes.

| Version | Supported |
| ------- | --------- |
| 1.0.x   | ✅        |
| < 1.0   | ❌        |

### Reporting a vulnerability

> [!IMPORTANT]
> **Do not open a public issue** for a security flaw. It would expose the problem before
> a fix is available.

Use **GitHub private vulnerability reporting**:

1. Go to the repository's **Security** tab:
   <https://github.com/xkddn/RootPass-App/security>
2. Click **Report a vulnerability**.
3. Describe the flaw, reproduction steps, and potential impact.

You may write your report in English or French.

#### What to expect

- **Acknowledgement** within 72 hours.
- An **assessment** of severity and discussion of reproduction steps.
- A **fix** shipped as soon as possible depending on severity, followed by a new
  release. Users are updated automatically through the built-in update mechanism.
- **Credit** in the release notes if you wish.

Please allow a reasonable time for a fix before any public disclosure.

### Scope

RootPass is a **100% local, offline** app: no server, no account, no telemetry, no
network requests (other than checking GitHub Releases for updates). The threat model
therefore focuses on:

- encryption at rest (AES-256-GCM, PBKDF2-derived key);
- the master password never being persisted;
- isolation of the decryption key inside the Electron main process;
- integrity of the IPC channel between renderer and main.

**Out of scope**: an already-compromised device (malware, keylogger), a weak master
password chosen by the user, or physical access to an unlocked session.

For implementation details, see the **Security model** section of the
[README](./README.en.md).
