// Ce que l'app lit sans session : les lieux publiés, leur carte, le fil « Pour toi » et ses médias (voir routes/contenu-app.ts).
import { join } from "node:path";

import type { Request, Response } from "express";

import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import { FORME_CODE_PUBLIC, type ServicesLieuxApp, type ZoneLieux } from "../services/lieux-app-regles.ts";
import { PUBLICATIONS_PAR_PAGE, PUBLICATIONS_PAR_PAGE_MAX, type CurseurFil, type ServicesPublicationsApp } from "../services/publications-app-regles.ts";

export type DependancesContenuApp = {
  lieux?: ServicesLieuxApp;
  publications?: ServicesPublicationsApp;
  /** Le dossier des fichiers de médias (DOSSIER_MEDIAS) */
  dossierMedias: string;
  /** Pour les tests : une fausse horloge */
  horloge?: () => number;
};

const refuser = (reponse: Response, champ: string) => reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ });

/** Un nombre lu dans l'adresse (?nord=43.7), entre deux bornes ; null s'il manque ou ne va pas */
function lireNombre(brut: unknown, min: number, max: number): number | null {
  if (typeof brut !== "string" || brut.trim() === "") return null;
  const n = Number(brut);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

/** La zone demandée : les quatre bords ou aucun ; undefined si elle ne va pas */
function lireZone(q: Request["query"]): ZoneLieux | null | undefined {
  const bords = [q.nord, q.sud, q.ouest, q.est];
  if (bords.every((b) => b === undefined)) return null;
  const [nord, sud, ouest, est] = [lireNombre(q.nord, -90, 90), lireNombre(q.sud, -90, 90), lireNombre(q.ouest, -180, 180), lireNombre(q.est, -180, 180)];
  if (nord === null || sud === null || ouest === null || est === null || sud >= nord || ouest >= est) return undefined;
  return { nord, sud, ouest, est };
}

/** Le curseur du fil (« 2026-10-09T10:00:00.000Z_12 ») ; null s'il n'y en a pas, undefined s'il ne va pas */
function lireCurseur(brut: unknown): CurseurFil | null | undefined {
  if (brut === undefined) return null;
  if (typeof brut !== "string") return undefined;
  const morceaux = /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)_([1-9]\d{0,8})$/.exec(brut);
  if (!morceaux) return undefined;
  const publieeLe = new Date(morceaux[1]);
  return Number.isNaN(publieeLe.getTime()) ? undefined : { publieeLe, id: Number(morceaux[2]) };
}

export function creerControleursContenuApp({ lieux, publications, dossierMedias, horloge = Date.now }: DependancesContenuApp) {
  const maintenant = () => new Date(horloge());

  return {
    /** GET /app/lieux */
    async listerLieux(requete: Request, reponse: Response) {
      const zone = lireZone(requete.query);
      if (zone === undefined) return refuser(reponse, "zone");
      const liste = await lieux!.listerLieux(zone, maintenant());
      reponse.set("Cache-Control", "public, max-age=60").json({ ok: true, lieux: liste });
    },

    /** GET /app/lieux/:id */
    async lireLieu(requete: Request, reponse: Response) {
      const id = lireIdentifiant(requete.params.id);
      const lieu = id === null ? null : await lieux!.lireLieu(id, maintenant());
      if (!lieu) return reponse.status(404).json({ ok: false, erreur: "lieu-inconnu" });
      reponse.set("Cache-Control", "public, max-age=60").json({ ok: true, lieu });
    },

    /** GET /app/lieux/code/:code : le QR de vitrine scanné (ou ouvert depuis sosmiam.fr/l/<code>) */
    async trouverParCode(requete: Request, reponse: Response) {
      const code = String(requete.params.code);
      const lieuId = FORME_CODE_PUBLIC.test(code) ? await lieux!.trouverParCode(code) : null;
      if (lieuId === null) return reponse.status(404).json({ ok: false, erreur: "lieu-inconnu" });
      reponse.set("Cache-Control", "public, max-age=300").json({ ok: true, lieuId });
    },

    /** GET /app/lieux/:id/carte */
    async lireCarte(requete: Request, reponse: Response) {
      const id = lireIdentifiant(requete.params.id);
      const lue = id === null ? null : await lieux!.lireCarte(id);
      if (!lue) return reponse.status(404).json({ ok: false, erreur: "lieu-inconnu" });
      reponse.set("Cache-Control", "public, max-age=60").json({ ok: true, carte: lue.carte, majLe: lue.majLe });
    },

    /** GET /app/publications */
    async listerPublications(requete: Request, reponse: Response) {
      const apres = lireCurseur(requete.query.apres);
      if (apres === undefined) return refuser(reponse, "apres");
      const limite = requete.query.limite === undefined ? PUBLICATIONS_PAR_PAGE : lireNombre(requete.query.limite, 1, PUBLICATIONS_PAR_PAGE_MAX);
      if (limite === null || !Number.isInteger(limite)) return refuser(reponse, "limite");
      const page = await publications!.lister(apres, limite, maintenant());
      reponse.set("Cache-Control", "public, max-age=30").json({
        ok: true,
        publications: page.publications,
        suite: page.suite ? `${page.suite.publieeLe.toISOString()}_${page.suite.id}` : null,
      });
    },

    /** GET /app/medias/:fichier */
    async lireMedia(requete: Request, reponse: Response) {
      const fichier = String(requete.params.fichier);
      const media = await publications!.lireMedia(fichier, maintenant());
      if (!media) return reponse.status(404).json({ ok: false, erreur: "media-inconnu" });
      // Cache court : une publication suspendue ne doit pas rester servie longtemps (Cloudflare garde aussi les fichiers)
      reponse.sendFile(join(dossierMedias, fichier), { headers: { "Content-Type": media.typeMime, "Cache-Control": "public, max-age=300" } }, (erreur) => {
        if (erreur && !reponse.headersSent) reponse.status(404).json({ ok: false, erreur: "media-inconnu" });
      });
    },
  };
}
