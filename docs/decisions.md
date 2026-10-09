# Décisions produit

## Concept
- Faire découvrir les lieux indépendants (restos, pâtisseries, bars, bowlings, salles d'événements, sorties) qui ont besoin de monde, y compris ceux en vraie difficulté.
- Lancement **partout en France** (décidé le 8 octobre 2026 ; avant : Montpellier et l'Hérault d'abord). Le site ne met plus en avant une ville ou une région.
- App : partout en France aussi (décidé le 8 octobre 2026) : villes de toute la France proposées à l'inscription (packages/commun/src/contenus/villes-france.ts), distances calculées depuis la ville du profil, carte d'Explorer ouverte sur ta ville. Les lieux d'exemple restent dans l'Hérault.
- L'utilisateur a **3 rescousses par semaine** (rechargées le lundi) et valide ses visites par **QR code**.

## Modèle économique (changé le 8 octobre 2026)
- **Tout est gratuit**, pour les utilisateurs comme pour les lieux : fiche, avis vérifiés, SOS « place ce soir », statistiques, événements. **Pas d'abonnement Pro.**
- **Aucune commission** sur les réservations.
- Financement : **publicité toujours signalée**, sans effet sur le classement. Pas de pub pour l'instant ; elle arrivera avec le bandeau de consentement aux cookies.
- Statut : pas d'entreprise tant que rien ne rapporte. Hugo édite le site à titre non professionnel (mentions légales avec son nom, sans adresse ni téléphone). Dès que de la pub rémunérée sera mise en place (contrat avec une régie, réseau publicitaire activé), il faudra une structure (micro-entreprise ou société) et des mentions légales complètes, **avant** ce démarrage.
- Abandonné : le Pro à 10,99 €/mois et l'offre « Pro offert 6 mois aux 50 premiers lieux ».

## BIG SOS
- Un lieu en vraie difficulté passe **à la une 7 jours**.
- Parcours : demande du lieu (espace pro) ou proposition d'un ambassadeur → vérification sur place par un ambassadeur → vote de la communauté → validation admin → à la une → bilan.
- Page : histoire racontée par le lieu, vidéos de créateurs + liens, objectif de mobilisation avec jauge, bons solidaires.
- **BIG SOS gratuit, mais limité** (décidé le 8 octobre 2026). Les limites restent à définir (nombre, fréquence…) : n'en annoncer aucune tant qu'elles ne sont pas décidées.
- Point ouvert : que devient un bon solidaire si le lieu ferme.
- **Jauge « objectif de mobilisation » : pas encore décidée** (8 octobre 2026). En attendant l'app, c'est un objectif libre réglé et mis à jour à la main dans le logiciel pour chaque BIG SOS ; les visites validées ou les rescousses pourront la remplir quand l'app existera.
- Le vote de la communauté arrivera avec l'app : d'ici là, un BIG SOS peut être validé sans vote.

## Comptes et données de l'app (décidé le 8 octobre 2026)
- **Inscription à partir de 15 ans** (sous 15 ans, le RGPD exigerait l'accord des parents). **Anti-contournement (décidé le 8 octobre 2026)** : le choix de la date reste neutre (toutes les dates, pas d'annonce de l'âge minimum à côté du champ) ; continuer avec une date qui donne moins de 15 ans (écrite en toutes lettres dans le champ, donc on a pu corriger une faute de frappe) bloque l'inscription sur le téléphone jusqu'aux 15 ans (verrou dans le Trousseau ou le Keystore, qui garde le jour des 15 ans, ce qui revient à garder la date de naissance, uniquement sur le téléphone et jamais envoyé), même si on revient changer la date. Sur iPhone, le verrou survit à une désinstallation. Limite connue : le verrou suit l'horloge du téléphone, donc avancer la date le lève ; il sera vérifié avec l'heure du serveur quand l'API sera branchée. Aucune vérification d'identité : c'est une barrière, pas une preuve. Un bouton « Débloquer » existe seulement en mode développement (Expo Go), jamais dans l'app publiée. Entre 15 et 17 ans, tout ce qui touche à l'alcool (boissons alcoolisées, types de bar) est masqué. Règles dans `packages/commun/src/regles/ages.ts`.
- Première ouverture : carrousel de bienvenue qui explique le concept avec la mascotte, puis création du compte, « Fais connaissance » (prénom obligatoire, nom facultatif, date de naissance, ville : avec la position du téléphone, lue une seule fois et jamais gardée, ou tapée à la main avec nos villes de lancement en suggestion), puis les envies (lieux, cuisines, boissons, types de bar, ambiance musicale, jeux, moments, régime particulier), puis « C'est prêt ».
- **Un seul compte pour tout (décidé le 8 octobre 2026)** : le compte de l'app sert aussi à se connecter à l'espace ambassadeur (ambassadeur.sosmiam.fr) et à l'espace pro. Ambassadeur et pro sont des rôles ajoutés à ce compte : suspendre ou retirer un rôle ne touche ni au compte ni à l'app. **Les modes ambassadeur et pro seront sur le site ET dans l'app** (précisé par Hugo le 8 octobre 2026) : même compte, même rôles, écrans équivalents des deux côtés.
- **Connexion : Apple, Google ou e-mail.** Il faudra un compte Apple Developer, qu'on prendra de toute façon pour l'App Store. Apple impose son bouton dès qu'on propose Google.
- **Base de données ultra sécurisée** : PostgreSQL sur le VPS, jamais exposée à Internet, rôle limité au strict nécessaire, données sensibles (date de naissance, nom, régimes) chiffrées par l'API (AES-256-GCM, clé hors de la base), sauvegardes chiffrées, journaux sans données personnelles, suppression de compte réelle.
- **Régime particulier** (végétarien, vegan, halal, casher, sans gluten, allergies…) : ces données peuvent révéler une religion ou un état de santé. Elles restent sur le téléphone tant qu'il n'y a pas d'accord explicite (RGPD, article 9) pour les envoyer au serveur.

## Onglet Explorer de l'app (décidé le 8 octobre 2026)
- **Carte + liste glissante** (comme Google Maps) : la carte des lieux en haut, une liste qu'on remonte du bas. Sur l'aperçu web, pas de carte : la liste seule.
- **Recherche et filtres** : par nom, plat ou quartier ; type de lieu, ville, budget (€ à €€€), « ouvert maintenant ».
- **SOS ce soir en tête** : les lieux en SOS ou en alerte, en carrousel au-dessus de la liste.
- **La roulette** : « Tu sais pas où aller ? » tire un lieu au hasard parmi ceux qui correspondent aux filtres.
- **Android après** (décidé le 8 octobre 2026) : on avance sur iPhone d'abord (Plans d'Apple, sans clé). Le fond de carte Android (Google Maps avec une clé, ou OpenStreetMap via un fournisseur) sera choisi à ce moment-là.
- **Autour de moi** : tri par distance avec la position du téléphone, demandée seulement quand on touche le bouton, gardée le temps de l'écran, jamais enregistrée ni envoyée. Sans elle, la liste suit les envies (même score que le fil « Pour toi »).

## Carte des lieux (décidé le 8 octobre 2026)
- Chaque fiche de lieu montre sa **carte** (« 🍽️ La carte » ; « 🎟️ Les formules » pour une activité) : les plats phares sur la fiche, la carte complète sur un écran à part (sections, prix, repères végé / vegan / sans gluten / épicé / fait maison / local).
- Les boissons alcoolisées de la carte sont masquées aux moins de 18 ans, comme le reste de l'alcool dans l'app. Prix indicatifs : le lieu a toujours le dernier mot.
- Pour l'instant, cartes d'exemple dans l'app (`contenus/cartes-exemples.ts`) ; plus tard, chaque lieu remplit la sienne (espace pro), et elle servira aussi aux avis par plat.

## Signalements et modération (décidé le 8 octobre 2026)
- Dans l'app, le menu « ⋯ » d'une publication → **Signaler** : une raison (faux lieu, pub cachée, arnaque, haine, violence ou contenu sexuel, danger, vie privée, contenu volé, autre chose), une précision facultative, puis le pourquoi avec ses mots (obligatoire pour « Autre chose »). Liste dans `apps/app-mobile/src/contenus/raisons-signalement.ts`, règles dans `packages/commun/src/regles/signalement.ts`.
- **Violence ou contenu sexuel : la publication est masquée pour tout le monde dès le premier signalement**, et une **alerte de modération arrive dans le logiciel de gestion**. Un modérateur décide **à la main**, dans le logiciel de gestion : signalement retenu → la publication est retirée pour de bon ; rejeté → elle est remise en ligne.
- Les autres raisons ne masquent la publication que pour la personne qui signale, en attendant la modération.
- Pour les contenus graves (haine, violence, danger), l'app rappelle le 17, le 112 et Pharos.
- **Promis dans les CGU (8 octobre 2026), à coder avant la sortie de l'app** : quand une publication est masquée ou retirée, ou un compte limité, on prévient l'auteur et on lui dit pourquoi ; s'il conteste, on réexamine la décision ; la personne qui a signalé apprend ce qu'on a décidé (règlement européen sur les services numériques).
- Points ouverts : garde-fous contre les signalements abusifs (un concurrent qui ferait masquer les vidéos d'un lieu) ; délai de traitement.

## Miam Safe : se sentir en sécurité dans un lieu (concept posé le 9 octobre 2026, rien de construit)
- **Compte obligatoire** pour tout Miam Safe. **En cas de danger réel, l'app renvoie d'abord vers le 17 (police), le 18 (pompiers), le 15 (Samu) ou le 112**, accessibles en un appui. Sur ces écrans, le ton reste doux et sérieux : pas de blague ni d'easter egg.
- **Aide sur le moment** (bouton Miam Safe sur la fiche du lieu et pendant une visite) :
  - **prévenir un pote de Ma bande** : il reçoit « Léa ne se sent pas en sécurité au [lieu] », la **position en direct pendant 1 h** (seulement si la personne le déclenche, arrêtable à tout moment) et un bouton pour l'appeler ;
  - **demander de l'aide au comptoir** : une phrase à dire, sur le principe de « Demande Angela », **et** un écran à montrer au personnel (« J'ai besoin d'aide, discrètement »).
- **Signaler après coup** (harcèlement, agression, discrimination, personnel déplacé…) : ça part en alerte de modération dans le logiciel de gestion. **Jamais public sur la fiche.** L'équipe peut contacter le lieu, lui retirer son badge, le suspendre ou le retirer.
- **Lieux engagés** : dans l'espace pro, le lieu signe une **charte Miam Safe** (équipe qui connaît la phrase et l'écran, consigne au comptoir) et obtient le badge **« Miam Safe »** sur sa fiche.
- **Avis des usagers, seulement en positif** : après une visite, on demande « Tu t'es senti·e bien ici ? ». Au-dessus d'un seuil (proposé : 90 % de oui sur au moins 20 réponses), la fiche affiche « Les Miamis s'y sentent bien ». **Un « non » ne s'affiche jamais : il devient un signalement privé.**
- Points ouverts : texte de la charte et phrase au comptoir ; le 114 (urgences par SMS, pour les personnes sourdes ou qui ne peuvent pas parler) ; la position partagée pour les 15-17 ans ; délai de traitement des signalements Miam Safe ; seuil définitif de l'avis positif.

## Publications et compte (CGU du 8 octobre 2026)
- Les publications restent à leur auteur : SOS Miam peut seulement les héberger, les adapter au format et les montrer dans l'app et sur le site. **Pour les reprendre ailleurs (nos réseaux TikTok, Instagram…), on demande d'abord l'accord de l'auteur.**
- Un compte par personne ; suppression possible **depuis l'app** (exigé par Apple, à coder) ou par e-mail.
- Âge : page publique https://sosmiam.fr/age (« URL d'adéquation à l'âge » de l'App Store, classification 16+). À mettre à jour avec les CGU **avant** l'arrivée de la messagerie et de la pub.

## Fil « Pour toi » de l'app (décidé le 8 octobre 2026)
- Un mélange de Reels, Shorts et TikTok :
  - son coupé par défaut, avec un bouton (seulement si la vidéo a du son) ;
  - barre d'avancée qu'on peut glisser ;
  - appui long = vitesse x2 ;
  - photos qui défilent seules (4 s) avec des barres façon stories ;
  - double appui = J'aime, avec une petite vibration ;
  - légende coupée avec « … plus » ;
  - quand on réduit la fiche, le @ de l'auteur reste visible.
- Les publications des lieux et créateurs suivis passent en tête, sans jamais deux fois le même lieu de suite.

## Suivre et abonnements (décidé le 8 octobre 2026)
- **Lieux pros et créateurs** :
  - « Suivre » sur leur fiche ou leur page, et dans le fil ;
  - toucher « Suivi » ouvre une confirmation « Ne plus suivre ? » : on ne désabonne jamais d'un seul toucher ;
  - liste « Tu suis » depuis l'onglet Profil.
- **Entre personnes** (démo sur le téléphone depuis le 8 octobre 2026 ; l'API viendra ensuite) :
  - suivre est à sens unique et **coexiste avec « Ma bande »** : suivre, c'est voir passer ses listes et ses lieux (ses vidéos et avis arriveront avec les comptes) ; Ma bande, ce sont les vrais potes, pour les sorties et le chat. Suivre n'ouvre jamais le chat ;
  - comptes **publics par défaut, privé possible** (Réglages > Compte privé) : en privé, chaque abonnement est une demande à accepter ;
  - **15-17 ans : compte privé d'office**. Un adulte ne peut ni les suivre, ni leur envoyer de demande, ni voir leurs compteurs et leurs abonnés (sauf un créateur de 15-17 ans, voir plus bas). Eux suivent les lieux, les créateurs et les ados de leur âge (sur demande) ;
  - abonnés / abonnements sur les profils (retirer un abonné), onglet « Abonnements » dans le fil (seulement ce que publient les lieux et créateurs suivis), notifications dans l'app derrière une cloche (« … te suit », demandes, nouvelle vidéo), suggestions « Tu pourrais suivre » (potes de potes, créateurs de ta ville, lieux proches). Pas de notification sur le téléphone avant l'API ;
  - tous les gestes de suivi demandent un compte (pendant la visite sans compte, ils ouvrent « Crée ton compte »), et suivre une personne demande d'avoir choisi son pseudo ;
  - choix par défaut, à confirmer par Hugo : passer en privé garde les abonnés, repasser en public accepte les demandes en attente (après confirmation) ; un compte privé montre à un non-abonné son avatar, son prénom, son @pseudo et ses compteurs, rien d'autre ; la bande voit tout si vous vous êtes ajoutés en vrai (lien ou QR code vérifié) ; refuser, retirer un abonné ou ne plus suivre ne prévient jamais l'autre ; bloquer coupe tout dans les deux sens et débloquer ne rétablit rien ;
  - **à 18 ans, les abonnements déjà acceptés avec des 15-17 ans restent** : seuls les nouveaux liens adulte → mineur sont interdits, et les demandes encore en attente qui le deviennent sont retirées sans bruit. Le compte reste privé tant que la personne ne choisit pas « public », et sa bande ne bouge pas ;
  - **un 15-17 ans pourra être créateur** (publier dans le fil public) **avec des abonnés adultes, sous surveillance accrue** : son compte reste privé (chaque abonnement est une demande qu'il accepte ou refuse), et ces liens remontent au logiciel de gestion. La surveillance sera détaillée avec la publication de vidéos (pistes : modération renforcée des commentaires d'adultes, signalements traités en priorité, pas de message privé d'un adulte, position jamais affichée).

## Potes (décidé le 8 octobre 2026)
- **Ma bande** :
  - on ajoute un pote par lien, QR code ou pseudo ; le pseudo est choisi à l'inscription ;
  - sorties avec vote (plusieurs votes par personne) et discussion réservée aux participants ;
  - listes partagées, envoyer un lieu à un pote ;
  - activité de la bande et classement du mois ;
  - profil communautaire partageable.
- **Protection des 15-17 ans** :
  - pas de bar dans une sortie où il y a un mineur ;
  - un adulte ne voit pas les mineurs dans la recherche par pseudo et ne peut pas les ajouter par pseudo ;
  - tant que les comptes n'existent pas, un adulte ne peut ajouter aucun mineur.
- **Liens et QR codes d'invitation** :
  - ils portent un code secret personnel ;
  - tant que l'API ne vérifie pas ce code, un ajout par lien ou QR ne compte pas comme « ajouté en vrai ».
- Bloquer et signaler partout (messages, commentaires, profils, lieux envoyés, listes). Réglages > Personnes bloquées pour débloquer.
- Démo avec des potes d'exemple, gardée sur le téléphone, en attendant les comptes.

## Commentaires (décidé le 8 octobre 2026)
- Dans une feuille qui monte du bas :
  - réponses, J'aime, mentions @ ;
  - la réponse du lieu est mise en avant ;
  - modifier ou supprimer ses commentaires ;
  - le lieu peut masquer un commentaire ;
  - signaler ou bloquer.
- **Filtre de mots** (`packages/commun/src/regles/mots-interdits.ts`) :
  - il refuse insultes, haine et contournements (chiffres collés, lettres espacées, répétées ou en leet) ;
  - il laisse passer les phrases normales (« pain bâtard », « je suis retardé », « Negroni ») ;
  - « fdp » et « ta gueule » restent permis (à revoir si besoin).

## Messagerie entre potes de l'app (décidé le 8 octobre 2026)
- Messages privés et groupes. On y envoie :
  - du texte, avec des réactions en emoji ;
  - un lieu, avec « On y va ? » qui ouvre une sortie déjà remplie ;
  - des photos ;
  - des notes vocales (1 minute au plus ; micro demandé seulement au moment d'enregistrer).
- **15-17 ans** :
  - ils ne discutent qu'avec des potes ajoutés en vrai (lien ou QR code vérifié, donc pas avant l'API) ;
  - pas de photo ni de note vocale dans une conversation qui mélange mineurs et adultes ;
  - pas de bar proposé.
- Pour l'instant, démo locale : rien ne part du téléphone, les interlocuteurs sont des potes d'exemple.

## Lieux vérifiés et non vérifiés (décidé le 9 octobre 2026)
- **Un lieu présent dans l'app n'a pas forcément de compte SOS Miam.** Il y a deux sortes de lieux :
  - **lieu « vérifié » ✓** : il a un compte SOS Miam (pro) ;
  - **lieu « non vérifié »** : ajouté par l'équipe ou proposé par un ambassadeur, sans compte. C'est à dire clairement partout (fiche, carte, FAQ, CGU), pour ne pas laisser croire qu'il est inscrit.
- **Seul un lieu vérifié valide les visites** (addition, QR du comptoir, réservation honorée), lance des SOS et répond aux avis. Les **points de visite** (+15, +25 pendant un SOS), les **rescousses** et les **avis vérifiés** n'existent donc que dans un lieu vérifié. Sans compte, pas de scan : on ne compte rien.
- **Dans un lieu non vérifié**, on peut voir la fiche et l'itinéraire, le garder en favori, donner un avis (marqué « non vérifié », sans visite validée) et **inviter le lieu à rejoindre SOS Miam**.
- **Dans l'app (construit le 9 octobre 2026)** : badge « ✓ Vérifié » ou « Non vérifié » sur la fiche, dans la liste d'Explorer, sur la carte (rond crème en pointillé) et sur les publications du fil ; dans un lieu non vérifié, ni bloc « Tu passes chez eux ? », ni SOS, ni rescousse (une rescousse déjà donnée se reprend encore) : « Inviter ce lieu » à la place (fiche et menu « ⋯ » du fil), qui partage le lien d'inscription gratuite. Un lieu non vérifié ne publie pas lui-même : seuls des créateurs en parlent. Champ `verifie` du type Lieu, règle `estLieuVerifie`.

## Scan et validation des visites (décidé le 8 octobre 2026)
- **On valide son passage en payant**, comme le promet la FAQ. Trois façons pour la première version :
  - **l'addition demandée dans l'app**, que le lieu marque réglée d'un geste ;
  - **un QR qui change au comptoir** (renouvelé toutes les 30 s environ), affiché par le téléphone ou la tablette du lieu et scanné par le client après avoir payé ;
  - **une réservation faite dans l'app et honorée**, ce qui demande aussi de construire les réservations.
- Le QR imprimé sur le ticket d'une caisse connectée viendra plus tard.
- **Côté lieu** : un mode pro dans l'app et le même écran dans l'espace pro du site.
- **Anti-triche** :
  - **position vérifiée au moment de valider**, à environ 200 m du lieu, demandée à ce moment-là et jamais gardée ;
  - **le lieu peut refuser une demande**, et trop de refus signalent le compte ;
  - **les comptes louches remontent dans le logiciel de gestion**.
- Pas de limite d'une visite par lieu et par jour : deux passages le même jour peuvent compter, et les excès relèvent du contrôle.
- **Une visite validée débloque** :
  - des points (+15, ou +25 pendant un SOS) ;
  - un avis vérifié, avec une invitation une heure après ;
  - un tampon sur la carte de fidélité du lieu (récompense choisie par le lieu) ;
  - une ligne dans l'historique « Mes visites ».
- **Précisions (8 octobre 2026, soir)** :
  - **le QR du comptoir s'affiche à la demande** : après le paiement, l'équipe touche « Montrer le QR » pour 1 à 12 personnes ; il change toutes les 30 s et s'éteint après 2 minutes ou quand tout le monde a scanné. Pas de QR affiché en permanence (il prouverait une présence, pas un paiement) ;
  - **pendant un SOS, +25 à la place de +15**, si le SOS était lancé avant la demande ;
  - **chaque membre de l'équipe d'un lieu a son compte** (rôle « équipe », invité par le gérant) : on sait qui a validé quoi ;
  - **délais** : 30 minutes pour valider une addition demandée, 15 minutes pour qu'un lieu annule une validation faite par erreur, 14 jours pour donner son avis ;
  - une addition de table : chaque personne fait sa propre demande (une visite chacun) ;
  - « Venu » (réservation) ne compte que si le client a aussi fait « Je suis là » sur place ;
  - les avis sont signés « Léa M. » (« Léa » seulement pour un 15-17 ans), datés au mois, jamais à l'heure ; un ambassadeur donne un avis consultatif sur un avis louche, l'équipe tranche dans le logiciel ;
  - aucun texte libre d'un lieu vers un client en v1 (motifs de refus fermés) ;
  - la démo du mode pro et du mode ambassadeur n'existe qu'en développement (jamais dans une version publiée).
- **Règles détaillées (plan du 8 octobre 2026)** :
  - **QR du comptoir montré à la demande** : l'équipe touche « Montrer le QR » pour N personnes (1 par défaut, 12 au plus) ; il change toutes les 30 s, reste valable 60 s au plus et s'éteint après 2 min ou quand tout le monde a scanné. Pas d'affichage en continu en v1. Le QR de vitrine et des chevalets ouvre la fiche, il ne valide jamais une visite ;
  - **réservation honorée** : la visite compte quand le lieu touche « Venu » **et** que le client a confirmé « Je suis là » (position vérifiée, d'une heure avant le créneau à 4 h après) ;
  - **position** : comparée par le serveur (sur le téléphone dans la démo) ; refusée si l'imprécision dépasse 500 m, si la lecture a plus de 60 s ou si elle est simulée ; rayon de 200 m, tolérance plafonnée à 150 m. Jamais gardée ni écrite dans un journal ; seul le résultat est gardé ;
  - **au comptoir** : dès 2 additions en attente, l'équipe tape le code à 4 chiffres ; jamais de « tout valider ». Une addition en attente à la fois par compte (30 min). Le lieu peut annuler une validation pendant 15 min. Motifs de refus fermés ; le client peut contester. Un compte n'est signalé que par des refus venant d'au moins 2 gérants ; le taux de refus des lieux est surveillé ;
  - **rôles** : même compte ; modes pro (gérant ou équipe) et ambassadeur dans l'app et sur le site ; 18 ans et plus ; un 15-17 ans n'a qu'un mode. L'équipe d'un lieu ne valide ni ne note chez elle. Le lieu voit seulement le prénom, l'initiale, l'emoji, le code et les tampons chez lui. Aucun texte libre du lieu vers le client en v1 ;
  - **avis vérifiés** : liés à une visite, ouverts 1 h après, pendant 14 jours ; signés « Prénom I. » (prénom seul avant 18 ans), datés au mois ; moyenne prudente ; part de clients qui reviennent à partir de 20 clients (jours distincts). Un ambassadeur relit sans voir l'auteur, jamais un avis de mineur ; son verdict est consultatif, l'équipe tranche. On ne masque jamais un avis automatiquement ;
  - **fidélité** : un tampon par visite validée ; 3 à 10 visites (5 par défaut) ; récompense figée quand la carte se remplit, remise depuis « Récompenses à donner » ; une récompense avec alcool exige une version sans alcool, la seule montrée aux 15-17 ans ;
  - **démo** : en développement seulement ; les visites de démo ne seront jamais importées dans un vrai compte ; dans une version publiée sans API, aucune fausse visite vérifiée ; le mode pro de démo joue le **Restaurant du Capitaine Bouiboui** (lieu inventé d'après la mascotte du kit, décidé le 9 octobre 2026), jamais un nom de lieu qui pourrait exister ;
  - **sanctions** décidées à la main dans le logiciel ; seuls des freins techniques temporaires sont automatiques.
- **Limites assumées** (à écrire aussi dans les CGU) : la position est un frein, pas une preuve (sur iPhone, aucun indice d'une position simulée) ; un complice sur place avec plusieurs comptes peut tricher au prix d'un vrai effort, on le détecte après coup ; la règle « membre du lieu » se contourne avec un second compte ; l'âge est déclaratif, le lieu reste responsable de l'alcool qu'il sert.
- **Comment la visite a été réglée (décidé le 9 octobre 2026)** : en validant (addition, QR du comptoir, réservation), l'équipe choisit dans une liste fermée, jamais en texte libre :
  - **payée** : +15 (ou +25 pendant un SOS), tampon, avis ;
  - **payée avec réduction** : pareil, avec la réduction indiquée (−10, 15, 20, 25, 30 ou 50 %, ou sans préciser) ;
  - **offerte par le lieu** : la visite est notée, mais sans points ni tampon (pour qu'un lieu ne puisse pas offrir des repas pour gonfler ses visites) ; l'avis reste possible, marqué « Repas offert » ;
  - plus des **avantages** : récompense fidélité, happy hour ou formule, offre SOS, collaboration commerciale (toujours affichée, en premier), autre avantage.
  - C'est affiché partout : au comptoir pro, côté client (célébration, visite, Mes visites, onglet Scan), sur les avis publics (« Repas offert », « Avec réduction ») et dans le logiciel de gestion (part d'offerts par lieu, alerte s'il y en a trop).
- **Points ouverts, à trancher avant de brancher l'API** : rattacher un pro à son lieu (SIREN + vérification), e-mail vérifié obligatoire pour valider, seuils anti-triche, durées de conservation des visites, adresse de l'espace pro (pro.sosmiam.fr ?).

## Carte du lieu (construite le 9 octobre 2026)
- **Le gérant remplit sa carte lui-même** : mode pro de l'app > Mon lieu > La carte (l'espace pro du site suivra). Elle se compose de :
  - **sections** à titre libre, avec des idées toutes prêtes (Plats, Desserts, À boire, Menu enfant…) ;
  - **éléments** : nom, description, prix au centime, « pour » (le verre, la part, par personne…), spécialité ⭐, alcool, repères (végé, vegan, sans gluten, épicé, fait maison, local).
  - Le gérant range sections et éléments avec des flèches (mode « Ranger », aussi en actions VoiceOver).
- **Tout part d'un coup avec « Enregistrer »** ; quitter avant redemande (« Partir sans enregistrer ? »). Le serveur revérifie la carte (`validerCarteDuLieu`, dans packages/commun) et pose lui-même la date affichée aux gourmands (« Mise à jour par le lieu le … »).
- **Limites** :
  - 20 sections, 60 éléments par section, 250 en tout ;
  - noms de 80 caractères au plus, descriptions de 200, titres de 40 ;
  - prix de 0 à 9 999 € ;
  - pas de gros mot.
- **Alcool** :
  - coché par le gérant, et caché aux moins de 18 ans et quand l'âge est inconnu (visite sans compte) ;
  - l'app prévient quand un nom fait penser à de l'alcool, sans rien imposer : un « coq au vin » reste un plat.
- **Ce que voient les gourmands** : une section vide reste chez le gérant mais n'apparaît pas aux gourmands. Une carte enregistrée remplace celle de la fiche, même si elle est vide.
- **Droits** : seul le gérant enregistre ; toute l'équipe peut lire.
- **Contrat** : `lireCarteDuLieu` / `reglerCarteDuLieu` (ServiceComptoir). Ils restent à brancher dans l'API (stockage de la carte) quand Hugo le décidera.

## Infos pratiques des lieux (décidé le 9 octobre 2026)
- Chaque fiche montre un bloc « Infos pratiques » : téléphone (bouton « Appeler »), site, Instagram, accueil des animaux (bienvenus, en terrasse seulement, pas d'animaux), accès en fauteuil roulant, terrasse, Wi-Fi, chaise haute ou menu enfant, parking, réservation (inutile, conseillée, obligatoire) et moyens de paiement (dont tickets resto et chèques-vacances).
- Une info inconnue n'est jamais affichée (on ne devine pas). Plus tard, le lieu les remplit lui-même (mode pro, espace pro du site).
- Lieux d'exemple : numéros pris dans la tranche que l'ARCEP réserve à la fiction (04 65 71 xx xx), sites en example.com, pas de compte Instagram inventé.

## Visite sans compte (décidé le 8 octobre 2026, construite le 9 octobre)
- **Sans compte, on regarde seulement** : fil, Explorer, fiches des lieux et leur carte, pages des créateurs, lecture des commentaires, « Y aller ».
- **Tout le reste demande un compte** : rescousse, J'aime, commenter, suivre, garder, partager, envoyer à un pote, Pas intéressé, Signaler, Potes, chat, profil, défis, Scan. Une feuille « Crée ton compte » s'ouvre à la place.
- **Pas de question d'âge** : contenu tout public (ni bars ni alcool) jusqu'à l'inscription. Le verrou des moins de 15 ans reste actif sur le téléphone.
- Entrée par « Juste jeter un œil » (bienvenue et écran du compte). Après une inscription lancée depuis la visite, on revient sur l'écran d'où l'on est parti, avec le compte. Une fiche de bar ouverte sans compte propose de s'inscrire (« tu as 18 ans ou plus ? »).

## Notifications push (décidé le 8 octobre 2026)
- **Envoyées directement à Apple (APNs) et à Google (FCM), sans intermédiaire** (pas le service d'Expo). Il faut une clé APNs « .p8 » (developer.apple.com → Keys) et un compte de service d'un projet Firebase gratuit, déposés par Hugo dans /root/sos-miam-secrets.
- **Anti-spam : au plus 1 notification par jour et 4 par semaine par téléphone**, hors notifications demandées par la personne (« un SOS près de chez toi »).
- Une notification n'ouvre qu'un écran de l'app (jamais une adresse extérieure) ; détail des réceptions effacé après 90 jours.

## Programme Ambassadeurs
- Paliers : Curieux (0 pt) → Dénicheur (100) → Ambassadeur de quartier (300) → Ambassadeur de ville (nommé par l'équipe parmi les fondateurs de sa ville, décidé le 9 octobre 2026 ; avant : sur candidature ou invitation).
- **Deux badges distincts (décidé le 8 octobre 2026)** : « 🚀 Premier sauveteur » = donner la toute première rescousse à un lieu qui vient d'arriver (+20 points) ; « 🔎 Déniché par toi » = proposer un lieu qui rejoint SOS Miam, sa fiche affiche « Déniché par <prénom> » (+30 points, « proposer un lieu validé »).
- **Barème des points (décidé le 8 octobre 2026)** : visite validée +15, visite pendant un SOS +25, avis avec photo +10, proposer un lieu validé +30, corriger une fiche +5, premier sauveteur +20, **rescousse +2**. Les défis réussis rapportent leurs propres points. Règles dans `packages/commun/src/regles/ambassadeurs.ts`.
- Écran Profil de l'app : avatar (emoji au choix, ou photo gardée sur le téléphone), palier et points, rescousses de la semaine, défis, badges, lieux gardés et publications aimées, réglages (infos, envies, notifications, confidentialité, tout effacer). La date de naissance ne se change pas depuis l'app (règle d'âge) : tant que tout est sur le téléphone, la seule façon de la corriger est « Effacer mes données et recommencer ».

## Fondateurs par ville (décidé le 9 octobre 2026)
- **Remplace les « 10 fondateurs » pour toute la France.** Chaque ville a ses fondateurs, selon sa taille (population municipale INSEE en vigueur, via geo.api.gouv.fr) :
  - plus de 500 000 habitants → **10 places** (Paris, Marseille, Lyon, Toulouse) ;
  - 200 000 à 500 000 → **5 places** (Nice, Nantes, Montpellier, Strasbourg, Bordeaux, Lille, Rennes) ;
  - 100 000 à 200 000 → **3 places** (31 villes, de Toulon à Nancy) ;
  - 50 000 à 100 000 → **1 place** (93 villes, d'Avignon à Bondy) ;
  - les communes de moins de 50 000 habitants partagent **1 place par département** (100 places : Paris est déjà une ville).
  - les collectivités d'outre-mer comptent comme un département : **1 place chacune** pour Polynésie française, Nouvelle-Calédonie, Saint-Martin, Saint-Barthélemy, Saint-Pierre-et-Miquelon et Wallis-et-Futuna (6 places ; Nouméa, plus de 50 000 habitants, a en plus sa propre place).
  - Total : **367 places** (261 dans 135 villes, 100 pour les départements, 6 pour les collectivités d'outre-mer).
- **Tout ouvre en même temps**, partout en France. On candidate pour la ville où l'on vit, ou pour son département (ou sa collectivité d'outre-mer) si sa commune a moins de 50 000 habitants ; l'équipe choisit, comme avant.
- **Carte** : « Fondateur n° 3 de Lyon · n° 147 en France » (numéro dans sa ville ou son département, et numéro national, dans l'ordre des acceptations). Numérique tout de suite (image et PDF à imprimer, dans l'espace) ; une vraie carte envoyée par la poste plus tard (quand, et à quel coût : à décider par Hugo ; il faudra alors demander l'adresse postale et compléter la politique de confidentialité).
- **Rencontre** : une visio d'environ 30 minutes avec les fondateurs de sa ville (de sa région pour les fondateurs de département), et un tête-à-tête si besoin. Remplace « café ou visio, 20 minutes ».
- **Ville ou département au complet** : la candidature s'y ferme d'elle-même et rouvre quand une place se libère (fondateur retiré du programme, compte effacé ou déménagement). Pas de liste d'attente (confirmé par Hugo le 9 octobre 2026).
- **Déménagement** : le fondateur garde son titre en souvenir, mais sa place dans son ancienne ville se libère. **Un numéro n'est jamais redonné** (confirmé par Hugo le 9 octobre 2026) : le fondateur suivant à Lyon sera le n° 11, même avec 10 places à la fois.
- **Ambassadeur de ville** : nommé plus tard par l'équipe parmi les fondateurs de la ville (son capitaine). Réservé aux fondateurs d'une ville : un fondateur de département garde son titre de fondateur, sans palier équivalent (décidé par Hugo le 9 octobre 2026).
- **En attendant la nouvelle version** : la candidature reste ouverte avec l'ancien texte ; l'équipe n'accepte personne d'ici là ; chaque candidature reçue sera reprise dans la ville ou le département de la personne.

## Ambassadeur certifié (décidé le 9 octobre 2026, à construire)
- **Qui** : quelqu'un qui aide les lieux partenaires. Ça peut être un ambassadeur, un pro (restaurateur, commerçant) ou une structure (asso, mairie, office de tourisme…). Une structure est représentée par **une personne** qui a son compte (18 ans ou plus) et indique le nom de sa structure : « Marie, pour l'asso Les Gourmands du 11e ».
- **Comment** : l'équipe le choisit, sur candidature depuis l'espace ou sur invitation, et valide dans le logiciel de gestion.
- **Un titre à part**, pas un palier : il s'ajoute au palier (et au titre de fondateur s'il y en a un).
- **Ce qu'il a de plus** :
  - un badge « Ambassadeur certifié ✓ » sur son profil et sur les fiches des lieux qu'il a aidés (prénom, ou prénom et structure) ;
  - des missions chez les lieux partenaires, confiées par l'équipe ;
  - un kit média pro (visuels pour présenter SOS Miam aux lieux) ;
  - le contact direct avec les lieux, **par la messagerie SOS Miam** (demande depuis l'espace pro, reçue dans « Mes messages »), sans aucune adresse ni aucun numéro montré. Ça arrivera avec l'espace pro.
- **Titre et rôle** : le titre part avec le rôle d'ambassadeur (retrait par l'équipe ou après 1 an sans visite) ; on peut recandidater en revenant (décidé le 9 octobre 2026).
- **Pas de liste publique** des ambassadeurs certifiés : seulement le badge sur les fiches des lieux aidés.
- **Jamais payé par un lieu**, comme tous les ambassadeurs : si un lieu lui offre quelque chose, il l'écrit « Collaboration commerciale ».
- **Candidature** (validée par Hugo le 9 octobre 2026) :
  - tu es plutôt… : un ambassadeur qui aime aider les lieux, un pro ou une structure ;
  - nom de ta structure ou de ton lieu (facultatif) ;
  - ta ville (commune officielle) ;
  - comment tu aides déjà les lieux (600 caractères) ;
  - ce que tu aimerais faire : remplir une fiche, faire de belles photos, présenter SOS Miam aux lieux du coin, donner un coup de main pendant un BIG SOS ;
  - case obligatoire « J'ai compris : jamais payé par un lieu (sinon « Collaboration commerciale ») ».
  Une candidature refusée est effacée 3 mois après la réponse, comme pour les fondateurs.
- **Kit média pro**, réservé aux certifiés : une affiche A4 (« Ton lieu sur SOS Miam, c'est gratuit », avec un QR vers « J'inscris mon lieu »), un flyer A6 (recto : ce que SOS Miam apporte à un lieu ; verso : comment s'inscrire, gratuit et sans abonnement), un mot de 30 secondes à dire au comptoir et un mail type avec le lien d'inscription.
- Base : colonnes `certifie_le`, `profil_certifie` et `structure` sur `ambassadeurs`, et table `candidatures_certification` (migration du 9 octobre 2026).

## Propositions de modification de fiche (décidé le 9 octobre 2026)
- Un compte connecté propose de corriger une fiche de lieu (nom, adresse, horaires, texte, contact, infos pratiques) : POST /comptes/moi/suggestions, vérifié par validerPropositionLieu (packages/commun). L'équipe est prévenue dans le logiciel, voit avant / maintenant / proposé, accepte tout ou par champ, ou refuse avec une réponse envoyée par mail.
- Pas de suggestion sans compte. Limites : 10 par 24 h par compte, 3 en attente au plus sur un même lieu.
- **Conservation : 1 an après la décision de l'équipe** (ménage de nuit) ; si le compte est supprimé avant, la proposition reste sans auteur jusqu'à cette date.

## Espace pro (décidé le 9 octobre 2026)
- **https://pro.sosmiam.fr**, servi par le site (comme ambassadeur.sosmiam.fr), avec son propre cookie. **Compte unique** : « pro » est un rôle, obtenu quand l'équipe valide le **rattachement** du compte à un lieu (table `rattachements_lieux` : rôle « gerant » ou « equipe », preuve, SIRET facultatif ; un compte peut tenir plusieurs lieux). Un lieu est **vérifié ✓** dès qu'il a un rattachement validé.
- **Modifier sa fiche** : horaires, texte, contact et infos pratiques changent **tout de suite** ; le **nom et l'adresse** passent par l'équipe (suggestion « pro » décidée dans le logiciel), contre les abus.
- **Première version** : rattachement à mon lieu (chercher mon lieu, ou le proposer s'il n'existe pas), ma fiche et mes infos pratiques, les suggestions des clients sur ma fiche (et la décision de l'équipe), mon équipe (inviter un employé, rôle « equipe »), l'affichette de table (QR vers la fiche).
- **Deuxième version, avec les visites côté serveur** (à construire avec l'app) : le QR du comptoir, lancer un SOS « place ce soir », mes statistiques (vues, rescousses, visites validées), mes avis et y répondre.

## Espace ambassadeur (décidé le 8 octobre 2026)
- **https://ambassadeur.sosmiam.fr**, servi par le site (apps/site-web) : « / » mène à `/programme`, la page publique (et indexée) qui explique le programme ; sur sosmiam.fr, les adresses de l'espace renvoient vers ce sous-domaine. Lancement partout en France : aucune ville n'y est citée comme lieu de lancement.
- **Dès 18 ans** : date de naissance demandée à l'inscription, âge calculé avec la date du jour à Paris, date jamais gardée ni écrite dans un journal (moins de 18 ans : rien n'est gardé). **Chaque inscription est validée par l'équipe** dans le logiciel de gestion : statut « en attente », puis « actif », « refusé » ou « suspendu ». Seul « actif » ouvre le kit média, les propositions de lieux, la candidature fondateur, les missions et les messages ; « refusé » et « suspendu » peuvent se connecter pour voir leur statut et gérer leur compte dans « Mon compte » (infos, mot de passe, suppression), rien d'autre.
- Connexion **e-mail + mot de passe**. Mot de passe oublié : la personne écrit à bonjour@sosmiam.fr depuis l'adresse de son compte ; l'équipe prépare dans le logiciel un lien `https://ambassadeur.sosmiam.fr/nouveau-mot-de-passe#jeton=…` (valable 24 h, une seule fois), envoyé par mail depuis bonjour@sosmiam.fr. **« Mot de passe oublié » en libre-service** (décidé et construit le 9 octobre 2026) : la personne tape son e-mail et reçoit le même lien (24 h, une seule fois), avec la même réponse que l'adresse existe ou non ; le lien préparé par l'équipe reste possible. **E-mail vérifié à l'inscription** (décidé et construit le 9 octobre 2026, lien valable 7 jours) : un lien à cliquer, reçu par mail ; le logiciel affiche « e-mail vérifié ✓ » avant que l'équipe valide le compte. L'e-mail du compte ne se change pas en ligne (« écris-nous »).
- **Risque accepté** (décidé le 9 octobre 2026) : quelqu'un qui connaît l'e-mail d'un compte peut bloquer sa **connexion** jusqu'à 2 h (5 faux mots de passe) ; les sessions déjà ouvertes et « Mon compte » ne sont pas touchés, et le lien de nouveau mot de passe remet l'attente à zéro. À revoir si ça arrive (appareil reconnu par un cookie).
- L'espace connecté : **profil et palier**, **kit média (réservé aux ambassadeurs validés)**, **proposer un lieu** (même formulaire que « J'inscris mon lieu », sans la partie contact), **candidater « fondateur »**, **Mes missions**, **Mes messages**, et « Mon compte » (prénom, ville, quartier, mot de passe, suppression du compte).
- **Promesses permises, rien d'autre** : badges de palier, « Déniché par toi » (prénom sur la fiche du lieu proposé et accepté), points (barème du programme ci-dessus) ; pour les **fondateurs** (voir « Fondateurs par ville ») : carte de fondateur (numérique, puis une vraie carte envoyée plus tard), autocollant « Déniché par » à leur prénom en vitrine, badges, l'app en avant-première en lien direct avec l'équipe ; une visio d'environ 30 minutes avec les fondateurs de sa ville (de sa région pour un fondateur de département), et un tête-à-tête si besoin. **Pas** d'avantages chez des commerçants, pas d'événements, pas de groupe promis, pas de rémunération : un programme de passionnés, ni horaires ni objectifs.
- **Fondateurs au complet** : quand les places d'une ville ou d'un département sont toutes prises, la candidature s'y ferme d'elle-même (l'API refuse les nouvelles : « plus-de-place ») et rouvre si une place se libère (fondateur retiré du programme, compte effacé ou déménagement). Pas de liste d'attente : confirmé par Hugo le 9 octobre 2026. Un candidat refusé peut recandidater tout de suite (décidé le 9 octobre 2026). Pas de carte en PDF : l'image (SVG ou PNG) suffit.
- Un ambassadeur n'est **jamais payé par un lieu** qu'il met en avant ; si un lieu lui offre quelque chose, il l'écrit « Collaboration commerciale » (loi n° 2023-451).
- **Conservation** (compte unique app + espace, décidé le 8 octobre 2026) : **1 an** sans visite → seulement le **rôle** ambassadeur est retiré (comme « Retirer du programme » : missions, messages perso et candidatures ; le compte, ses points et ses badges restent) ; **2 ans** sans connexion → **tout le compte** est effacé ; un mail prévient 30 jours avant chacun (à 335 et 700 jours), avec une alerte dans le logiciel ; compte **refusé** → effacé **30 jours** après le refus ; candidature fondateur **refusée** → effacée **3 mois** après la réponse ; compte supprimé par la personne → tout part, sauf ses propositions de lieux, gardées sans lien vers elle (le prénom « Déniché par » recopié sur une fiche y reste : on le change ou on le retire sur simple demande, droit à l'effacement), et le journal des mails qu'on lui a envoyés (pas relié au compte, effacé 90 jours après chaque envoi) ; sauvegardes chiffrées de nuit → la donnée en disparaît au plus tard 30 jours après.
- **Mots de passe** : **12 à 128 caractères** (après normalisation NFC), sans règle de composition, mais **16 chiffres au moins** s'il n'y a que des chiffres ; refusé s'il fait partie d'une liste de mots de passe courants (même entouré de chiffres ou de signes ; grande liste publique de plus de 1 000 mots de passe parmi les plus utilisés : SecLists, licence MIT, 10 222 entrées dans apps/api/src/donnees/mots-de-passe-courants.txt ; décidé et construit le 9 octobre 2026), si c'est une suite (« 123456789012345 », « azertyuiop… ») ou un petit motif répété (« aaaaaaaaaaaaa », « 121212121212 »), ou s'il est égal à l'e-mail ou à ce qui précède son « @ » (complété à la relecture du 8 octobre 2026 ; cas 2 de la délibération CNIL 2022-100, grâce à l'attente par compte). Empreinte **scrypt** (N = 2^14, r = 8, p = 5, sel aléatoire de 16 octets, clé de 32 octets, format `scrypt$16384$8$5$<sel>$<empreinte>`), comparée en temps constant ; hachage factice quand l'e-mail est inconnu ; au plus 2 calculs en même temps et 20 en attente (file pleine : l'API répond 503 « occupe » avec Retry-After, et le site affiche « Il y a beaucoup de monde en ce moment : réessaie dans un instant. ») ; toujours après les limites d'essais.
- **Sessions** : jeton aléatoire de 32 octets rendu une seule fois, la base n'en garde que l'empreinte ; fermée après **30 jours** sans visite et au plus **90 jours** après l'ouverture ; nouveau jeton à chaque connexion ; changer de mot de passe ferme les autres sessions et donne un nouveau jeton à celle en cours (posé par une redirection, pour que ça marche aussi sans JavaScript), une réinitialisation les ferme toutes. Cookie `__Host-sosmiam-session` (HttpOnly, SameSite=Lax, Path=/, sans Domain, 90 jours au plus), strictement nécessaire : pas de consentement à demander. Pages connectées : `Cache-Control: private, no-store` et `noindex`.
- **Limites d'essais** (par adresse IP, en mémoire ; une IPv6 compte par son préfixe /56) : inscription 10 par heure, connexion 20 par 10 min, nouveau mot de passe 10 par 10 min, le reste (personne connectée) 600 par 10 min (une page de l'espace fait plusieurs appels, et une IP peut être partagée). **Attente par compte** (en mémoire, rien en base, aucune IP ; clé : l'e-mail tapé pour la connexion, le compte lui-même dans « Mon compte ») : rien avant le 5e échec de suite, puis 2 min avant l'essai suivant, et le double après chaque nouvel échec (4 min, 8 min…), 2 heures au plus : soit 21 essais au plus par 24 h (CNIL 2022-100, §43) ; remise à zéro après une connexion réussie. La connexion répond la même erreur pour un e-mail inconnu et un mauvais mot de passe (l'inscription, elle, dit que l'e-mail est déjà pris, tant qu'elle ne vérifie pas l'adresse par mail).
- **Mails** (8 octobre 2026) : envoyés par la boîte bonjour@sosmiam.fr (SMTP de l'hébergement mail, sans autre prestataire) ; bienvenue à la validation ambassadeur ; nouvelles du programme (mail groupé aux ambassadeurs, depuis le logiciel) ; alertes 30 jours avant le retrait du rôle et avant l'effacement du compte ; journal des envois (adresse, type et objet du mail, date, résultat ; le reste du contenu est effacé dès l'envoi) effacé après 90 jours, même si le compte est supprimé entre-temps.

## Engagements publics (FAQ)
- ~~On peut passer faire la fiche avec le lieu (Montpellier et Hérault).~~ Retiré le 8 octobre 2026, avec le lancement partout en France.
- On ne vend jamais les données des utilisateurs.
- Newsletter : on prévient du lancement, puis on continue d'envoyer des nouvelles tant que la personne ne se désinscrit pas (un simple mail suffit). Après 3 ans sans aucun message de sa part, on lui demande si elle veut continuer, sinon on efface.
- Contact : bonjour@sosmiam.fr.
- Cookies : rien de facultatif sans accord, choix gardé 6 mois.

## Outils internes
- **Logiciel ordinateur de gestion** (Tauri, Windows), commencé le 8 octobre 2026 : statistiques, newsletter (éditeur visuel, envoi), lieux, publications du fil, modération, comptes, ambassadeurs, BIG SOS, notifications, annonces Discord, maintenance. L'administration n'est pas sur le site.
- **Réservé à Hugo** (décidé le 8 octobre 2026) : clé secrète propre à chaque PC, chiffrée par un mot de passe, **et** code à 6 chiffres d'une application d'authentification. Le serveur ne connaît que les clés publiques des postes autorisés ; chaque demande est signée. Seul le chemin `/api-gestion` de l'API est joignable de l'extérieur.
- L'installateur est construit sur le serveur (comme TabulaDB), sans passer par GitHub ; depuis la 0.2.0, le logiciel **se met à jour tout seul** (installateurs signés, servis seulement à un poste connecté).
- **Sauvegardes** : copie chiffrée de la base chaque nuit sur le serveur, 30 gardées ; clé de restauration notée par Hugo dans son gestionnaire de mots de passe.
- **Demandes de lieux** : les lieux s'inscrivent sur le site (/inscrire-mon-lieu), la communauté propose sur Discord (/proposer-lieu) ; tout arrive dans le logiciel, où Hugo accepte (fiche créée en brouillon) ou refuse. Contacts effacés automatiquement 3 ans après.
- **Annonces Discord** écrites dans le logiciel, publiées par le bot (salon choisi avec `/config annonces`).
- Newsletter : le logiciel gère les inscrits, la rédaction et l'envoi. **Les mails partent de la boîte bonjour@sosmiam.fr chez l'hébergement mail (SMTP), sans prestataire d'envoi** (décidé le 8 octobre 2026) : file d'attente avec une limite d'envois par heure (`ENVOI_PAR_HEURE`, 100 par défaut), désinscriptions retirées juste avant chaque envoi, journal des envois effacé après 90 jours. Mêmes règles pour les mails des comptes (bienvenue, alertes avant retrait ou effacement, nouveau mot de passe).
- Les fiches des lieux et les publications du fil sont désormais dans la base, saisies dans le logiciel ; l'app les lira quand elle sera branchée à l'API.

## Statistiques de visite (décidé le 8 octobre 2026)
- Le site compte ses visites **côté serveur, sans cookie ni script** : pages vues, visites, visiteurs uniques par jour, semaine, mois et année, pages, provenances, appareils, navigateurs, systèmes, pays. Seulement des totaux, jamais d'adresse IP.
- Visiteurs uniques : empreinte brouillée par un secret propre à chaque période, qui ne sert qu'à une esquisse HyperLogLog ; secret et esquisse effacés à la fin de la période. Détail par jour effacé au bout de 25 mois (conditions d'exemption de consentement de la CNIL).
- Pas comptés : robots, préchargements, aperçu, signaux « Global Privacy Control » et « Do Not Track », et les personnes qui le refusent sur la page `/statistiques` (cookie de refus, 13 mois).
- Depuis le 8 octobre au soir, aussi : langue du navigateur, région et ville approximatives (si le réglage « en-têtes de localisation du visiteur » est actif dans Cloudflare), jours et heures, parcours des visites (arrivée, sortie, rebond, durée ; gardé en mémoire 30 min au plus), campagnes (`?utm_campaign=`), clics des boutons de /liens (via /liens/aller/…), temps de réponse, pages introuvables, passages de robots (par leur nom). Tout reste des totaux ; la politique de confidentialité le décrit.
- Plus tard, l'app enverra ses statistiques de la même façon (source « app »).
