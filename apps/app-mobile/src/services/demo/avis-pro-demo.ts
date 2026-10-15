import type { ServiceComptoir } from "@sos-miam/commun/client-api/contrat-comptoir";
import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import { peutAgirAuComptoir } from "@sos-miam/commun/fonctions/roles/peut-agir-au-comptoir";
import { peutReglerLieu } from "@sos-miam/commun/fonctions/roles/peut-regler-lieu";
import type { AvisPublic } from "@sos-miam/commun/types/avis";
import { validerReponseAvis } from "@sos-miam/commun/validation/valider-reponse-avis";

import { lieuxExemples } from "~/contenus/lieux-exemples";
import { convertirAvisDemo } from "~/fonctions/demo/convertir-avis-demo";

import { lirePageAvisDemo } from "./lire-page-avis-demo";
import type { ContexteDemo } from "./types-demo";

export type AvisProDemo = Pick<ServiceComptoir, "listerAvis" | "repondreAvis">;

type Echec = Extract<ReponseApi, { ok: false }>;
type ReponseReponse = ReponseApi<{ avis: AvisPublic }>;

const INTROUVABLE: Echec = { ok: false, erreur: "introuvable" };
const ROLE_REQUIS: Echec = { ok: false, erreur: "role-requis" };

export function creerAvisProDemo(ctx: ContexteDemo): AvisProDemo {
  return {
    async listerAvis(lieuId) {
      if (!lieuxExemples.some((l) => l.id === lieuId)) return INTROUVABLE;
      if (!peutAgirAuComptoir(ctx.lireRoles(), lieuId)) return ROLE_REQUIS;
      return ctx.magasin.lire((m) => {
        const { resume, avis } = lirePageAvisDemo(m, lieuId, null);
        return { ok: true, resume, avis };
      });
    },

    async repondreAvis(avisId, texte) {
      const refus = validerReponseAvis(texte);
      if (refus) return { ok: false, erreur: refus, champ: "texte" };
      return ctx.magasin.modifier((m, maintenantMs): ReponseReponse => {
        const avis = m.avis.find((a) => a.id === avisId);
        if (!avis) return INTROUVABLE;
        if (!peutReglerLieu(ctx.lireRoles(), avis.lieuId)) return ROLE_REQUIS;
        if (avis.statut === "masque") return INTROUVABLE;
        if (avis.reponseLieu !== null) return { ok: false, erreur: "reponse-deja-donnee" };
        avis.reponseLieu = { texte: texte.trim(), le: new Date(maintenantMs).toISOString() };
        const reglement = m.visites.find((v) => v.id === avis.visiteId)?.reglement ?? null;
        return { ok: true, avis: convertirAvisDemo(avis, reglement) };
      });
    },
  };
}
