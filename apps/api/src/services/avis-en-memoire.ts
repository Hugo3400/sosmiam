// Double en mémoire des avis, pour les tests (aucune base de données). Mêmes gestes que avis.ts ; une seule chose à la fois
// en JavaScript, donc le verrou ne fait rien (deux écritures peuvent s'entrelacer à chaque await : les gestes conditionnels
// tranchent, comme dans la base). ecrire est tout ou rien : chaque écriture note de quoi la défaire, et une erreur levée
// défait celles de cet appel (et d'aucun autre), comme le retour en arrière d'une transaction. Les points de la photo : chaque
// mouvement est noté (pointsPhoto, le journal) et le total du compte suit (pointsComptes, jamais sous 0, comme
// ajouterPointsDans), défaits avec le reste. transaction joue la transaction d'un appelant (le logiciel de gestion) :
// depot.dans(tx) y écrit, et tout est défait si son fn lève.
import type { LieuResume } from "../../../../packages/commun/src/types/lieu-resume.ts";
import type { MotifAvisLouche } from "../../../../packages/commun/src/types/avis.ts";
import type { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { calculerClesPeriodes } from "../fonctions/dates/calculer-cles-periodes.ts";
import type { CompteAuteur, DepotAvis, LieuAvis, LigneAvis, NouvelleLigneAvis, TablesAvis } from "./avis-regles.ts";
import type { LigneVisite } from "./visites-regles.ts";

type AvisEnMemoire = Omit<LigneAvis, "preuve" | "avecReduction">;

/** Retire cette ligne de la liste (rien si elle n'y est plus) */
const retirer = <T>(liste: T[], ligne: T) => {
  const i = liste.indexOf(ligne);
  if (i >= 0) liste.splice(i, 1);
};
export type RelectureEnMemoire = { avisId: number; ambassadeurId: number; verdict: "ok" | "louche" | "deporte"; motif: MotifAvisLouche | null; creeLe: Date };
/** Un mouvement des points de la photo d'un avis (poserPointsPhoto), tel qu'il irait au journal des points */
export type MouvementPointsEnMemoire = { compteId: number; points: number; raison: "avis-photo"; detail: string };

export function creerAvisEnMemoire() {
  const lieux = new Map<number, LieuAvis>();
  const comptes = new Map<number, CompteAuteur>();
  const visites: LigneVisite[] = [];
  const avis: AvisEnMemoire[] = [];
  const relectures: RelectureEnMemoire[] = [];
  const pointsPhoto: MouvementPointsEnMemoire[] = [];
  /** Le total des points de chaque compte (absent : 0), posé par les tests */
  const pointsComptes = new Map<number, number>();
  let prochainId = 1;

  const resumer = (l: LieuAvis): LieuResume => ({ id: l.id, nom: l.nom, emoji: l.emoji, type: l.type, ville: l.ville });
  /** L'avis tel que la base le rend, avec ce qu'on lit de sa visite */
  const versLigne = (a: AvisEnMemoire): LigneAvis => {
    const visite = a.visiteId === null ? undefined : visites.find((v) => v.id === a.visiteId);
    return { ...a, preuve: visite?.mode ?? null, avecReduction: visite?.reglement?.type === "reduction" };
  };

  /**
   * Les gestes ; annuler(geste) note de quoi défaire une écriture si l'appel échoue (rien à noter en lecture) ;
   * enTransaction : faux en lecture, où les points sont refusés comme dans la base
   */
  const creerTables = (annuler: (geste: () => void) => void, enTransaction = true): TablesAvis => ({
    brut: null,

    async verrouillerCompte() {},

    async lireLieu(lieuId) {
      const lieu = lieux.get(lieuId);
      return lieu ? { ...lieu } : null;
    },
    async resumerLieux(ids) {
      return new Map(ids.flatMap((id) => {
        const lieu = lieux.get(id);
        return lieu ? [[id, resumer(lieu)] as const] : [];
      }));
    },
    async lireCompte(compteId) {
      const compte = comptes.get(compteId);
      return compte ? { ...compte, lieuxLies: [...compte.lieuxLies] } : null;
    },

    async lireVisite(id) {
      const v = visites.find((visite) => visite.id === id);
      if (!v) return null;
      const { compteId, lieuId, statut, mode, avisOuvertLe, avisFermeLe, avisDonne, reglement } = v;
      return { id, compteId, lieuId, statut, mode, avisOuvertLe, avisFermeLe, avisDonne, reglement };
    },
    async listerVisitesAvisOuvert(compteId, maintenant) {
      return visites
        .filter((v) => v.compteId === compteId && v.statut === "validee" && !v.avisDonne && v.avisOuvertLe && v.avisOuvertLe <= maintenant
          && v.avisFermeLe && v.avisFermeLe > maintenant && lieux.get(v.lieuId)?.publie)
        .sort((a, b) => (b.valideLe?.getTime() ?? 0) - (a.valideLe?.getTime() ?? 0) || b.id - a.id)
        .map((v) => ({ ...v }));
    },
    async marquerAvisDonne(visiteId) {
      const v = visites.find((visite) => visite.id === visiteId);
      if (!v || v.avisDonne) return false;
      v.avisDonne = true;
      annuler(() => { v.avisDonne = false; });
      return true;
    },

    async creerAvis(nouvel: NouvelleLigneAvis) {
      if (nouvel.visiteId !== null && avis.some((a) => a.visiteId === nouvel.visiteId)) throw Object.assign(new Error("doublon"), { code: "P2002" });
      const ligne: AvisEnMemoire = { ...nouvel, id: prochainId++, reponseTexte: null, reponseLe: null, reponseParId: null, reponseStatut: null };
      avis.push(ligne);
      annuler(() => retirer(avis, ligne));
      return versLigne(ligne);
    },
    async lireAvis(id) {
      const a = avis.find((ligne) => ligne.id === id);
      return a ? versLigne(a) : null;
    },
    async listerAvisLieu(lieuId, statuts, apres, limite) {
      return avis
        .filter((a) => a.lieuId === lieuId && statuts.includes(a.statut) && (apres === null || a.id < apres))
        .sort((a, b) => b.id - a.id)
        .slice(0, limite)
        .map(versLigne);
    },
    async compterNotes(lieuId, statuts) {
      const parNote = new Map<number, number>();
      for (const a of avis) if (a.lieuId === lieuId && statuts.includes(a.statut)) parNote.set(a.note, (parNote.get(a.note) ?? 0) + 1);
      return [...parNote].map(([note, nombre]) => ({ note, nombre }));
    },
    async listerJoursClients(lieuId) {
      const paires = new Set(visites
        .filter((v) => v.lieuId === lieuId && v.statut === "validee")
        .map((v) => `${v.compteId}|${calculerClesPeriodes(v.valideLe ?? v.creeLe).jour}`));
      return [...paires].map((paire) => {
        const [client, jour] = paire.split("|") as [string, string];
        return { client, jour };
      });
    },
    async compterAvisRecents(lieuId, depuis, notes) {
      return avis.filter((a) => a.lieuId === lieuId && a.creeLe >= depuis && notes.includes(a.note)).length;
    },
    async lireDernierAvisNonVerifie(compteId, lieuId) {
      const dates = avis.filter((a) => a.compteId === compteId && a.lieuId === lieuId && a.visiteId === null).map((a) => a.creeLe.getTime());
      return dates.length > 0 ? new Date(Math.max(...dates)) : null;
    },

    async listerARelire(ambassadeurId, lieuxExclus, verdictsMax, limite) {
      return avis
        .filter((a) => a.statut === "en-relecture" && a.compteId !== ambassadeurId && !lieuxExclus.includes(a.lieuId) && lieux.get(a.lieuId)?.publie
          && !relectures.some((r) => r.avisId === a.id && r.ambassadeurId === ambassadeurId)
          && relectures.filter((r) => r.avisId === a.id && r.verdict !== "deporte").length < verdictsMax)
        .sort((a, b) => a.id - b.id)
        .slice(0, limite)
        .map(versLigne);
    },
    async ajouterRelecture(avisId, ambassadeurId, verdict, le) {
      if (relectures.some((r) => r.avisId === avisId && r.ambassadeurId === ambassadeurId)) return "deja";
      const relecture: RelectureEnMemoire = { avisId, ambassadeurId, verdict: verdict.type, motif: verdict.type === "louche" ? verdict.motif : null, creeLe: le };
      relectures.push(relecture);
      annuler(() => retirer(relectures, relecture));
      return "ok";
    },
    async poserReponse(avisId, { texte, le, parId }) {
      const a = avis.find((ligne) => ligne.id === avisId);
      if (!a || a.reponseTexte !== null) return false;
      const { reponseTexte, reponseLe, reponseParId, reponseStatut } = a;
      Object.assign(a, { reponseTexte: texte, reponseLe: le, reponseParId: parId, reponseStatut: "en-relecture" });
      annuler(() => void Object.assign(a, { reponseTexte, reponseLe, reponseParId, reponseStatut }));
      return true;
    },
    async changerStatutAvis(avisId, de, vers) {
      const a = avis.find((ligne) => ligne.id === avisId);
      if (!a || a.statut !== de) return false;
      a.statut = vers;
      annuler(() => { a.statut = de; });
      return true;
    },
    async changerStatutReponse(avisId, de, vers) {
      const a = avis.find((ligne) => ligne.id === avisId);
      if (!a || a.reponseTexte === null || a.reponseStatut !== de) return false;
      a.reponseStatut = vers;
      annuler(() => { a.reponseStatut = de; });
      return true;
    },
    async poserPointsPhoto(compteId, points, detail) {
      if (!enTransaction) throw new Error("Avis : points de la photo posés hors d'une transaction");
      const mouvement: MouvementPointsEnMemoire = { compteId, points, raison: "avis-photo", detail };
      pointsPhoto.push(mouvement);
      const avant = pointsComptes.get(compteId);
      pointsComptes.set(compteId, Math.max(0, (avant ?? 0) + points));
      annuler(() => {
        retirer(pointsPhoto, mouvement);
        if (avant === undefined) pointsComptes.delete(compteId);
        else pointsComptes.set(compteId, avant);
      });
    },
    async lirePointsCompte(compteId) {
      return pointsComptes.get(compteId) ?? 0;
    },
    async sommerPointsPhoto(compteId, detail) {
      return pointsPhoto.filter((m) => m.compteId === compteId && m.detail === detail).reduce((somme, m) => somme + m.points, 0);
    },
  });

  /** Tout ou rien : fn reçoit de quoi noter ses écritures, défaites (de la dernière à la première) s'il lève */
  async function toutOuRien<T>(fn: (noter: (geste: () => void) => void) => Promise<T>): Promise<T> {
    const aDefaire: (() => void)[] = [];
    try {
      return await fn((geste) => aDefaire.push(geste));
    } catch (erreur) {
      for (const geste of aDefaire.reverse()) geste();
      throw erreur;
    }
  }
  /** Les transactions ouvertes par transaction (un jeton opaque chacune) et de quoi y noter une écriture */
  const ouvertes = new WeakMap<object, (geste: () => void) => void>();

  const lecture = creerTables(() => {}, false);
  const depot: DepotAvis = {
    lire: (fn) => fn(lecture),
    ecrire: (fn) => toutOuRien((noter) => fn(creerTables(noter))),
    dans(tx) {
      const noter = ouvertes.get(tx);
      if (!noter) throw new Error("Avis : transaction inconnue ou déjà terminée");
      return creerTables(noter);
    },
  };
  /**
   * Comme baseDeDonnees.$transaction chez l'appelant : tx est un jeton (aucun geste Prisma dessus), à passer à depot.dans ;
   * si fn lève, tout ce qui a été écrit par depot.dans(tx) est défait
   */
  async function transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    const jeton = {};
    try {
      return await toutOuRien((noter) => {
        ouvertes.set(jeton, noter);
        return fn(jeton as Prisma.TransactionClient);
      });
    } finally {
      ouvertes.delete(jeton);
    }
  }
  return { depot, transaction, lieux, comptes, visites, avis, relectures, pointsPhoto, pointsComptes };
}
