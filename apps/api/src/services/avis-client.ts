// Les avis côté client (voir routes/avis.ts) : avis à écrire, avis vérifié (une visite validée, ouvert 1 h après et pendant
// 14 jours, un seul), avis non vérifié (lieu sans compte SOS Miam, un tous les 30 jours), lecture publique d'un lieu.
// Signature figée à l'écriture (« Léa M. », prénom seul pour un 15-17 ans) ; jamais masqué automatiquement : certains
// partent en relecture (compte neuf, rafale de notes, tirage au sort) et restent visibles, l'équipe tranche.
import { signerAvis } from "../../../../packages/commun/src/fonctions/avis/signer-avis.ts";
import type { AvisPublic, NouvelAvis, NouvelAvisNonVerifie, PageAvisLieu } from "../../../../packages/commun/src/types/avis.ts";
import type { DetailsErreur } from "../../../../packages/commun/src/client-api/reponse-api.ts";
import type { LieuResume } from "../../../../packages/commun/src/types/lieu-resume.ts";
import type { Visite } from "../../../../packages/commun/src/types/visite.ts";
import { choisirRaisonRelecture } from "../fonctions/avis/choisir-raison-relecture.ts";
import { lirePageAvis } from "../fonctions/avis/lire-page-avis.ts";
import { presenterAvisPublic } from "../fonctions/avis/presenter-avis-public.ts";
import { estMajeurVisiteur } from "../fonctions/visites/est-majeur-visiteur.ts";
import { lireInitialeNom } from "../fonctions/visites/lire-initiale-nom.ts";
import { presenterVisite } from "../fonctions/visites/presenter-visite.ts";
import {
  DELAI_AVIS_NON_VERIFIE_MS, NOTES_TRANCHEES, POINTS_AVIS_PHOTO, RAFALE_FENETRE_MS,
  type CompteAuteur, type ContexteAvis, type EchecAvis, type ErreurAvis, type LigneAvis, type TablesAvis,
} from "./avis-regles.ts";

type Reponse<T> = ({ ok: true } & T) | EchecAvis;
/** Un avis écrit, et les points à poser ensuite (ajouterPoints, raison « avis-photo ») */
export type AvisEcrit = { avis: AvisPublic; avisId: number; lieuId: number; pointsAPoser: number };

export const echecAvis = (erreur: ErreurAvis, details?: DetailsErreur): EchecAvis => (details ? { ok: false, erreur, details } : { ok: false, erreur });

/** Un lieu effacé depuis (seulement par prudence) */
export const lieuDisparu = (id: number): LieuResume => ({ id, nom: "Lieu disparu", emoji: "📍", type: "resto", ville: "" });

