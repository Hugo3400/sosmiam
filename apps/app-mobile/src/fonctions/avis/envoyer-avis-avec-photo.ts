import type { ServiceAvis } from "@sos-miam/commun/client-api/contrat-avis";
import type { NoteAvis } from "@sos-miam/commun/types/avis";
import { validerAvis } from "@sos-miam/commun/validation/valider-avis";

import type { AvisEnvoye, EtapeEnvoiAvis, PhotoAvis, RefusEnvoiAvis } from "~/contenus/type-donner-avis";
import { classerRefusAvis } from "~/fonctions/avis/classer-refus-avis";

export type PhotoDeposee = { uri: string; nom: string };

export type SaisieEnvoiAvis = { visiteId: number; note: NoteAvis; texte: string; photo: PhotoAvis | null };

type Entree = {
  service: Pick<ServiceAvis, "envoyerAvis" | "envoyerPhotoAvis">;
  saisie: SaisieEnvoiAvis;
  deposee: PhotoDeposee | null;
  lireFichier: (uri: string) => Promise<Blob>;
  surEtape: (etape: EtapeEnvoiAvis) => void;
};

export type ResultatEnvoiAvis = { deposee: PhotoDeposee | null } & ({ ok: true; envoye: AvisEnvoye } | { ok: false; refus: RefusEnvoiAvis });

const HORS_LIGNE = { ok: false as const, erreur: "hors-ligne" as const };

async function deposer(e: Entree, photo: PhotoAvis): Promise<PhotoDeposee | RefusEnvoiAvis> {
  e.surEtape("photo");
  const fichier = await e.lireFichier(photo.uri).catch(() => null);
  if (!fichier) return { ou: "photo", erreur: "media-invalide" };
  const r = await e.service.envoyerPhotoAvis(fichier).catch(() => HORS_LIGNE);
  if (!r.ok) return classerRefusAvis(r, "photo");
  return { uri: photo.uri, nom: r.photo };
}

async function envoyerUneFois(e: Entree, dejaDeposee: PhotoDeposee | null): Promise<ResultatEnvoiAvis> {
  const { visiteId, note, texte, photo } = e.saisie;
  let deposee = dejaDeposee;
  if (photo && deposee?.uri !== photo.uri) {
    const essai = await deposer(e, photo);
    if (!("nom" in essai)) return { ok: false, refus: essai, deposee };
    deposee = essai;
  }
  e.surEtape("avis");
  const r = await e.service.envoyerAvis({ visiteId, note, texte: texte.trim(), photo: photo && deposee ? deposee.nom : null }).catch(() => HORS_LIGNE);
  if (r.ok) return { ok: true, envoye: { avis: r.avis ?? null, pointsGagnes: r.pointsGagnes }, deposee };
  const refus = classerRefusAvis(r, "avis");
  return { ok: false, refus, deposee: refus.ou === "photo" ? null : deposee };
}

export async function envoyerAvisAvecPhoto(e: Entree): Promise<ResultatEnvoiAvis> {
  const { visiteId, note, texte, photo } = e.saisie;
  if (validerAvis({ visiteId, note, texte, photo: null })) return { ok: false, refus: { ou: "texte" }, deposee: e.deposee };
  const reprise = photo !== null && e.deposee?.uri === photo.uri;
  const premier = await envoyerUneFois(e, e.deposee);
  if (premier.ok || !reprise || premier.refus.ou !== "photo") return premier;
  return envoyerUneFois(e, null);
}
