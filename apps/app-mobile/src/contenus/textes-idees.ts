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

export const TEXTES_IDEES = {
  titre: "Boîte à idées",
  retour: "Retour à la communauté",
  intro: "Une envie pour l'app ? Propose-la. Vote pour celles des autres. La Brigade lit tout et répond ici.",
  ideeDuMois: (mois: string) => `Idée du mois · ${MOIS[Number(mois.slice(5, 7)) - 1] ?? ""}`,
  ideeDuMoisMerci: (pseudo: string | null) =>
    `${pseudo ? `Merci @${pseudo}, badge « Bonne idée » à la clé ! ` : ""}On l'annonce dans le salon patch-notes du Discord.`,
  proposer: "Proposer une idée",
  filtres: "Trier et filtrer les idées",
  aucune: "Rien par ici pour l'instant. La prochaine bonne idée, c'est peut-être la tienne !",
  commentaires: (n: number) => (n > 1 ? `${n} commentaires` : n === 1 ? "1 commentaire" : "0 commentaire"),
  parToi: "par toi",
  brigadeARepondu: "La Brigade a répondu",
  miam: "Miam !",
  voter: (titre: string) => `Voter pour ${titre}`,
  retirerVote: (titre: string) => `Retirer mon vote pour ${titre}`,
  votesLus: (n: number) => (n > 1 ? `${n} votes` : `${n} vote`),
  votants: (prenoms: string[], autres: number, moi: boolean) => {
    const noms = moi ? ["Toi", ...prenoms] : prenoms;
    if (noms.length === 0) return "Sois le premier Miami à voter !";
    const debut = noms.slice(0, 3).join(", ");
    return autres > 0 ? `${debut} et ${autres} autre${autres > 1 ? "s" : ""} Miami${autres > 1 ? "s" : ""}` : debut;
  },
  barre: "Boîte à idées",
  retourBoite: "Retour à la boîte à idées",
  ouEnEst: "Où en est l'idée",
  enRelecture: "La Brigade relit ton idée avant qu'elle apparaisse aux autres Miamis. Un peu de patience !",
  brigade: "La Brigade",
  reponseOfficielle: (quand: string) => `Réponse officielle · ${quand}`,
  plusAimes: "Les plus aimés",
  commentairePlaceholder: "Ajoute ton grain de sel…",
  commentaireLibelle: "Ajouter un commentaire",
  publierCommentaire: "Publier le commentaire",
  repondre: "Répondre",
  reponseA: (pseudo: string) => `Tu réponds à @${pseudo}`,
  annulerReponse: "Annuler la réponse",
  optionsCommentaire: "Plus d'options : signaler ce commentaire",
  signalerCommentaire: "Signaler ce commentaire",
  aimer: (n: number) => `J'aime, ${n}`,
  pasDeCommentaire: "Pas encore de commentaire. Lance la discussion !",
  introuvableTitre: "Idée introuvable",
  introuvableTexte: "Elle a peut-être été fusionnée avec une autre, ou retirée par la Brigade.",
  feuilleTitre: "Ton idée pour l'app",
  enUnePhrase: "En une phrase",
  titrePlaceholder: "Ex. : un badge pour les fans de soupe",
  detail: "Dis-nous-en plus",
  detailMention: "facultatif",
  detailPlaceholder: "Pourquoi ça te ferait plaisir ?",
  note: "Une idée par proposition. Pas de nom de lieu ni de personne : la Brigade relit avant que l'idée apparaisse.",
  doublon: (titre: string, votes: number) => `Ça ressemble à « ${titre} » (${votes} votes). Vote plutôt pour celle-ci, ta voix comptera plus !`,
  voterDoublon: "Voter pour celle-ci",
  pasPareil: "Non, c'est différent",
  envoyer: "Envoyer",
  annuler: "Annuler",
  merci: "💡 Merci ! Ton idée part en relecture : la Brigade la lit avant qu'elle apparaisse.",
  voteDoublon: "🗳️ Vote ajouté : ta voix compte double sur une idée déjà lancée !",
  erreurs: {
    vide: "Écris ton idée en une phrase, la Brigade a hâte de la lire.",
    "trop-court": "Un peu court : dis-en un poil plus (8 caractères au moins).",
    "trop-long": "Trop long : garde les détails pour la case d'en dessous.",
    "mot-interdit": "Un mot ne passe pas chez nous. Tu reformules gentiment ?",
    reseau: "Le réseau a fait des siennes : ton idée n'est pas partie. Réessaie dans un instant.",
  },
  erreursCommentaire: {
    vide: "Écris quelque chose avant d'envoyer, même un petit emoji 😉",
    "trop-long": "Ton commentaire est un peu long : coupe un peu, on t'écoute quand même.",
    "mot-interdit": "Oups, un mot ne passe pas chez nous. Tu reformules gentiment ?",
    reseau: "Le réseau a fait des siennes : ton commentaire n'est pas parti. Réessaie dans un instant.",
  },
} as const;

export const REFUS_LIMITATION_IDEES = {
  idee: "Ton compte est limité : proposer une idée attendra la fin de la limitation. Voter « Miam ! », tu peux toujours.",
} as const;
