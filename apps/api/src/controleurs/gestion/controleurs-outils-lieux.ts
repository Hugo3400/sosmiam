// Contrôleurs des outils du logiciel : contrôle des fiches de lieux (positions douteuses, doublons), lieux semblables à
// une fiche pas encore créée, import en lot (CSV lu par le logiciel), villes à lancer et test des sauvegardes.
import type { Request, Response } from "express";

import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { LieuSaisi } from "../../services/gestion/lieux.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { ChampInvalide, lireParametre } from "./lire-champs.ts";
import { lireLieuImporte } from "./lire-lieu.ts";

/** Lignes vérifiées d'un coup (aperçu) ; lignes créées par demande (le logiciel envoie par paquets) */
const LIGNES_VERIFIEES = 500;
const LIGNES_IMPORTEES = 50;

const lignesDe = (requete: Request, maximum: number): Record<string, unknown>[] => {
  const lieux = (requete.body as { lieux?: unknown } | null)?.lieux;
  if (!Array.isArray(lieux) || lieux.length === 0 || lieux.length > maximum || lieux.some((ligne) => typeof ligne !== "object" || ligne === null)) {
    throw new ChampInvalide("lieux");
  }
  return lieux as Record<string, unknown>[];
};

const nombreOuNull = (valeur: unknown) => {
  const nombre = typeof valeur === "string" && valeur.trim() !== "" ? Number(valeur) : NaN;
  return Number.isFinite(nombre) ? nombre : null;
};

export function creerControleursOutilsLieux(s: ServicesGestion) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);

  return {
    controle: async (_requete: Request, reponse: Response) => reponse.json(await s.lireControleLieux()),
    villes: async (_requete: Request, reponse: Response) => reponse.json(await s.listerVilles()),
    dernierTestSauvegarde: async (_requete: Request, reponse: Response) => reponse.json(await s.lireDernierTestSauvegarde()),
    /** Teste la sauvegarde la plus récente (déchiffrée et relue en entier, rien n'est restauré) */
    testerSauvegarde: async (_requete: Request, reponse: Response) => {
      const resultat = await s.testerSauvegarde();
      if (!resultat) return reponse.status(404).json({ ok: false, erreur: "introuvable" });
      await noter(reponse, resultat.ok ? "Sauvegarde testée : relue en entier" : "Sauvegarde testée : ÉCHEC", resultat.nom);
      reponse.json(resultat);
    },
    /** ?ville= : où en est cette ville (fiches, ambassadeurs, fondateurs, public à prévenir) */
    lancement: async (requete: Request, reponse: Response) => {
      const ville = lireParametre(requete.query.ville, 80);
      if (!ville) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: "ville" });
      reponse.json(await s.lireLancementVille(ville));
    },
    /** ?nom=&ville=&adresse=&latitude=&longitude= : lieux déjà en base qui ressemblent à cette fiche */
    semblables: async (requete: Request, reponse: Response) => {
      const nom = lireParametre(requete.query.nom, 80);
      if (!nom) return reponse.json([]);
      reponse.json(await s.chercherLieuxSemblables({
        nom,
        ville: lireParametre(requete.query.ville, 80),
        adresse: lireParametre(requete.query.adresse, 160) || null,
        latitude: nombreOuNull(requete.query.latitude),
        longitude: nombreOuNull(requete.query.longitude),
      }));
    },
    /** Aperçu d'un import : chaque ligne valable ou non (champ en cause), et ses doublons possibles */
    verifierImport: async (requete: Request, reponse: Response) => {
      let lignes: Record<string, unknown>[];
      try {
        lignes = lignesDe(requete, LIGNES_VERIFIEES);
      } catch {
        return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: "lieux" });
      }
      const lues = lignes.map((ligne, index) => {
        try {
          return { index, fiche: lireLieuImporte(ligne) };
        } catch (erreur) {
          if (erreur instanceof ChampInvalide) return { index, champ: erreur.champ };
          throw erreur;
        }
      });
      const valables = lues.filter((l): l is { index: number; fiche: LieuSaisi } => "fiche" in l);
      const doublons = await s.verifierDoublonsImport(valables);
      reponse.json(lues.map((l) => ("fiche" in l ? { ok: true, ...doublons.get(l.index) } : { ok: false, champ: l.champ, semblables: [], dansLeFichier: [] })));
    },
    /** Crée un paquet de fiches (toutes valables, sinon rien : 400 avec la ligne et le champ) */
    importer: async (requete: Request, reponse: Response) => {
      let fiches: LieuSaisi[];
      try {
        fiches = lignesDe(requete, LIGNES_IMPORTEES).map((ligne, index) => {
          try {
            return lireLieuImporte(ligne);
          } catch (erreur) {
            if (erreur instanceof ChampInvalide) throw new ChampInvalide(`${index}.${erreur.champ}`);
            throw erreur;
          }
        });
      } catch (erreur) {
        if (erreur instanceof ChampInvalide) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: erreur.champ });
        throw erreur;
      }
      const resultat = await s.importerLieux(fiches);
      await noter(reponse, "Lieux importés (fichier CSV)", `${resultat.crees} fiche(s) en brouillon, ${resultat.placees} placée(s) par l'adresse`);
      reponse.status(201).json({ ok: true, ...resultat });
    },
  };
}