export function creerAvisClient(c: ContexteAvis) {
  const maintenant = () => new Date(c.horloge());
  const majeur = (compte: CompteAuteur) => estMajeurVisiteur(compte.dateNaissanceChiffree, c.chiffrement, maintenant());

  /** Écrit l'avis (signature, âge, relecture éventuelle) ; la visite a déjà été marquée « avis donné » */
  async function ecrire(
    t: TablesAvis,
    compte: CompteAuteur,
    avis: { lieuId: number; visiteId: number | null; note: number; texte: string; photo: string | null; repasOffert: boolean },
    le: Date,
  ): Promise<LigneAvis> {
    const adulte = majeur(compte);
    const tranchesRecents = NOTES_TRANCHEES.includes(avis.note)
      ? await t.compterAvisRecents(avis.lieuId, new Date(le.getTime() - RAFALE_FENETRE_MS), NOTES_TRANCHEES)
      : 0;
    const raison = choisirRaisonRelecture({ note: avis.note, tranchesRecents, compteCreeLe: compte.creeLe, maintenant: le, tirer: c.tirer });
    return t.creerAvis({
      ...avis,
      compteId: compte.id,
      texte: avis.texte.trim(),
      signature: signerAvis(compte.prenom, lireInitialeNom(compte.nomChiffre, c.chiffrement), adulte),
      mineur: !adulte,
      statut: raison ? "en-relecture" : "publie",
      raisonRelecture: raison,
      creeLe: le,
    });
  }

  return {
    /** GET /app/avis/a-ecrire : les visites validées dont l'avis est ouvert et pas encore donné */
    listerAEcrire(compteId: number): Promise<{ ok: true; visites: Visite[] }> {
      return c.depot.lire(async (t) => {
        const lignes = await t.listerVisitesAvisOuvert(compteId, maintenant());
        const lieux = await t.resumerLieux([...new Set(lignes.map((v) => v.lieuId))]);
        return { ok: true, visites: lignes.map((v) => presenterVisite(v, lieux.get(v.lieuId) ?? lieuDisparu(v.lieuId))) };
      });
    },

    /** POST /app/avis : l'avis vérifié d'une visite validée (la photo a déjà été vérifiée par le contrôleur) */
    donnerAvis(compteId: number, nouvel: NouvelAvis): Promise<Reponse<AvisEcrit>> {
      return c.depot.ecrire(async (t) => {
        const le = maintenant();
        await t.verrouillerCompte(compteId);
        const visite = await t.lireVisite(nouvel.visiteId);
        if (!visite || visite.compteId !== compteId) return echecAvis("introuvable");
        if (visite.avisDonne) return echecAvis("avis-deja-donne");
        // Une visite retirée a perdu ses dates d'avis : comme une visite pas validée
        if (visite.statut !== "validee" || !visite.avisOuvertLe || !visite.avisFermeLe || le < visite.avisOuvertLe) return echecAvis("avis-pas-ouvert");
        if (le >= visite.avisFermeLe) return echecAvis("avis-ferme");
        const [lieu, compte] = await Promise.all([t.lireLieu(visite.lieuId), t.lireCompte(compteId)]);
        if (!lieu?.publie || !compte) return echecAvis("introuvable");
        // L'équipe d'un lieu ne note pas chez elle (ni quelqu'un qui demande à la rejoindre)
        if (compte.lieuxLies.includes(lieu.id)) return echecAvis("membre-du-lieu");
        if (!(await t.marquerAvisDonne(visite.id))) return echecAvis("avis-deja-donne");
        const repasOffert = visite.reglement?.type === "offert";
        const avis = await ecrire(t, compte, { lieuId: lieu.id, visiteId: visite.id, note: nouvel.note, texte: nouvel.texte, photo: nouvel.photo, repasOffert }, le);
        // Les points d'une photo suivent ceux de la visite : rien pour un repas offert
        const pointsAPoser = nouvel.photo !== null && !repasOffert ? POINTS_AVIS_PHOTO : 0;
        return { ok: true, avis: presenterAvisPublic(avis), avisId: avis.id, lieuId: lieu.id, pointsAPoser };
      });
    },

    /** POST /app/avis/non-verifie : chez un lieu non vérifié seulement, sans visite ni points, un tous les 30 jours */
    donnerAvisNonVerifie(compteId: number, nouvel: NouvelAvisNonVerifie): Promise<Reponse<AvisEcrit>> {
      return c.depot.ecrire(async (t) => {
        const le = maintenant();
        await t.verrouillerCompte(compteId);
        const [lieu, compte] = await Promise.all([t.lireLieu(nouvel.lieuId), t.lireCompte(compteId)]);
        if (!lieu?.publie || !compte) return echecAvis("lieu-inconnu");
        // Un bar n'existe pas pour un 15-17 ans : rien d'autre n'en est dit
        if (lieu.type === "bar" && !majeur(compte)) return echecAvis("mineur-bar");
        if (lieu.verifie) return echecAvis("avis-visite-requise");
        if (!compte.emailVerifie) return echecAvis("email-non-verifie");
        if (compte.lieuxLies.includes(lieu.id)) return echecAvis("membre-du-lieu");
        const dernier = await t.lireDernierAvisNonVerifie(compteId, lieu.id);
        if (dernier && le.getTime() - dernier.getTime() < DELAI_AVIS_NON_VERIFIE_MS) {
          return echecAvis("avis-recent", { jusqua: new Date(dernier.getTime() + DELAI_AVIS_NON_VERIFIE_MS).toISOString() });
        }
        const avis = await ecrire(t, compte, { lieuId: lieu.id, visiteId: null, note: nouvel.note, texte: nouvel.texte, photo: nouvel.photo, repasOffert: false }, le);
        return { ok: true, avis: presenterAvisPublic(avis), avisId: avis.id, lieuId: lieu.id, pointsAPoser: 0 };
      });
    },

    /** GET /app/avis/lieux/:lieuId (sans session) : les avis visibles d'un lieu publié, page par page, et leur résumé */
    lireAvisLieu(lieuId: number, apres: number | null): Promise<Reponse<PageAvisLieu>> {
      return c.depot.lire(async (t) => {
        const lieu = await t.lireLieu(lieuId);
        if (!lieu?.publie) return echecAvis("lieu-inconnu");
        return { ok: true, ...(await lirePageAvis(t, lieuId, apres)) };
      });
    },
  };
}
