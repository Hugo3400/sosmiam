# Idées pour plus tard

Des idées validées par Hugo, pas encore construites. Rien ici n'est promis au public.

## Easter eggs (validés le 9 octobre 2026, tous)
Jamais sur les fiches et pages BIG SOS : on y parle de lieux en vraie difficulté.
Visuels : mascotte et emblèmes dans `kits/SOS_Miam_kit_de_marque/` (Capitaine Bouiboui, six expressions).

1. **Taper « MIAM » au clavier (site)** : pluie d'emojis bouffe (🍕🥐🌮🍜) quelques secondes, et le Capitaine Bouiboui « C'est la fête » : « Tu as trouvé la cachette. Ton estomac est fier de toi. » (le code Konami marche aussi).
2. **Le bouton SOS qui s'énerve (app)** : 7 appuis très rapides sur le bouton SOS ou le logo → l'écran tremble, petite vibration : « Calme-toi, on arrive. Respire. Pense à une frite. »
3. **Le gargouillis (app)** : appui long sur le logo → bruit de ventre qui gargouille avec une vibration synchronisée.
4. **L'heure du crime (site et app)** : entre 3 h et 4 h du matin (heure de Paris), l'accueil affiche le Capitaine « Fait dodo » : « Tiens, un affamé nocturne. Respect. » Texte partagé dans `packages/commun`.
5. **La 404 gourmande (site)** : « Cette page a été mangée », avec un mini-jeu pour attraper des croissants qui tombent, score affiché.
6. **Secouer pour décider (app)** : secouer le téléphone sur la liste des lieux en choisit un au hasard : « Le destin a parlé. »
7. **Badge secret « Fin gourmet de l'ombre »** : débloqué en trouvant un easter egg (ou les deux premiers), caché dans la liste des badges tant qu'on ne l'a pas (champ en plus côté API).
8. **`/miam` sur le bot Discord** : répond par une blague de bouffe au hasard.

Ordre conseillé : 1 et 3 d'abord (rapides, sans API), puis 7 pour récompenser ceux qui trouvent.

## Thèmes de saison et événements (validés le 25 octobre 2026, tous)
Maquette complète : canevas https://claude.ai/artifact/SvmEBgisjjZdLt3aGaHjmm (calendrier nov. 2026 → oct. 2027, téléphone « Pour toi » à essayer, 16 fiches fêtes et causes, 12 cartes sport, mode d'emploi). Les 16 tenues du Capitaine Bouiboui (SVG, casquette gardée, accessoires ajoutés) se refont avec `temporaire/outils/themes/habiller-capitaine.cjs`.

- **Ce qu'un thème change** : la bannière en haut de « Pour toi » (titre, texte, Capitaine habillé), une sélection de lieux et le filtre du moment dans Explorer, un badge ou un couvre-chef de saison pour l'avatar des Miamis, une seule notification par thème (seulement pour qui accepte les nouveautés), le même bandeau sur l'accueil du site.
- **Ce qui ne bouge jamais** : la tomate et les épingles SOS ; aucun thème ni blague sur le BIG SOS, Miam Safe et les urgences ; la carte, les fiches et les boutons ; contraste vérifié en clair et en sombre ; un interrupteur « Thèmes de saison » dans Paramètres.
- **Familles** : fêtes d'ici et d'ailleurs (Noël, Nouvel An, Saint-Valentin, Pâques, Fête de la musique, 14 juillet, Halloween, Nouvel An lunaire, Ramadan, Aïd, Hanoukka, Diwali…), causes (Octobre rose, Movember, Janvier tout doux, Mois des fiertés), sport (soirs de Ligue des champions, Six Nations, Coupe du monde de rugby 2027 en « brunchs d'Ovalie », Coupe du monde féminine 2027, Roland-Garros, Tour de France, Eurovision…), gourmand (galette, Chandeleur, Mardi gras, macaron…), clins d'œil (poisson d'avril, jour de π, jour du pirate, heures d'été et d'hiver, jours fériés « qui est ouvert ? », Braderie de Lille, Fête des Lumières).
- **Pincettes** : alcool et loi Évin (pas de Beaujolais nouveau, Saint-Patrick sans pinte, rien autour de l'alcool pour la visite sans compte) ; causes et fêtes religieuses au ton sobre, lien vers une info officielle (validés par Hugo le 27 octobre 2026 : Octobre rose → la page « Dépistage des cancers du sein » de cancer.fr, Institut national du cancer ; Movember → movember.com, en anglais ; le bouton dit la langue de la page quand elle change), aucune collecte sans décision ; sport sans logo ni nom officiel dans l'app (« Soir de match », « L'été des Bleues ») ; pronostics pour du beurre, jamais d'argent ni de lien vers des paris ; pas de Black Friday.
- **Pilotage** (décidé par Hugo le 25 octobre 2026 : « pour le site et l'app seulement, et l'API évidemment », pas de logiciel de gestion) : le calendrier et les textes français et anglais sont dans `packages/commun` (`regles/calendrier-themes-saison.ts`, `contenus/themes-saison.ts`) ; l'app et le site demandent les thèmes du jour à l'API (`GET /app/themes`), sans nouvelle version de l'app par fête ; les tenues du Capitaine voyagent avec l'app ; sélections automatiques (événements des lieux, étiquettes des pros comme « Diffuse les matchs »).
- **Construction lancée le 25 octobre 2026** : socle commun, 19 tenues (`scripts/tenues-capitaine`) et route de l'API écrits et testés ; bannière de « Pour toi » confiée à App, bandeau de l'accueil et redémarrage de l'API confiés à Site. Plus tard : la sélection de lieux par thème, la notification par thème, les petits rendez-vous du calendrier (Diwali, Hanoukka, jour de π…) et le Tour de France (parcours pas encore publié).
- **Dates** : celles qui suivent la lune ou ne sont pas encore publiées sont « à confirmer » dans la maquette ; les vérifier avant de programmer un thème.
