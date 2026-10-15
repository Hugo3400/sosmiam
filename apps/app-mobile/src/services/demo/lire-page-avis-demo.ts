import { resumerAvis } from "@sos-miam/commun/fonctions/avis/resumer-avis";
import { calculerJourParis } from "@sos-miam/commun/fonctions/temps/calculer-jour-paris";
import type { PageAvisLieu } from "@sos-miam/commun/types/avis";

import { convertirAvisDemo } from "~/fonctions/demo/convertir-avis-demo";

import type { MagasinDemo } from "./types-demo";

const AVIS_PAR_PAGE = 30;

const plusRecentDabord = (a: { creeLe: string; id: number }, b: { creeLe: string; id: number }) => b.creeLe.localeCompare(a.creeLe) || b.id - a.id;

export function lirePageAvisDemo(m: Readonly<MagasinDemo>, lieuId: number, apres: string | null | undefined): PageAvisLieu {
  const reglementDe = (visiteId: number | null) => m.visites.find((v) => v.id === visiteId)?.reglement ?? null;
  const visibles = m.avis.filter((a) => a.lieuId === lieuId && a.statut !== "masque").sort(plusRecentDabord);
  const clients = m.visites
    .filter((v) => v.lieuId === lieuId && v.statut === "validee" && v.valideLe)
    .map((v) => ({ client: v.client, jour: calculerJourParis(Date.parse(v.valideLe ?? "")) }));
  const debut = apres ? visibles.findIndex((a) => String(a.id) === apres) + 1 : 0;
  const page = visibles.slice(debut, debut + AVIS_PAR_PAGE);
  const suite = debut + AVIS_PAR_PAGE < visibles.length && page.length > 0 ? String(page[page.length - 1].id) : null;
  return {
    resume: resumerAvis(visibles.map((a) => a.note), clients),
    avis: page.map((a) => convertirAvisDemo(a, reglementDe(a.visiteId))),
    suite,
  };
}
