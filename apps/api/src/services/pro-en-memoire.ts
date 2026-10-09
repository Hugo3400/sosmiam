// Espace pro en mémoire, pour les tests et l'API de démonstration : mêmes règles que pro.ts (Prisma), rien n'est écrit
// nulle part. Branché dans comptes-en-memoire.ts, qui lui prête ses comptes, ses lieux de test et ses suggestions.
import { presenterCarte } from "../fonctions/pro/presenter-carte.ts";
import type { FichePublique } from "./lieux-publics.ts";
import { CHAMPS_PROPOSABLES, type FicheSuggerable } from "./suggestions-comptes-regles.ts";
import type { LieuEnMemoire, creerSuggestionsEnMemoire } from "./suggestions-comptes-en-memoire.ts";
import {
  DEMANDES_RATTACHEMENT_PAR_JOUR, GARDE_RATTACHEMENT_CLOS, INVITATIONS_PAR_JOUR, MEMBRES_EQUIPE_MAX, RESULTATS_RECHERCHE, SUGGESTIONS_MONTREES, UN_JOUR_PRO,
  type FichePro, type LieuDuPro, type LieuTrouve, type MembreEquipe, type RoleRattachement, type ServicesPro, type StatutRattachement,
} from "./pro-regles.ts";

export type RattachementEnMemoire = {
  id: number; lieuId: number; compteId: number; role: RoleRattachement; preuve: string; siret: string | null;
  statut: StatutRattachement; reponse: string | null; creeLe: number; decideLe: number | null;
};
type CompteVu = { email: string; prenom: string };
type Suggestions = ReturnType<typeof creerSuggestionsEnMemoire>;

const iso = (moment: number | null) => (moment === null ? null : new Date(moment).toISOString());
const actif = (r: RattachementEnMemoire) => r.statut === "en-attente" || r.statut === "valide";
/** Le reste d'une fiche de test, quand le test ne l'a pas donné */
const decrire = (lieu: LieuEnMemoire) => ({
  type: lieu.type ?? "resto", emoji: lieu.emoji ?? "🍽️", info: lieu.info ?? "", quartier: lieu.quartier ?? "", ville: lieu.ville ?? "",
});

/** carte et carteMajLe de la fiche publique */
function presenterCartePublique(lieu: LieuEnMemoire) {
  const { carte, majLe } = presenterCarte(lieu.carte ?? null, lieu.carteMajLe ? new Date(lieu.carteMajLe) : null);
  return { carte, carteMajLe: majLe };
}

