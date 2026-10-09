// Double en mémoire des visites, de la fidélité et du comptoir, pour les tests (aucune base de données). Mêmes gestes que
// visites.ts ; une seule chose à la fois en JavaScript, donc les verrous ne font rien.
import type { LieuResume } from "../../../../packages/commun/src/types/lieu-resume.ts";
import type {
  CompteVisiteur, DepotVisites, LieuVisite, LigneCarte, LigneDemande, LignePresentation, LigneProgramme, LigneRecompense, LigneVisite, TablesVisites,
} from "./visites-regles.ts";

/** Un lieu des tests : publié ou non (un lieu non publié garde son résumé pour l'historique) */
export type LieuVisiteEnMemoire = LieuVisite & { publie: boolean };
type CarteEnMemoire = { id: number; compteId: number; lieuId: number; tampons: number };
type RecompenseEnMemoire = LigneRecompense & { carteId: number; offerteLe: Date | null; offerteParId: number | null };
type DemandeEnMemoire = LigneDemande & { carteId: number };

const copier = <T extends object>(ligne: T): T => ({ ...ligne });

export function creerVisitesEnMemoire() {
  const lieux = new Map<number, LieuVisiteEnMemoire>();
  const comptes = new Map<number, CompteVisiteur>();
  const visites: LigneVisite[] = [];
  const presentations: LignePresentation[] = [];
  const programmes = new Map<number, LigneProgramme>();
  const cartes: CarteEnMemoire[] = [];
  const recompenses: RecompenseEnMemoire[] = [];
  const demandes: DemandeEnMemoire[] = [];
  let prochainId = 1;

  const resumer = (l: LieuVisiteEnMemoire): LieuResume => ({ id: l.id, nom: l.nom, emoji: l.emoji, type: l.type, ville: l.ville });
  const lieuPublie = (id: number): LieuVisite | null => {
    const lieu = lieux.get(id);
    if (!lieu?.publie) return null;
    const { publie: _publie, ...reste } = lieu;
    return { ...reste, position: reste.position ? { ...reste.position } : null };
  };
  const versCarte = (c: CarteEnMemoire, maintenant: Date): LigneCarte => ({
    ...c,
    pretes: recompenses
      .filter((r) => r.carteId === c.id && r.offerteLe === null)
      .sort((a, b) => a.gagneeLe.getTime() - b.gagneeLe.getTime())
      .map(({ id, libelle, alcool, gagneeLe }) => ({ id, libelle, alcool, gagneeLe })),
    demande: demandes.filter((d) => d.carteId === c.id && d.expireLe > maintenant).map(({ carteId: _c, ...d }) => d).at(-1) ?? null,
  });

  const tables: TablesVisites = {
    async verrouillerCompte() {},
    async verrouillerLieu() {},

    async lireLieu(lieuId) {
      return lieuPublie(lieuId);
    },
    async trouverLieuParCode(codePublic) {
      const lieu = [...lieux.values()].find((l) => l.publie && l.codePublic === codePublic);
      return lieu ? lieuPublie(lieu.id) : null;
    },
    async resumerLieux(ids) {
      return new Map(ids.flatMap((id) => {
        const lieu = lieux.get(id);
        return lieu ? [[id, resumer(lieu)] as const] : [];
      }));
    },
    async listerLieuxQuiValident() {
      return [...lieux.values()].filter((l) => l.publie && l.validationActive).map((l) => ({ id: l.id, type: l.type }));
    },
    async lireComptes(ids) {
      return new Map(ids.flatMap((id) => {
        const compte = comptes.get(id);
        return compte ? [[id, { ...compte, rattachements: compte.rattachements.map(copier) }] as const] : [];
      }));
    },

    async lireVisite(id) {
      const v = visites.find((x) => x.id === id);
      return v ? copier(v) : null;
    },
    async listerVisites({ compteId, lieuId, statuts, presentationId, limite }) {
      const trouvees = visites
        .filter((v) => (compteId === undefined || v.compteId === compteId) && (lieuId === undefined || v.lieuId === lieuId)
          && (statuts === undefined || statuts.includes(v.statut)) && (presentationId === undefined || v.presentationId === presentationId))
        .sort((a, b) => b.creeLe.getTime() - a.creeLe.getTime() || b.id - a.id)
        .map(copier);
      return limite === undefined ? trouvees : trouvees.slice(0, limite);
    },
    async creerVisite(visite) {
      const ligne = { ...visite, id: prochainId++ };
      visites.push(ligne);
      return copier(ligne);
    },
    async modifierVisite(id, champs) {
      const v = visites.find((x) => x.id === id);
      if (v) Object.assign(v, champs);
    },
    async expirerDemandes(maintenant) {
      for (const v of visites) {
        if (v.statut === "demandee" && v.expireLe && v.expireLe <= maintenant) Object.assign(v, { statut: "expiree", decideLe: maintenant });
      }
    },
    async listerCodesPris(lieuId, maintenant) {
      const codes = new Set<string>();
      for (const v of visites) if (v.lieuId === lieuId && v.statut === "demandee" && v.code && v.expireLe && v.expireLe > maintenant) codes.add(v.code);
      for (const d of demandes) if (d.expireLe > maintenant && cartes.find((c) => c.id === d.carteId)?.lieuId === lieuId) codes.add(d.code);
      return codes;
    },

    async lirePresentation(id) {
      const p = presentations.find((x) => x.id === id);
      return p ? copier(p) : null;
    },
    async lirePresentationAffichee(lieuId, maintenant) {
      const p = presentations.filter((x) => x.lieuId === lieuId && !x.cacheeLe && x.expireLe > maintenant && x.restantes > 0).at(-1);
      return p ? copier(p) : null;
    },
    async creerPresentation(presentation) {
      const ligne = { ...presentation, id: prochainId++ };
      presentations.push(ligne);
      return copier(ligne);
    },
    async cacherPresentations(lieuId, maintenant) {
      for (const p of presentations) if (p.lieuId === lieuId && !p.cacheeLe) p.cacheeLe = maintenant;
    },
    async consommerPresentation(id) {
      const p = presentations.find((x) => x.id === id);
      if (!p || p.restantes <= 0) return false;
      p.restantes -= 1;
      return true;
    },

    async lireProgramme(lieuId) {
      const p = programmes.get(lieuId);
      return p ? copier(p) : null;
    },
    async ecrireProgramme(programme) {
      programmes.set(programme.lieuId, copier(programme));
    },
    async lireCarte(compteId, lieuId, maintenant) {
      const c = cartes.find((x) => x.compteId === compteId && x.lieuId === lieuId);
      return c ? versCarte(c, maintenant) : null;
    },
    async listerCartes(filtre, maintenant) {
      const choisies = "compteId" in filtre
        ? cartes.filter((c) => c.compteId === filtre.compteId)
        : cartes.filter((c) => c.lieuId === filtre.lieuId && demandes.some((d) => d.carteId === c.id && d.expireLe > maintenant));
      return choisies.map((c) => versCarte(c, maintenant));
    },
    async creerCarte(compteId, lieuId, maintenant) {
      let c = cartes.find((x) => x.compteId === compteId && x.lieuId === lieuId);
      if (!c) {
        c = { id: prochainId++, compteId, lieuId, tampons: 0 };
        cartes.push(c);
      }
      return versCarte(c, maintenant);
    },
    async modifierTampons(carteId, tampons) {
      const c = cartes.find((x) => x.id === carteId);
      if (c) c.tampons = tampons;
    },
    async ajouterRecompense(carteId, recompense) {
      const id = prochainId++;
      recompenses.push({ ...recompense, id, carteId, offerteLe: null, offerteParId: null });
      return id;
    },
    async creerDemande(carteId, demande) {
      const ligne = { ...demande, id: prochainId++, carteId };
      demandes.push(ligne);
      const { carteId: _c, ...vue } = ligne;
      return vue;
    },
    async supprimerDemandes(carteId) {
      for (let i = demandes.length - 1; i >= 0; i--) if (demandes[i].carteId === carteId) demandes.splice(i, 1);
    },
    async lireDemande(id) {
      const d = demandes.find((x) => x.id === id);
      const c = d ? cartes.find((x) => x.id === d.carteId) : undefined;
      return d && c ? { ...d, compteId: c.compteId, lieuId: c.lieuId } : null;
    },
    async offrirRecompense(recompenseId, parId, le) {
      const r = recompenses.find((x) => x.id === recompenseId);
      if (!r || r.offerteLe) return false;
      Object.assign(r, { offerteLe: le, offerteParId: parId });
      return true;
    },
  };

  const depot: DepotVisites = { lire: (fn) => fn(tables), ecrire: (fn) => fn(tables) };
  return { depot, lieux, comptes, visites, presentations, programmes, cartes, recompenses, demandes };
}
