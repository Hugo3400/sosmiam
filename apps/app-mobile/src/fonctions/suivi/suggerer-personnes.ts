import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";

import { TEXTES_SUIVI_PAR_LANGUE } from "~/contenus/textes-suivi";

type Entree = {
  /** Ton identifiant (utiliserMonId) : jamais proposé */
  monId: string;
  /** Ta bande (identifiants, sans les personnes bloquées) */
  bande: readonly string[];
  /** La bande de chaque personne connue */
  bandes: Readonly<Record<string, readonly string[]>>;
  /** Vrai si on peut te proposer cette personne (pas toi, pas bloquée ni signalée, pas déjà suivie ou demandée, permise par la règle, pas masquée) */
  estCandidat: (id: string) => boolean;
  prenomDe: (id: string) => string;
};

/**
 * Personnes à suivre : les potes de tes potes, de celui qui a le plus de potes en commun avec toi au moins (« Pote de Léa »,
 * « Pote de Léa et Karim », « Pote de Léa et 2 autres »), puis les membres de ta bande que tu ne suis pas encore (« Dans ta bande »).
 */
export function suggererPersonnes({ monId, bande, bandes, estCandidat, prenomDe }: Entree, langue: Langue): { id: string; raison: string }[] {
  const T = choisirTextes(TEXTES_SUIVI_PAR_LANGUE, langue).raisons;
  const dansBande = new Set(bande);
  // Pour chaque pote de pote : les membres de ta bande qui l'ont dans la leur (dans l'ordre de ta bande)
  const enCommun = new Map<string, string[]>();
  for (const pote of bande) {
    for (const id of bandes[pote] ?? []) {
      if (id === monId || dansBande.has(id)) continue;
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
      const raison = autres === 0 ? T.poteDe(premier) : autres === 1 ? T.poteDeEt(premier, prenomDe(communs[1])) : T.poteDeEtAutres(premier, autres);
      return { id, raison };
    });
  const deTaBande = bande.filter((id) => id !== monId && estCandidat(id)).map((id) => ({ id, raison: T.dansTaBande }));
  return [...potesDePotes, ...deTaBande];
}
