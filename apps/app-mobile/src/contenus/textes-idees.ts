import type { StatutIdee } from "@sos-miam/commun/types/idees";

export type FiltreIdees = "top" | "nouvelles" | "prevues" | "faites";

export const NOMS_STATUTS_IDEE: Readonly<Record<StatutIdee, string>> = {
  "en-relecture": "En relecture",
  proposee: "Proposée",
  "a-l-etude": "À l'étude",
  prevue: "Prévue",
  faite: "C'est fait !",
};

export const FILTRES_IDEES: readonly { id: FiltreIdees; nom: string }[] = [
  { id: "top", nom: "Les plus miam" },
  { id: "nouvelles", nom: "Nouvelles" },
  { id: "prevues", nom: "À l'étude et prévues" },
  { id: "faites", nom: "C'est fait !" },
];

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

const votesEnMots = (n: number) => (n > 1 ? `${n} votes` : `${n} vote`);

export const TEXTES_IDEES = {
  titre: "Boîte à idées",
  retour: "Retour à la communauté",
  intro: "Une envie pour l'app ? Propose-la. Vote pour celles des autres. La Brigade lit tout et répond ici.",
  chargement: "On ouvre la boîte à idées…",
  chargementIdee: "On déplie l'idée…",
  ideeDuMois: (mois: string) => `Idée du mois · ${MOIS[Number(mois.slice(5, 7)) - 1] ?? ""}`,
  ideeDuMoisStatut: {
    "en-relecture": "",
    proposee: "Les Miamis l'ont adorée, la Brigade s'y penche.",
    "a-l-etude": "La Brigade l'étudie de près.",
    prevue: "La Brigade la construit en ce moment.",
    faite: "Elle est déjà dans l'app, file la tester !",
  } satisfies Record<StatutIdee, string>,
  ideeDuMoisMerci: (pseudo: string | null) =>
    `${pseudo ? `Merci @${pseudo}, badge « Bonne idée » à la clé ! ` : ""}On l'annonce dans le salon patch-notes du Discord.`,
  ouvrirIdeeDuMois: (titre: string) => `Idée du mois : ${titre}. Ouvrir l'idée`,
  proposer: "Proposer une idée",
  filtres: "Trier et filtrer les idées",
  aucune: "Rien par ici pour l'instant. La prochaine bonne idée, c'est peut-être la tienne !",
  aucuneTitre: "La boîte est vide",
  aucunePrevue: "Rien à l'étude pour l'instant : vote pour tes chouchoutes, la Brigade regarde les plus miam en premier.",
  aucuneFaite: "Pas encore d'idée sortie du four. La première arrive, promis !",
  aucuneFiltreTitre: "Rien dans ce tiroir",
  commentaires: (n: number) => (n > 1 ? `${n} commentaires` : n === 1 ? "1 commentaire" : "0 commentaire"),
  parToi: "par toi",
  auteurInconnu: "un Miami discret",
  brigadeARepondu: "La Brigade a répondu",
  ouvrirIdee: (titre: string) => `Ouvrir l'idée ${titre}`,
  miam: "Miam !",
  voter: (titre: string) => `Voter pour ${titre}`,
  retirerVote: (titre: string) => `Retirer mon vote pour ${titre}`,
  votesLus: votesEnMots,
  votants: (prenoms: string[], autres: number, moi: boolean) => {
    const noms = moi ? ["Toi", ...prenoms] : prenoms;
    if (noms.length === 0) return "Sois le premier Miami à voter !";
    const debut = noms.slice(0, 3).join(", ");
    return autres > 0 ? `${debut} et ${autres} autre${autres > 1 ? "s" : ""} Miami${autres > 1 ? "s" : ""}` : debut;
  },
  voteEnRelecture: "Les votes s'ouvrent dès que la Brigade l'a relue.",
  barre: "Boîte à idées",
  retourBoite: "Retour à la boîte à idées",
  ouEnEst: "Où en est l'idée",
  etape: (nom: string, atteinte: boolean, actuelle: boolean) => `${nom}${actuelle ? ", étape actuelle" : atteinte ? ", étape passée" : ", à venir"}`,
  enRelecture: "La Brigade relit ton idée avant qu'elle apparaisse aux autres Miamis. Un peu de patience !",
  enRelectureTitre: "En relecture",
  brigade: "La Brigade",
  reponseOfficielle: (quand: string) => `Réponse officielle · ${quand}`,
  plusAimes: "Les plus aimés",
  commentairePlaceholder: "Ajoute ton grain de sel…",
  commentaireLibelle: "Ajouter un commentaire",
  publierCommentaire: "Publier le commentaire",
  envoiEnCours: "Envoi en cours",
  repondre: "Répondre",
  repondreA: (pseudo: string) => `Répondre à @${pseudo}`,
  reponseA: (pseudo: string) => `Tu réponds à @${pseudo}`,
  annulerReponse: "Annuler la réponse",
  optionsCommentaire: (pseudo: string) => `Plus d'options sur le commentaire de @${pseudo}`,
  optionsIdee: "Plus d'options sur cette idée",
  signalerCommentaire: "Signaler ce commentaire",
  aimer: (n: number) => `J'aime, ${n}`,
  pasDeCommentaire: "Pas encore de commentaire. Lance la discussion !",
  commentairesFermes: "Les commentaires s'ouvrent dès que l'idée est publiée.",
  introuvableTitre: "Idée introuvable",
  introuvableTexte: "Elle a peut-être été fusionnée avec une autre, ou retirée par la Brigade.",
  feuilleTitre: "Ton idée pour l'app",
  enUnePhrase: "En une phrase",
  titrePlaceholder: "Ex. : un badge pour les fans de soupe",
  detail: "Dis-nous-en plus",
  detailMention: "facultatif",
  detailPlaceholder: "Pourquoi ça te ferait plaisir ?",
  note: "Une idée par proposition. Pas de nom de lieu ni de personne : la Brigade relit avant que l'idée apparaisse.",
  doublon: (titre: string, votes: number) => `Ça ressemble à « ${titre} » (${votesEnMots(votes)}). Vote plutôt pour celle-ci, ta voix comptera plus !`,
  doublonDejaVote: (titre: string) => `Ça ressemble à « ${titre} », et tu as déjà voté pour elle ! Va plutôt y ajouter ton grain de sel.`,
  voterDoublon: "Voter pour celle-ci",
  voirDoublon: "Voir cette idée",
  pasPareil: "Non, c'est différent",
  envoyer: "Envoyer",
  annuler: "Annuler",
  merci: "💡 Merci ! Ton idée part en relecture : la Brigade la lit avant qu'elle apparaisse.",
  voteDoublon: "🗳️ Vote ajouté : ta voix pèse plus sur une idée déjà lancée !",
  ideeRetiree: "🧹 Ton idée est retirée de la boîte.",
  commentaireSupprime: "🧹 Commentaire supprimé.",
  rates: {
    vote: "Ton « Miam ! » n'est pas parti : vérifie ton réseau et réessaie.",
    jaime: "Ton J'aime n'est pas parti : vérifie ton réseau et réessaie.",
    suppression: "Pas supprimé : le réseau a fait des siennes. Réessaie dans un instant.",
    retrait: "Pas retirée : le réseau a fait des siennes. Réessaie dans un instant.",
  },
  menu: {
    titreCommentaire: (pseudo: string) => `Commentaire de @${pseudo}`,
    titreIdee: "Cette idée",
    titreMonCommentaire: "Ton commentaire",
    titreMonIdee: "Ton idée",
    voirProfil: (pseudo: string) => `Voir le profil de @${pseudo}`,
    voirProfilDetail: "Ses listes, ses badges, et de quoi le bloquer si besoin",
    signaler: (pseudo: string) => `Signaler @${pseudo}`,
    signalerDetail: "Un mot qui blesse, une arnaque, de la pub cachée ? On regarde ça de près",
    sujetSignalement: (pseudo: string) => `le profil de @${pseudo}`,
    supprimerCommentaire: "Supprimer mon commentaire",
    supprimerCommentaireDetail: "Il disparaît pour tout le monde",
    supprimerCommentaireConfirmation: {
      titre: "Supprimer ton commentaire ?",
      detail: "Il disparaît pour tout le monde, J'aime compris. Les réponses des autres restent là.",
      confirmer: "Oui, supprimer",
      rester: "Non, je le garde",
    },
    retirerIdee: "Retirer mon idée",
    retirerIdeeDetail: "Elle quitte la boîte, votes et commentaires avec",
    retirerIdeeConfirmation: {
      titre: "Retirer ton idée ?",
      detail: "Elle quitte la boîte à idées pour de bon, avec ses votes et ses commentaires. Tu pourras toujours en proposer une autre.",
      confirmer: "Oui, la retirer",
      rester: "Non, je la garde",
    },
    annuler: "Annuler",
  },
  erreurs: {
    vide: "Écris ton idée en une phrase, la Brigade a hâte de la lire.",
    "trop-court": "Un peu court : dis-en un poil plus (8 caractères au moins).",
    "trop-long": "Trop long : garde les détails pour la case d'en dessous.",
    "mot-interdit": "Un mot ne passe pas chez nous. Tu reformules gentiment ?",
    reseau: "Le réseau a fait des siennes : ton idée n'est pas partie. Réessaie dans un instant.",
  },
  erreursDetail: {
    vide: "Quelques caractères de ce détail ne passent pas. Tu le réécris ?",
    "trop-court": "Quelques caractères de ce détail ne passent pas. Tu le réécris ?",
    "trop-long": "Quel roman ! 500 caractères au plus : la Brigade lit vite, mais pas tout.",
    "mot-interdit": "Un mot ne passe pas chez nous. Tu reformules gentiment ?",
  },
  erreursCommentaire: {
    vide: "Écris quelque chose avant d'envoyer, même un petit emoji 😉",
    "trop-long": "Ton commentaire est un peu long : coupe un peu, on t'écoute quand même.",
    "mot-interdit": "Oups, un mot ne passe pas chez nous. Tu reformules gentiment ?",
    reseau: "Le réseau a fait des siennes : ton commentaire n'est pas parti. Réessaie dans un instant.",
    "reponse-perdue": "Le commentaire auquel tu réponds n'est plus là. Ton message peut partir tout seul : touche la croix, puis renvoie.",
  },
} as const;

export const REFUS_LIMITATION_IDEES = {
  idee: "Ton compte est limité : proposer une idée attendra la fin de la limitation. Voter « Miam ! », tu peux toujours.",
  commentaire: "Ton compte est limité : commenter les idées attendra la fin de la limitation. Voter « Miam ! » et mettre des J'aime, tu peux toujours.",
} as const;
