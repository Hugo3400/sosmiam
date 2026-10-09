// L'état du comptoir d'un lieu, comme le verra l'équipe (mode pro de démo) : le QR affiché, les additions et
// récompenses en attente, et les validations encore annulables. Lecture seule : ne modifie pas le magasin.
import type { DemandeComptoir, EtatComptoir, ValidationRecente } from "@sos-miam/commun/types/comptoir";
import type { Lieu } from "@sos-miam/commun/types/lieu";

import { validationLieuxExemples } from "~/contenus/validation-lieux-exemples";
import { resumerLieu } from "~/fonctions/lieux/resumer-lieu";

import { construireQrDemo } from "./construire-qr-demo";
import { trouverClientDemo } from "./trouver-client-demo";
import type { ClientDemo, MagasinDemo } from "./types-demo";

// Au-delà, les validations récentes ne servent plus au comptoir (elles sont dans l'historique du lieu)
const VALIDEES_AFFICHEES = 10;

/** L'état du comptoir du lieu à cet instant ; `moi` sert seulement à afficher ton prénom si tu es le client */
export function calculerEtatComptoirDemo(m: Readonly<MagasinDemo>, lieu: Lieu, maintenantMs: number, moi: ClientDemo | null): EtatComptoir {
  const presentation = m.presentations.find(
    (p) => p.lieuId === lieu.id && !p.cachee && p.restantes > 0 && Date.parse(p.expireLe) > maintenantMs,
  );

  const tamponsDe = (cle: string) => m.cartes.find((c) => c.lieuId === lieu.id && c.client === cle)?.tampons ?? 0;

  const additions: DemandeComptoir[] = m.visites
    .filter((v) => v.lieuId === lieu.id && v.statut === "demandee" && v.code && (!v.expireLe || Date.parse(v.expireLe) > maintenantMs))
    .map((v) => {
      const client = trouverClientDemo(m, v.client, moi);
      return {
        id: v.id,
        type: "addition",
        code: v.code ?? "",
        prenom: client.prenom,
        initialeNom: client.initialeNom,
        avatar: client.avatar,
        depuis: v.creeLe,
        recompense: null,
        tamponsIci: tamponsDe(v.client),
      };
    });

  const recompenses: DemandeComptoir[] = m.cartes
    .filter((c) => c.lieuId === lieu.id && c.demande && Date.parse(c.demande.expireLe) > maintenantMs)
    .map((c) => {
      const demande = c.demande!;
      const client = trouverClientDemo(m, c.client, moi);
      return {
        id: demande.id,
        type: "recompense",
        code: demande.code,
        prenom: client.prenom,
        initialeNom: client.initialeNom,
        avatar: client.avatar,
        depuis: demande.creeLe,
        recompense: c.pretes.find((p) => p.id === demande.recompenseId)?.libelle ?? null,
        tamponsIci: c.tampons,
      };
    });

  const validees: ValidationRecente[] = m.visites
    .filter((v) => v.lieuId === lieu.id && v.statut === "validee" && v.valideLe && v.annulableJusqua && Date.parse(v.annulableJusqua) > maintenantMs)
    .sort((a, b) => (b.valideLe ?? "").localeCompare(a.valideLe ?? ""))
    .slice(0, VALIDEES_AFFICHEES)
    .map((v) => {
      const client = trouverClientDemo(m, v.client, moi);
      return {
        visiteId: v.id,
        mode: v.mode,
        prenom: client.prenom,
        initialeNom: client.initialeNom,
        avatar: client.avatar,
        valideLe: v.valideLe ?? v.creeLe,
        annulableJusqua: v.annulableJusqua ?? v.creeLe,
        reglement: null,
      };
    });

  return {
    lieu: resumerLieu(lieu),
    validationActive: validationLieuxExemples[lieu.id]?.validationActive ?? false,
    qr: presentation ? construireQrDemo(presentation, maintenantMs) : null,
    // Les plus anciennes d'abord : c'est l'ordre du passage en caisse
    demandes: [...additions, ...recompenses].sort((a, b) => a.depuis.localeCompare(b.depuis)),
    arrivees: [],
    reservationsARepondre: 0,
    validees,
    genereLe: new Date(maintenantMs).toISOString(),
  };
}
