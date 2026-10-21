import { randomUUID } from "node:crypto";

import { PART_LIBRE_MIN_DISQUE } from "../../../../packages/commun/src/regles/chat.ts";
import type { EntreeTableauHonneur, NouveauSignalementSecurite } from "../../../../packages/commun/src/types/securite.ts";
import { lireNouveauSignalement } from "../fonctions/chasse-aux-bugs/lire-nouveau-signalement.ts";
import { preparerImageSignalement } from "../fonctions/chasse-aux-bugs/preparer-image-signalement.ts";
import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import {
  ENTREES_TABLEAU_MAX, FENETRE_SIGNALEMENTS_EMAIL_MS, SIGNALEMENTS_PAR_EMAIL,
  type DependancesSecurite, type IssueAjoutSignalement, type ResultatDepotSignalement,
} from "./securite-regles.ts";

export function creerSecuritePublics({ depot, stockage, chiffrement, nettoyerJpeg, horloge = Date.now }: DependancesSecurite) {
  const calculerAttente = (depots: Date[], quand: Date) => {
    const tries = depots.map((d) => d.getTime()).sort((a, b) => a - b);
    const libere = tries[tries.length - SIGNALEMENTS_PAR_EMAIL] ?? quand.getTime();
    return Math.max(1, Math.ceil((libere + FENETRE_SIGNALEMENTS_EMAIL_MS - quand.getTime()) / 1000));
  };

  const jeter = (fichiers: string[]) => (fichiers.length > 0 ? stockage.supprimer(fichiers).catch(() => 0) : Promise.resolve(0));

  return {
    async deposerSignalement(envoye: NouveauSignalementSecurite, quand = new Date(horloge())): Promise<ResultatDepotSignalement> {
      const lecture = lireNouveauSignalement(envoye);
      if (!lecture.ok) return lecture;
      const s = lecture.signalement;
      if (!chiffrement) return { ok: false, erreur: "chiffrement-indisponible" };
      const emailEmpreinte = chiffrement.calculerEmpreinteEmail(s.email);
      const limite = { depuis: new Date(quand.getTime() - FENETRE_SIGNALEMENTS_EMAIL_MS), maximum: SIGNALEMENTS_PAR_EMAIL };
      const recents = await depot.listerDepotsEmail(emailEmpreinte, limite.depuis);
      if (recents.length >= SIGNALEMENTS_PAR_EMAIL) return { ok: false, erreur: "trop-de-demandes", reessayerDans: calculerAttente(recents, quand) };
      const propres: Buffer[] = [];
      for (const image of s.images) {
        const preparee = await preparerImageSignalement(image, nettoyerJpeg);
        if (!preparee.ok) return { ok: false, erreur: preparee.erreur };
        propres.push(preparee.octets);
      }
      const id = randomUUID();
      const images: string[] = [];
      if (propres.length > 0 && !((await stockage.lirePartLibre()) >= PART_LIBRE_MIN_DISQUE)) return { ok: false, erreur: "stockage-plein" };
      let issue: IssueAjoutSignalement;
      try {
        for (const octets of propres) {
          const fichier = stockage.tirerNom();
          await stockage.ecrire(fichier, chiffrement.chiffrerImage(octets, id, fichier));
          images.push(fichier);
        }
        issue = await depot.ajouterSignalement({
          id,
          nomChiffre: chiffrement.chiffrerTexte(s.nom, id, "nom"),
          emailChiffre: chiffrement.chiffrerTexte(s.email, id, "email"),
          emailEmpreinte,
          cible: s.cible,
          titreChiffre: chiffrement.chiffrerTexte(s.titre, id, "titre"),
          descriptionChiffree: chiffrement.chiffrerTexte(s.description, id, "description"),
          lienChiffre: s.lien ? chiffrement.chiffrerTexte(s.lien, id, "lien") : null,
          images,
          nomTableauChiffre: s.nomTableauHonneur ? chiffrement.chiffrerTexte(s.nomTableauHonneur, id, "nomTableauHonneur") : null,
          statut: "nouveau",
          gravite: null,
          creeLe: quand,
          clotureLe: null,
          badgeDonneLe: null,
        }, limite);
      } catch (erreur) {
        await jeter(images);
        throw new Error(`Signalement de sécurité non enregistré : ${resumerErreur(erreur)}`);
      }
      if (issue.ok) return { ok: true };
      await jeter(images);
      return { ok: false, erreur: "trop-de-demandes", reessayerDans: calculerAttente(issue.depots, quand) };
    },

    async listerTableauHonneur(): Promise<EntreeTableauHonneur[]> {
      return (await depot.listerTableauHonneur(ENTREES_TABLEAU_MAX)).map((e) => ({ nom: e.nom, mois: e.mois }));
    },
  };
}
