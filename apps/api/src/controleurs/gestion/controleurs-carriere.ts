import type { Request, Response } from "express";

import type { StatutCandidature } from "../../../../../packages/commun/src/types/carriere.ts";
import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";

const STATUTS: readonly StatutCandidature[] = ["nouvelle", "lue", "retenue", "non-retenue"];
const FORME_ID = /^[0-9a-z-]{1,64}$/i;
const corpsDe = (requete: Request): Record<string, unknown> =>
  typeof requete.body === "object" && requete.body !== null && !Buffer.isBuffer(requete.body) ? requete.body : {};

export function creerControleursCarriere(s: ServicesGestion) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);
  const id = (requete: Request) => (typeof requete.params.id === "string" && FORME_ID.test(requete.params.id) ? requete.params.id : "");
  const introuvable = (reponse: Response) => reponse.status(404).json({ ok: false, erreur: "introuvable" });

  async function enregistrer(reponse: Response, resultat: Awaited<ReturnType<ServicesGestion["creerOffre"]>>, action: string) {
    if (!resultat.ok) {
      if (resultat.erreur === "champ-invalide") return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: resultat.champ });
      return introuvable(reponse);
    }
    await noter(reponse, action, `offre n° ${resultat.offre.id}`);
    reponse.json({ ok: true, offre: resultat.offre });
  }

  return {
    offres: async (_requete: Request, reponse: Response) => {
      reponse.json({ offres: await s.listerOffresGestion() });
    },
    creerOffre: async (requete: Request, reponse: Response) => {
      await enregistrer(reponse, await s.creerOffre(corpsDe(requete)), "Offre de la page Carrière créée");
    },
    modifierOffre: async (requete: Request, reponse: Response) => {
      if (!id(requete)) return introuvable(reponse);
      await enregistrer(reponse, await s.modifierOffre(id(requete), corpsDe(requete)), "Offre de la page Carrière modifiée");
    },
    publierOffre: async (requete: Request, reponse: Response) => {
      const offre = id(requete) ? await s.publierOffre(id(requete)) : null;
      if (!offre) return introuvable(reponse);
      await noter(reponse, "Offre de la page Carrière publiée", `offre n° ${offre.id}`);
      reponse.json({ ok: true, offre });
    },
    fermerOffre: async (requete: Request, reponse: Response) => {
      const offre = id(requete) ? await s.fermerOffre(id(requete)) : null;
      if (!offre) return introuvable(reponse);
      await noter(reponse, "Offre de la page Carrière fermée", `offre n° ${offre.id}`);
      reponse.json({ ok: true, offre });
    },
    supprimerOffre: async (requete: Request, reponse: Response) => {
      if (!id(requete) || !(await s.supprimerOffre(id(requete)))) return introuvable(reponse);
      await noter(reponse, "Offre de la page Carrière supprimée (avec ses candidatures)", `offre n° ${id(requete)}`);
      reponse.json({ ok: true });
    },
    candidatures: async (requete: Request, reponse: Response) => {
      const offreId = typeof requete.query.offre === "string" && FORME_ID.test(requete.query.offre) ? requete.query.offre : undefined;
      const statut = typeof requete.query.statut === "string" && (STATUTS as readonly string[]).includes(requete.query.statut) ? (requete.query.statut as StatutCandidature) : undefined;
      reponse.json({ candidatures: await s.listerCandidaturesCarriere({ offreId, statut }) });
    },
    cv: async (requete: Request, reponse: Response) => {
      const cv = id(requete) ? await s.lireCvCandidature(id(requete)) : null;
      if (!cv) return introuvable(reponse);
      await noter(reponse, "CV d'une candidature ouvert", `candidature n° ${id(requete)}`);
      reponse
        .set("Cache-Control", "no-store")
        .set("X-Content-Type-Options", "nosniff")
        .set("Content-Security-Policy", "sandbox; default-src 'none'")
        .set("Content-Disposition", "attachment; filename=\"cv.pdf\"")
        .type("application/pdf")
        .send(cv);
    },
    statutCandidature: async (requete: Request, reponse: Response) => {
      const resultat = id(requete) ? await s.changerStatutCandidature(id(requete), corpsDe(requete).statut) : { ok: false as const, erreur: "candidature-inconnue" as const };
      if (!resultat.ok) return resultat.erreur === "champ-invalide" ? reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: "statut" }) : introuvable(reponse);
      await noter(reponse, "Statut d'une candidature changé", `candidature n° ${id(requete)} → ${String(corpsDe(requete).statut)}`);
      reponse.json({ ok: true });
    },
    supprimerCandidature: async (requete: Request, reponse: Response) => {
      if (!id(requete) || !(await s.supprimerCandidature(id(requete)))) return introuvable(reponse);
      await noter(reponse, "Candidature supprimée", `candidature n° ${id(requete)}`);
      reponse.json({ ok: true });
    },
  };
}
