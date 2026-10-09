import type { EndroitAlerte, RaisonSignalementMiamSafe } from "@sos-miam/commun/regles/miam-safe";

// Textes et données d'exemple de Miam Safe (décidé le 9 octobre 2026, voir docs/decisions.md).
// Ton doux et sérieux sur ces écrans : pas de blague, pas d'easter egg.

/** Un numéro d'urgence : appelé (tel:) ou, pour le 114, écrit par SMS (sms:) */
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

export const LIBELLES_RAISON_MIAM_SAFE: Record<RaisonSignalementMiamSafe, { titre: string; detail: string }> = {
  harcelement: { titre: "Harcèlement", detail: "Quelqu'un a insisté, suivi, fait des remarques ou des gestes déplacés." },
  agression: { titre: "Agression", detail: "On t'a fait du mal, ou on a essayé." },
  discrimination: { titre: "Discrimination", detail: "On t'a traité·e différemment à cause de qui tu es." },
  personnel: { titre: "Quelqu'un de l'équipe", detail: "Le comportement d'une personne qui travaille dans le lieu." },
  autre: { titre: "Autre chose", detail: "Raconte-nous avec tes mots." },
};

/**
 * Lieux d'exemple qui ont signé la charte Miam Safe, avec leurs réponses à « Tu t'es senti·e bien ici ? » (démo).
 * Le 18 est le Restaurant du Capitaine Bouiboui, le lieu de démo du mode pro.
 */
export const LIEUX_MIAM_SAFE_EXEMPLES: Readonly<Record<number, { oui: number; reponses: number }>> = {
  0: { oui: 46, reponses: 49 },
  4: { oui: 15, reponses: 16 },
  18: { oui: 29, reponses: 31 },
};
