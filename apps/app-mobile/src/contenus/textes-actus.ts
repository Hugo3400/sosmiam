import { LIBELLES_ACTUS } from "@sos-miam/commun/contenus/libelles-actus";
import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ACTUS_ANGLAIS } from "~/contenus/anglais/textes-actus";

export const TEXTES_ACTUS = {
  ...LIBELLES_ACTUS,
  onglet: "Actus",
  filtresLu: "Rubriques des Actus",
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
