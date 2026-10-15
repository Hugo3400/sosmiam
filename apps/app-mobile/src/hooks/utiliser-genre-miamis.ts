import { useCallback, useState } from "react";

import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { ChoixGenre, GenreProfil } from "@sos-miam/commun/types/genre";
import { utiliserLectureCommunaute } from "~/hooks/utiliser-lecture-communaute";
import { utiliserServiceCommunaute } from "~/hooks/utiliser-service-communaute";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";

export type ResultatGenre = { ok: true } | { ok: false; prochain: string } | { ok: false; erreur: ErreurService };

export type EtatGenreMiamis = {
  genre: GenreProfil | null;
  pret: boolean;
  erreur: ErreurService | null;
  envoi: boolean;
  relire: () => Promise<void>;
  choisir: (choix: ChoixGenre) => Promise<ResultatGenre>;
  effacer: () => Promise<ResultatGenre>;
};

type ReponseGenre = ReponseApi<{ genre: GenreProfil }>;

const HORS_LIGNE: ReponseGenre = { ok: false, erreur: "hors-ligne" };

export function utiliserGenreMiamis(): EtatGenreMiamis {
  const service = utiliserServiceCommunaute();
  const actif = utiliserSourceSociale() === "compte";
  const { donnees, chargement, erreur, relire, remplacer } = utiliserLectureCommunaute((s) => s.lireGenre());
  const [envoi, setEnvoi] = useState(false);

  const envoyer = useCallback(
    async (appel: () => Promise<ReponseGenre>): Promise<ResultatGenre> => {
      if (!actif) return { ok: false, erreur: "service-indisponible" };
      setEnvoi(true);
      const r = await appel().catch(() => HORS_LIGNE);
      setEnvoi(false);
      if (r.ok) {
        remplacer((d) => ({ ...d, genre: r.genre }));
        return { ok: true };
      }
      if (r.erreur === "genre-trop-tot" && r.details?.jusqua) return { ok: false, prochain: r.details.jusqua };
      return { ok: false, erreur: r.erreur };
    },
    [actif, remplacer],
  );

  const choisir = useCallback((choix: ChoixGenre) => envoyer(() => service.choisirGenre(choix)), [envoyer, service]);
  const effacer = useCallback(() => envoyer(() => service.effacerGenre()), [envoyer, service]);

  return {
    genre: donnees?.genre ?? null,
    pret: donnees !== null || !chargement,
    erreur: donnees ? null : erreur,
    envoi,
    relire,
    choisir,
    effacer,
  };
}
