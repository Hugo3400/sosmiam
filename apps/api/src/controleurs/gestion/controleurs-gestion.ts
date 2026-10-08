// Contrôleurs du logiciel de gestion : lecture de la demande, appel du service, réponse. Chaque modification
// est notée dans le journal de gestion, avec le nom du poste qui l'a faite.
import type { Request, Response } from "express";

import type { Echelle } from "../../fonctions/dates/lister-periodes.ts";
import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { TypeMedia } from "../../services/gestion/medias.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { ChampInvalide, lireChoix, lireDocumentEditeur, lireId, lireNombre, lireParametre, lireTexte } from "./lire-champs.ts";
import { lireIds, lireLieuSaisi, lireModificationLot } from "./lire-lieu.ts";
import { lirePublicationSaisie } from "./lire-publication.ts";
import type { OutilsComptes } from "./controleurs-ambassadeurs.ts";

const ECHELLES: Record<Echelle, { defaut: number; max: number }> = {
  jour: { defaut: 30, max: 400 },
  semaine: { defaut: 12, max: 110 },
  mois: { defaut: 12, max: 60 },
  annee: { defaut: 5, max: 20 },
};

const corpsDe = (requete: Request): Record<string, unknown> =>
  typeof requete.body === "object" && requete.body !== null && !Buffer.isBuffer(requete.body) ? requete.body : {};
const posteDe = (reponse: Response) => (reponse.locals.gestion as ContexteGestion).poste.nom;
const introuvable = (reponse: Response) => reponse.status(404).json({ ok: false, erreur: "introuvable" });

/** Enveloppe un contrôleur : un champ invalide donne une erreur 400 qui dit lequel. */
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

