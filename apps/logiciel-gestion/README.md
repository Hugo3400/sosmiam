# SOS Miam — logiciel de gestion

Le logiciel Windows qui sert à administrer SOS Miam : statistiques, newsletter, lieux, publications du fil, modération,
état du serveur. Il est réservé aux postes autorisés de Hugo : il ne parle qu'à l'API (`https://sosmiam.fr/api-gestion`),
et chaque demande est signée.

## La sécurité, en bref
- **Une clé par PC.** Au premier lancement, le logiciel crée une paire de clés Ed25519. La clé secrète est chiffrée par
  le mot de passe (AES-256-GCM, PBKDF2-SHA256 600 000 tours) et gardée dans le profil Windows. En mémoire, elle n'existe
  que sous une forme non exportable : elle signe, mais aucun script ne peut la lire.
- **Le serveur ne connaît que la clé publique**, dans `/root/sos-miam-secrets/gestion.json` (lisible par root seul).
- **Chaque demande est signée** : méthode, chemin, heure, nonce unique, session et empreinte du corps. Une demande
  interceptée ne peut être ni rejouée, ni modifiée. Format : `src/fonctions/securite/construire-message-gestion.ts`,
  le même que `apps/api/src/fonctions/securite/construire-message-gestion.ts`.
- **Code à 6 chiffres** (application d'authentification) pour ouvrir une session, qui se ferme après 2 h sans
  activité (12 h au plus). Le logiciel se verrouille tout seul après 20 minutes sans souris ni clavier.
- Sans fichier d'accès sur le serveur, la gestion est fermée (réponse 503).

## Installer sur un PC
1. Sur le serveur : `npm run gestion:installateur` (depuis `/var/www/sos-miam`). L'installateur arrive dans
   `apps/logiciel-gestion/installateur/` ; dans VS Code, clic droit → « Télécharger ».
2. Windows dit « Éditeur inconnu » (installateur non signé) : « Informations complémentaires » → « Exécuter quand même ».
3. Au premier lancement, choisis un mot de passe (12 caractères au moins). Le logiciel affiche une commande.
4. **Toi-même**, dans un terminal du serveur (pas à travers une session Claude : un secret s'affiche) :
   `npm run gestion:autoriser -- <clé publique> "PC de Hugo"`. La première fois, le serveur affiche la clé du code à
   6 chiffres : ajoute-la dans ton application d'authentification.
5. « C'est fait, je me connecte », puis le code.

## Gérer les accès (sur le serveur)
- `npm run gestion:autoriser -- --liste` : postes autorisés.
- `npm run gestion:autoriser -- --retirer <identifiant>` : coupe un poste aussitôt (PC perdu, volé ou remplacé).
- `npm run gestion:autoriser -- --nouveau-code` : change le secret du code à 6 chiffres.
- Mot de passe oublié : « Recréer une clé pour ce PC » sur l'écran de connexion, puis autoriser la nouvelle clé et
  retirer l'ancienne.

## Développer
- `npm run gestion:verifier` : types, tests, limite de 700 lignes.
- Essai dans un navigateur : `VITE_ADRESSE_API=http://127.0.0.1:5192/api-gestion npm run dev` (port 5193), avec une API
  lancée avec `ORIGINES_GESTION=http://127.0.0.1:5193` (et, pour ne pas toucher aux vraies données, `SCHEMA_BASE=<schéma
  d'essai>` et `FICHIER_GESTION=<fichier d'accès d'essai>`).
- Nouvelle version : augmenter `version` dans `src-tauri/tauri.conf.json`, `npm run gestion:installateur`, relancer
  l'installateur sur le PC (la clé du poste est gardée). Pas de mise à jour automatique pour l'instant.
- Le CLI Tauri reste en 2.11.5 : les versions suivantes demandent un NSIS plus récent que celui de Debian 12.
