// Banc d'essai des décisions de l'équipe sur les avis (services/avis-gestion.ts), pour avis-gestion.test.ts et
// avis-gestion-points.test.ts. Aucune base de données : avis en mémoire, mouvements de points notés par le double
// (pointsPhoto, le journal ; pointsComptes, le total), transaction de l'appelant jouée par le double (transaction), défis
// notés au lieu d'être réévalués, pannes à la demande. Comme la vraie écriture : un avis vérifié avec photo reçoit ses points
// juste après (la ligne « avis <id>, lieu <lieuId> » que pose controleurs/avis.ts), sauf si le test dit que l'ajout a raté.
import assert from "node:assert/strict";

import { calculerPointsPhotoAvis } from "../../src/fonctions/avis/calculer-points-photo-avis.ts";
import { creerAvisClient } from "../../src/services/avis-client.ts";
import { creerAvisEnMemoire, type MouvementPointsEnMemoire } from "../../src/services/avis-en-memoire.ts";
import { creerAvisGestion, type DependancesAvisGestion } from "../../src/services/avis-gestion.ts";
import { creerAvisPro } from "../../src/services/avis-pro.ts";
import type { DepotAvis, NouvelleLigneAvis, TablesAvis } from "../../src/services/avis-regles.ts";

export const T0 = new Date("2026-10-15T09:00:00Z");
export const MAINTENANT = new Date("2026-10-16T14:00:00Z");
/** L'auteur des avis, et le gérant du lieu 1 (celui qui répond) */
export const AUTEUR = 7;
export const GERANT = 50;
export const REPONSE = "Merci pour ton passage, on t'attend pour la prochaine fournée de crêpes !";
/** Les points de l'auteur avant ses avis (assez pour que le plancher à 0 ne joue pas, sauf exprès) */
export const POINTS_DEPART = 100;

export function creerBancAvisGestion(o: { ajouterPoints?: DependancesAvisGestion["ajouterPoints"] } = {}) {
  const memoire = creerAvisEnMemoire();
  memoire.lieux.set(1, { id: 1, nom: "Chez Léa", emoji: "🍝", type: "resto", ville: "Montpellier", publie: true, verifie: true });
  memoire.pointsComptes.set(AUTEUR, POINTS_DEPART);
  /** Les lignes posées à l'écriture des avis (comme controleurs/avis.ts), hors des décisions */
  const ecritures = new Set<MouvementPointsEnMemoire>();
  const defis: { compteId: number; maintenant: Date }[] = [];
  /** Pannes à la demande : les points (dans la transaction) ou la réévaluation des défis (après) */
  const panne = { points: false, defis: false };
  const avecPanne = (t: TablesAvis): TablesAvis => ({
    ...t,
    poserPointsPhoto: async (...args) => {
      if (panne.points) throw new Error("base indisponible");
      return t.poserPointsPhoto(...args);
    },
  });
  const depot: DepotAvis = {
    lire: memoire.depot.lire,
    ecrire: (fn) => memoire.depot.ecrire((t) => fn(avecPanne(t))),
    dans: (tx) => avecPanne(memoire.depot.dans(tx)),
  };
  const gestion = creerAvisGestion({
    depot,
    ...(o.ajouterPoints ? { ajouterPoints: o.ajouterPoints } : {}),
    reevaluerDefis: async (compteId, maintenant) => {
      if (panne.defis) throw new Error("défis indisponibles");
      defis.push({ compteId, maintenant });
    },
  });
  const horloge = () => MAINTENANT.getTime();
  const client = creerAvisClient({ depot: memoire.depot, chiffrement: null, tirer: () => 7, horloge });
  const pro = creerAvisPro({ depot: memoire.depot, horloge }, async (compteId, lieuId) => (compteId === GERANT && lieuId === 1 ? "gerant" : null));
  let visites = 0;

  /**
   * Un avis du lieu 1, en relecture par défaut ; verifie : écrit grâce à une visite (une nouvelle à chaque fois) ; ses
   * points posés ensuite comme controleurs/avis.ts (pointsEcrits faux : cet ajout a raté, l'avis reste sans ses points)
   */
  const avis = async (champs: Partial<NouvelleLigneAvis> & { verifie?: boolean; pointsEcrits?: boolean } = {}) => {
    const { verifie = true, pointsEcrits = true, ...reste } = champs;
    const cree = await memoire.depot.ecrire((t) => t.creerAvis({
      compteId: AUTEUR, lieuId: 1, visiteId: verifie ? ++visites : null, note: 4, texte: "Très bonne adresse, on reviendra.", photo: null,
      signature: "Léa M.", statut: "en-relecture", raisonRelecture: "tirage", repasOffert: false, creeLe: T0, ...reste,
    }));
    const gagnes = calculerPointsPhotoAvis(cree);
    if (gagnes > 0 && pointsEcrits) {
      await memoire.depot.ecrire((t) => t.poserPointsPhoto(cree.compteId, gagnes, `avis ${cree.id}, lieu ${cree.lieuId}`));
      ecritures.add(memoire.pointsPhoto.at(-1)!);
    }
    return cree.id;
  };
  /** La ligne gardée (statut, réponse) */
  const ligne = (id: number) => memoire.avis.find((a) => a.id === id)!;
  /** Les identifiants des avis de la page publique, et son résumé */
  const pagePublique = async () => {
    const r = await client.lireAvisLieu(1, null);
    assert.ok(r.ok);
    return { ids: r.avis.map((a) => a.id), resume: r.resume, avis: r.avis };
  };
  /** La page du comptoir vue par le gérant */
  const comptoir = async () => {
    const r = await pro.lister(GERANT, 1, null);
    assert.ok(r.ok);
    return r.avis;
  };
  /** Le gérant répond à cet avis (posée « en-relecture ») */
  const repondre = async (id: number) => assert.ok((await pro.repondre(GERANT, id, REPONSE)).ok);
  /** Le total des points de ce compte */
  const total = (compteId = AUTEUR) => memoire.pointsComptes.get(compteId) ?? 0;
  return {
    memoire, gestion, pro, defis, panne, avis, ligne, pagePublique, comptoir, repondre, total,
    /** Les mouvements de points écrits par les décisions (masquer, rétablir), sans ceux de l'écriture des avis */
    get points() {
      return memoire.pointsPhoto.filter((m) => !ecritures.has(m));
    },
    /** Tout le journal des points de la photo, écriture des avis comprise */
    journal: memoire.pointsPhoto,
  };
}
