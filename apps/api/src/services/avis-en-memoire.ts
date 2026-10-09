// Double en mémoire des avis, pour les tests (aucune base de données). Mêmes gestes que avis.ts ; une seule chose à la fois
// en JavaScript, donc le verrou ne fait rien.
import type { LieuResume } from "../../../../packages/commun/src/types/lieu-resume.ts";
import type { MotifAvisLouche } from "../../../../packages/commun/src/types/avis.ts";
import { calculerClesPeriodes } from "../fonctions/dates/calculer-cles-periodes.ts";
import type { CompteAuteur, DepotAvis, LieuAvis, LigneAvis, NouvelleLigneAvis, TablesAvis } from "./avis-regles.ts";
import type { LigneVisite } from "./visites-regles.ts";

type AvisEnMemoire = Omit<LigneAvis, "preuve" | "avecReduction">;
export type RelectureEnMemoire = { avisId: number; ambassadeurId: number; verdict: "ok" | "louche" | "deporte"; motif: MotifAvisLouche | null; creeLe: Date };

export function creerAvisEnMemoire() {
  const lieux = new Map<number, LieuAvis>();
  const comptes = new Map<number, CompteAuteur>();
  const visites: LigneVisite[] = [];
  const avis: AvisEnMemoire[] = [];
  const relectures: RelectureEnMemoire[] = [];
  let prochainId = 1;

  const resumer = (l: LieuAvis): LieuResume => ({ id: l.id, nom: l.nom, emoji: l.emoji, type: l.type, ville: l.ville });
  /** L'avis tel que la base le rend, avec ce qu'on lit de sa visite */
  const versLigne = (a: AvisEnMemoire): LigneAvis => {
    const visite = a.visiteId === null ? undefined : visites.find((v) => v.id === a.visiteId);
    return { ...a, preuve: visite?.mode ?? null, avecReduction: visite?.reglement?.type === "reduction" };
  };

  const tables: TablesAvis = {
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
      return true;
    },

    async creerAvis(nouvel: NouvelleLigneAvis) {
      if (nouvel.visiteId !== null && avis.some((a) => a.visiteId === nouvel.visiteId)) throw Object.assign(new Error("doublon"), { code: "P2002" });
      const ligne: AvisEnMemoire = { ...nouvel, id: prochainId++, reponseTexte: null, reponseLe: null, reponseParId: null, reponseStatut: null };
      avis.push(ligne);
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
        .filter((a) => a.statut === "en-relecture" && !a.mineur && a.compteId !== ambassadeurId && !lieuxExclus.includes(a.lieuId) && lieux.get(a.lieuId)?.publie
          && !relectures.some((r) => r.avisId === a.id && r.ambassadeurId === ambassadeurId)
          && relectures.filter((r) => r.avisId === a.id && r.verdict !== "deporte").length < verdictsMax)
        .sort((a, b) => a.id - b.id)
        .slice(0, limite)
        .map(versLigne);
    },
    async ajouterRelecture(avisId, ambassadeurId, verdict, le) {
      if (relectures.some((r) => r.avisId === avisId && r.ambassadeurId === ambassadeurId)) return "deja";
      relectures.push({ avisId, ambassadeurId, verdict: verdict.type, motif: verdict.type === "louche" ? verdict.motif : null, creeLe: le });
      return "ok";
    },
    async poserReponse(avisId, { texte, le, parId }) {
      const a = avis.find((ligne) => ligne.id === avisId);
      if (!a || a.reponseTexte !== null) return false;
      Object.assign(a, { reponseTexte: texte, reponseLe: le, reponseParId: parId, reponseStatut: "publiee" });
      return true;
    },
  };

  const depot: DepotAvis = { lire: (fn) => fn(tables), ecrire: (fn) => fn(tables) };
  return { depot, lieux, comptes, visites, avis, relectures };
}
