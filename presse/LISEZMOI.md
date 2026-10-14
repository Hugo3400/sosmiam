# Espace presse SOS Miam

Tous les contenus promo, exportés en fichiers pour l'Espace presse du logiciel de gestion :
- les maquettes : canevas « Affiches », « Réseaux », « Imprimés », « Capitaine Bouiboui », « Flyer SOS Miam » et fiches Miam Safe ;
- les documents : « Textes promo », mail de présentation, fiche lieu, recrutement des ambassadeurs, kit réseaux ;
- les visuels des stores (copie de `apps/app-mobile/visuels-stores`) ;
- le kit de marque (copie de `kits/SOS_Miam_kit_de_marque`) ;
- le pack vidéos, sons et images de campagne (décompressé depuis `kits/SOSMiam_partie_*.zip`).

- `index.json` : les familles, leurs fichiers (chemin, format, taille, description, aperçu) et le zip de chaque famille. Tous les chemins sont relatifs à `presse/`.
- `apercus/` : une image légère par fichier, pour la liste du logiciel. Pour une vidéo, c'est une image tirée de la vidéo ; les sons et les textes n'ont pas d'aperçu.
- `videos/` (environ 330 Mo, zip compris) n'est pas dans git (voir `.gitignore`) : il n'existe que sur le serveur, comme `kits/*.zip`.
- Les kits médias du site (`apps/site-web/kit-media*`) ne sont pas recopiés ici : le logiciel les lit à leur place.

Les maquettes sont à valider par Hugo : aucune date, aucun chiffre, aucune promesse au-delà de docs/decisions.md. Les documents les plus anciens (5 au 8 octobre) gardent leur état d'origine : relis-les avant de les envoyer.
