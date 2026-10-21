import { randomUUID } from "node:crypto";

import { PART_LIBRE_MIN_DISQUE } from "../../../../packages/commun/src/regles/chat.ts";
import type { CandidatureGestion, NouvelleCandidature, StatutCandidature } from "../../../../packages/commun/src/types/carriere.ts";
import { calculerEffacementCandidature } from "../fonctions/carriere/calculer-effacement-candidature.ts";
import { decoderCvPdf } from "../fonctions/carriere/decoder-cv-pdf.ts";
import { estOffreOuverte } from "../fonctions/carriere/est-offre-ouverte.ts";
import { lireIdOffre } from "../fonctions/carriere/lire-id-offre.ts";
import { lireNouvelleCandidature } from "../fonctions/carriere/lire-nouvelle-candidature.ts";
import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import {
  CANDIDATURES_PAR_EMAIL, CANDIDATURES_PAR_LISTE, CV_OCTETS_MAX, DELAI_ORPHELIN_CV_MS, DUREE_CONSERVATION_CANDIDATURE_MS,
  FENETRE_CANDIDATURES_EMAIL_MS, FICHIERS_PAR_PASSAGE, FORME_ID_CANDIDATURE, STATUTS_CANDIDATURE, TEXTE_ILLISIBLE,
  type BilanMenageCarriere, type CandidatureEnBase, type ChiffresCandidature, type DependancesCarriere, type FiltresCandidatures, type IssueAjoutCandidature,
  type ResultatDepotCandidature, type ResultatStatutCandidature,
} from "./carriere-regles.ts";
import type { ChampCandidature, ChiffrementCarriere } from "./chiffrement-carriere.ts";

type IssueRechiffrement = "rechiffree" | "illisible" | "a-jour";

