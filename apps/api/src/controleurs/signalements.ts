import type { Request, Response } from "express";

import type { CompteSession } from "../middlewares/proteger-comptes.ts";
import type { SignalementRecu } from "../services/gestion/moderation.ts";
import type { JugeSignaleurPublication } from "../services/juge-signaleur-publication.ts";

// Mêmes règles que packages/commun (types/signalement.ts, regles/signalement.ts, validation/est-signalement-valide.ts),
// que l'API ne peut pas encore importer telles quelles : à garder en phase.
const RAISONS = ["faux-lieu", "pub-cachee", "arnaque", "haine", "choquant", "danger", "vie-privee", "vol-contenu", "autre"];
const EXPLICATION_MAX = 500;
const EXPLICATION_MIN_SI_OBLIGATOIRE = 10;
const RAISONS_AVEC_EXPLICATION_OBLIGATOIRE = ["autre"];

/** POST /signalements : un signalement de publication envoyé depuis l'app. Il ne garde pas qui l'a envoyé. */
export function creerControleurSignalement(enregistrer: (signalement: SignalementRecu) => Promise<void>, jugerSignaleur: JugeSignaleurPublication | null = null) {
  return async (requete: Request, reponse: Response) => {
    const s = typeof requete.body === "object" && requete.body !== null ? (requete.body as Record<string, unknown>) : {};
    const explication = typeof s.explication === "string" ? s.explication.trim() : "";
    const raisonValide =
      typeof s.raison === "string" && RAISONS.includes(s.raison) &&
      (s.precision === null || s.precision === undefined || (typeof s.precision === "string" && s.precision.length <= 80)) &&
      explication.length <= EXPLICATION_MAX &&
      (!RAISONS_AVEC_EXPLICATION_OBLIGATOIRE.includes(String(s.raison)) || explication.length >= EXPLICATION_MIN_SI_OBLIGATOIRE);
    const compte = reponse.locals.compte as CompteSession | undefined;
    if (s.cible === "article-actu" || s.cible === "reponse-actu" || s.cible === "comment-actu") {
      const estId = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v > 0;
      const precisionValide = s.cible === "article-actu" || (s.cible === "reponse-actu" ? estId(s.lieuId) : estId(s.commentaireId));
      if (!raisonValide || !estId(s.articleId) || !precisionValide) return reponse.status(400).json({ ok: false, erreur: "signalement-invalide" });
      await enregistrer({
        cible: s.cible,
        articleId: s.articleId as number,
        lieuId: s.cible === "reponse-actu" ? (s.lieuId as number) : null,
        commentaireId: s.cible === "comment-actu" ? (s.commentaireId as number) : null,
        raison: s.raison as string,
        precision: typeof s.precision === "string" && s.precision.trim() ? s.precision.trim() : null,
        explication,
        signaleParId: compte?.id ?? null,
        source: s.source === "site" ? "site" : "app",
      });
      return reponse.status(201).json({ ok: true });
    }
    if (s.cible === "image-lieu") {
      const valideImage = raisonValide && typeof s.lieuId === "number" && Number.isSafeInteger(s.lieuId) && s.lieuId > 0 && (s.quelle === "banniere" || s.quelle === "logo");
      if (!valideImage) return reponse.status(400).json({ ok: false, erreur: "signalement-invalide" });
      await enregistrer({
        cible: "image-lieu",
        lieuId: s.lieuId as number,
        quelle: s.quelle as "banniere" | "logo",
        raison: s.raison as string,
        precision: typeof s.precision === "string" && s.precision.trim() ? s.precision.trim() : null,
        explication,
        signaleParId: compte?.id ?? null,
        source: s.source === "site" ? "site" : "app",
      });
      return reponse.status(201).json({ ok: true });
    }
    const valide =
      typeof s.publicationId === "string" && /^[\w-]{1,40}$/.test(s.publicationId) &&
      typeof s.lieuId === "number" && Number.isInteger(s.lieuId) &&
      typeof s.raison === "string" && RAISONS.includes(s.raison) &&
      (s.precision === null || s.precision === undefined || (typeof s.precision === "string" && s.precision.length <= 80)) &&
      explication.length <= EXPLICATION_MAX &&
      (!RAISONS_AVEC_EXPLICATION_OBLIGATOIRE.includes(String(s.raison)) || explication.length >= EXPLICATION_MIN_SI_OBLIGATOIRE);
    if (!valide) return reponse.status(400).json({ ok: false, erreur: "signalement-invalide" });
    const masquageAutorise = compte !== undefined && jugerSignaleur !== null && (await jugerSignaleur(compte.id));
    await enregistrer({
      publicationId: s.publicationId as string,
      lieuId: s.lieuId as number,
      raison: s.raison as string,
      precision: typeof s.precision === "string" && s.precision.trim() ? s.precision.trim() : null,
      explication,
      masquageAutorise,
    });
    reponse.status(201).json({ ok: true });
  };
}
