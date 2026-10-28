import { useCallback, useState } from "react";

import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { enregistrerExportSocial } from "~/fonctions/donnees/enregistrer-export-social";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";

export type EtatExportSocial = {
  /** Vrai avec un compte connecté */
  disponible: boolean;
  enCours: boolean;
  /**
   * « Télécharger mes données sociales » : tes potes, tes listes, tes sorties et TES messages, rien que pour toi (2 fois par
   * 24 h). « ok » : la feuille de partage s'est ouverte ; « indisponible » : pas de feuille de partage ici ; sinon l'erreur
   * du serveur (trop-de-demandes, chiffrement-indisponible, hors-ligne…)
   */
  exporter: () => Promise<"ok" | "indisponible" | ErreurService>;
};

/** Le droit d'accès (RGPD) de la partie sociale, depuis l'app : l'export est préparé par le serveur, puis partagé en fichier. */
export function utiliserExportSocial(): EtatExportSocial {
  const source = utiliserSourceSociale();
  const { sociaux } = utiliserSession();
  const { langue } = utiliserLangue();
  const [enCours, setEnCours] = useState(false);
  const disponible = source === "compte";

  const exporter = useCallback(async (): Promise<"ok" | "indisponible" | ErreurService> => {
    if (!disponible) return "session-app-requise";
    setEnCours(true);
    try {
      const r = await sociaux.social.exporter().catch(() => ({ ok: false as const, erreur: "hors-ligne" as ErreurService }));
      if (!r.ok) return r.erreur;
      return (await enregistrerExportSocial(r.export, new Date(), langue)) === "partage" ? "ok" : "indisponible";
    } catch {
      return "erreur-serveur";
    } finally {
      setEnCours(false);
    }
  }, [disponible, sociaux, langue]);

  return { disponible, enCours, exporter };
}
