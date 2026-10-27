import { accorder } from "../../../../packages/commun/src/fonctions/langue/accorder.ts";
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_RATTACHER_LIEU_ANGLAIS } from "~/contenus/anglais/rattacher-lieu";

export const EXEMPLES_RATTACHER_LIEU = {
  lieu: "Chez Jo, Montpellier…",
  siret: "123 456 789 00012",
};

export type CodeRechercheLieu = "trop-court" | "trop-de-demandes" | "panne" | "aucun";

export const TEXTES_RATTACHER_LIEU = {
  meta: {
    titre: "Rattacher mon lieu",
    description: "Dis-nous que ce lieu est à toi pour gérer sa fiche.",
  },
  titre: "Rattacher mon lieu",
  chapo: "Trouve ton lieu sur SOS Miam, dis-nous qu'il est à toi : l'équipe vérifie, et sa fiche s'ouvre dans ton tableau.",
  lieuNumero: (id: number) => `Lieu n° ${id}`,
  recherche: {
    "trop-court": "Tape au moins 2 lettres.",
    "trop-de-demandes": "Beaucoup de recherches d'un coup : réessaie dans quelques minutes.",
    panne: "La recherche ne répond pas. Réessaie dans un instant.",
    aucun: "Aucun lieu trouvé. Essaie avec un autre mot, ou inscris ton lieu.",
  } satisfies Record<CodeRechercheLieu, string>,
  erreurs: {
    gerant: "Coche la case : seul le gérant peut demander la fiche (il invitera son équipe ensuite).",
    preuve: "Dis-nous en quelques mots comment vérifier (600 caractères au plus).",
    siret: "Un SIRET, c'est 14 chiffres. Pas sous la main ? Laisse vide.",
    siretRefuse: "Ce SIRET ne semble pas juste : vérifie les 14 chiffres, ou laisse vide.",
    dejaDemande: "Tu as déjà demandé ce lieu : l'équipe regarde ta demande. Tu la retrouves dans ton tableau.",
    tropDeDemandes: "Ça fait beaucoup de demandes d'un coup : réessaie demain, ou écris-nous à bonjour@sosmiam.fr.",
    lieuInconnu: "Ce lieu n'est plus sur SOS Miam. Cherche-le de nouveau, ou inscris-le.",
    champInvalide: "Un champ ne va pas : vérifie le formulaire.",
    panne: "Oups, ta demande n'est pas partie. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.",
  },
  page: {
    dejaValide: "Ce lieu est déjà à toi ! ",
    dejaDemande: "Tu as déjà demandé ce lieu : l'équipe regarde. ",
    retourTableau: "Retour au tableau",
    pasLeBon: "Pas le bon ? ",
    autreLieu: "Chercher un autre lieu",
    pasEncore: "Ton lieu n'est pas encore sur SOS Miam ? ",
    inscrisLe: "Inscris-le gratuitement",
    inscrisSuite: " : l'équipe crée sa fiche, puis tu reviens ici.",
  },
  formulaire: {
    bouton: "Envoyer ma demande",
    gerant: "Je suis le gérant (ou la gérante) de ce lieu",
    preuve: "Comment peut-on vérifier que c'est toi ?",
    aidePreuve: "Par exemple : le numéro du lieu où te rappeler, une adresse e-mail au nom du lieu, ton nom sur l'extrait Kbis… L'équipe s'en sert seulement pour vérifier.",
    siret: "Le SIRET du lieu",
    aideSiret: "14 chiffres, sur tes factures ou ton extrait Kbis. Ça va plus vite avec, mais ça marche sans.",
    gratuit: "C'est gratuit, sans abonnement ni commission. L'équipe SOS Miam lit chaque demande à la main.",
  },
  rechercheLieu: {
    nom: "Chercher mon lieu",
    libelle: "Le nom de ton lieu (et sa ville, si tu veux)",
    aide: "Seuls les lieux déjà publiés sur SOS Miam apparaissent.",
    bouton: "Chercher",
    lequel: "C'est lequel ?",
    pasPublie: "· pas encore publié",
    verifie: "· Vérifié ✓",
  },
  champ: {
    liste: "Lieux proposés",
    aucun: "Aucun lieu trouvé.",
    trouves: (nombre: number) => accorder(nombre, "fr", `${nombre} lieu proposé.`, `${nombre} lieux proposés.`),
    pasPublie: " · pas encore publié",
  },
};

export const TEXTES_RATTACHER_LIEU_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_RATTACHER_LIEU>> = {
  fr: TEXTES_RATTACHER_LIEU,
  en: TEXTES_RATTACHER_LIEU_ANGLAIS,
};
