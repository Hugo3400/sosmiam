import type { EndroitAlerte, RaisonSignalementMiamSafe } from "@sos-miam/commun/regles/miam-safe";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import {
  ECHEC_ALERTE_MIAM_SAFE_ANGLAIS,
  ECHECS_ALERTE_MIAM_SAFE_ANGLAIS,
  LIBELLES_ENDROIT_ALERTE_ANGLAIS,
  LIBELLES_RAISON_MIAM_SAFE_ANGLAIS,
  NUMEROS_URGENCE_ANGLAIS,
} from "~/contenus/anglais/miam-safe";

export type NumeroUrgence = { numero: string; libelle: string; lien: string; lu: string };

export const NUMEROS_URGENCE: readonly NumeroUrgence[] = [
  { numero: "17", libelle: "Police", lien: "tel:17", lu: "Appeler le 17, la police" },
  { numero: "18", libelle: "Pompiers", lien: "tel:18", lu: "Appeler le 18, les pompiers" },
  { numero: "15", libelle: "Samu", lien: "tel:15", lu: "Appeler le 15, le Samu" },
  { numero: "112", libelle: "Urgences", lien: "tel:112", lu: "Appeler le 112, les urgences, partout en Europe" },
  { numero: "114", libelle: "Par SMS", lien: "sms:114", lu: "Écrire au 114 par SMS, si tu ne peux pas parler" },
];

export const LIBELLES_ENDROIT_ALERTE: Record<EndroitAlerte, string> = {
  salle: "En salle",
  terrasse: "En terrasse",
  toilettes: "Aux toilettes",
  ailleurs: "Ailleurs",
};

export const ECHECS_ALERTE_MIAM_SAFE: Partial<Record<ErreurService, string>> = {
  "hors-ligne": "Pas de réseau ici. Les numéros d'urgence, eux, marchent sans Internet.",
  "trop-de-demandes": "Trop de demandes en peu de temps : elle ne peut pas partir tout de suite.",
  "pas-miam-safe": "Ce lieu ne reçoit pas les alertes : il n'a pas signé la charte Miam Safe.",
};

export const ECHEC_ALERTE_MIAM_SAFE = "On n'a pas pu l'envoyer.";

export const LIBELLES_RAISON_MIAM_SAFE: Record<RaisonSignalementMiamSafe, { titre: string; detail: string }> = {
  harcelement: { titre: "Harcèlement", detail: "Quelqu'un a insisté, suivi, fait des remarques ou des gestes déplacés." },
  agression: { titre: "Agression", detail: "On t'a fait du mal, ou on a essayé." },
  discrimination: { titre: "Discrimination", detail: "On t'a traité·e différemment à cause de qui tu es." },
  personnel: { titre: "Quelqu'un de l'équipe", detail: "Le comportement d'une personne qui travaille dans le lieu." },
  autre: { titre: "Autre chose", detail: "Raconte-nous avec tes mots." },
};

export const LIEUX_SIGNATAIRES_MIAM_SAFE_EXEMPLES: readonly number[] = [0, 4, 18];

export const REPONSES_SENTI_BIEN_EXEMPLES: Readonly<Record<number, { oui: number; reponses: number }>> = {
  0: { oui: 46, reponses: 49 },
  3: { oui: 23, reponses: 24 },
  4: { oui: 15, reponses: 16 },
  18: { oui: 29, reponses: 31 },
};

export const NUMEROS_URGENCE_PAR_LANGUE: ParLangue<Traduction<typeof NUMEROS_URGENCE>> = { fr: NUMEROS_URGENCE, en: NUMEROS_URGENCE_ANGLAIS };
export const LIBELLES_ENDROIT_ALERTE_PAR_LANGUE: ParLangue<Traduction<typeof LIBELLES_ENDROIT_ALERTE>> = { fr: LIBELLES_ENDROIT_ALERTE, en: LIBELLES_ENDROIT_ALERTE_ANGLAIS };
export const ECHECS_ALERTE_MIAM_SAFE_PAR_LANGUE: ParLangue<Traduction<typeof ECHECS_ALERTE_MIAM_SAFE>> = { fr: ECHECS_ALERTE_MIAM_SAFE, en: ECHECS_ALERTE_MIAM_SAFE_ANGLAIS };
export const ECHEC_ALERTE_MIAM_SAFE_PAR_LANGUE: ParLangue<Traduction<typeof ECHEC_ALERTE_MIAM_SAFE>> = { fr: ECHEC_ALERTE_MIAM_SAFE, en: ECHEC_ALERTE_MIAM_SAFE_ANGLAIS };
export const LIBELLES_RAISON_MIAM_SAFE_PAR_LANGUE: ParLangue<Traduction<typeof LIBELLES_RAISON_MIAM_SAFE>> = { fr: LIBELLES_RAISON_MIAM_SAFE, en: LIBELLES_RAISON_MIAM_SAFE_ANGLAIS };
