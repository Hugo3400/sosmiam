// La bande (les potes, lien réciproque), son lien d'invitation, les demandes, les blocages, « Quoi de neuf » et le classement
// du mois (spécification sociale B.2, D.2) : contrat commun du service Prisma (bande.ts, et bande-activite.ts pour
// l'activité et le classement) et de son double en mémoire (bande-en-memoire.ts). Décisions de Hugo du 14/10/2026 : un lien
// ou un QR avec le code secret ajoute les deux personnes tout de suite, dans les deux bandes ; par pseudo, c'est une demande
// que l'autre accepte ; retirer vaut des deux côtés, sans prévenir ; le lien n'expire pas (il change tout seul après 10
// arrivées en 24 h, ou par « Changer mon lien ») ; bloquer coupe tout dans les deux sens. Chaque création de lien relit les
// blocages sous le verrou des deux comptes : un geste lancé au moment d'un blocage ne recrée rien. Aucune règle d'âge :
// l'app est réservée aux majeurs.
import { calculerClassement } from "../../../../packages/commun/src/fonctions/potes/calculer-classement.ts";
import { calculerDebutMoisParis } from "../../../../packages/commun/src/fonctions/temps/calculer-debut-mois-paris.ts";
import { calculerDecalageParis } from "../../../../packages/commun/src/fonctions/temps/calculer-decalage-paris.ts";
import { DUREE_DEMANDE_BANDE_JOURS, MAX_BANDE } from "../../../../packages/commun/src/regles/potes.ts";
import type { ActiviteBandeApi, BandeApi, ClassementApi } from "../../../../packages/commun/src/types/bande.ts";
import type { PersonneResume } from "../../../../packages/commun/src/types/social.ts";
import { ecrirePushBande, type SortePushBande } from "../fonctions/social/ecrire-push-bande.ts";
import type { EffetSocial } from "./effets-sociaux-regles.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";

/** Le code d'invitation déchiffré, avec le pseudo du lien (creerLienInvitation de commun en fait le lien) */
export type InvitationLue = { pseudo: string; code: string; creeLe: Date };

export type ResultatRejoindre =
  | { ok: true; poteId: number; deja: boolean; effets: EffetSocial[] }
  | { ok: false; erreur: "invitation-invalide" | "invitation-inconnue" | "bande-pleine" | "soi-meme" };

/**
 * Le compte qui a quitté ce pseudo en en changeant (pseudo réservé 30 jours pour lui, pseudos-reserves.ts), ou null : pas
 * réservé, réservation expirée, ou compte supprimé (réservé pour personne). Ne sert qu'à rejoindre, jamais à une réponse
 */
export type LireAncienTitulaire = (pseudo: string, maintenant: Date) => Promise<number | null>;

export type ResultatDemandeBande =
  | { ok: true; etat: "demande" | "ajoute" | "deja"; effets: EffetSocial[] }
  | { ok: false; erreur: "bande-pleine" | "trop-de-demandes-en-attente" | "personne-inconnue" | "soi-meme" | "demandes-fermees" };