export function creerCandidaturesCarriere({ depot, stockage, chiffrement, horloge = Date.now }: DependancesCarriere) {
  const maintenant = () => new Date(horloge());

  const dechiffrer = (chiffre: string, id: string, champ: ChampCandidature) => {
    if (!chiffrement) return TEXTE_ILLISIBLE;
    try {
      return chiffrement.dechiffrerTexte(chiffre, id, champ);
    } catch {
      return TEXTE_ILLISIBLE;
    }
  };

  const calculerAttente = (depots: Date[], quand: Date) => {
    const tries = depots.map((d) => d.getTime()).sort((a, b) => a - b);
    const libere = tries[tries.length - CANDIDATURES_PAR_EMAIL] ?? quand.getTime();
    return Math.max(1, Math.ceil((libere + FENETRE_CANDIDATURES_EMAIL_MS - quand.getTime()) / 1000));
  };

  async function effacerOrphelins(quand: Date): Promise<number> {
    const limite = quand.getTime() - DELAI_ORPHELIN_CV_MS;
    let effaces = 0;
    let apres: string | null = null;
    for (;;) {
      const paquet = await stockage.lister(apres, FICHIERS_PAR_PASSAGE);
      if (paquet.length === 0) return effaces;
      apres = paquet[paquet.length - 1]!.fichier;
      const vieux = paquet.filter((f) => f.modifieLe.getTime() < limite).map((f) => f.fichier);
      if (vieux.length === 0) continue;
      const cites = await depot.listerCvCites(vieux);
      effaces += await stockage.supprimer(vieux.filter((fichier) => !cites.has(fichier)));
    }
  }

  async function rechiffrerUne(c: CandidatureEnBase, ch: ChiffrementCarriere): Promise<IssueRechiffrement> {
    const textes = [c.nomChiffre, c.emailChiffre, c.messageChiffre, ...(c.lienChiffre ? [c.lienChiffre] : [])];
    const cvChiffre = c.cvFichier ? await stockage.lire(c.cvFichier) : null;
    const cvAncien = cvChiffre !== null && ch.estAncienCv(cvChiffre);
    if (!cvAncien && !textes.some((texte) => ch.estAncien(texte))) return "a-jour";
    const relire = (chiffre: string, champ: ChampCandidature) => ch.chiffrerTexte(ch.dechiffrerTexte(chiffre, c.id, champ), c.id, champ);
    let chiffres: ChiffresCandidature;
    let cvClair: Buffer | null = null;
    try {
      chiffres = {
        nomChiffre: relire(c.nomChiffre, "nom"),
        emailChiffre: relire(c.emailChiffre, "email"),
        messageChiffre: relire(c.messageChiffre, "message"),
        lienChiffre: c.lienChiffre ? relire(c.lienChiffre, "lien") : null,
        cvFichier: c.cvFichier,
      };
      if (cvAncien && cvChiffre && c.cvFichier) cvClair = ch.dechiffrerCv(cvChiffre, c.id, c.cvFichier);
    } catch {
      return "illisible";
    }
    if (cvClair) {
      chiffres.cvFichier = stockage.tirerNom();
      await stockage.ecrire(chiffres.cvFichier, ch.chiffrerCv(cvClair, c.id, chiffres.cvFichier));
    }
    const remplace = await depot.remplacerChiffres(c.id, c.cvFichier, chiffres);
    const aJeter = remplace ? c.cvFichier : chiffres.cvFichier;
    if (aJeter && chiffres.cvFichier !== c.cvFichier) await stockage.supprimer([aJeter]);
    return remplace ? "rechiffree" : "a-jour";
  }

  async function rechiffrer(): Promise<{ rechiffrees: number; illisibles: number }> {
    const bilan = { rechiffrees: 0, illisibles: 0 };
    if (!chiffrement || !chiffrement.aDesAnciennesCles()) return bilan;
    let apres: string | null = null;
    for (;;) {
      const paquet = await depot.listerCandidaturesApres(apres, FICHIERS_PAR_PASSAGE);
      if (paquet.length === 0) return bilan;
      apres = paquet[paquet.length - 1]!.id;
      for (const candidature of paquet) {
        const issue = await rechiffrerUne(candidature, chiffrement);
        if (issue === "rechiffree") bilan.rechiffrees++;
        if (issue === "illisible") bilan.illisibles++;
      }
    }
  }

  return {
    async deposerCandidature(offreId: string, envoyee: NouvelleCandidature, quand = maintenant()): Promise<ResultatDepotCandidature> {
      const lecture = lireNouvelleCandidature(envoyee);
      if (!lecture.ok) return { ok: false, erreur: "champ-invalide", champ: lecture.champ };
      const candidature = lecture.candidature;
      const id = lireIdOffre(offreId);
      const offre = id === null ? null : await depot.lireOffre(id);
      if (!offre || offre.publieeLe === null || offre.publieeLe.getTime() > quand.getTime()) return { ok: false, erreur: "offre-inconnue" };
      if (!estOffreOuverte(offre, quand)) return { ok: false, erreur: "offre-fermee" };
      const cv = candidature.cv ? decoderCvPdf(candidature.cv, CV_OCTETS_MAX) : null;
      if (cv && !cv.ok) return { ok: false, erreur: cv.erreur };
      if (!chiffrement) return { ok: false, erreur: "chiffrement-indisponible" };
      const emailEmpreinte = chiffrement.calculerEmpreinteEmail(candidature.email);
      const limite = { depuis: new Date(quand.getTime() - FENETRE_CANDIDATURES_EMAIL_MS), maximum: CANDIDATURES_PAR_EMAIL };
      const recents = await depot.listerDepotsEmail(emailEmpreinte, limite.depuis);
      if (recents.length >= CANDIDATURES_PAR_EMAIL) return { ok: false, erreur: "trop-de-demandes", reessayerDans: calculerAttente(recents, quand) };
      const candidatureId = randomUUID();
      let cvFichier: string | null = null;
      if (cv) {
        if (!((await stockage.lirePartLibre()) >= PART_LIBRE_MIN_DISQUE)) return { ok: false, erreur: "stockage-plein" };
        cvFichier = stockage.tirerNom();
        await stockage.ecrire(cvFichier, chiffrement.chiffrerCv(cv.octets, candidatureId, cvFichier));
      }
      let issue: IssueAjoutCandidature;
      try {
        issue = await depot.ajouterCandidature({
          id: candidatureId,
          offreId: offre.id,
          nomChiffre: chiffrement.chiffrerTexte(candidature.nom, candidatureId, "nom"),
          emailChiffre: chiffrement.chiffrerTexte(candidature.email, candidatureId, "email"),
          emailEmpreinte,
          messageChiffre: chiffrement.chiffrerTexte(candidature.message, candidatureId, "message"),
          lienChiffre: candidature.lien ? chiffrement.chiffrerTexte(candidature.lien, candidatureId, "lien") : null,
          cvFichier,
          statut: "nouvelle",
          creeLe: quand,
          lueLe: null,
        }, limite);
      } catch (erreur) {
        if (cvFichier) await stockage.supprimer([cvFichier]).catch(() => 0);
        throw new Error(`Candidature non enregistrée : ${resumerErreur(erreur)}`);
      }
      if (issue.ok) return { ok: true };
      if (cvFichier) await stockage.supprimer([cvFichier]).catch(() => 0);
      return { ok: false, erreur: "trop-de-demandes", reessayerDans: calculerAttente(issue.depots, quand) };
    },

    async listerCandidatures(filtres: FiltresCandidatures = {}): Promise<CandidatureGestion[]> {
      const offreId = filtres.offreId === undefined ? undefined : lireIdOffre(filtres.offreId);
      if (offreId === null) return [];
      if (filtres.statut !== undefined && !STATUTS_CANDIDATURE.includes(filtres.statut)) return [];
      const lignes = await depot.listerCandidatures({ offreId, statut: filtres.statut }, CANDIDATURES_PAR_LISTE);
      return lignes.map((c) => ({
        id: c.id,
        offreId: String(c.offreId),
        offreTitre: c.offreTitre,
        nom: dechiffrer(c.nomChiffre, c.id, "nom"),
        email: dechiffrer(c.emailChiffre, c.id, "email"),
        message: dechiffrer(c.messageChiffre, c.id, "message"),
        lien: c.lienChiffre ? dechiffrer(c.lienChiffre, c.id, "lien") : null,
        aUnCv: c.cvFichier !== null,
        statut: c.statut,
        creeLe: c.creeLe.toISOString(),
        effaceeLe: calculerEffacementCandidature(c.creeLe).toISOString(),
      }));
    },

    async lireCvCandidature(id: string): Promise<Buffer | null> {
      if (!chiffrement || !FORME_ID_CANDIDATURE.test(id)) return null;
      const candidature = await depot.lireCandidature(id);
      if (!candidature?.cvFichier) return null;
      const chiffre = await stockage.lire(candidature.cvFichier);
      if (!chiffre) return null;
      try {
        return chiffrement.dechiffrerCv(chiffre, candidature.id, candidature.cvFichier);
      } catch {
        return null;
      }
    },

    async changerStatutCandidature(id: string, statut: unknown, quand = maintenant()): Promise<ResultatStatutCandidature> {
      if (!STATUTS_CANDIDATURE.includes(statut as StatutCandidature)) return { ok: false, erreur: "champ-invalide" };
      const candidature = FORME_ID_CANDIDATURE.test(id) ? await depot.lireCandidature(id) : null;
      if (!candidature) return { ok: false, erreur: "candidature-inconnue" };
      const lueLe = statut === "nouvelle" ? null : (candidature.lueLe ?? quand);
      return (await depot.changerStatut(id, statut as StatutCandidature, lueLe)) ? { ok: true } : { ok: false, erreur: "candidature-inconnue" };
    },

    async supprimerCandidature(id: string): Promise<boolean> {
      if (!FORME_ID_CANDIDATURE.test(id)) return false;
      const supprimee = await depot.supprimerCandidature(id);
      if (!supprimee) return false;
      if (supprimee.cvFichier) await stockage.supprimer([supprimee.cvFichier]).catch(() => 0);
      return true;
    },

    async menager(quand = maintenant()): Promise<BilanMenageCarriere> {
      const anciennes = await depot.effacerCandidaturesAvant(new Date(quand.getTime() - DUREE_CONSERVATION_CANDIDATURE_MS));
      const cv = await stockage.supprimer(anciennes.cvFichiers);
      const orphelins = await effacerOrphelins(quand);
      const { rechiffrees, illisibles } = await rechiffrer();
      return { candidatures: anciennes.nombre, cv, orphelins, rechiffrees, illisibles };
    },
  };
}
