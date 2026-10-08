// Contrôleurs du logiciel de gestion pour les BIG SOS : liste, fiche, création, modification (histoire, objectif, liens,
// bilan), vérification sur place par un ambassadeur, décisions (vote, validation et dates, refus, clôture).
import type { Request, Response } from "express";

import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { DecisionBigSos, ModificationBigSos } from "../../services/gestion/big-sos.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { ChampInvalide, lireChoix, lireId, lireNombre, lireTexte } from "./lire-champs.ts";

const corpsDe = (requete: Request): Record<string, unknown> =>
  typeof requete.body === "object" && requete.body !== null && !Buffer.isBuffer(requete.body) ? requete.body : {};
const introuvable = (reponse: Response) => reponse.status(404).json({ ok: false, erreur: "introuvable" });

function lireDate(corps: Record<string, unknown>, cle: string): Date {
  const date = typeof corps[cle] === "string" ? new Date(corps[cle] as string) : null;
  if (!date || Number.isNaN(date.getTime())) throw new ChampInvalide(cle);
  return date;
}

/** Liens des vidéos de créateurs et liens utiles : 10 au plus, des adresses https seulement. */
function lireLiens(valeur: unknown): { titre: string; adresse: string }[] {
  if (!Array.isArray(valeur) || valeur.length > 10) throw new ChampInvalide("liens");
  return valeur.map((lien) => {
    const { titre, adresse } = (lien ?? {}) as { titre?: unknown; adresse?: unknown };
    if (typeof titre !== "string" || !titre.trim() || titre.length > 80) throw new ChampInvalide("liens");
    if (typeof adresse !== "string" || !/^https:\/\/[^\s"<>]+$/.test(adresse.trim()) || adresse.length > 500) throw new ChampInvalide("liens");
    return { titre: titre.trim(), adresse: adresse.trim() };
  });
}

function verifier(controleur: (requete: Request, reponse: Response) => Promise<unknown>) {
  return async (requete: Request, reponse: Response) => {
    try {
      await controleur(requete, reponse);
    } catch (erreur) {
      if (erreur instanceof ChampInvalide) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: erreur.champ });
      throw erreur;
    }
  };
}

export function creerControleursBigSos(s: ServicesGestion) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);
  const id = (requete: Request) => lireId(requete.params.id) ?? 0;

  return {
    liste: verifier(async (_requete, reponse) => reponse.json(await s.listerBigSos())),
    fiche: verifier(async (requete, reponse) => {
      const bigSos = await s.lireBigSos(id(requete));
      return bigSos ? reponse.json(bigSos) : introuvable(reponse);
    }),
    creer: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      const lieuId = lireNombre(corps, "lieuId", 1, 1e9);
      if (!lieuId) throw new ChampInvalide("lieuId");
      const cree = await s.creerBigSos({ lieuId, histoire: lireTexte(corps, "histoire", 3000, true), note: lireTexte(corps, "note", 2000) });
      if (!cree) return introuvable(reponse);
      await noter(reponse, "BIG SOS créé", `BIG SOS n° ${cree.id} (lieu n° ${lieuId})`);
      reponse.status(201).json(cree);
    }),
    modifier: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      const modification: ModificationBigSos = {
        ...(corps.histoire !== undefined ? { histoire: lireTexte(corps, "histoire", 3000, true) } : {}),
        ...(corps.note !== undefined ? { note: lireTexte(corps, "note", 2000) } : {}),
        ...(corps.objectifTitre !== undefined ? { objectifTitre: lireTexte(corps, "objectifTitre", 100) } : {}),
        ...(corps.objectifCible !== undefined ? { objectifCible: lireNombre(corps, "objectifCible", 1, 1_000_000) } : {}),
        ...(corps.objectifAtteint !== undefined ? { objectifAtteint: lireNombre(corps, "objectifAtteint", 0, 1_000_000) ?? 0 } : {}),
        ...(corps.liens !== undefined ? { liens: lireLiens(corps.liens) } : {}),
        ...(corps.bilan !== undefined ? { bilan: lireTexte(corps, "bilan", 3000) } : {}),
      };
      if (!(await s.modifierBigSos(id(requete), modification))) return introuvable(reponse);
      await noter(reponse, "BIG SOS modifié", `BIG SOS n° ${id(requete)}`);
      reponse.json({ ok: true });
    }),
    verification: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      const compteId = lireNombre(corps, "compteId", 1, 1e9);
      if (!compteId) throw new ChampInvalide("compteId");
      const echeance = typeof corps.echeance === "string" && corps.echeance ? lireDate(corps, "echeance") : null;
      const resultat = await s.envoyerVerification(id(requete), compteId, echeance);
      if (!resultat) return reponse.status(409).json({ ok: false, erreur: "etape-impossible" });
      if ("erreur" in resultat) return reponse.status(400).json({ ok: false, erreur: resultat.erreur });
      await noter(reponse, "BIG SOS : vérification sur place confiée", `BIG SOS n° ${id(requete)} → compte n° ${compteId}`);
      reponse.json({ ok: true, ...resultat });
    }),
    decider: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      const decision = lireChoix(corps, "decision", ["vote", "valider", "refuser", "rouvrir", "terminer"] as const);
      const choix: DecisionBigSos =
        decision === "valider" ? { decision, debutLe: lireDate(corps, "debutLe") }
        : decision === "terminer" ? { decision, bilan: lireTexte(corps, "bilan", 3000, true) }
        : { decision };
      if (!(await s.deciderBigSos(id(requete), choix))) return reponse.status(409).json({ ok: false, erreur: "etape-impossible" });
      const actions = { vote: "BIG SOS soumis au vote", valider: "BIG SOS validé", refuser: "BIG SOS refusé", rouvrir: "BIG SOS rouvert", terminer: "BIG SOS clôturé (bilan)" };
      await noter(reponse, actions[decision], `BIG SOS n° ${id(requete)}`);
      reponse.json({ ok: true });
    }),
    supprimer: verifier(async (requete, reponse) => {
      if (!(await s.supprimerBigSos(id(requete)))) return introuvable(reponse);
      await noter(reponse, "BIG SOS supprimé", `BIG SOS n° ${id(requete)}`);
      reponse.json({ ok: true });
    }),
  };
}