export interface ServicesBande {
  /** Potes (du plus récent au plus ancien, tous : 200 au plus), demandes reçues (sans les refusées) et envoyées (refusées comprises), 50 chacune */
  lireBande(compteId: number, maintenant: Date): Promise<BandeApi>;
  /**
   * Le code est tiré (creerCodeInvitation) et chiffré à la première demande, par une mise à jour « seulement s'il n'y en a
   * pas encore », puis relu : deux téléphones qui le demandent en même temps reçoivent le même. Le profil social existe
   * (exigerProfilSocial) ; il faut la clé des données (route 🔐)
   */
  lireInvitation(compteId: number, maintenant: Date): Promise<InvitationLue>;
  /**
   * Nouveau code : l'ancien lien et l'ancien QR ne marchent plus, tout de suite ; le compte des arrivées repart de zéro. Sous
   * le verrou de mon compte, celui que prend rejoindre : une arrivée en cours finit avant (avec l'ancien code), jamais par-dessus
   */
  renouvelerInvitation(compteId: number, maintenant: Date): Promise<InvitationLue>;
  /**
   * Par le lien ou le QR : code comparé en temps constant après déchiffrement, sous le verrou des deux comptes, blocage relu
   * dans la transaction. Pseudo inconnu, code faux ou changé, lien qui a trop tourné, blocage : la même « invitation-invalide »,
   * avec le même travail (un pseudo inconnu ou sans profil social passe aussi par la transaction et un déchiffrement) : le
   * temps de réponse ne dit pas si ce pseudo utilise Potes. Compte les arrivées par ce lien (compterArriveesParLien) : la 10e
   * passe, puis le code change tout seul (« lien-renouvele »). Ancien lien d'un compte qui a changé de pseudo depuis (le
   * pseudo d'avant, encore réservé pour lui) : « invitation-inconnue » (bloc « Pseudos libérés » de la spécification), mais
   * seulement avec SON bon code et sans blocage, après le même travail ; sinon « invitation-invalide » : un pseudo réservé ne
   * se devine pas. Rien n'est écrit, aucune arrivée comptée
   */
  rejoindre(compteId: number, pseudo: string, code: string, maintenant: Date): Promise<ResultatRejoindre>;
  /**
   * Par le pseudo : une demande, ou l'ajout tout de suite si l'autre m'avait déjà demandé (même refusée : je change d'avis).
   * « deja » : déjà potes, ma demande déjà envoyée, ou déjà refusée par l'autre (en silence, jusqu'à l'expiration à 30 jours).
   * Vers un compte « trouvable: false » (on n'entre dans sa bande que par son lien, I.1) : « demandes-fermees », refus dit
   * franchement (décidé par Hugo le 14/10/2026), rien n'est écrit ; son lien d'invitation, lui, marche toujours. Si elle
   * m'avait déjà demandé, nous voilà potes quand même : c'est elle qui a commencé
   */
  demander(compteId: number, cibleId: number, maintenant: Date): Promise<ResultatDemandeBande>;
  /**
   * Sa demande (même refusée par moi) : nous voilà potes, « bande-acceptee » pour elle. Déjà potes (deux touchers, ou une
   * réponse perdue puis renvoyée) : ok, sans rien de plus
   */
  accepter(compteId: number, deId: number, maintenant: Date): Promise<{ ok: true; effets: EffetSocial[] } | { ok: false; erreur: "demande-inconnue" | "bande-pleine" }>;
  /** Refuser une demande reçue (refuseeLe, sans prévenir) ou annuler la mienne (effacée) */
  retirerDemande(compteId: number, autreId: number, maintenant: Date): Promise<void>;
  /** Des deux bandes, sans prévenir, et les co-auteurs entre eux (listes de l'un remplies par l'autre ; leurs lieux restent) */
  retirer(compteId: number, poteId: number, maintenant: Date): Promise<void>;
  /**
   * Sous le verrou des deux comptes, dans une seule transaction, entre eux et dans les deux sens : bande, demandes, suivis,
   * co-auteurs et abonnements aux listes de l'autre, invitations en attente (groupes et sorties), cloche ; et l'autre sort
   * des sorties où j'ai la main (trouverOrganisateurEffectif ; invitation, discussion et votes, comme retirerParticipant des
   * sorties : ses votes ne comptent plus pour le lieu retenu). Les conversations et sorties communes changent de version (ce
   * que l'un écrit y est désormais caché pour l'autre). Déjà bloqué : ok
   */
  bloquer(compteId: number, autreId: number, maintenant: Date): Promise<{ ok: true } | { ok: false; erreur: "trop-de-blocages" | "soi-meme" }>;
  /** Sans rien rétablir */
  debloquer(compteId: number, autreId: number): Promise<void>;
  /** Ceux que j'ai bloqués, du plus récent au plus ancien (Réglages › Personnes bloquées) */
  listerBloques(compteId: number): Promise<PersonneResume[]>;
  /** Pour Miam Safe « Prévenir un pote » (F.3) : mes potes, en petit */
  listerPotes(compteId: number): Promise<PersonneResume[]>;
  estPote(a: number, b: number): Promise<boolean>;
  /**
   * « Quoi de neuf » : rescousses, lieux gardés, badges et nouvelles listes des potes qui partagent leur activité, 30 derniers
   * jours, 50 au plus, du plus récent au plus ancien, sans les lignes retirées de ma vue ni les listes que j'ai signalées
   */
  lireActivite(compteId: number, maintenant: Date): Promise<ActiviteBandeApi[]>;
  /** Moi et mes potes qui partagent leur activité : points nets du mois de Paris, puis rescousses du mois ; même rang à égalité */
  lireClassement(compteId: number, maintenant: Date): Promise<ClassementApi>;
}

