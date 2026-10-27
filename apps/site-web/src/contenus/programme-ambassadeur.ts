// Page /programme (https://ambassadeur.sosmiam.fr/programme) : le programme Ambassadeurs expliqué avec des mots simples.
// Seules promesses permises (docs/decisions.md, « Espace ambassadeur ») : badges de palier, « Déniché par toi », points,
// et pour les fondateurs de chaque ville (docs/decisions.md, « Fondateurs par ville ») la carte numérotée (numérique, puis
// une vraie carte « plus tard », sans date), l'autocollant « Déniché par » à leur prénom, les badges, l'app en avant-première
// et une visio d'environ 30 minutes. Aucune ville citée comme lieu de lancement : tout ouvre en même temps, partout en France.
// L'app n'est pas encore sortie.
// Barème des points : le même que docs/decisions.md et packages/commun/src/regles/ambassadeurs.ts (à garder en phase).
import { accorder } from "../../../../packages/commun/src/fonctions/langue/accorder.ts";
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_PROGRAMME_AMBASSADEUR_ANGLAIS } from "~/contenus/anglais/programme-ambassadeur";

export const EMOJIS_GESTES_AMBASSADEUR = ["🔎", "✏️", "✅", "📣"];
export const EMOJIS_GAINS_AMBASSADEUR = ["🏅", "📍", "⭐"];
export const EMOJIS_CADEAUX_FONDATEURS = ["🔢", "🏷️", "🎖️", "📱"];
export const EMOJIS_AVANTAGES_CERTIFIE = ["✅", "📋", "🧰", "💬"];
export const PLACES_PAR_TAILLE_DE_VILLE = [10, 5, 3, 1, 1];
export const TOTAL_PLACES_FONDATEURS = 367;

