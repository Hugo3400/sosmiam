# Changer la clé des données des comptes

La « clé des données » chiffre le **nom** et la **date de naissance** des comptes de l'app (AES-256-GCM), et sert aussi à
signer les liens « Me désinscrire » de la newsletter. Elle vit hors de la base, dans
`/root/sos-miam-secrets/cle-donnees-comptes` (root seul, droits 600). Cette page dit comment la remplacer sans perdre
une seule donnée, ni casser un lien déjà envoyé.

Code concerné : `apps/api/src/services/chiffrement-donnees.ts` (lecture des clés), `services/rechiffrement-comptes.ts`
(réécriture des comptes), `taches/taches-de-nuit.ts` (passage de nuit), `services/liens-desinscription.ts`.

## Qui décide

**Hugo, et lui seul.** Aucune session Claude ne lance un changement de clé, ne génère une clé, ni ne lit son fichier.
Bonnes raisons de changer : un doute sur une fuite (voir plus bas), quelqu'un qui a eu accès au serveur et n'y a plus
droit, ou un changement de routine (une fois par an, par exemple).

## Comment ça marche, en deux phrases

Chaque valeur chiffrée commence par la version de sa clé : `v1:…` pour la toute première clé (toutes les valeurs écrites
avant cette procédure), `v2:…` après le premier changement, et ainsi de suite. Pendant un changement, l'API garde
**deux** clés : elle lit avec les deux, écrit toujours avec la nouvelle, et chaque nuit réécrit les comptes encore en
ancienne version, jusqu'à ce qu'il n'en reste aucun.

Deux réglages dans `apps/api/.env` :

| Variable | Rôle |
|---|---|
| `SOS_MIAM_CLE_DONNEES_VERSION` | version de la clé **courante** (absente : 1) |
| `SOS_MIAM_CLE_DONNEES_ANCIENNE` | chemin du fichier de l'**ancienne** clé, seulement pendant un changement (sa version : la courante moins 1) |

## Les étapes

Toutes les commandes sont à lancer **par Hugo lui-même, en root, sur le serveur**. Ne jamais afficher une clé (`cat`,
`echo`…), ne jamais la coller dans un chat (Claude compris), un mail, un ticket ou git.

1. **Vérifier qu'aucun changement n'est en cours** : dans `apps/api/.env`, `SOS_MIAM_CLE_DONNEES_ANCIENNE` est absente
   ou vide. Noter la version actuelle (`SOS_MIAM_CLE_DONNEES_VERSION`, 1 si elle est absente).

2. **Copier l'actuelle en « ancienne »**, droits gardés :

   ```sh
   cp -p /root/sos-miam-secrets/cle-donnees-comptes /root/sos-miam-secrets/cle-donnees-comptes-ancienne
   ```

   Et en faire **une copie hors ligne** (clé USB chiffrée ou gestionnaire de mots de passe, comme la clé des sauvegardes) :
   elle servira à relire les sauvegardes faites avant le changement (voir « Les sauvegardes »).

3. **Poser la nouvelle clé** à la place de l'actuelle (écrite d'un coup, droits 600 dès sa création, jamais affichée) :

   ```sh
   ( umask 077 && openssl rand -base64 32 > /root/sos-miam-secrets/cle-donnees-comptes.tmp ) \
     && mv /root/sos-miam-secrets/cle-donnees-comptes.tmp /root/sos-miam-secrets/cle-donnees-comptes
   ls -l /root/sos-miam-secrets/   # les deux fichiers : -rw------- root root
   ```

4. **Régler les variables** dans `apps/api/.env` (exemple pour passer de la version 1 à la 2) :

   ```sh
   SOS_MIAM_CLE_DONNEES_VERSION=2
   SOS_MIAM_CLE_DONNEES_ANCIENNE=/root/sos-miam-secrets/cle-donnees-comptes-ancienne
   ```

