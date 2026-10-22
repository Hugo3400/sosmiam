import type { Request, Response } from "express";

import type { StatutSignalementSecurite } from "../../../../../packages/commun/src/types/securite.ts";
import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";

const STATUTS: readonly StatutSignalementSecurite[] = ["nouveau", "en-cours", "corrige", "non-retenu", "doublon"];
const FORME_ID = /^[0-9a-z-]{1,64}$/i;
const corpsDe = (requete: Request): Record<string, unknown> =>
  typeof requete.body === "object" && requete.body !== null && !Buffer.isBuffer(requete.body) ? requete.body : {};

export function creerControleursSecurite(s: ServicesGestion) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);
  const id = (requete: Request) => (typeof requete.params.id === "string" && FORME_ID.test(requete.params.id) ? requete.params.id : "");
  const introuvable = (reponse: Response) => reponse.status(404).json({ ok: false, erreur: "introuvable" });

  return {
    liste: async (requete: Request, reponse: Response) => {
      const statut = typeof requete.query.statut === "string" && (STATUTS as readonly string[]).includes(requete.query.statut) ? (requete.query.statut as StatutSignalementSecurite) : undefined;
      reponse.json({ signalements: await s.listerSignalementsSecurite({ statut }) });
    },
    changer: async (requete: Request, reponse: Response) => {
      if (!id(requete)) return introuvable(reponse);
      const resultat = await s.changerSignalementSecurite(id(requete), corpsDe(requete));
      if (!resultat.ok) {
        if (resultat.erreur === "champ-invalide") return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: resultat.champ });
        if (resultat.erreur === "signalement-inconnu") return introuvable(reponse);
        if (resultat.erreur === "sans-nom-tableau") return reponse.status(409).json({ ok: false, erreur: "sans-nom-tableau" });
        return reponse.status(503).json({ ok: false, erreur: "chiffrement-indisponible" });
      }
      const changes = Object.keys(corpsDe(requete)).filter((cle) => ["statut", "gravite", "auTableauHonneur"].includes(cle)).join(", ");
      await noter(reponse, "Signalement de sécurité modifié", `signalement n° ${id(requete)} : ${changes || "rien"}`);
      reponse.json({ ok: true, signalement: resultat.signalement });
    },
    image: async (requete: Request, reponse: Response) => {
      const image = id(requete) ? await s.lireImageSignalementSecurite(id(requete), Number(requete.params.numero)) : null;
      if (!image) return introuvable(reponse);
      await noter(reponse, "Capture d'un signalement de sécurité ouverte", `signalement n° ${id(requete)}, capture ${Number(requete.params.numero) + 1}`);
      reponse
        .set("Cache-Control", "no-store")
        .set("X-Content-Type-Options", "nosniff")
        .set("Content-Security-Policy", "sandbox; default-src 'none'")
        .set("Content-Disposition", "attachment")
        .type(image.typeMime)
        .send(image.octets);
    },
    badge: async (requete: Request, reponse: Response) => {
      if (!id(requete)) return introuvable(reponse);
      const resultat = await s.donnerBadgeSignalementSecurite(id(requete));
      if (!resultat.ok) {
        if (resultat.erreur === "signalement-inconnu") return introuvable(reponse);
        if (resultat.erreur === "compte-introuvable") return reponse.status(409).json({ ok: false, erreur: "compte-introuvable" });
        return reponse.status(503).json({ ok: false, erreur: "chiffrement-indisponible" });
      }
      if (resultat.nouveau) await noter(reponse, "Badge « Chasseur de bugs » donné", `signalement n° ${id(requete)}`);
      reponse.json({ ok: true, nouveau: resultat.nouveau });
    },
    supprimer: async (requete: Request, reponse: Response) => {
      if (!id(requete) || !(await s.supprimerSignalementSecurite(id(requete)))) return introuvable(reponse);
      await noter(reponse, "Signalement de sécurité supprimé", `signalement n° ${id(requete)}`);
      reponse.json({ ok: true });
    },
    tableau: async (_requete: Request, reponse: Response) => {
      reponse.json({ entrees: await s.listerEntreesTableauHonneur() });
    },
    retirerDuTableau: async (requete: Request, reponse: Response) => {
      if (!id(requete) || !(await s.retirerEntreeTableauHonneur(id(requete)))) return introuvable(reponse);
      await noter(reponse, "Nom retiré du tableau d'honneur", `entrée n° ${id(requete)}`);
      reponse.json({ ok: true });
    },
  };
}
