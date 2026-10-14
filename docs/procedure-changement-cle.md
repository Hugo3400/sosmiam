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

6. **Attendre le rechiffrement de nuit** (vers 3 h 30). Dans le journal du logiciel de gestion, la ligne
   « Rechiffrement des comptes (changement de clé des données) » donne des nombres : rechiffrés, illisibles, restants.
   Attendre **« 0 restant(s) »**. S'il reste des « illisible(s) », ne pas aller plus loin : un compte qu'aucune des deux
   clés ne lit est à regarder avant de jeter l'ancienne clé.

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
- La partie sociale (messagerie chiffrée, bande) se sert des sous-clés de la clé des données : **à relire par la session
  App** avant un changement de clé. Ce qu'elle a chiffré avec une sous-clé (`deriverCle(contexte)`) doit, comme le nom et
  la date de naissance, porter la version de sa clé et se relire avec `deriverCleVersion(contexte, version)` ou
  `deriverClesAnciennes(contexte)` ; à elle de dire si ses données se rechiffrent la nuit ou s'effacent d'elles-mêmes avant
  l'étape 7. Tant qu'elle ne l'a pas confirmé ici, ne pas retirer l'ancienne clé.

## Si la clé fuit

1. Changer de clé **tout de suite** (étapes 1 à 5), sans attendre une date ronde.
2. Retirer l'ancienne clé dès le premier « 0 restant(s) » (étapes 7 et 8). Le rechiffrement passe chaque nuit ; il n'a
   pas encore de bouton « maintenant » : si l'attente d'une nuit est de trop, demander à une session d'en ajouter un
   (la fonction `rechiffrerComptes` est prête).
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
en disparaît au plus tard 30 jours après. Donc : garder la copie hors ligne de l'ancienne clé **30 jours après la nuit du
« 0 restant(s) »** (la dernière sauvegarde qui en a besoin sort alors du lot), puis la détruire. La garder plus longtemps
ne sert à rien, et ce serait une clé de plus à protéger.