export function creerControleursGestion(s: ServicesGestion, comptes?: OutilsComptes) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction(posteDe(reponse), action, detail);

  return {
    tableauDeBord: verifier(async (_requete, reponse) => reponse.json(await s.lireTableauDeBord())),

    statistiques: verifier(async (requete, reponse) => {
      const echelle = lireChoix({ echelle: requete.query.echelle ?? "jour" }, "echelle", ["jour", "semaine", "mois", "annee"] as const);
      const source = lireChoix({ source: requete.query.source ?? "site" }, "source", ["site", "app"] as const);
      const demande = Number(requete.query.nombre);
      const nombre = Number.isInteger(demande) && demande > 0 ? Math.min(demande, ECHELLES[echelle].max) : ECHELLES[echelle].defaut;
      // « jusqua=AAAA-MM-JJ » : les périodes qui finissent à cette date (une semaine passée…), jamais dans le futur
      const jusqua = lireParametre(requete.query.jusqua, 10);
      const fin = /^\d{4}-\d{2}-\d{2}$/.test(jusqua) ? new Date(`${jusqua}T12:00:00Z`) : new Date();
      reponse.json(await s.lireStatistiques(source, echelle, nombre, Number.isNaN(fin.getTime()) || fin > new Date() ? new Date() : fin));
    }),

    objectif: verifier(async (_requete, reponse) => reponse.json(await s.lireObjectifMois())),
    fixerObjectif: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      if (corps.valeur === null) {
        await s.ecrireObjectifMois(null);
        await noter(reponse, "Objectif du mois retiré");
        return reponse.json({ ok: true });
      }
      const mesure = lireChoix(corps, "mesure", ["visiteurs", "vues", "inscriptions"] as const);
      const valeur = lireNombre(corps, "valeur", 1, 1e9);
      if (valeur === null) throw new ChampInvalide("valeur");
      await s.ecrireObjectifMois({ mesure, valeur });
      await noter(reponse, "Objectif du mois fixé", `${valeur} ${mesure}`);
      reponse.json({ ok: true });
    }),
    journal: verifier(async (requete, reponse) => reponse.json(await s.listerJournal(Math.max(1, lireId(requete.query.page) ?? 1)))),

    // ─── Newsletter ───
    inscrits: verifier(async (requete, reponse) => {
      reponse.json(
        await s.listerInscrits({
          recherche: lireParametre(requete.query.recherche),
          ville: lireParametre(requete.query.ville, 80),
          ambassadeur: requete.query.ambassadeur === "1",
          beta: requete.query.beta === "1",
          telephone: ["iphone", "android"].includes(String(requete.query.telephone)) ? String(requete.query.telephone) : "",
          aRelancer: requete.query.relance === "1",
          page: Math.max(1, lireId(requete.query.page) ?? 1),
        }),
      );
    }),
    desinscrire: verifier(async (requete, reponse) => {
      const id = lireId(requete.params.id);
      if (!id || !(await s.desinscrire(id))) return introuvable(reponse);
      await noter(reponse, "Inscrit désinscrit et effacé", `inscription n° ${id}`);
      reponse.json({ ok: true });
    }),
    exporter: verifier(async (_requete, reponse) => {
      const csv = await s.exporterInscrits();
      await noter(reponse, "Export des inscrits (CSV)");
      reponse.type("text/csv; charset=utf-8").send(`﻿${csv}`);
    }),
    boite: verifier(async (_requete, reponse) => reponse.json(await s.lireEtatBoite())),
    synchroniserBoite: verifier(async (_requete, reponse) => {
      const resultat = await s.synchroniserBoite();
      await noter(reponse, resultat.ok ? "Boîte mail synchronisée" : "Synchronisation de la boîte mail ratée");
      reponse.json(resultat);
    }),
    brouillons: verifier(async (_requete, reponse) => reponse.json(await s.listerBrouillons())),
    brouillon: verifier(async (requete, reponse) => {
      const brouillon = await s.lireBrouillon(lireId(requete.params.id) ?? 0);
      return brouillon ? reponse.json(brouillon) : introuvable(reponse);
    }),
    enregistrerBrouillon: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      const saisie = {
        objet: lireTexte(corps, "objet", 150, true),
        texte: typeof corps.texte === "string" ? corps.texte.slice(0, 20000) : "",
        ...(corps.contenu !== undefined ? { contenu: lireDocumentEditeur(corps.contenu) } : {}),
      };
      const id = requete.params.id === undefined ? null : lireId(requete.params.id);
      if (requete.params.id !== undefined && !id) return introuvable(reponse);
      const brouillon = id ? await s.modifierBrouillon(id, saisie) : await s.creerBrouillon(saisie);
      if (!brouillon) return introuvable(reponse);
      await noter(reponse, id ? "Newsletter modifiée" : "Newsletter créée", saisie.objet);
      reponse.status(id ? 200 : 201).json(brouillon);
    }),
    supprimerBrouillon: verifier(async (requete, reponse) => {
      const id = lireId(requete.params.id);
      if (!id || !(await s.supprimerBrouillon(id))) return introuvable(reponse);
      await noter(reponse, "Newsletter supprimée", `brouillon n° ${id}`);
      reponse.json({ ok: true });
    }),

    // ─── Lieux ───
    lieux: verifier(async (requete, reponse) =>
      reponse.json(await s.listerLieux({ recherche: lireParametre(requete.query.recherche), statut: lireParametre(requete.query.statut, 12) })),
    ),
    lieu: verifier(async (requete, reponse) => {
      const lieu = await s.lireLieu(lireId(requete.params.id) ?? 0);
      return lieu ? reponse.json(lieu) : introuvable(reponse);
    }),
    enregistrerLieu: verifier(async (requete, reponse) => {
      const saisie = lireLieuSaisi(corpsDe(requete));
      const id = requete.params.id === undefined ? null : lireId(requete.params.id);
      if (requete.params.id !== undefined && !id) return introuvable(reponse);
      const lieu = id ? await s.modifierLieu(id, saisie) : await s.creerLieu(saisie);
      if (!lieu) return introuvable(reponse);
      await noter(reponse, id ? "Lieu modifié" : "Lieu créé", `${lieu.nom} (n° ${lieu.id}, ${lieu.statut})`);
      reponse.status(id ? 200 : 201).json(lieu);
    }),
    /** POST /lieux/lot : { ids, action: « modifier » (avec les champs à changer) ou « supprimer » } */
    lotLieux: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      const ids = lireIds(corps);
      const action = lireChoix(corps, "action", ["modifier", "supprimer"] as const);
      if (action === "supprimer") {
        const nombre = await s.supprimerLieuxEnLot(ids);
        await noter(reponse, "Lieux supprimés en lot", `${nombre} lieu(x)`);
        return reponse.json({ ok: true, nombre });
      }
      const modification = lireModificationLot(typeof corps.modification === "object" && corps.modification !== null ? (corps.modification as Record<string, unknown>) : {});
      const nombre = await s.modifierLieuxEnLot(ids, modification);
      await noter(reponse, "Lieux modifiés en lot", `${nombre} lieu(x) : ${Object.entries(modification).map(([cle, valeur]) => `${cle} → ${valeur}`).join(", ")}`);
      reponse.json({ ok: true, nombre });
    }),
    supprimerLieu: verifier(async (requete, reponse) => {
      const supprime = await s.supprimerLieu(lireId(requete.params.id) ?? 0);
      if (!supprime) return introuvable(reponse);
      await noter(reponse, "Lieu supprimé", supprime.nom);
      reponse.json({ ok: true });
    }),

    // ─── Publications ───
    publications: verifier(async (requete, reponse) =>
      reponse.json(await s.listerPublications({ statut: lireParametre(requete.query.statut, 12), lieuId: lireId(requete.query.lieu) })),
    ),
    publication: verifier(async (requete, reponse) => {
      const publication = await s.lirePublication(lireId(requete.params.id) ?? 0);
      return publication ? reponse.json(publication) : introuvable(reponse);
    }),
    enregistrerPublication: verifier(async (requete, reponse) => {
      const saisie = lirePublicationSaisie(corpsDe(requete));
      const id = requete.params.id === undefined ? null : lireId(requete.params.id);
      if (requete.params.id !== undefined && !id) return introuvable(reponse);
      const publication = id ? await s.modifierPublication(id, saisie) : await s.creerPublication(saisie);
      if (!publication) return introuvable(reponse);
      await noter(reponse, id ? "Publication modifiée" : "Publication créée", `n° ${publication.id} (${publication.lieu.nom}, ${publication.statut})`);
      reponse.status(id ? 200 : 201).json(publication);
    }),
    supprimerPublication: verifier(async (requete, reponse) => {
      const id = lireId(requete.params.id);
      if (!id || !(await s.supprimerPublication(id))) return introuvable(reponse);
      await noter(reponse, "Publication supprimée", `n° ${id}`);
      reponse.json({ ok: true });
    }),
    ajouterMedia: verifier(async (requete, reponse) => {
      const id = lireId(requete.params.id);
      const type = lireChoix({ type: requete.query.type }, "type", ["video", "affiche", "photo"] as const) satisfies TypeMedia;
      if (!id || !Buffer.isBuffer(requete.body) || requete.body.length === 0) return reponse.status(400).json({ ok: false, erreur: "fichier-absent" });
      const resultat = await s.ajouterMedia(id, type, (requete.get("content-type") ?? "").split(";")[0]?.trim() ?? "", requete.body);
      if ("erreur" in resultat) return reponse.status(resultat.erreur === "publication-introuvable" ? 404 : 400).json({ ok: false, erreur: resultat.erreur });
      await noter(reponse, "Média ajouté", `publication n° ${id} (${type})`);
      reponse.status(201).json(resultat.media);
    }),
    retirerMedia: verifier(async (requete, reponse) => {
      const id = lireId(requete.params.id);
      const idMedia = lireId(requete.params.idMedia);
      if (!id || !idMedia || !(await s.retirerMedia(id, idMedia))) return introuvable(reponse);
      await noter(reponse, "Média retiré", `publication n° ${id}`);
      reponse.json({ ok: true });
    }),
    media: verifier(async (requete, reponse) => {
      const media = await s.trouverFichierMedia(String(requete.params.fichier));
      if (!media) return introuvable(reponse);
      reponse.sendFile(media.chemin, { headers: { "Content-Type": media.typeMime, "Cache-Control": "private, no-store" } });
    }),

    // ─── Modération ───
    signalements: verifier(async (requete, reponse) =>
      reponse.json(await s.listerSignalements(lireParametre(requete.query.statut, 10))),
    ),
    deciderSignalement: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      const decision = lireChoix(corps, "decision", ["retenu", "rejete"] as const);
      const resultat = await s.deciderSignalement(lireId(requete.params.id) ?? 0, decision, lireTexte(corps, "note", 500));
      if (!resultat) return introuvable(reponse);
      await noter(
        reponse,
        decision === "retenu" ? "Signalement retenu (contenu retiré)" : "Signalement rejeté",
        `${resultat.cible} n° ${resultat.cibleId}, ${resultat.regles} signalement(s) réglé(s)`,
      );
      reponse.json({ ok: true, ...resultat });
    }),

    // ─── Demandes de lieux ───
    demandes: verifier(async (requete, reponse) => reponse.json(await s.listerDemandes(lireParametre(requete.query.statut, 10)))),
    accepterDemande: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      const lieu = lireLieuSaisi(typeof corps.lieu === "object" && corps.lieu !== null ? (corps.lieu as Record<string, unknown>) : {});
      const cree = await s.accepterDemande(lireId(requete.params.id) ?? 0, lieu, lireTexte(corps, "reponse", 1000));
      if (!cree) return introuvable(reponse);
      // Lieu proposé par un ambassadeur : ses points (barème « proposer-lieu », +30) et le badge de son premier lieu
      if (cree.compteIdAuteur && comptes) {
        await comptes.ajouterPoints(cree.compteIdAuteur, 30, "proposer-lieu", cree.nom);
        await comptes.donnerBadge(cree.compteIdAuteur, "deniche-par-toi");
      }
      await noter(reponse, "Demande de lieu acceptée", `${cree.nom} (fiche n° ${cree.id}, ${cree.statut})`);
      reponse.status(201).json(cree);
    }),
    refuserDemande: verifier(async (requete, reponse) => {
      const id = lireId(requete.params.id);
      if (!id || !(await s.refuserDemande(id, lireTexte(corpsDe(requete), "reponse", 1000)))) return introuvable(reponse);
      await noter(reponse, "Demande de lieu refusée", `demande n° ${id}`);
      reponse.json({ ok: true });
    }),
    effacerContactDemande: verifier(async (requete, reponse) => {
      const id = lireId(requete.params.id);
      if (!id || !(await s.effacerContactDemande(id))) return introuvable(reponse);
      await noter(reponse, "Contact d'une demande effacé", `demande n° ${id}`);
      reponse.json({ ok: true });
    }),

    // ─── Annonces Discord ───
    annonces: verifier(async (_requete, reponse) => reponse.json(await s.listerAnnonces())),
    creerAnnonce: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      const annonce = await s.creerAnnonce(lireTexte(corps, "titre", 100, true), lireTexte(corps, "texte", 3500, true));
      await noter(reponse, "Annonce Discord envoyée au bot", annonce.titre);
      reponse.status(201).json(annonce);
    }),
    retirerAnnonce: verifier(async (requete, reponse) => {
      const id = lireId(requete.params.id);
      if (!id || !(await s.retirerAnnonce(id))) return introuvable(reponse);
      await noter(reponse, "Annonce Discord retirée", `annonce n° ${id}`);
      reponse.json({ ok: true });
    }),

    // ─── Sauvegardes et coordonnées ───
    sauvegardes: verifier(async (_requete, reponse) => reponse.json(await s.lireEtatSauvegardes())),
    sauvegarder: verifier(async (_requete, reponse) => {
      const sauvegarde = await s.sauvegarderBase();
      await noter(reponse, "Sauvegarde à la demande", sauvegarde.nom);
      reponse.status(201).json(sauvegarde);
    }),
    telechargerSauvegarde: verifier(async (requete, reponse) => {
      const chemin = await s.trouverSauvegarde(String(requete.params.nom));
      if (!chemin) return introuvable(reponse);
      await noter(reponse, "Sauvegarde téléchargée", String(requete.params.nom));
      reponse.sendFile(chemin, { headers: { "Content-Type": "application/octet-stream" } });
    }),
    geocodage: verifier(async (requete, reponse) => {
      const adresse = lireParametre(requete.query.adresse, 200);
      if (adresse.length < 3) return reponse.json([]);
      reponse.json(await s.chercherAdresse(adresse).catch(() => null) ?? []);
    }),

    // ─── Maintenance ───
    maintenance: verifier(async (_requete, reponse) => reponse.json(await s.lireEtatServeur())),
    relancer: verifier(async (requete, reponse) => {
      const nom = lireTexte(corpsDe(requete), "processus", 60, true);
      if (!(await s.relancerProcessus(nom))) return reponse.status(400).json({ ok: false, erreur: "processus-refuse" });
      await noter(reponse, "Processus relancé", nom);
      reponse.json({ ok: true });
    }),
  };
}
