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
- **Code à 6 chiffres** (application d'authentification) pour ouvrir une session, qui se ferme après 24 h sans
  activité (7 jours au plus). Les sessions sont gardées dans la base (empreinte seulement) : un redémarrage de l'API ne
  redemande pas le code. Le logiciel se verrouille tout seul (mot de passe redemandé) après un temps sans souris ni
  clavier réglable dans Réglages : 20 min, 1 h (par défaut), 4 h ou jamais.
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

## Sauvegardes de la base
- Chaque nuit vers 3 h 30, l'API sauvegarde la base, chiffrée (AES-256-GCM), dans `/var/backups/sos-miam/` ; les 30
  dernières sont gardées. Écran Maintenance : état, « Sauvegarder maintenant », copie chiffrée sur le PC.
- **Clé de restauration** : `npm run sauvegardes:cle` (toi-même, dans un terminal du serveur), à noter dans ton
  gestionnaire de mots de passe. Sans elle, aucune sauvegarde ne se relit.
- Relire une sauvegarde : `npm run sauvegardes:dechiffrer -- <fichier.sauvegarde>`, puis `pg_restore` dans une base vide.
  Sur une autre machine, donner la clé par la variable `CLE_SAUVEGARDES`.

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
- Nouvelle version : augmenter `version` dans `src-tauri/tauri.conf.json`, `package.json` et `src-tauri/Cargo.toml`, puis
  `NOTES="ce qui change" npm run gestion:installateur`. L'installateur est signé avec la clé de mise à jour
  (`/root/sos-miam-secrets/cle-maj-logiciel.key`, jamais dans l'environnement de la compilation) et publié dans
  `/var/lib/sos-miam/mises-a-jour/` : les logiciels installés (depuis la 0.2.0) le proposent à la connexion suivante.
  Le manifeste et l'installateur ne sont servis qu'avec un jeton de 15 minutes, obtenu par une demande signée.
- Le CLI Tauri reste en 2.11.5 : les versions suivantes demandent un NSIS plus récent que celui de Debian 12.
