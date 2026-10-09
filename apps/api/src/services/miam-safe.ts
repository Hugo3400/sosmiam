// Miam Safe avec Prisma : chartes, alertes silencieuses, signalements et réponses « Tu t'es senti·e bien ici ? ».
// Contrat et formes : miam-safe-regles.ts ; double en mémoire : miam-safe-en-memoire.ts.
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import {
  calculerRepereSentiBien, calculerStatutAlerte, DUREE_GARDE_ALERTES_MS, FENETRE_ALERTES_COMPTOIR_MS,
  type EndroitAlerte, type ServicesMiamSafe,
} from "./miam-safe-regles.ts";

/** Un lieu publié existe-t-il ? (les gestes de l'app ne visent que des lieux publiés) */
async function estPublie(lieuId: number): Promise<boolean> {
  return (await baseDeDonnees.lieu.count({ where: { id: lieuId, statut: "publie" } })) > 0;
}

export const servicesMiamSafe: ServicesMiamSafe = {
  async lireLieu(lieuId) {
    const lieu = await baseDeDonnees.lieu.findFirst({ where: { id: lieuId, statut: "publie" }, select: { miamSafe: { select: { retireeLe: true } } } });
    if (!lieu) return null;
    const engage = lieu.miamSafe !== null && lieu.miamSafe.retireeLe === null;
    const [reponses, oui] = await Promise.all([
      baseDeDonnees.reponseSentiBien.count({ where: { lieuId } }),
      baseDeDonnees.reponseSentiBien.count({ where: { lieuId, oui: true } }),
    ]);
    return { engage, repere: calculerRepereSentiBien(oui, reponses) };
  },

  async creerAlerte(alerte, maintenant) {
    const lieu = await baseDeDonnees.lieu.findFirst({ where: { id: alerte.lieuId, statut: "publie" }, select: { miamSafe: { select: { retireeLe: true } } } });
    if (!lieu) return { ok: false, erreur: "lieu-inconnu" };
    if (!lieu.miamSafe || lieu.miamSafe.retireeLe) return { ok: false, erreur: "pas-miam-safe" };
    // Ménage au passage : une alerte ne se garde pas plus de 30 jours
    await baseDeDonnees.alerteMiamSafe.deleteMany({ where: { creeLe: { lt: new Date(maintenant.getTime() - DUREE_GARDE_ALERTES_MS) } } });
    const { id } = await baseDeDonnees.alerteMiamSafe.create({ data: { ...alerte, creeLe: maintenant }, select: { id: true } });
    return { ok: true, id };
  },

  async lireAlerte(id, compteId, maintenant) {
    const a = await baseDeDonnees.alerteMiamSafe.findFirst({ where: { id, compteId }, select: { id: true, creeLe: true, repondueLe: true } });
    if (!a) return null;
    return { id: a.id, statut: calculerStatutAlerte(a.creeLe, a.repondueLe, maintenant), creeLe: a.creeLe.toISOString(), repondueLe: a.repondueLe?.toISOString() ?? null };
  },

  async enregistrerSignalement({ lieuId, compteId, raison, explication }) {
    if (!(await estPublie(lieuId))) return false;
    await baseDeDonnees.signalementMiamSafe.create({ data: { lieuId, compteId, raison, explication } });
    return true;
  },

  async repondreSentiBien({ lieuId, compteId, oui }) {
    if (!(await estPublie(lieuId))) return false;
    await baseDeDonnees.reponseSentiBien.upsert({ where: { lieuId_compteId: { lieuId, compteId } }, create: { lieuId, compteId, oui }, update: { oui } });
    return true;
  },

  async listerAlertesLieu(lieuId, maintenant) {
    const lignes = await baseDeDonnees.alerteMiamSafe.findMany({
      where: { lieuId, creeLe: { gte: new Date(maintenant.getTime() - FENETRE_ALERTES_COMPTOIR_MS) } },
      orderBy: { creeLe: "desc" },
      take: 50,
      select: { id: true, prenom: true, endroit: true, detail: true, creeLe: true, repondueLe: true },
    });
    return lignes.map((a) => ({
      id: a.id, prenom: a.prenom, endroit: a.endroit as EndroitAlerte, detail: a.detail,
      statut: calculerStatutAlerte(a.creeLe, a.repondueLe, maintenant), creeLe: a.creeLe.toISOString(),
    }));
  },

  async repondreAlerte(lieuId, alerteId, compteId, maintenant) {
    const recente = { gte: new Date(maintenant.getTime() - FENETRE_ALERTES_COMPTOIR_MS) };
    const { count } = await baseDeDonnees.alerteMiamSafe.updateMany({
      where: { id: alerteId, lieuId, creeLe: recente, repondueLe: null },
      data: { repondueLe: maintenant, reponduParId: compteId },
    });
    if (count > 0) return true;
    // Déjà répondue par un collègue : c'est bon aussi
    return (await baseDeDonnees.alerteMiamSafe.count({ where: { id: alerteId, lieuId, creeLe: recente } })) > 0;
  },

  async lireCharte(lieuId) {
    const c = await baseDeDonnees.charteMiamSafe.findUnique({ where: { lieuId }, select: { signeeLe: true, retireeLe: true, motifRetrait: true } });
    if (!c) return { signee: false, signeeLe: null, retireeParEquipe: false };
    return { signee: c.retireeLe === null, signeeLe: c.retireeLe === null ? c.signeeLe.toISOString() : null, retireeParEquipe: c.retireeLe !== null && c.motifRetrait !== null };
  },

  async signerCharte(lieuId, compteId, maintenant) {
    const c = await baseDeDonnees.charteMiamSafe.findUnique({ where: { lieuId }, select: { retireeLe: true, motifRetrait: true } });
    if (c?.retireeLe && c.motifRetrait !== null) return { ok: false, erreur: "charte-retiree" };
    if (c && c.retireeLe === null) return { ok: true };
    await baseDeDonnees.charteMiamSafe.upsert({
      where: { lieuId },
      create: { lieuId, signeeParId: compteId, signeeLe: maintenant },
      update: { signeeParId: compteId, signeeLe: maintenant, retireeLe: null, motifRetrait: null },
    });
    return { ok: true };
  },

  async quitterCharte(lieuId, maintenant) {
    await baseDeDonnees.charteMiamSafe.updateMany({ where: { lieuId, retireeLe: null }, data: { retireeLe: maintenant } });
  },
};
