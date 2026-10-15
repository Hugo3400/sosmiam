import type { ServiceAvis } from "@sos-miam/commun/client-api/contrat-avis";
import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import { calculerPointsPhotoAvis } from "@sos-miam/commun/fonctions/avis/calculer-points-photo-avis";
import { signerAvis } from "@sos-miam/commun/fonctions/avis/signer-avis";
import type { AvisPublic, NouvelAvis } from "@sos-miam/commun/types/avis";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { Visite } from "@sos-miam/commun/types/visite";
import { validerAvis } from "@sos-miam/commun/validation/valider-avis";

import { lieuxExemples } from "~/contenus/lieux-exemples";
import { convertirAvisDemo } from "~/fonctions/demo/convertir-avis-demo";
import { convertirVisiteDemo } from "~/fonctions/demo/convertir-visite-demo";

import { lirePageAvisDemo } from "./lire-page-avis-demo";
import { retenirPhotoAvisDemo } from "./photos-avis-demo";
import type { ClientDemo, ContexteDemo, MagasinDemo, VisiteDemo } from "./types-demo";

const VISITES_A_NOTER_MAX = 50;
const FORME_PHOTO_DEMO = /^demo-[a-z0-9]+\.jpg$/;

type ReponseEnvoi = ReponseApi<{ pointsGagnes: number; avis?: AvisPublic }>;

const trouverLieu = (id: number) => lieuxExemples.find((l) => l.id === id);
const plusRecentDabord = (a: { creeLe: string; id: number }, b: { creeLe: string; id: number }) => b.creeLe.localeCompare(a.creeLe) || b.id - a.id;

function refuserOuverture(v: VisiteDemo, maintenantMs: number): ErreurService | null {
  if (v.avisDonne) return "avis-deja-donne";
  if (v.statut !== "validee" || !v.avisOuvertLe || !v.avisFermeLe || maintenantMs < Date.parse(v.avisOuvertLe)) return "avis-pas-ouvert";
  if (maintenantMs >= Date.parse(v.avisFermeLe)) return "avis-ferme";
  return null;
}

function listerVisitesANoter(m: Readonly<MagasinDemo>, maintenantMs: number): Visite[] {
  const visites: Visite[] = [];
  for (const v of m.visites.filter((x) => x.client === "moi").sort(plusRecentDabord)) {
    const lieu = trouverLieu(v.lieuId);
    if (lieu && refuserOuverture(v, maintenantMs) === null) visites.push(convertirVisiteDemo(v, lieu));
  }
  return visites.slice(0, VISITES_A_NOTER_MAX);
}

function ecrireAvis(m: MagasinDemo, nouvel: NouvelAvis, client: ClientDemo, maintenantMs: number): ReponseEnvoi {
  const v = m.visites.find((x) => x.id === nouvel.visiteId && x.client === "moi");
  if (!v || !trouverLieu(v.lieuId)) return { ok: false, erreur: "introuvable" };
  const refus = refuserOuverture(v, maintenantMs);
  if (refus) return { ok: false, erreur: refus };
  const le = new Date(maintenantMs).toISOString();
  v.avisDonne = true;
  const avis = {
    id: m.prochainId++,
    visiteId: v.id,
    lieuId: v.lieuId,
    client: "moi" as const,
    signature: signerAvis(client.prenom, client.initialeNom),
    note: nouvel.note,
    texte: nouvel.texte.trim(),
    photo: nouvel.photo,
    preuve: v.mode,
    creeLe: le,
    statut: "publie" as const,
    reponseLieu: null,
  };
  m.avis.push(avis);
  const pointsGagnes = calculerPointsPhotoAvis({ verifie: true, avecPhoto: avis.photo !== null, repasOffert: v.reglement?.type === "offert" });
  if (pointsGagnes > 0) m.journal.push({ id: m.prochainId++, visiteId: v.id, avisId: avis.id, valeur: pointsGagnes, raison: "avis-photo", le });
  return { ok: true, pointsGagnes, avis: convertirAvisDemo(avis, v.reglement ?? null) };
}

export function creerAvisDemo(ctx: ContexteDemo): ServiceAvis {
  let photosDeposees = 0;
  return {
    async listerAvisAEcrire() {
      if (!ctx.lireClient()) return { ok: true, visites: [] };
      return ctx.magasin.lire((m, maintenantMs) => ({ ok: true, visites: listerVisitesANoter(m, maintenantMs) }));
    },

    async envoyerPhotoAvis(jpeg) {
      if (!ctx.lireClient()) return { ok: false, erreur: "connexion-requise" };
      photosDeposees += 1;
      const photo = `demo-${ctx.maintenant().toString(36)}${photosDeposees}.jpg`;
      retenirPhotoAvisDemo(photo, jpeg);
      return { ok: true, photo };
    },

    async envoyerAvis(nouvel) {
      const client = ctx.lireClient();
      if (!client) return { ok: false, erreur: "connexion-requise" };
      if (validerAvis(nouvel)) return { ok: false, erreur: "avis-invalide" };
      if (nouvel.photo !== null && !FORME_PHOTO_DEMO.test(nouvel.photo)) return { ok: false, erreur: "avis-invalide", champ: "photo" };
      return ctx.magasin.modifier((m, maintenantMs) => ecrireAvis(m, nouvel, client, maintenantMs));
    },

    async listerAvisLieu(lieuId, apres) {
      return ctx.magasin.lire((m) => ({ ok: true, ...lirePageAvisDemo(m, lieuId, apres) }));
    },
  };
}