/** Demandes reçues ou envoyées rendues par GET /app/bande */
export const DEMANDES_BANDE_LUES = 50;
/** « Quoi de neuf » : 30 derniers jours, 50 lignes au plus */
export const DUREE_ACTIVITE_JOURS = 30;
export const MAX_ACTIVITES = 50;
/** Le compte des arrivées par un même lien repart de zéro après 24 h sans arrivée (compterArriveesParLien) */
export const FENETRE_ARRIVEES_MS = 24 * 60 * 60 * 1000;

/**
 * Les arrivées déjà comptées par ce lien, avant la nouvelle (choix de construction, à confirmer par Hugo, seuil compris).
 * Sans colonne de plus, pas de vraie fenêtre glissante : `derniere` (ProfilSocial.arriveesDepuis) est la DERNIÈRE arrivée,
 * et le compte ne repart de zéro qu'après 24 h sans aucune arrivée. C'est un peu plus strict que « 24 h glissantes », jamais
 * moins : 10 arrivées en 24 h changent toujours le code (une fenêtre fixe en laissait passer 18 en quelques minutes, à
 * cheval sur deux fenêtres), et 10 arrivées sans pause de 24 h le changent aussi, même étalées sur plusieurs jours
 */
export function compterArriveesParLien(arrivees: number, derniere: Date | null, maintenant: Date): number {
  return derniere !== null && maintenant.getTime() - derniere.getTime() < FENETRE_ARRIVEES_MS ? arrivees : 0;
}
/** Forme d'un code d'invitation reçu (celle de lireLienInvitation de commun), avant comparaison */
export const FORME_CODE_INVITATION = /^[a-z0-9]{6,64}$/;

const JOUR_MS = 24 * 60 * 60 * 1000;

/** Une demande de bande plus vieille que 30 jours n'existe plus (le ménage de nuit l'efface ; d'ici là, on l'ignore) */
export const debutDemandesValides = (maintenant: Date) => new Date(maintenant.getTime() - DUREE_DEMANDE_BANDE_JOURS * JOUR_MS);
/** Le début de la fenêtre de « Quoi de neuf » */
export const debutActivite = (maintenant: Date) => new Date(maintenant.getTime() - DUREE_ACTIVITE_JOURS * JOUR_MS);

