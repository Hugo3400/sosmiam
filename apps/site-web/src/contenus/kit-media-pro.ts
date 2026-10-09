// Kit média pro, réservé aux ambassadeurs certifiés (docs/decisions.md, « Ambassadeur certifié ») : de quoi présenter
// SOS Miam aux lieux. Une affiche A4, un flyer A6 recto verso, un mot de 30 secondes à dire au comptoir et un mail type.
// Les fichiers sont dans apps/site-web/kit-media-pro/ (pas dans public/, servi à tout le monde). Pour les refaire :
// npm run site:kit-media-pro (scripts/generer-kit-media-pro.sh), qui capture chaque visuel sur la route de rendu du
// serveur de développement (/rendu-kit-pro/<id>). Seulement ce qui existe vraiment : tout est gratuit pour les lieux,
// sans abonnement ni commission, et la pub est toujours signalée. Aucun chiffre, aucune promesse de résultat.

/** Dossier des fichiers, depuis le dossier du site (apps/site-web), d'où le serveur est toujours lancé */
export const DOSSIER_KIT_MEDIA_PRO = "kit-media-pro";

/** Le zip de tout le kit pro (avec a-lire.txt : les textes, les règles et l'usage), refait par le script */
export const NOM_ZIP_KIT_MEDIA_PRO = "kit-media-pro-sos-miam.zip";

/** Là où mènent le QR code, le flyer et le mail : la page « J'inscris mon lieu » */
export const LIEN_INSCRIRE_LIEU = "https://sosmiam.fr/inscrire-mon-lieu";

/** Le même lien, sans « https:// », pour l'écrire sous le QR */
export const LIEN_INSCRIRE_LIEU_COURT = "sosmiam.fr/inscrire-mon-lieu";

export const EMAIL_CONTACT_KIT_PRO = "bonjour@sosmiam.fr";

export type IdVisuelKitPro = "affiche-a4" | "flyer-a6-recto" | "flyer-a6-verso" | "flyer-a6" | "flyer-a6-planche-a4";

/** Un format d'impression : sa taille en millimètres (pour le PDF) et en pixels à 300 dpi (pour le PNG) */
export type FormatImpression = { nom: "A4" | "A6"; largeurMm: number; hauteurMm: number; largeur: number; hauteur: number };

export const formatsImpression = {
  A4: { nom: "A4", largeurMm: 210, hauteurMm: 297, largeur: 2480, hauteur: 3508 },
  A6: { nom: "A6", largeurMm: 105, hauteurMm: 148, largeur: 1240, hauteur: 1748 },
} as const satisfies Record<string, FormatImpression>;

export type VisuelKitPro = {
  /** Adresse de rendu : /rendu-kit-pro/<id> (avec ?impression=1 : la version PDF, à la taille du papier) */
  id: IdVisuelKitPro;
  titre: string;
  /** Ce que montre le fichier (texte de remplacement de son aperçu) */
  description: string;
  /** Format d'une page du PDF */
  page: FormatImpression;
  /** Nombre de pages du PDF */
  pages: number;
  /** Produit en PNG (une seule page, 300 dpi) */
  png: boolean;
  /** Produit en PDF, à imprimer */
  pdf: boolean;
};

/** Les visuels du kit pro, dans l'ordre de la page. Le PNG et le PDF d'un visuel portent son nom. */
export const visuelsKitMediaPro: VisuelKitPro[] = [
  {
    id: "affiche-a4", titre: "Affiche A4 « Ton lieu sur SOS Miam, c'est gratuit »", page: formatsImpression.A4, pages: 1, png: true, pdf: true,
    description: "Affiche jaune : le logo, la mascotte, le titre « Ton lieu sur SOS Miam, c'est gratuit », quatre atouts pour un lieu et un grand QR code vers « J'inscris mon lieu ».",
  },
  {
    id: "flyer-a6-recto", titre: "Flyer A6, recto", page: formatsImpression.A6, pages: 1, png: true, pdf: false,
    description: "Recto crème : « Ton lieu mérite plus de monde » et ce que SOS Miam apporte à un lieu (fiche, avis vérifiés, SOS « place ce soir », statistiques, gratuit).",
  },
  {
    id: "flyer-a6-verso", titre: "Flyer A6, verso", page: formatsImpression.A6, pages: 1, png: true, pdf: false,
    description: "Verso jaune : « Inscris ton lieu en 3 étapes », gratuit et sans abonnement, avec le QR code vers « J'inscris mon lieu ».",
  },
  {
    id: "flyer-a6", titre: "Flyer A6 recto verso", page: formatsImpression.A6, pages: 2, png: false, pdf: true,
    description: "Le flyer au format A6 : page 1 le recto, page 2 le verso. Pour un imprimeur ou du papier A6.",
  },
  {
    id: "flyer-a6-planche-a4", titre: "Flyer A6, planche de 4 sur A4", page: formatsImpression.A4, pages: 2, png: false, pdf: true,
    description: "Quatre flyers sur une feuille A4, avec des traits de coupe : page 1 les rectos, page 2 les versos. À imprimer chez toi en recto verso, puis à couper en quatre.",
  },
];