5. **Redémarrer l'API** : c'est la session Logiciel qui s'en charge (elle vérifie d'abord `prisma migrate status`).
   Au démarrage, aucune ligne « INDISPONIBLE » ne doit apparaître dans le journal de pm2. Si une ligne le dit, l'API
   répond 503 aux adresses des comptes de l'app : relire le message (fichier mal protégé, mal écrit, version oubliée),
   corriger, redémarrer. Le message ne contient jamais la clé.

6. **Attendre le rechiffrement de nuit** (vers 3 h 30). Dans le journal du logiciel de gestion, deux lignes donnent des
   nombres (rechiffrés, illisibles, restants ; les restants comptent les illisibles) : « Rechiffrement des comptes
   (changement de clé des données) » et « Rechiffrement social : … illisible(s), … restant(s) » (la partie sociale, voir
   plus bas). **Règle de fin** : on peut passer à l'étape 7 quand, **sur les deux lignes**, restants = illisibles, et que
   ces nombres ne bougent plus d'une nuit à l'autre (deux nuits de suite pareilles, sans ligne « Ménage social, étape(s)
   ratée(s) : … » qui cite « rechiffrement » ces nuits-là). Le cas simple : « 0 illisible(s), 0 restant(s) » deux nuits de
   suite. S'il reste des illisibles, les regarder d'abord (partie sociale : « Retrouver les illisibles » plus bas ;
   comptes : avec la session Site) : l'ancienne clé ne les relit pas non plus, elle ne les sauvera donc pas, mais c'est le
   moment de comprendre d'où ils viennent.

7. **Retirer l'ancienne clé du serveur** : effacer la ligne `SOS_MIAM_CLE_DONNEES_ANCIENNE` de `apps/api/.env` (garder
   `SOS_MIAM_CLE_DONNEES_VERSION=2` !), puis, une fois la copie hors ligne vérifiée :

   ```sh
   shred -u /root/sos-miam-secrets/cle-donnees-comptes-ancienne
   ```

8. **Redémarrer l'API** (session Logiciel). À partir de là, les liens « Me désinscrire » signés avec l'ancienne clé ne
   marchent plus : les gens peuvent toujours répondre « STOP », et les mails suivants portent un lien neuf.

Au prochain changement, même chemin avec la version 3, et ainsi de suite.

## Ce qui reste valable pendant le changement