/** Le mois du classement, « 2026-10 », à l'heure de Paris */
export function ecrireMoisParis(maintenant: Date): string {
  const debut = calculerDebutMoisParis(maintenant.getTime());
  const aParis = new Date(debut + calculerDecalageParis(debut));
  return `${aParis.getUTCFullYear()}-${String(aParis.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Les cibleId des lignes de « Quoi de neuf » (masque « activite ») : jamais l'id d'un compte, l'identifiant public seulement */
export const ID_ACTIVITE = {
  rescousse: (id: number) => `rescousse:${id}`,
  garde: (idPublic: string, lieuId: number) => `garde:${idPublic}:${lieuId}`,
  badge: (id: number) => `badge:${id}`,
  liste: (id: number) => `liste:${id}`,
} as const;

/** La bande telle que l'API la rend ; les comptes sans profil social (ou sans pseudo) n'y sont pas */
export function construireBande(
  membres: readonly { poteId: number; creeLe: Date }[],
  recues: readonly { deId: number; creeLe: Date }[],
  envoyees: readonly { aId: number; creeLe: Date }[],
  personnes: ReadonlyMap<number, PersonneResume>,
): BandeApi {
  const avec = <T>(id: number, faire: (personne: PersonneResume) => T): T[] => {
    const personne = personnes.get(id);
    return personne ? [faire(personne)] : [];
  };
  return {
    membres: membres.flatMap((m) => avec(m.poteId, (personne) => ({ personne, depuis: m.creeLe.toISOString() }))),
    demandesRecues: recues.flatMap((d) => avec(d.deId, (personne) => ({ personne, date: d.creeLe.toISOString() }))),
    demandesEnvoyees: envoyees.flatMap((d) => avec(d.aId, (personne) => ({ personne, date: d.creeLe.toISOString() }))),
    max: MAX_BANDE,
  };
}

/**
 * Les effets d'une arrivée dans la bande de `destinataire` (C.5) : « bande-ajout » (par son lien ou son QR) ou
 * « bande-acceptee » (sa demande acceptée, ou deux demandes croisées) dans sa cloche, et sur son téléphone s'il veut les
 * notifications sociales (hors anti-spam). `acteur` : celui qui vient d'entrer
 */
export async function construireEffetsArrivee(
  relations: Pick<RelationsSociales, "presenter" | "lirePushSocial">,
  sorte: SortePushBande,
  destinataire: number,
  acteur: number,
): Promise<EffetSocial[]> {
  const [personnes, push] = await Promise.all([relations.presenter([acteur]), relations.lirePushSocial([destinataire])]);
  const effets: EffetSocial[] = [{ quoi: "cloche", notification: { compteId: destinataire, type: sorte, acteurId: acteur } }];
  const personne = personnes.get(acteur);
  if (personne && push.has(destinataire)) {
    effets.push({ quoi: "push", compteId: destinataire, sorte, message: ecrirePushBande({ sorte, prenom: personne.prenom, idPublic: personne.id }) });
  }
  return effets;
}

/** Une ligne de « Quoi de neuf », telle que la requête (ou le double en mémoire) la rend, avant d'y mettre la personne */
export type LigneActivite = {
  type: ActiviteBandeApi["type"];
  compteId: number;
  /** ID_ACTIVITE */
  id: string;
  lieuId: number | null;
  /** Code du badge, ou titre de la liste */
  detail: string | null;
  listeId: number | null;
  date: Date;
};

export function presenterActivites(lignes: readonly LigneActivite[], personnes: ReadonlyMap<number, PersonneResume>): ActiviteBandeApi[] {
  return lignes.flatMap((l) => {
    const personne = personnes.get(l.compteId);
    if (!personne) return [];
    return [{
      id: l.id, personne, type: l.type, date: l.date.toISOString(),
      ...(l.lieuId === null ? {} : { lieuId: l.lieuId }),
      ...(l.detail === null ? {} : { detail: l.detail }),
      ...(l.listeId === null ? {} : { listeId: String(l.listeId) }),
    }];
  });
}

/** Le classement tel que l'API le rend, à partir des totaux du mois (moi compris) ; les comptes sans profil social n'y sont pas */
export function construireClassement(
  totaux: readonly { compteId: number; pointsDuMois: number; rescoussesDuMois: number }[],
  personnes: ReadonlyMap<number, PersonneResume>,
  moi: number,
  maintenant: Date,
): ClassementApi {
  const lignes = totaux.flatMap((t) => {
    const personne = personnes.get(t.compteId);
    return personne ? [{ id: personne.id, personne, pointsDuMois: t.pointsDuMois, rescoussesDuMois: t.rescoussesDuMois }] : [];
  });
  const monId = personnes.get(moi)?.id ?? "";
  return {
    mois: ecrireMoisParis(maintenant),
    places: calculerClassement(lignes, monId).map(({ personne: l, rang, estMoi }) => ({
      personne: l.personne, pointsDuMois: l.pointsDuMois, rescoussesDuMois: l.rescoussesDuMois, rang, estMoi,
    })),
  };
}
