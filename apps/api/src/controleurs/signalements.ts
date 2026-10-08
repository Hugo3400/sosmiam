import type { Request, Response } from "express";

import type { SignalementRecu } from "../services/gestion/moderation.ts";

// Mêmes règles que packages/commun (types/signalement.ts, regles/signalement.ts, validation/est-signalement-valide.ts),
// que l'API ne peut pas encore importer telles quelles : à garder en phase.
const RAISONS = ["faux-lieu", "pub-cachee", "arnaque", "haine", "choquant", "danger", "vie-privee", "vol-contenu", "autre"];
const EXPLICATION_MAX = 500;
const EXPLICATION_MIN_SI_OBLIGATOIRE = 10;
const RAISONS_AVEC_EXPLICATION_OBLIGATOIRE = ["autre"];

/** POST /signalements : un signalement de publication envoyé depuis l'app. Il ne garde pas qui l'a envoyé. */
export function creerControleurSignalement(enregistrer: (signalement: SignalementRecu) => Promise<void>) {
  return async (requete: Request, reponse: Response) => {
    const s = typeof requete.body === "object" && requete.body !== null ? (requete.body as Record<string, unknown>) : {};
    const explication = typeof s.explication === "string" ? s.explication.trim() : "";
    const valide =
      typeof s.publicationId === "string" && /^[\w-]{1,40}$/.test(s.publicationId) &&
      typeof s.lieuId === "number" && Number.isInteger(s.lieuId) &&
      typeof s.raison === "string" && RAISONS.includes(s.raison) &&
      (s.precision === null || s.precision === undefined || (typeof s.precision === "string" && s.precision.length <= 80)) &&
      explication.length <= EXPLICATION_MAX &&
      (!RAISONS_AVEC_EXPLICATION_OBLIGATOIRE.includes(String(s.raison)) || explication.length >= EXPLICATION_MIN_SI_OBLIGATOIRE);
    if (!valide) return reponse.status(400).json({ ok: false, erreur: "signalement-invalide" });
    await enregistrer({
      publicationId: s.publicationId as string,
      lieuId: s.lieuId as number,
      raison: s.raison as string,
      precision: typeof s.precision === "string" && s.precision.trim() ? s.precision.trim() : null,
      explication,
    });
    reponse.status(201).json({ ok: true });
  };
}