- Le nom et la date de naissance se lisent avec l'une ou l'autre clé ; tout ce qui est écrit l'est avec la nouvelle.
- Les liens « Me désinscrire » des mails déjà envoyés restent bons **tant que l'ancienne clé est là** (étapes 5 à 7).
- La partie sociale (messagerie chiffrée, bande, signalements) se sert des sous-clés de la clé des données : chaque chiffré
  porte la version de sa clé et se relit avec l'une ou l'autre. Confirmé par la session App le 15 octobre 2026 : elle se
  **rechiffre la nuit**, voir « La partie sociale » plus bas (sa ligne compte dans la règle de fin de l'étape 6).
- Les candidatures de la page « Carrière » (sous-clés `sos-miam/carriere/…` : nom, e-mail, message, lien et CV, fichiers du dossier
  `/var/lib/sos-miam/candidatures`) : **rechiffrées la nuit**, toutes en une fois (`services/carriere-candidatures.ts`, lancé par
  `nettoyerCarriere` dans `taches/taches-de-nuit.ts`). Le journal du logiciel dit « Candidatures rechiffrées (changement de clé) » et,
  s'il y en a, « Candidatures illisibles pendant le rechiffrement », des nombres seulement. Une nuit sans ligne « rechiffrées » : il
  n'en reste plus. Elles sont de toute façon effacées 6 mois après leur envoi.
- Les signalements de la page « Chasse aux bugs » (sous-clés `sos-miam/securite/…` : nom, e-mail, titre, description, lien, nom
  pour le tableau d'honneur et captures, fichiers du dossier `/var/lib/sos-miam/signalements-securite`) : **rechiffrés la nuit**,
  tous en une fois (`services/securite-menage.ts`, lancé par le ménage de la sécurité dans `taches/taches-de-nuit.ts`). Le journal
  du logiciel dit « Signalements de sécurité rechiffrés (changement de clé) » et, s'il y en a, « Signalements illisibles pendant le
  rechiffrement », des nombres seulement. Un signalement ouvert est gardé sans limite : attendre la ligne avant de retirer
  l'ancienne clé.
- Les partages de position de Miam Safe (« Prévenir un pote », sous-clé `miam-safe:position`) : **rien à rechiffrer**. Une
  position est effacée au bout d'1 heure au plus (fin ou arrêt du partage), et une position illisible s'affiche comme
  « pas de position », sans erreur.

## La partie sociale (rechiffrement de nuit)

Réponse de la session App (lot L7, 15 octobre 2026) au point ci-dessus : la partie sociale **se rechiffre la nuit**, avec
la même ancienne clé (`SOS_MIAM_CLE_DONNEES_ANCIENNE`) ; il n'y a rien d'autre à régler.

Code concerné : `apps/api/src/services/chiffrement-social.ts` (quatre sous-clés tirées de la clé des données ; chaque
chiffré porte la version de sa clé, `v<N>:`), `services/rechiffrement-social.ts` (la réécriture), lancé comme étape 9 du
ménage social (`services/menage-social.ts`). Le branchement est fait : `nettoyerSocial`, dans `taches/taches-de-nuit.ts`,
passe chaque nuit après `nettoyerComptes` et avant la sauvegarde ; il n'y a rien à brancher.

Ce qui est chiffré, et donc réécrit :

| Quoi | Où |
|---|---|
| Codes des liens et QR d'invitation de la bande | `profils_sociaux.code_invitation_chiffre` |
| Titres des groupes | `conversations.titre_chiffre` |
| Textes des messages et lieux envoyés (avec leur petit mot) | `messages_conversations.texte_chiffre` |
| Copies des contenus signalés (instantanés de la modération) | `signalements.instantane_chiffre` |
| Photos et notes vocales du chat | fichiers du dossier `DOSSIER_MEDIAS_CHAT` (`/var/lib/sos-miam/medias-chat`) |

Comment ça se passe :

- Pendant le changement, tout se lit avec l'une ou l'autre clé, et tout ce qui s'écrit l'est avec la nouvelle.
- Chaque nuit, les textes sont réécrits par paquets de 500 (100 000 par table et par nuit au plus), puis les fichiers
  (500 par nuit au plus : une photo pèse jusqu'à 5 Mo ; et le rechiffrement s'arrête pour la nuit si le disque passe sous
  17 % de place libre, pour ne jamais prendre la place des envois des Miamis, refusés sous 15 %). Un fichier n'est jamais
  écrasé : le rechiffré prend un nouveau nom, il est forcé sur le disque, et la base passe au nouveau nom (le message, et
  tous les signalements qui le citent, jugés compris). L'ancien fichier n'est **pas** supprimé tout de suite : plus cité
  par aucun message ni signalement qui le garde, il part avec les fichiers orphelins de plus de 24 h (étape 8 du ménage)
  **la nuit suivante**. Un signalement fait pendant le rechiffrement peut encore citer l'ancien nom : ce fichier-là reste
  tant que le signalement le garde, et la nuit suivante le rechiffre à son tour.
- Dans le journal du logiciel de gestion, la ligne « Rechiffrement social : … illisible(s), … restant(s) » paraît chaque
  nuit tant que l'ancienne clé est là, même quand il n'y a plus rien à réécrire ; le détail donne le nombre réécrit cette
  nuit-là. Seulement des nombres, jamais un contenu (et 60 caractères au plus par ligne, la longueur que garde le
  journal : les nombres viennent en tête). Elle manque une nuit où l'étape a échoué (ligne « Ménage social, étape(s)
  ratée(s) : rechiffrement… », « rechiffrement » toujours en tête de la liste) : cette nuit-là ne compte pas.
- **Disque presque plein** : une nuit où le disque passe sous 17 % de place libre, le rechiffrement des fichiers se met en
  pause, et une ligne de plus le dit : « Fichiers à rechiffrer en pause : disque presque plein », le détail donnant le
  nombre de photos et vocaux qui attendent (déjà comptés dans les restants). Tant qu'elle revient, les restants ne
  baissent pas et la règle de fin ne peut pas être remplie : libérer de la place sur le disque (ou l'agrandir), le
  rechiffrement reprend tout seul la nuit suivante.
- **Combien de nuits** : « 0 restant(s) » (hors illisibles) arrive la nuit N, la plus grande de ⌈photos et vocaux
  anciens ÷ 500⌉ et ⌈lignes anciennes de la plus grosse table ÷ 100 000⌉ : la **1re nuit** tant qu'il y a moins de 500
  photos et vocaux et moins de 100 000 lignes par table. La règle de fin (deux nuits pareilles) est donc remplie au plus
  tôt **la nuit N + 1** : cette nuit-là, l'étape 8 a retiré les anciens fichiers de la nuit N, et un fichier qu'un
  signalement aurait cité entre-temps a été rechiffré.
- **Étape 7 (retirer l'ancienne clé)** : la règle de fin de l'étape 6, sur la ligne des comptes **et** sur celle-ci
  (restants = illisibles, deux nuits de suite). Les illisibles (un chiffré abîmé qu'aucune des deux clés ne relit) restent
  tels quels : un message illisible s'affiche « illisible » dans l'app et part avec sa conversation (1 an sans message),
  sauf si un de ses messages attend la modération (signalement ouvert : elle part la nuit qui suit la décision) ; une
  photo ou une note vocale disparaît de la conversation au bout de 90 jours, et son fichier part du disque, **sauf** si
  un signalement la garde pour la modération : ouvert (pas encore jugé, ou contesté et pas encore réexaminé), ou jugé
  depuis moins de 6 mois (183 jours après la décision, ou après le réexamen), même retenu (décision du 15 octobre 2026).
- Les sauvegardes faites avant le changement contiennent aussi des messages chiffrés avec l'ancienne clé, et le dossier
  des médias n'est pas dans la sauvegarde de la base : la règle des 30 jours de la section « Les sauvegardes » suffit.

### Retrouver les illisibles

Chaque nuit, le rechiffrement écrit chaque illisible dans le journal d'erreurs de l'API (pm2), par sa **table et son id**,
ou le **nom de son fichier** (tiré au hasard), jamais par son contenu ; 100 par nuit au plus, puis leur nombre. À lancer
par Hugo, en root :

```sh
grep -h "Rechiffrement social" /root/.pm2/logs/sos-miam-api-error*.log | tail -n 120
```

Exemples : « illisible, table messages_conversations, id 2003 », « illisible, fichier 0f…c2.bin ». Les tables possibles :
`profils_sociaux` (compte_id : le code d'invitation de sa bande ; un nouveau lien le remplace),
`conversations` (titre d'un groupe), `messages_conversations` (texte d'un message), `signalements` (instantané d'un
signalement). Ne jamais copier une valeur chiffrée dans un chat ou un ticket.

**Au-delà de 100 illisibles** (le journal n'en détaille que 100 par nuit), ou pour les avoir tous d'un coup : une fois la
règle de fin remplie (restants = illisibles, deux nuits de suite, sans « rechiffrement » dans les étapes ratées), plus rien
d'autre n'attend l'ancienne clé. Donc **chaque ligne dont la colonne chiffrée ne commence pas par `v<courante>:`** (la
version de `SOS_MIAM_CLE_DONNEES_VERSION`) **est un illisible**. Requêtes à lancer par Hugo, en lecture seule, dans psql
sur la base `sosmiam` (par exemple `sudo -u postgres psql -d sosmiam`), ici pour une clé courante en version 2 (remplacer
`'v2:%'` par la version courante, par exemple `'v3:%'`). Elles ne sortent que des identifiants, jamais un chiffré :

```sql
-- Codes d'invitation de la bande (un nouveau lien les remplace)
SELECT compte_id FROM profils_sociaux
WHERE code_invitation_chiffre IS NOT NULL AND code_invitation_chiffre NOT LIKE 'v2:%' ORDER BY compte_id;

-- Titres des groupes
SELECT id FROM conversations
WHERE titre_chiffre IS NOT NULL AND titre_chiffre NOT LIKE 'v2:%' ORDER BY id;

-- Textes des messages et lieux envoyés (avec leur conversation)
SELECT id, conversation_id FROM messages_conversations
WHERE texte_chiffre IS NOT NULL AND texte_chiffre NOT LIKE 'v2:%' ORDER BY id;

-- Instantanés des signalements
SELECT id FROM signalements
WHERE instantane_chiffre IS NOT NULL AND instantane_chiffre NOT LIKE 'v2:%' ORDER BY id;
```

Pour seulement les compter, remplacer la liste des colonnes par `count(*)` (et retirer `ORDER BY`). C'est exactement la
condition du rechiffrement (« v12: » ne commence pas par « v1: » : le motif ne prend jamais une autre version pour la
courante).

Les photos et notes vocales ne sont pas dans la base : leur version est écrite au début du fichier (`v2:` en clair, puis
le chiffré). Même règle, sur le dossier des médias, en root (lecture seule ; pour une version à deux chiffres, `head -c 4`
et `"v12:"`) :

```sh
cd /var/lib/sos-miam/medias-chat && for f in *.bin; do [ "$(head -c 3 "$f" 2>/dev/null)" = "v2:" ] || echo "$f"; done
```

Puis, pour savoir à quoi sert un de ces fichiers (dans psql, avec son nom) :
`SELECT id, conversation_id FROM messages_conversations WHERE fichier = '<nom>.bin';` et
`SELECT id, statut FROM signalements WHERE fichier_media = '<nom>.bin';` (aucune ligne : le ménage le retire comme
orphelin la nuit suivante).

## Si la clé fuit

1. Changer de clé **tout de suite** (étapes 1 à 5), sans attendre une date ronde.
2. Retirer l'ancienne clé dès que la règle de fin de l'étape 6 est remplie (étapes 7 et 8). Le rechiffrement passe
   chaque nuit ; il n'a pas encore de bouton « maintenant » : si l'attente d'une nuit est de trop, demander à une session
   d'en ajouter un (les fonctions `rechiffrerComptes` et `rechiffrerSocial` sont prêtes ; pour la partie sociale, les
   anciens fichiers ne partent qu'avec l'étape 8 du ménage, 24 h après au plus tôt).
3. Se demander ce qui a pu fuir **avec** elle : la clé seule ne lit rien ; avec une copie de la base ou d'une sauvegarde
   d'avant le changement, elle lit les noms et dates de naissance qu'elle contient. Les sauvegardes sont chiffrées avec
   une autre clé (`cle-sauvegardes`) : si celle-là a fui aussi, la changer également.
4. C'est une violation de données personnelles possible : la noter dans le registre, et si un risque existe pour les
   personnes, prévenir la CNIL dans les 72 heures (RGPD, article 33) ; si le risque est élevé, prévenir aussi les
   personnes concernées (article 34), avec dignité et sans dramatiser.

## Les sauvegardes

Une sauvegarde faite **avant** le changement contient des noms et dates de naissance chiffrés avec l'ancienne clé : pour
la relire, il faut la clé des sauvegardes **et** l'ancienne clé des données (le temps d'une restauration, remettre
`SOS_MIAM_CLE_DONNEES_ANCIENNE` comme à l'étape 4, puis laisser la nuit rechiffrer).

La politique de confidentialité dit qu'on garde **les 30 dernières sauvegardes** (une par nuit) et qu'une donnée effacée
en disparaît au plus tard 30 jours après. Donc : garder la copie hors ligne de l'ancienne clé **30 jours après son retrait
du serveur (étape 7)** (la dernière sauvegarde qui en a besoin sort alors du lot), puis la détruire. La garder plus longtemps
ne sert à rien, et ce serait une clé de plus à protéger.