export function creerProEnMemoire(comptes: Map<number, CompteVu>, suggestions: Suggestions, horloge: () => number) {
  const { lieux } = suggestions;
  const rattachements: RattachementEnMemoire[] = [];
  let compteur = 0;
  const trouver = (lieuId: number, compteId: number) => rattachements.find((r) => r.lieuId === lieuId && r.compteId === compteId);
  const estVerifie = (lieuId: number) => rattachements.some((r) => r.lieuId === lieuId && r.statut === "valide");
  /** Nouveau rattachement, ou l'ancien (refusé, retiré) remis à zéro : un seul par lieu et par compte, comme la base */
  function poser(lieuId: number, compteId: number, role: RoleRattachement, preuve: string, siret: string | null, moment: number) {
    const existant = trouver(lieuId, compteId);
    const valeurs = { role, preuve, siret, statut: "en-attente" as const, reponse: null, creeLe: moment, decideLe: null };
    if (existant) return Object.assign(existant, valeurs).id;
    const id = ++compteur;
    rattachements.push({ id, lieuId, compteId, ...valeurs });
    return id;
  }

  const services: ServicesPro = {
    async listerRattachements(compteId) {
      return rattachements
        .filter((r) => r.compteId === compteId && r.statut !== "retire")
        .sort((a, b) => b.creeLe - a.creeLe)
        .map((r) => {
          const lieu = lieux.get(r.lieuId);
          return {
            id: r.id, lieuId: r.lieuId, nom: lieu?.nom as string, ville: lieu ? decrire(lieu).ville : "", emoji: lieu ? decrire(lieu).emoji : "",
            role: r.role, statut: r.statut, reponse: r.reponse, creeLe: iso(r.creeLe) as string, decideLe: iso(r.decideLe),
          };
        });
    },
    async demanderRattachement(compteId, { lieuId, preuve, siret }, maintenant) {
      const lieu = lieux.get(lieuId);
      if (!lieu || lieu.statut === "masque") return { ok: false, erreur: "lieu-inconnu" };
      const existant = trouver(lieuId, compteId);
      if (existant && actif(existant)) return { ok: false, erreur: "deja-demande" };
      const moment = maintenant.getTime();
      const duJour = rattachements.filter((r) => r.compteId === compteId && r.role === "gerant" && r.creeLe > moment - UN_JOUR_PRO).length;
      if (duJour >= DEMANDES_RATTACHEMENT_PAR_JOUR) return { ok: false, erreur: "trop-de-demandes" };
      return { ok: true, id: poser(lieuId, compteId, "gerant", preuve, siret, moment) };
    },
    async accepterInvitation(compteId, id, maintenant) {
      const r = rattachements.find((x) => x.id === id && x.compteId === compteId && x.role === "equipe" && x.statut === "en-attente");
      if (!r) return false;
      Object.assign(r, { statut: "valide", decideLe: maintenant.getTime() });
      return true;
    },
    async quitterRattachement(compteId, id, maintenant) {
      const r = rattachements.find((x) => x.id === id && x.compteId === compteId && actif(x));
      if (!r) return false;
      Object.assign(r, { statut: "retire", decideLe: maintenant.getTime() });
      return true;
    },
    async chercherLieux(mots) {
      const petits = mots.map((mot) => mot.toLowerCase());
      return [...lieux.entries()]
        .filter(([, lieu]) => lieu.statut === "publie" || lieu.statut === "brouillon")
        .filter(([, lieu]) => petits.every((mot) => `${lieu.nom}`.toLowerCase().includes(mot) || decrire(lieu).ville.toLowerCase().includes(mot)))
        .sort(([idA, a], [idB, b]) => (a.nom === b.nom ? idA - idB : `${a.nom}` < `${b.nom}` ? -1 : 1))
        .slice(0, RESULTATS_RECHERCHE)
        .map(([id, lieu]): LieuTrouve => {
          const { type, emoji, quartier, ville } = decrire(lieu);
          return { id, nom: lieu.nom as string, emoji, type, quartier, ville, statut: lieu.statut as LieuTrouve["statut"], estVerifie: estVerifie(id) };
        });
    },
    async lireRole(compteId, lieuId) {
      const r = trouver(lieuId, compteId);
      return r?.statut === "valide" ? r.role : null;
    },
    async lireFichePro(lieuId) {
      const lieu = lieux.get(lieuId);
      if (!lieu) return null;
      const champs = Object.fromEntries(CHAMPS_PROPOSABLES.map((champ) => [champ, lieu[champ]])) as FicheSuggerable;
      return structuredClone({ id: lieuId, ...decrire(lieu), statut: lieu.statut, ...champs, estVerifie: estVerifie(lieuId) } satisfies FichePro);
    },
    async modifierFichePro(compteId, lieuId, { directs, suggestion }, maintenant) {
      const lieu = lieux.get(lieuId);
      let suggestionId: number | null = null;
      if (suggestion) {
        const cree = await suggestions.creerSuggestionLieu(compteId, { lieuId, ...suggestion }, maintenant, "pro");
        if (!cree.ok) return cree;
        suggestionId = cree.id;
      }
      if (lieu) Object.assign(lieu, structuredClone(directs));
      return { ok: true, suggestionId };
    },
    async listerSuggestionsDuLieu(lieuId) {
      return suggestions.suggestions
        .filter((s) => s.lieuId === lieuId)
        .sort((a, b) => b.creeLe - a.creeLe || b.id - a.id)
        .slice(0, SUGGESTIONS_MONTREES)
        .map((s) => structuredClone({
          id: s.id, source: s.source, champs: Object.keys(s.proposition), avant: s.avant, proposition: s.proposition, message: s.message,
          statut: s.statut, champsAcceptes: s.champsAcceptes ?? [], reponse: s.source === "pro" ? (s.reponse ?? null) : null,
          creeLe: iso(s.creeLe) as string, decideLe: iso(s.decideLe ?? null),
        }));
    },
    async lireCarte(lieuId) {
      const lieu = lieux.get(lieuId);
      if (!lieu) return null;
      return structuredClone({ carte: lieu.carte ?? null, majLe: lieu.carteMajLe ? new Date(lieu.carteMajLe) : null });
    },
    async enregistrerCarte(lieuId, carte, maintenant) {
      const lieu = lieux.get(lieuId);
      if (!lieu) return false;
      Object.assign(lieu, { carte: structuredClone(carte), carteMajLe: carte === null ? null : maintenant.getTime() });
      return true;
    },
    async listerEquipe(lieuId) {
      return rattachements
        .filter((r) => r.lieuId === lieuId && (r.role === "equipe" ? actif(r) : r.statut === "valide"))
        .sort((a, b) => (a.role === b.role ? a.creeLe - b.creeLe : a.role === "gerant" ? -1 : 1))
        .map((r): MembreEquipe => {
          const compte = comptes.get(r.compteId);
          return {
            compteId: r.compteId, prenom: compte?.prenom ?? "", email: r.role === "equipe" ? (compte?.email ?? null) : null, role: r.role,
            statut: r.statut as MembreEquipe["statut"], creeLe: iso(r.creeLe) as string, decideLe: iso(r.decideLe),
          };
        });
    },
    async inviterMembre(lieuId, inviteurId, email, maintenant) {
      const compteId = [...comptes.entries()].find(([, compte]) => compte.email === email)?.[0];
      if (compteId === undefined) return { ok: false, erreur: "compte-inconnu" };
      const existant = trouver(lieuId, compteId);
      if (existant && actif(existant)) return { ok: false, erreur: "deja-membre" };
      const moment = maintenant.getTime();
      const equipe = rattachements.filter((r) => r.lieuId === lieuId && r.role === "equipe");
      if (equipe.filter((r) => r.creeLe > moment - UN_JOUR_PRO).length >= INVITATIONS_PAR_JOUR) return { ok: false, erreur: "trop-d-invitations" };
      if (equipe.filter(actif).length >= MEMBRES_EQUIPE_MAX) return { ok: false, erreur: "equipe-complete" };
      poser(lieuId, compteId, "equipe", `Invitation du gérant (compte ${inviteurId})`, null, moment);
      return { ok: true };
    },
    async retirerMembre(lieuId, compteId, maintenant) {
      const r = trouver(lieuId, compteId);
      if (!r || r.role !== "equipe" || !actif(r)) return false;
      Object.assign(r, { statut: "retire", decideLe: maintenant.getTime() });
      return true;
    },
  };

  return {
    services,
    rattachements,
    /** `compte.pro.lieux` : ses rattachements sauf « retire », du plus ancien au plus récent */
    lieuxDuCompte(compteId: number): LieuDuPro[] {
      return rattachements
        .filter((r) => r.compteId === compteId && r.statut !== "retire")
        .sort((a, b) => a.creeLe - b.creeLe)
        .map((r) => {
          const lieu = lieux.get(r.lieuId);
          return {
            lieuId: r.lieuId, nom: lieu?.nom as string, ville: lieu ? decrire(lieu).ville : "", emoji: lieu ? decrire(lieu).emoji : "", role: r.role,
            statut: r.statut,
          };
        });
    },
    /**
     * Décision de l'équipe sur une demande « gerant » en attente, comme le fera le logiciel de gestion : « valide » ou
     * « refuse », avec une réponse facultative. Faux si la demande n'est pas en attente.
     */
    deciderRattachement(id: number, statut: "valide" | "refuse", reponse: string | null = null): boolean {
      const r = rattachements.find((x) => x.id === id && x.role === "gerant" && x.statut === "en-attente");
      if (!r) return false;
      Object.assign(r, { statut, reponse, decideLe: horloge() });
      return true;
    },
    /** GET /lieux/publics/:id : la fiche d'un lieu publié, comme lireFichePublique (lieux-publics.ts) */
    async lireFichePublique(id: number): Promise<FichePublique | null> {
      const lieu = lieux.get(id);
      if (!lieu || lieu.statut !== "publie") return null;
      const champs = Object.fromEntries(CHAMPS_PROPOSABLES.map((champ) => [champ, lieu[champ]])) as FicheSuggerable;
      return structuredClone({
        id, ...decrire(lieu), prix: lieu.prix ?? "€", couleurs: lieu.couleurs ?? [], decouvertPar: lieu.decouvertPar ?? null,
        ...champs, estVerifie: estVerifie(id), ...presenterCartePublique(lieu),
      } as FichePublique);
    },
    /** Ménage de nuit (services/menage-comptes.ts) : refusés ou retirés depuis plus d'un an ; renvoie le nombre effacé. */
    effacerRattachementsClos(maintenant = horloge()): number {
      const limite = maintenant - GARDE_RATTACHEMENT_CLOS;
      let effaces = 0;
      for (let i = rattachements.length - 1; i >= 0; i--) {
        const r = rattachements[i];
        if (r && (r.statut === "refuse" || r.statut === "retire") && r.decideLe !== null && r.decideLe < limite) {
          rattachements.splice(i, 1);
          effaces += 1;
        }
      }
      return effaces;
    },
    /** Compte effacé : ses rattachements partent avec lui (onDelete: Cascade) */
    oublierCompte(compteId: number) {
      for (let i = rattachements.length - 1; i >= 0; i--) if (rattachements[i]?.compteId === compteId) rattachements.splice(i, 1);
    },
  };
}
