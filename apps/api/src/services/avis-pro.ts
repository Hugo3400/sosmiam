// Les avis vus du comptoir (voir routes/comptoir.ts) : l'équipe du lieu (gérant et équipe) lit les avis visibles de son lieu
// avec leur réponse ; seul le gérant répond, une fois par avis, en public (600 caractères, filtre de mots, vérifié par le
// contrôleur). La réponse est publiée tout de suite et relue après par l'équipe SOS Miam dans le logiciel ; jamais de
// message privé du lieu au client. Le lieu est relu sur l'avis, jamais pris dans la demande.
import type { AvisPublic, PageAvisLieu } from "../../../../packages/commun/src/types/avis.ts";
import { lirePageAvis } from "../fonctions/avis/lire-page-avis.ts";
import { presenterAvisPublic } from "../fonctions/avis/presenter-avis-public.ts";
import { echecAvis } from "./avis-client.ts";
import type { ContexteAvis, EchecAvis } from "./avis-regles.ts";
import type { RoleRattachement } from "./pro-regles.ts";

/** comptoir.roleDe : le rattachement VALIDÉ du compte à ce lieu, s'il a 18 ans ou plus (null sinon) */
export type RoleDe = (compteId: number, lieuId: number) => Promise<RoleRattachement | null>;

export function creerAvisPro(c: Pick<ContexteAvis, "depot" | "horloge">, roleDe: RoleDe) {
  return {
    /** GET /pro/comptoir/lieux/:id/avis : gérant et équipe */
    async lister(compteId: number, lieuId: number, apres: number | null): Promise<({ ok: true } & PageAvisLieu) | EchecAvis> {
      if (!(await roleDe(compteId, lieuId))) return echecAvis("role-requis");
      return { ok: true, ...(await c.depot.lire((t) => lirePageAvis(t, lieuId, apres))) };
    },

    /** POST /pro/comptoir/avis/:avisId/reponse : le gérant seulement, une réponse par avis (texte déjà vérifié) */
    async repondre(compteId: number, avisId: number, texte: string): Promise<{ ok: true; avis: AvisPublic } | EchecAvis> {
      const avis = await c.depot.lire((t) => t.lireAvis(avisId));
      if (!avis) return echecAvis("introuvable");
      if ((await roleDe(compteId, avis.lieuId)) !== "gerant") return echecAvis("role-requis");
      // Un avis masqué par l'équipe n'existe plus pour personne
      if (avis.statut === "masque") return echecAvis("introuvable");
      if (avis.reponseTexte !== null) return echecAvis("reponse-deja-donnee");
      const posee = await c.depot.ecrire((t) => t.poserReponse(avisId, { texte: texte.trim(), le: new Date(c.horloge()), parId: compteId }));
      if (!posee) return echecAvis("reponse-deja-donnee");
      const apres = await c.depot.lire((t) => t.lireAvis(avisId));
      return apres ? { ok: true, avis: presenterAvisPublic(apres) } : echecAvis("introuvable");
    },
  };
}
