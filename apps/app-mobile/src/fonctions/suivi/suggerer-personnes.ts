import { ID_MOI } from "@sos-miam/commun/regles/potes";
import { eliderDe } from "~/fonctions/texte/elider-de";

type Entree = {
  /** Ta bande (identifiants, sans les personnes bloquées) */
  bande: readonly string[];
  /** La bande de chaque personne connue (démo : bandesExemples) */
  bandes: Readonly<Record<string, readonly string[]>>;
  /** Vrai si on peut te proposer cette personne (pas toi, pas bloquée ni signalée, pas déjà suivie ou demandée, permise par la règle, pas masquée) */
  estCandidat: (id: string) => boolean;
  prenomDe: (id: string) => string;
};

/**
 * Personnes à suivre : les potes de tes potes, de celui qui a le plus de potes en commun avec toi au moins (« Pote de Léa »,
 * « Pote de Léa et Karim », « Pote de Léa et 2 autres »), puis les membres de ta bande que tu ne suis pas encore (« Dans ta bande »).
 */
export function suggererPersonnes({ bande, bandes, estCandidat, prenomDe }: Entree): { id: string; raison: string }[] {
  const dansBande = new Set(bande);
  // Pour chaque pote de pote : les membres de ta bande qui l'ont dans la leur (dans l'ordre de ta bande)
  const enCommun = new Map<string, string[]>();
  for (const pote of bande) {
    for (const id of bandes[pote] ?? []) {
      if (id === ID_MOI || dansBande.has(id)) continue;
      const liste = enCommun.get(id) ?? [];
      if (!liste.includes(pote)) liste.push(pote);
      enCommun.set(id, liste);
    }
  }

  const potesDePotes = [...enCommun]
    .filter(([id]) => estCandidat(id))
    .sort(([, a], [, b]) => b.length - a.length)
    .map(([id, communs]) => {
      const premier = prenomDe(communs[0]);
      const autres = communs.length - 1;
      const raison =
        autres === 0 ? `Pote ${eliderDe(premier)}` : autres === 1 ? `Pote ${eliderDe(premier)} et ${prenomDe(communs[1])}` : `Pote ${eliderDe(premier)} et ${autres} autres`;
      return { id, raison };
    });
  const deTaBande = bande.filter((id) => id !== ID_MOI && estCandidat(id)).map((id) => ({ id, raison: "Dans ta bande" }));
  return [...potesDePotes, ...deTaBande];
}
