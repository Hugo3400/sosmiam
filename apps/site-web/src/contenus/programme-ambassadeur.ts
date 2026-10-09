// Page /programme (https://ambassadeur.sosmiam.fr/programme) : le programme Ambassadeurs expliqué avec des mots simples.
// Seules promesses permises (docs/decisions.md, « Espace ambassadeur ») : badges de palier, « Déniché par toi », points,
// et pour les fondateurs de chaque ville (docs/decisions.md, « Fondateurs par ville ») la carte numérotée (numérique, puis
// une vraie carte « plus tard », sans date), l'autocollant « Déniché par » à leur prénom, les badges, l'app en avant-première
// et une visio d'environ 30 minutes. Aucune ville citée comme lieu de lancement : tout ouvre en même temps, partout en France.
// L'app n'est pas encore sortie.
// Barème des points : le même que docs/decisions.md et packages/commun/src/regles/ambassadeurs.ts (à garder en phase).
import type { QuestionFaq } from "~/contenus/faq/type-faq";

export const descriptionProgramme =
  "Fais découvrir les petits lieux indépendants de ton coin, partout en France : dès 18 ans, gratuit, à ton rythme. Deviens ambassadeur SOS Miam.";

/** « C'est quoi ? » : ce que fait un ambassadeur (les envies de la candidature « fondateur » reprennent ces 4 gestes). */
export const gestesAmbassadeur = [
  {
    emoji: "🔎",
    titre: "Dénicher les pépites",
    texte: "Tu repères les petits lieux qui valent le détour, et tu nous les proposes depuis ton espace.",
  },
  {
    emoji: "✏️",
    titre: "Tenir les fiches à jour",
    texte: "Nouveaux horaires, nouveau plat, fermeture pour les vacances ? Tu nous aides à garder les bonnes infos.",
  },
  {
    emoji: "✅",
    titre: "Valider et créer des sélections",
    texte: "Des listes de lieux testés et approuvés, comme « Les meilleurs cafés du quartier ».",
  },
  {
    emoji: "📣",
    titre: "En parler autour de toi",
    texte: "À tes potes, à ta famille, sur tes réseaux : le kit média (des images et des textes prêts à poster) t'aide à bien le faire.",
  },
];

/** Ce que tu y gagnes : rien d'autre que ce qui est décidé. */
export const gainsAmbassadeur = [
  {
    emoji: "🏅",
    titre: "Un badge à chaque niveau",
    texte: "Curieux, Dénicheur, Ambassadeur de quartier, Ambassadeur de ville : chaque niveau a le sien.",
  },
  {
    emoji: "📍",
    titre: "« Déniché par toi »",
    texte: "Un lieu que tu as proposé rejoint SOS Miam ? Sa fiche affiche « Déniché par » et ton prénom. La classe.",
  },
  {
    emoji: "⭐",
    titre: "Des points",
    texte: "Ils te font grimper les niveaux. Le détail est juste en dessous.",
  },
];

/** Barème des points (décidé le 8 octobre 2026). */
export const baremePoints = [
  { action: "Une visite payée dans un lieu vérifié ✓ (qui a un compte SOS Miam), validée dans l'app", points: 15 },
  { action: "Une visite pendant un SOS, quand un lieu appelle à l'aide pour remplir sa salle", points: 25 },
  { action: "Un avis avec une photo", points: 10 },
  { action: "Un lieu que tu proposes et qui rejoint SOS Miam", points: 30 },
  { action: "Une fiche de lieu corrigée", points: 5 },
  { action: "La toute première rescousse d'un lieu qui vient d'arriver", points: 20 },
  { action: "Une rescousse : ton coup de pouce à un lieu vérifié (tu en as 3 par semaine)", points: 2 },
];

/** Encadré sous le barème : l'app arrive plus tard (les +30 d'un lieu proposé depuis l'espace sont déjà comptés). */
export const noteAppProgramme =
  "L'app n'est pas encore sortie : la plupart des points arriveront avec elle. En attendant, tout le monde démarre Curieux. Seule exception : un lieu que tu proposes depuis ton espace et qui rejoint SOS Miam te rapporte déjà ses 30 points.";

/** Comment ça marche : du compte à l'espace. */
export const etapesProgramme = [
  {
    titre: "Tu crées ton compte",
    texte: "Avec ton e-mail et un mot de passe, dès 18 ans. Puis tu cliques sur le lien reçu par mail, pour confirmer que l'adresse est bien la tienne.",
  },
  { titre: "L'équipe valide", texte: "On lit chaque inscription nous-mêmes, sans robot. Ça peut prendre un peu de temps : ton espace te dit où ça en est." },
  { titre: "Ton espace s'ouvre", texte: "Des images et des textes à poster, des lieux à proposer, les missions et les messages de l'équipe, et ta candidature pour devenir fondateur." },
];

