import type { RubriqueActus } from "@sos-miam/commun/regles/actus";
import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ACTUS_ANGLAIS } from "~/contenus/anglais/textes-actus";

const RUBRIQUES: Record<RubriqueActus, string> = {
  portrait: "Portrait d'un lieu",
  "top-quartier": "Le top 5 du quartier",
  "bon-plan": "Bon plan du moment",
  "recit-sortie": "Récit de sortie",
};

const FILTRES: Record<RubriqueActus, string> = {
  portrait: "Portraits",
  "top-quartier": "Tops",
  "bon-plan": "Bons plans",
  "recit-sortie": "Récits",
};

export const TEXTES_ACTUS = {
  onglet: "Actus",
  rubriques: RUBRIQUES,
  filtres: { ...FILTRES, tout: "Tout", lu: "Rubriques des Actus" },
  aLaUne: "À la une",
  ambassadeur: "Ambassadeur·rice",
  collaboration: "Collaboration commerciale",
  minutes: (n: number) => `${n} min`,
  minutesLecture: (n: number) => `${n} min de lecture`,
  lieux: (n: number) => `${n} lieu${n > 1 ? "x" : ""}`,
  jaime: (n: number) => `${n} J'aime`,
  vide: "Pas encore d'article par ici. Les ambassadeurs affûtent leurs plumes ✍️",
  videRubrique: "Rien dans cette rubrique pour l'instant. Reviens bientôt !",
  ouvrirArticle: (titre: string) => `Lire l'article « ${titre} »`,
  article: {
    retour: "Retour aux Actus",
    introuvable: "Cet article n'est plus là. Il a peut-être été retiré.",
    lieuxTitre: (n: number) => (n > 1 ? "Les lieux de l'article" : "Le lieu de l'article"),
    verifie: "✓ Vérifié",
    voirFiche: "Voir la fiche",
    yAller: "Y aller",
    yAllerLu: (nom: string) => `Y aller : ${nom}`,
    voirFicheLu: (nom: string) => `Voir la fiche de ${nom}`,
    motDuLieu: (nom: string) => `Le mot de ${nom}`,
    reponseRelue: "Réponse du lieu, relue par la Brigade",
    relu: (date: string) => `Relu par la Brigade et publié le ${date}.`,
    collaborationOui: (prenom: string) => `${prenom} a reçu quelque chose du lieu pour cet article : c'est une collaboration commerciale.`,
    collaborationNon: (prenom: string) => `${prenom} n'a rien reçu du lieu pour l'écrire.`,
    finLe: (date: string) => `Bon plan valable jusqu'au ${date}`,
    jaime: "J'aime",
    jaimeLu: (n: number) => `J'aime, ${n} au total`,
    commentaires: (n: number) => `${n} commentaire${n > 1 ? "s" : ""}`,
    envoyer: "Envoyer à un pote",
    partage: (titre: string) => `${titre} : à lire dans les Actus de SOS Miam 📰 https://sosmiam.fr/actus`,
    plume: "plume de l'article",
    photoLu: (n: number) => `Photo ${n} de l'article`,
  },
} as const;

export const TEXTES_ACTUS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ACTUS>> = { fr: TEXTES_ACTUS, en: TEXTES_ACTUS_ANGLAIS };
