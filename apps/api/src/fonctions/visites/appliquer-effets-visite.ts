import { appliquerTampon } from "../../../../../packages/commun/src/fonctions/fidelite/appliquer-tampon.ts";
import { choisirRecompenseAffichee } from "../../../../../packages/commun/src/fonctions/fidelite/choisir-recompense-affichee.ts";
import { estRecompenseAlcool } from "../../../../../packages/commun/src/fonctions/fidelite/est-recompense-alcool.ts";
import type { EffetVisite } from "../../../../../packages/commun/src/types/visite.ts";
import type { ChampsVisite, LigneVisite, TablesVisites } from "../../services/visites-regles.ts";

/** Points à ajouter (ou retirer) au compte de la visite, une fois la transaction finie (ajouterPoints de services/comptes.ts) */
export type PointsVisite = { valeur: number; raison: "visite" | "visite-sos"; detail: string };

export type EffetsAppliques = { champs: ChampsVisite; points: PointsVisite[]; recompenseGagnee: boolean; controles: ("refus-lieu" | "annulation-lieu")[] };

/**
 * Applique, dans la transaction, les effets d'une visite qui vient d'être décidée (faireEvoluerVisite, packages/commun) :
 * tampon sur la carte (récompense figée quand elle se remplit, selon l'âge du client), dates de l'avis. Rend ce qu'il
 * reste à écrire sur la visite, et les points et contrôles que l'appelant traite après. `majeur` : le client de la visite.
 */
export async function appliquerEffetsVisite(t: TablesVisites, v: LigneVisite, effets: EffetVisite[], maintenant: Date, majeur: boolean): Promise<EffetsAppliques> {
  const resultat: EffetsAppliques = { champs: {}, points: [], recompenseGagnee: false, controles: [] };
  for (const effet of effets) {
    if (effet.type === "points") {
      // Une visite retirée rend ses points sous la raison qui les avait donnés
      const raison = effet.raison === "annulation-visite" ? (v.pendantSos ? "visite-sos" : "visite") : effet.raison;
      resultat.points.push({ valeur: effet.valeur, raison, detail: `${effet.raison === "annulation-visite" ? "visite retirée" : "visite"} ${v.id}, lieu ${v.lieuId}` });
    } else if (effet.type === "tampon") {
      const tampon = await changerTampon(t, v, effet.delta, maintenant, majeur);
      resultat.champs.tampon = tampon.pose;
      if (tampon.recompenseGagnee) resultat.recompenseGagnee = true;
    } else if (effet.type === "ouvrir-avis") {
      resultat.champs.avisOuvertLe = new Date(effet.ouvertLe);
      resultat.champs.avisFermeLe = new Date(effet.fermeLe);
    } else if (effet.type === "masquer-avis") {
      resultat.champs.avisOuvertLe = null;
      resultat.champs.avisFermeLe = null;
    } else {
      resultat.controles.push(effet.motif);
    }
  }
  return resultat;
}

/** Pose ou retire le tampon de la visite ; `pose` : la visite porte un tampon après coup */
async function changerTampon(t: TablesVisites, v: LigneVisite, delta: 1 | -1, maintenant: Date, majeur: boolean) {
  const programme = await t.lireProgramme(v.lieuId);
  const libelle = programme ? choisirRecompenseAffichee(programme, majeur) : null;
  if (!programme || (delta === 1 && (!programme.actif || libelle === null))) return { pose: false, recompenseGagnee: false };
  let carte = await t.lireCarte(v.compteId, v.lieuId, maintenant);
  if (!carte && delta === -1) return { pose: false, recompenseGagnee: false };
  carte ??= await t.creerCarte(v.compteId, v.lieuId, maintenant);
  // L'alcool est figé avec la récompense : si le lieu change ensuite son programme, le message sanitaire reste juste
  const alcool = estRecompenseAlcool(programme, majeur);
  const { carte: apres, recompenseGagnee } = appliquerTampon(
    { tampons: carte.tampons, pretes: [] },
    programme,
    delta,
    { id: 0, libelle: libelle ?? programme.recompense, alcool },
    maintenant.getTime(),
  );
  await t.modifierTampons(carte.id, apres.tampons);
  if (recompenseGagnee) await t.ajouterRecompense(carte.id, { libelle: libelle ?? programme.recompense, alcool, gagneeLe: maintenant });
  return { pose: delta === 1, recompenseGagnee };
}