/** Ce que reçoivent les fondateurs, dans chaque ville (la vraie carte : « plus tard », ni date ni coût décidés). */
export const cadeauxFondateurs = [
  {
    emoji: "🔢",
    texte: "Une carte numérotée « Fondateur n°\u00a03 de Lyon · n°\u00a0147 en France » : à télécharger et à partager tout de suite, et une vraie carte envoyée plus tard.",
  },
  { emoji: "🏷️", texte: "Ton prénom en vitrine, sur un autocollant « Déniché par »." },
  { emoji: "🎖️", texte: "Des badges de fondateur." },
  { emoji: "📱", texte: "L'app en avant-première, en lien direct avec l'équipe." },
];

/** Pour faire connaissance (remplace « 20 minutes, autour d'un café ou en visio »). */
export const rencontreFondateurs =
  "Pour faire connaissance : une visio d'environ 30 minutes avec les fondateurs de ta ville (de ta région si tu es fondateur de ton département), et un tête-à-tête si besoin.";

/**
 * Places de fondateur selon la population de la ville (population municipale INSEE). Les communes de moins de 50 000
 * habitants partagent 1 place par département, et chaque collectivité d'outre-mer a la sienne : 367 places en tout.
 */
export const placesFondateurs = [
  { taille: "Plus de 500\u00a0000 habitants", places: 10, villes: "Paris, Marseille, Lyon, Toulouse" },
  { taille: "De 200\u00a0000 à 500\u00a0000 habitants", places: 5, villes: "Nice, Nantes, Montpellier, Strasbourg, Bordeaux, Lille, Rennes" },
  { taille: "De 100\u00a0000 à 200\u00a0000 habitants", places: 3, villes: "31 villes, de Toulon à Nancy" },
  { taille: "De 50\u00a0000 à 100\u00a0000 habitants", places: 1, villes: "93 villes, d'Avignon à Bondy" },
  { taille: "Moins de 50\u00a0000 habitants", places: 1, villes: "1 place par département, partagée par ses communes, et 1 par collectivité d'outre-mer" },
];

/** Nombre total de places de fondateur en France (docs/decisions.md, « Fondateurs par ville »). */
export const totalPlacesFondateurs = 367;

/** Questions de la page : réponses courtes, sans rien promettre de plus. */
export const questionsProgramme: QuestionFaq[] = [
  {
    id: "question-paye",
    question: "C'est payé ?",
    reponse: [
      "Non. C'est une aventure de passionnés : un ambassadeur n'est payé ni par SOS Miam, ni par les lieux qu'il met en avant. Et si un lieu t'offre quelque chose, tu l'écris clairement dans ton post : « Collaboration commerciale ».",
    ],
  },
  {
    id: "question-temps",
    question: "Ça prend combien de temps ?",
    reponse: ["Le temps que tu veux. Ni horaires, ni objectifs : tu avances à ton rythme."],
  },
  {
    id: "question-influenceur",
    question: "Il faut être influenceur ?",
    reponse: ["Non ! Pas besoin d'avoir des milliers d'abonnés. Il suffit d'aimer les bonnes adresses et d'avoir envie de les partager."],
  },
  {
    id: "question-ou",
    question: "C'est où ?",
    reponse: ["Partout en France. Là où tu vis, il y a forcément une pépite à faire connaître."],
  },
  {
    id: "question-ville-fondateur",
    question: "Je candidate pour quelle ville ?",
    reponse: [
      "Pour la ville où tu vis. Si ta commune a moins de 50\u00a0000 habitants, tu candidates pour ton département (ou ta collectivité d'outre-mer). Ensuite, c'est l'équipe qui choisit.",
    ],
  },
  {
    id: "question-ville-complete",
    question: "Et si ma ville est déjà au complet ?",
    reponse: [
      "La candidature s'y ferme toute seule, et rouvre dès qu'une place se libère. Il n'y a pas de liste d'attente : jette un œil de temps en temps depuis ton espace.",
    ],
  },
  {
    id: "question-demenagement",
    question: "Et si je déménage ?",
    reponse: [
      "Tu gardes ton titre de fondateur en souvenir, mais ta place dans ton ancienne ville se libère pour quelqu'un d'autre. Ton numéro, lui, n'est jamais redonné : il reste le tien.",
    ],
  },
  {
    id: "question-pas-fondateur",
    question: "Et si je ne suis pas retenu comme fondateur ?",
    reponse: ["Aucun souci : tu restes ambassadeur, et tu grimpes les niveaux comme tout le monde."],
  },
  {
    id: "question-app",
    question: "L'app est déjà sortie ?",
    reponse: ["Pas encore, elle est en préparation. La plupart des points arriveront avec elle : en attendant, tout le monde démarre Curieux."],
  },
  {
    id: "question-arreter",
    question: "Et si je veux arrêter ?",
    reponse: ["Tu supprimes ton compte quand tu veux, depuis « Mon compte » dans ton espace. Sans rancune !"],
  },
];
