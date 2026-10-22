import type { Request, Response } from "express";

import { comparerVersionsApp } from "../../../../../packages/commun/src/fonctions/texte/comparer-versions-app.ts";
import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";

const FORME = /^\d{1,4}\.\d{1,4}\.\d{1,4}$/;
const SYSTEMES = ["ios", "android"] as const;
const corpsDe = (requete: Request): Record<string, unknown> =>
  typeof requete.body === "object" && requete.body !== null && !Buffer.isBuffer(requete.body) ? requete.body : {};

function lirePaire(valeur: unknown, nom: string): { ios: string; android: string } | string {
  const paire = valeur && typeof valeur === "object" ? (valeur as Record<string, unknown>) : {};
  for (const systeme of SYSTEMES) {
    const version = typeof paire[systeme] === "string" ? (paire[systeme] as string).trim() : "";
    if (!FORME.test(version)) return `${nom}.${systeme}`;
  }
  return { ios: (paire.ios as string).trim(), android: (paire.android as string).trim() };
}

export function creerControleursVersionsApp(s: ServicesGestion) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);
  return {
    lire: async (_requete: Request, reponse: Response) => {
      reponse.json(await s.lireVersionsAppGestion());
    },
    ecrire: async (requete: Request, reponse: Response) => {
      const corps = corpsDe(requete);
      const minimale = lirePaire(corps.minimale, "minimale");
      const derniere = lirePaire(corps.derniere, "derniere");
      if (typeof minimale === "string") return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: minimale });
      if (typeof derniere === "string") return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: derniere });
      for (const systeme of SYSTEMES) {
        if (comparerVersionsApp(minimale[systeme], derniere[systeme]) > 0) return reponse.status(400).json({ ok: false, erreur: "minimale-trop-haute", champ: `minimale.${systeme}` });
      }
      const avant = await s.lireVersionsAppGestion();
      await s.ecrireVersionsAppGestion({ minimale, derniere });
      await noter(reponse, "Versions de l'app changées", SYSTEMES.map((sy) => `${sy} : minimale ${avant.minimale[sy]} → ${minimale[sy]}, dernière ${avant.derniere[sy]} → ${derniere[sy]}`).join(" ; "));
      reponse.json({ ok: true, ...(await s.lireVersionsAppGestion()) });
    },
  };
}
