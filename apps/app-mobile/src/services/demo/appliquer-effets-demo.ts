// Ce que le faux serveur fait des effets d'une visite décidée (fonctions de commun) : points au journal, tampon sur la
// carte, dates de l'avis. Les effets « controle » (alertes anti-triche) sont ignorés en démo.
import { appliquerTampon } from "@sos-miam/commun/fonctions/fidelite/appliquer-tampon";
import { estRecompenseAlcool } from "@sos-miam/commun/fonctions/fidelite/est-recompense-alcool";
import type { EffetVisite } from "@sos-miam/commun/types/visite";

import type { CarteDemo, MagasinDemo, VisiteDemo } from "./types-demo";

/** Pose ou retire le tampon de la visite ; vrai si la carte vient de se remplir (récompense principale figée) */
function changerTampon(m: MagasinDemo, v: VisiteDemo, delta: 1 | -1, maintenantMs: number): boolean {
  const programme = m.programmes.find((p) => p.lieuId === v.lieuId);
  let carte = m.cartes.find((c) => c.lieuId === v.lieuId && c.client === v.client);
  if (delta === 1 && (!programme || !programme.actif)) {
    v.tampon = false;
    return false;
  }
  if (!programme || (delta === -1 && !carte)) {
    v.tampon = false;
    return false;
  }
  if (!carte) {
    const nouvelle: CarteDemo = { lieuId: v.lieuId, client: v.client, tampons: 0, pretes: [], demande: null };
    m.cartes.push(nouvelle);
    carte = nouvelle;
  }
  const resultat = appliquerTampon(
    { tampons: carte.tampons, pretes: carte.pretes },
    programme,
    delta,
    // L'alcool est figé avec la récompense : si le lieu change ensuite de programme, le message sanitaire reste juste
    { id: m.prochainId, libelle: programme.recompense, alcool: estRecompenseAlcool(programme) },
    maintenantMs,
  );
  if (resultat.recompenseGagnee) m.prochainId += 1;
  carte.tampons = resultat.carte.tampons;
  carte.pretes = resultat.carte.pretes;
  v.tampon = delta === 1;
  return resultat.recompenseGagnee;
}

/**
 * Applique au magasin les effets d'une visite qui vient d'être décidée (validée, retirée…). Le journal des points ne
 * concerne que « moi » (les figurants n'ont pas de points sur ce téléphone). La récompense figée est la même pour tous.
 */
export function appliquerEffetsVisite(
  m: MagasinDemo,
  v: VisiteDemo,
  effets: EffetVisite[],
  maintenantMs: number,
): { recompenseGagnee: boolean } {
  let recompenseGagnee = false;
  const le = new Date(maintenantMs).toISOString();
  for (const effet of effets) {
    switch (effet.type) {
      case "points":
        if (v.client === "moi") {
          m.journal.push({ id: m.prochainId, visiteId: v.id, avisId: null, valeur: effet.valeur, raison: effet.raison, le });
          m.prochainId += 1;
        }
        break;
      case "tampon":
        if (changerTampon(m, v, effet.delta, maintenantMs)) recompenseGagnee = true;
        break;
      case "ouvrir-avis":
        v.avisOuvertLe = effet.ouvertLe;
        v.avisFermeLe = effet.fermeLe;
        break;
      case "masquer-avis":
        v.avisOuvertLe = null;
        v.avisFermeLe = null;
        for (const avis of m.avis) if (avis.visiteId === v.id) avis.statut = "masque";
        break;
      case "controle":
        break;
    }
  }
  return { recompenseGagnee };
}
