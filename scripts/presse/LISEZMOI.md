# Refaire presse/

`presse/` (à la racine du dépôt) sert deux fois : l'Espace presse du logiciel de gestion lit `presse/index.json`, et les kits
médias du site servent les affiches, imprimés et visuels réseaux qui y sont (`apps/site-web/src/contenus/maquettes-kits.ts`).
Les sources des maquettes sont les **canevas sur claude.ai** (artifacts « Design ») : c'est là que Hugo les modifie. Les
scripts d'ici ne font que les exporter et tout ranger ; le dossier de travail (`<travail>`) est à part, hors du dépôt.

## Les canevas

| Famille | Artifact |
| --- | --- |
| `affiches` | Affiches SOS Miam : https://claude.ai/artifact/2J72bM5ci1C9DDqpoFL55S |
| `reseaux` | Réseaux SOS Miam : https://claude.ai/artifact/LWd76cD7xmBZX3Yf2Lk9gk |
| `imprimes` | Imprimés SOS Miam : https://claude.ai/artifact/Kr9uXMZ61QHDtGDWtvWnsq |
| `recrutement` | Campagne ambassadeurs fondateurs : https://claude.ai/artifact/315bU4qZ6N1DV7zVt1Fegp |
| `capitaine` | Capitaine Bouiboui : https://claude.ai/artifact/2eDDjg6gYUDoDWgDYh1BZL |
| `flyer` | Flyer SOS Miam : https://claude.ai/artifact/M5Jab7BY8YKS3qhsabWXaP |

## Refaire une famille après une retouche d'un canevas

1. Dans une session Claude : lire l'artifact (`project/canvas.json` et chaque `project/*.dc.html`), puis chaque fichier
   `/_blob/<id>` qu'ils citent, lu par son id. Les ranger dans `<travail>/canevas/<famille>/` : `project/…` et
   `<id>.<extension>` à côté.
2. `python3 -I scripts/presse/exporter-maquettes.py <travail> <famille>…` : PNG et PDF dans `<travail>/sortie/<famille>/`
   (les affiches aussi en A3 et en 40 × 60 cm, rallongées sans déformation).
3. `python3 -I scripts/presse/assembler-presse.py <travail> --depuis-presse` : ce qui n'a pas été exporté est repris du
   `presse/` actuel ; tout est reconstruit dans `<travail>`, puis échangé d'un coup avec `presse/` (un commit pris pendant
   l'export ne voit jamais un dossier à moitié vide).
4. `node --test apps/site-web/tests/maquettes-kits.test.ts` : chaque fichier que les kits du site citent existe encore.
5. Prévenir la session Logiciel (l'Espace presse relit `index.json`) et la session Site (les kits).

Les zips sont déterministes : un fichier qui n'a pas changé donne le même zip, git ne voit rien.
N'exporte que les familles retouchées : Chrome écrit la date dans chaque PDF, donc un PDF réexporté change toujours
pour git, même identique à l'œil. Pour ne changer qu'un fichier d'une famille, copie la famille depuis `presse/` dans
`<travail>/sortie/` et remplace juste ce fichier.

## Ce qui n'est pas exporté par ces scripts

- `miam-safe/` (fiches et page concept), `textes/` (document « Textes promo ») et `documents/` (mail de présentation,
  fiche lieu, recrutement, kits) : exportés à la main (documents Claude Docs en Markdown, rendus de pages). Avec
  `--depuis-presse`, ils sont repris tels quels ; pour en changer un, le poser dans `<travail>/sortie/<famille>/`.
- Les visuels des stores (`apps/app-mobile/visuels-stores`) et le kit de marque (`kits/SOS_Miam_kit_de_marque`) : recopiés
  du dépôt à chaque fois.
- Le pack vidéos, sons et images de campagne : décompressé de `kits/SOSMiam_partie_*.zip` dans `<travail>/pack-videos/`
  s'il n'y est pas déjà. `presse/videos/` (≈ 330 Mo, zip compris) est hors git (`.gitignore`), comme ces zips.

## Outils

Python 3 avec Pillow, `zip`, `unzip`, le Chrome sans écran de Playwright (`~/.cache/ms-playwright`), les polices
`@fontsource-variable` du dépôt, et ffmpeg pour l'aperçu des vidéos (`FFMPEG=…`, par défaut celui de /var/www/bot ; sans
lui, les vidéos n'ont pas d'aperçu).