export type FichierKitPro = {
  /** Nom du fichier, qui sera aussi son adresse de téléchargement */
  nom: string;
  /** Chemin dans apps/site-web/kit-media-pro/ */
  chemin: string;
  titre: string;
  format: "PNG" | "PDF" | "ZIP";
  /** « 2480 × 3508 px » pour un PNG, « A4, 1 page » pour un PDF */
  taille: string | null;
  /** Visuel dessiné par la route de rendu (aucun pour le zip) */
  visuel: IdVisuelKitPro | null;
};

const nbsp = " ";

/** Tous les fichiers du kit pro, un par ligne : c'est la liste blanche de leur future route de téléchargement */
export const fichiersKitMediaPro: FichierKitPro[] = [
  ...visuelsKitMediaPro.flatMap((v): FichierKitPro[] => [
    ...(v.png ? [{ nom: `${v.id}.png`, chemin: `${v.id}.png`, titre: v.titre, format: "PNG" as const, taille: `${v.page.largeur}${nbsp}×${nbsp}${v.page.hauteur}${nbsp}px`, visuel: v.id }] : []),
    ...(v.pdf ? [{ nom: `${v.id}.pdf`, chemin: `${v.id}.pdf`, titre: v.titre, format: "PDF" as const, taille: `${v.page.nom}, ${v.pages}${nbsp}page${v.pages > 1 ? "s" : ""}`, visuel: v.id }] : []),
  ]),
  { nom: NOM_ZIP_KIT_MEDIA_PRO, chemin: NOM_ZIP_KIT_MEDIA_PRO, titre: "Tout le kit média pro", format: "ZIP", taille: null, visuel: null },
];

/** Ce que SOS Miam apporte à un lieu (contenus/pros.ts et faq/pros.ts) : le recto du flyer et l'affiche */
export const atoutsLieu: { titre: string; texte: string }[] = [
  { titre: "Ta fiche", texte: "Tes photos, tes horaires, ton plat signature : ton lieu en un coup d'œil." },
  { titre: "Des avis vérifiés", texte: "Seuls les clients qui ont vraiment payé chez toi peuvent noter." },
  { titre: "Le SOS « place ce soir »", texte: "De la place ce soir ? Les gens du coin qui ont activé les alertes sont prévenus." },
  { titre: "Tes statistiques", texte: "Vues, rescousses, visites validées : tu vois ce qui marche." },
  { titre: "Gratuit, vraiment", texte: "Pas d'abonnement, pas de commission, pas d'engagement." },
];

/** L'affiche A4, à poser au comptoir, en vitrine ou à laisser au lieu */
export const texteAffiche = {
  titre: "Ton lieu sur SOS Miam,",
  titreFin: "c'est gratuit.",
  sousTitre: "Resto, pâtisserie, bar ou sortie indépendante : fais découvrir ton lieu aux gens du coin.",
  /** Les quatre premiers atouts ; le cinquième (gratuit) est déjà dans le titre et le bandeau */
  atouts: atoutsLieu.slice(0, 4),
  bandeau: "Sans abonnement, sans commission, sans engagement.",
  appelQr: "Scanne pour inscrire ton lieu",
  piedDePage: "SOS Miam vit de la publicité, toujours signalée, sans effet sur le classement.",
};

/** Le recto du flyer : ce que SOS Miam apporte à un lieu */
export const texteFlyerRecto = {
  titre: "Ton lieu mérite",
  titreFin: "plus de monde.",
  intro: "SOS Miam fait découvrir les restos, pâtisseries, bars et sorties indépendants.",
  atouts: atoutsLieu,
};

/** Le verso du flyer : comment s'inscrire */
export const texteFlyerVerso = {
  titre: "Inscris ton lieu",
  titreFin: "en 3 étapes.",
  etapes: [
    "Scanne le QR code, ou va sur sosmiam.fr/inscrire-mon-lieu.",
    "Présente ton lieu en quelques mots : son nom, sa ville, ce qui le rend unique.",
    "On lit ta demande, on crée ta fiche et on t'écrit.",
  ],
  gratuit: "Gratuit, sans abonnement, sans commission. Tu arrêtes quand tu veux.",
  deLaPartDe: "De la part de :",
  question: `Une question ? ${EMAIL_CONTACT_KIT_PRO}`,
};