export const TEXTES_PROGRAMME_AMBASSADEUR = {
  meta: {
    titre: "Programme Ambassadeurs",
    description: "Fais découvrir les petits lieux indépendants de ton coin, partout en France : dès 18 ans, gratuit, à ton rythme. Deviens ambassadeur SOS Miam.",
  },
  haut: {
    badge: "🎖️ Programme Ambassadeurs · dès 18 ans",
    titreDebut: "Deviens ",
    titreMarque: "ambassadeur",
    titreFin: " SOS Miam",
    chapo: "Tu connais un petit resto, un bar ou une pâtisserie qui mérite plus de monde ? Aide-nous à le faire connaître. C'est gratuit, ça se fait à ton rythme, et c'est partout en France.",
    note: "Dès 18 ans. L'équipe valide chaque inscription à la main.",
  },
  boutons: { creer: "Créer mon compte", connexion: "J'ai déjà un compte" },
  gestes: {
    titre: "C'est quoi, un ambassadeur ?",
    chapo: "Quelqu'un qui aime les bonnes petites adresses et qui aide SOS Miam à les faire découvrir. Concrètement, tu peux :",
    liste: [
      { titre: "Dénicher les pépites", texte: "Tu repères les petits lieux qui valent le détour, et tu nous les proposes depuis ton espace." },
      { titre: "Tenir les fiches à jour", texte: "Nouveaux horaires, nouveau plat, fermeture pour les vacances ? Tu nous aides à garder les bonnes infos." },
      { titre: "Valider et créer des sélections", texte: "Des listes de lieux testés et approuvés, comme « Les meilleurs cafés du quartier »." },
      {
        titre: "En parler autour de toi",
        texte: "À tes potes, à ta famille, sur tes réseaux : le kit média (des images et des textes prêts à poster) t'aide à bien le faire.",
      },
    ],
  },
  gains: {
    titre: "Ce que tu y gagnes",
    chapo: "Pas d'argent : c'est une aventure de passionnés. Mais il y a quand même de quoi être fier :",
    liste: [
      { titre: "Un badge à chaque niveau", texte: "Curieux, Dénicheur, Ambassadeur de quartier, Ambassadeur de ville : chaque niveau a le sien." },
      { titre: "« Déniché par toi »", texte: "Un lieu que tu as proposé rejoint SOS Miam ? Sa fiche affiche « Déniché par » et ton prénom. La classe." },
      { titre: "Des points", texte: "Ils te font grimper les niveaux. Le détail est juste en dessous." },
    ],
    finDebut: "Et si tu deviens l'un des ",
    finLien: "fondateurs de ta ville",
    finSuite: ", il y a encore plus.",
  },
  niveaux: {
    titre: "Les 4 niveaux",
    chapo: "Tout le monde commence Curieux. Ensuite, tes points te font monter.",
    titreBareme: "Ce qui rapporte des points",
    bareme: {
      visite: "Une visite payée dans un lieu vérifié ✓ (qui a un compte SOS Miam), validée dans l'app",
      visiteSos: "Une visite pendant un SOS, quand un lieu appelle à l'aide pour remplir sa salle",
      avisPhoto: "Un avis avec une photo",
      proposerLieu: "Un lieu que tu proposes et qui rejoint SOS Miam",
      corrigerFiche: "Une fiche de lieu corrigée",
      premierSauveteur: "La toute première rescousse d'un lieu qui vient d'arriver",
      rescousse: "Une rescousse : ton coup de pouce à un lieu vérifié (tu en as 3 par semaine)",
    },
    unitePoints: (points: number) => ` ${accorder(points, "fr", "point", "points")}`,
    defis: "Et chaque défi réussi rapporte ses propres points.",
    noteApp:
      "L'app n'est pas encore sortie : la plupart des points arriveront avec elle. En attendant, tout le monde démarre Curieux. Seule exception : un lieu que tu proposes depuis ton espace et qui rejoint SOS Miam te rapporte déjà ses 30 points.",
  },
  etapes: {
    titre: "Comment ça marche",
    chapo: "Trois étapes, et c'est parti.",
    liste: [
      {
        titre: "Tu crées ton compte",
        texte: "Avec ton e-mail et un mot de passe, dès 18 ans. Puis tu cliques sur le lien reçu par mail, pour confirmer que l'adresse est bien la tienne.",
      },
      { titre: "L'équipe valide", texte: "On lit chaque inscription nous-mêmes, sans robot. Ça peut prendre un peu de temps : ton espace te dit où ça en est." },
      { titre: "Ton espace s'ouvre", texte: "Des images et des textes à poster, des lieux à proposer, les missions et les messages de l'équipe, et ta candidature pour devenir fondateur." },
    ],
  },
  fondateurs: {
    titre: "Les fondateurs de ta ville",
    chapo: (total: number) =>
      `Dans chaque ville, des ambassadeurs lancent l'aventure avec nous : ${total} places partout en France, selon la taille de ta ville. Une fois ton compte validé, tu candidates depuis ton espace pour ta ville (ou ton département), tant qu'il y reste des places.`,
    ruban: "FONDATEUR",
    titreCadeaux: "Si tu es choisi, tu reçois :",
    cadeaux: [
      "Une carte numérotée « Fondateur n° 3 de Lyon · n° 147 en France » : à télécharger et à partager tout de suite, et une vraie carte envoyée plus tard.",
      "Ton prénom en vitrine, sur un autocollant « Déniché par ».",
      "Des badges de fondateur.",
      "L'app en avant-première, en lien direct avec l'équipe.",
    ],
    rencontre:
      "Pour faire connaissance : une visio d'environ 30 minutes avec les fondateurs de ta ville (de ta région si tu es fondateur de ton département), et un tête-à-tête si besoin.",
    titreVille: "Et dans ta ville ?",
    texteVille: "Tape le nom de ta commune ou ton code postal : on te dit combien il reste de places.",
    libelleVille: "Ta ville",
    boutonVille: "Voir les places",
  },
  tableau: {
    legende: "Places de fondateur selon la taille de ta ville (population INSEE)",
    colonneVille: "Ta ville",
    colonnePlaces: "Places",
    tailles: [
      { taille: "Plus de 500 000 habitants", villes: "Paris, Marseille, Lyon, Toulouse" },
      { taille: "De 200 000 à 500 000 habitants", villes: "Nice, Nantes, Montpellier, Strasbourg, Bordeaux, Lille, Rennes" },
      { taille: "De 100 000 à 200 000 habitants", villes: "31 villes, de Toulon à Nancy" },
      { taille: "De 50 000 à 100 000 habitants", villes: "93 villes, d'Avignon à Bondy" },
      { taille: "Moins de 50 000 habitants", villes: "1 place par département, partagée par ses communes, et 1 par collectivité d'outre-mer" },
    ],
    total: "En tout, partout en France",
  },
  certifie: {
    titre: "Ambassadeur certifié",
    chapo: "Tu aides déjà les lieux de ton coin ? Un titre à part, en plus de ton niveau, pour aller plus loin avec eux.",
    qui: "Un ambassadeur qui aime aider les lieux, un pro (resto, commerce…) ou une structure (asso, mairie, office de tourisme, école…). Une structure est représentée par une personne, avec son compte, dès 18 ans : « Marie, pour l'asso Les Gourmands du 11e ».",
    devenir: "Sur candidature depuis ton espace, une fois ton compte validé, ou sur invitation de l'équipe. C'est l'équipe qui choisit.",
    avantages: [
      "Le badge « Ambassadeur certifié ✓ » sur ton profil et sur les fiches des lieux que tu as aidés, avec ton prénom (et ta structure si tu en as une).",
      "Des missions chez les lieux partenaires, confiées par l'équipe.",
      "Un kit média pro pour présenter SOS Miam aux lieux : une affiche, un flyer, un mot de 30 secondes et un mail type.",
      "Bientôt, avec l'espace pro : le contact avec les lieux par la messagerie SOS Miam, sans adresse ni numéro montrés.",
    ],
    regle: "Jamais payé par un lieu, comme tous les ambassadeurs : si un lieu t'offre quelque chose, tu l'écris « Collaboration commerciale ».",
    ruban: "CERTIFIÉ",
    titreQui: "C'est qui ?",
    titreDevenir: "Comment on le devient ?",
    titreAvantages: "Ce que tu as de plus",
    titreRegle: "La règle d'or : ",
  },
  questions: {
    titre: "Tes questions",
    chapo: "Tu te poses sûrement une de ces questions.",
    liste: {
      "question-paye": {
        question: "C'est payé ?",
        reponse: [
          "Non. C'est une aventure de passionnés : un ambassadeur n'est payé ni par SOS Miam, ni par les lieux qu'il met en avant. Et si un lieu t'offre quelque chose, tu l'écris clairement dans ton post : « Collaboration commerciale ».",
        ],
      },
      "question-temps": {
        question: "Ça prend combien de temps ?",
        reponse: ["Le temps que tu veux. Ni horaires, ni objectifs : tu avances à ton rythme."],
      },
      "question-influenceur": {
        question: "Il faut être influenceur ?",
        reponse: ["Non ! Pas besoin d'avoir des milliers d'abonnés. Il suffit d'aimer les bonnes adresses et d'avoir envie de les partager."],
      },
      "question-ou": {
        question: "C'est où ?",
        reponse: ["Partout en France. Là où tu vis, il y a forcément une pépite à faire connaître."],
      },
      "question-ville-fondateur": {
        question: "Je candidate pour quelle ville ?",
        reponse: [
          "Pour la ville où tu vis. Si ta commune a moins de 50 000 habitants, tu candidates pour ton département (ou ta collectivité d'outre-mer). Ensuite, c'est l'équipe qui choisit.",
        ],
      },
      "question-ville-complete": {
        question: "Et si ma ville est déjà au complet ?",
        reponse: [
          "La candidature s'y ferme toute seule, et rouvre dès qu'une place se libère. Il n'y a pas de liste d'attente : jette un œil de temps en temps depuis ton espace.",
        ],
      },
      "question-demenagement": {
        question: "Et si je déménage ?",
        reponse: [
          "Tu gardes ton titre de fondateur en souvenir, mais ta place dans ton ancienne ville se libère pour quelqu'un d'autre. Ton numéro, lui, n'est jamais redonné : il reste le tien.",
        ],
      },
      "question-pas-fondateur": {
        question: "Et si je ne suis pas retenu comme fondateur ?",
        reponse: ["Aucun souci : tu restes ambassadeur, et tu grimpes les niveaux comme tout le monde. Et tu peux recandidater quand tu veux."],
      },
      "question-app": {
        question: "L'app est déjà sortie ?",
        reponse: ["Pas encore, elle est en préparation. La plupart des points arriveront avec elle : en attendant, tout le monde démarre Curieux."],
      },
      "question-arreter": {
        question: "Et si je veux arrêter ?",
        reponse: ["Tu supprimes ton compte quand tu veux, depuis « Mon compte » dans ton espace. Sans rancune !"],
      },
    },
  },
  appel: {
    titre: "Prêt à faire briller ton coin ?",
    chapo: "Crée ton compte : l'équipe le valide, puis ton espace s'ouvre.",
    note: "Dès 18 ans · gratuit · ni horaires ni objectifs",
  },
};

export const TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_PROGRAMME_AMBASSADEUR>> = {
  fr: TEXTES_PROGRAMME_AMBASSADEUR,
  en: TEXTES_PROGRAMME_AMBASSADEUR_ANGLAIS,
};