/** Le mot de 30 secondes à dire au comptoir (environ 80 mots, à dire tranquillement) */
export const motComptoir = {
  titre: "Le mot de 30 secondes, au comptoir",
  texte: `Salut ! Moi c'est [ton prénom], je suis ambassadeur SOS Miam. Je te prends 30 secondes, pas une de plus, promis.
SOS Miam, c'est fait pour aider les gens du coin à découvrir les lieux indépendants comme le tien. Tu peux y avoir ta fiche, des avis vérifiés laissés seulement par de vrais clients, et lancer un SOS « place ce soir » quand ta salle est calme.
Et c'est gratuit : pas d'abonnement, pas de commission.
Je te laisse ce flyer : le QR code mène à l'inscription, ça prend quelques minutes. Bon service !`,
  conseils: [
    "Passe à un moment calme : jamais en plein coup de feu.",
    "Demande d'abord à parler à la personne qui s'occupe du lieu, et souris : tu viens rendre service, pas vendre quelque chose.",
    "Tu peux vouvoyer si c'est plus naturel avec la personne en face.",
    "Un « non merci » ? Dis merci, laisse le flyer si on le veut bien, et pars avec le sourire : la porte reste ouverte.",
    "Une question à laquelle tu ne sais pas répondre ? Dis-le simplement et donne bonjour@sosmiam.fr.",
  ],
};

/** Le mail type, à envoyer à l'adresse publique d'un lieu (celle de son site, de sa vitrine ou de ses réseaux) */
export const mailType = {
  titre: "Le mail type",
  objet: "Ton lieu sur SOS Miam, c'est gratuit",
  texte: `Bonjour [le prénom de la personne, ou le nom du lieu],

Je m'appelle [ton prénom] et je suis ambassadeur certifié SOS Miam [si tu viens d'une structure : pour [le nom de ta structure]]. J'aime beaucoup [le nom du lieu], et je trouve qu'il mérite d'être connu de plus de monde.

SOS Miam fait découvrir les restos, pâtisseries, bars et sorties indépendants. Pour ton lieu, c'est :
- une fiche avec tes photos, tes horaires et ton plat signature ;
- des avis vérifiés : seuls les clients qui ont vraiment payé chez toi peuvent noter ;
- le SOS « place ce soir » : quand tu as de la place, les gens du coin qui ont activé les alertes sont prévenus ;
- tes statistiques : vues, rescousses, visites validées.

Tout est gratuit : pas d'abonnement, pas de commission, pas d'engagement. SOS Miam vit de la publicité, toujours signalée et sans effet sur le classement.

Pour inscrire ton lieu : ${LIEN_INSCRIRE_LIEU}
L'équipe lit chaque demande, crée la fiche et te répond par mail.

Une question ? Réponds-moi, ou écris à l'équipe : ${EMAIL_CONTACT_KIT_PRO}

Belle journée,
[ton prénom]
Ambassadeur certifié SOS Miam`,
  conseils: [
    "Remplace tout ce qui est entre crochets, et dis en une phrase ce que tu aimes dans ce lieu : c'est ce qui donne envie de lire la suite.",
    "Écris seulement à l'adresse que le lieu affiche lui-même (son site, sa vitrine, ses réseaux), une seule fois : pas de relance en boucle.",
  ],
};

/** Les règles du kit pro. Elles accompagnent aussi le zip (a-lire.txt). */
export const reglesKitMediaPro = {
  peux: [
    "Imprimer l'affiche et les flyers autant que tu veux, et les laisser aux lieux qui le veulent bien.",
    "Dire le mot du comptoir et envoyer le mail type, avec tes mots à toi si tu préfères.",
    "Dire que tu es ambassadeur certifié SOS Miam, et pour quelle structure si tu en représentes une.",
  ],
  peuxPas: [
    "Te faire payer par un lieu, de quelque façon que ce soit. Si un lieu t'offre quelque chose (un repas, un verre…) et que tu en parles, écris clairement « Collaboration commerciale ».",
    "Promettre quoi que ce soit au nom de SOS Miam : du monde, une place dans le classement, une date, une mise en avant.",
    "Demander quoi que ce soit à un lieu en échange de son inscription : elle est gratuite et le reste.",
    "Insister : un lieu qui dit non a le droit de dire non.",
    "Parler d'un lieu en difficulté pour faire pitié : on en parle avec dignité.",
    "Modifier l'affiche, le flyer, le logo ou la mascotte, ou t'en servir pour autre chose que présenter SOS Miam.",
  ],
};

/** « Comment t'en servir », en haut de a-lire.txt */
export const usageKitMediaPro = [
  "Imprime l'affiche (affiche-a4.pdf) et quelques flyers (flyer-a6-planche-a4.pdf : 4 flyers par feuille A4, en recto verso, à couper en suivant les traits).",
  "Passe dans un lieu à un moment calme, dis le mot du comptoir et laisse un flyer, ou l'affiche si le lieu veut l'afficher.",
  "Pas le temps de passer ? Envoie le mail type.",
  "Pour un imprimeur : flyer-a6.pdf (A6, recto en page 1, verso en page 2). Les PNG servent à partager l'affiche et le flyer à l'écran.",
];
