// Espace pro (https://pro.sosmiam.fr) et fiche publique d'un lieu : appels à l'API, côté serveur uniquement, avec le jeton
// de session et l'IP du visiteur comme les autres appels (services/comptes.server.ts). Contrat PRÉVU : docs/decisions.md,
// « Espace pro », et src/types/pro.ts.
//
// Tant que l'API n'a pas ces routes, le SERVEUR DE DÉVELOPPEMENT rend des données d'exemple (services/pro-exemple.server.ts),
// marquées `exemple: true` pour que la page l'affiche. En ligne (import.meta.env.DEV faux), c'est toujours l'appel réel :
// jamais de faux lieu.
import { appelerApiComptes, type ReponseComptes } from "~/services/comptes.server";
import type { FichePro, FichePublique, LieuDuCompte, LieuTrouve, MembreEquipe, ResultatModificationFiche, RoleLieu, SuggestionFiche } from "~/types/pro";
import type { CompteConnecte } from "~/types/compte";

type Exemple = { exemple?: true };

/**
 * L'appel réel ; en développement seulement, si l'API n'a pas (encore) la route (404 « introuvable ») ou ne répond pas,
 * les données d'exemple. Le module d'exemple n'est chargé qu'en développement (il n'est pas dans la version en ligne).
 */
async function appelerOuExemple<T extends object>(
  appel: () => Promise<ReponseComptes<T>>,
  exemple: (donnees: typeof import("~/services/pro-exemple.server")) => ReponseComptes<T>,
): Promise<ReponseComptes<T & Exemple>> {
  const reponse = await appel();
  if (import.meta.env.DEV && !reponse.ok && (reponse.erreur === "introuvable" || reponse.erreur === "erreur")) {
    const repli = exemple(await import("~/services/pro-exemple.server"));
    return repli.ok ? { ...repli, exemple: true } : repli;
  }
  return reponse;
}

/**
 * Les lieux du compte (compte.pro.lieux) ; en développement, ceux d'exemple tant que l'API ne rend pas « pro ».
 */
export async function lireLieuxDuCompte(compte: CompteConnecte): Promise<{ lieux: LieuDuCompte[]; exemple: boolean }> {
  if (compte.pro && Array.isArray(compte.pro.lieux)) return { lieux: compte.pro.lieux, exemple: false };
  if (import.meta.env.DEV) {
    const { LIEUX_COMPTE_EXEMPLE } = await import("~/services/pro-exemple.server");
    return { lieux: LIEUX_COMPTE_EXEMPLE, exemple: true };
  }
  return { lieux: [], exemple: false };
}

/** « Chercher mon lieu » : les lieux publiés dont le nom (ou la ville) ressemble au texte. */
export function chercherLieux(texte: string, jeton: string | null, ip: string | null) {
  return appelerOuExemple(
    () => appelerApiComptes<{ lieux: LieuTrouve[] }>(`/pro/recherche-lieux?${new URLSearchParams({ texte })}`, { jeton, ip }),
    ({ LIEUX_TROUVES_EXEMPLE }) => {
      const cherche = texte.toLowerCase();
      return { ok: true, lieux: LIEUX_TROUVES_EXEMPLE.filter((lieu) => `${lieu.nom} ${lieu.ville}`.toLowerCase().includes(cherche)) };
    },
  );
}

export type DemandeRattachement = { lieuId: number; role: "gerant"; preuve: string; siret?: string };

/** « Ce lieu est à moi » : la demande part à l'équipe (201), déjà faite (409 deja-demande) ou lieu inconnu (404). */
export function demanderRattachement(jeton: string, ip: string | null, demande: DemandeRattachement) {
  return appelerOuExemple(
    () => appelerApiComptes<object>("/comptes/moi/rattachements", { methode: "POST", jeton, ip, corps: demande }),
    ({ LIEUX_TROUVES_EXEMPLE }) => (LIEUX_TROUVES_EXEMPLE.some((lieu) => lieu.id === demande.lieuId) ? { ok: true } : { ok: false, erreur: "lieu-inconnu" }),
  );
}

/** Accepte une invitation à rejoindre l'équipe d'un lieu. */
export function accepterInvitation(jeton: string, ip: string | null, rattachementId: number) {
  return appelerOuExemple(
    () => appelerApiComptes<object>(`/comptes/moi/rattachements/${rattachementId}/accepter`, { methode: "POST", jeton, ip }),
    () => ({ ok: true }),
  );
}

/** La fiche d'un lieu du compte et le rôle du compte dans ce lieu (403 acces-refuse : pas son lieu). */
export function lireFichePro(jeton: string, ip: string | null, lieuId: number) {
  return appelerOuExemple(
    () => appelerApiComptes<{ lieu: FichePro; role: RoleLieu }>(`/pro/lieux/${lieuId}`, { jeton, ip }),
    ({ lireFicheExemple, LIEUX_COMPTE_EXEMPLE }) => {
      const lieu = lireFicheExemple(lieuId);
      const role = LIEUX_COMPTE_EXEMPLE.find((rattachement) => rattachement.lieuId === lieuId)?.role ?? "gerant";
      return lieu ? { ok: true, lieu, role } : { ok: false, erreur: "lieu-inconnu" };
    },
  );
}

/**
 * Enregistre « Ma fiche » (gérant seulement) : horaires, texte, contact et infos pratiques changent tout de suite ; le
 * nom et l'adresse partent vers l'équipe.
 */
export function modifierFichePro(jeton: string, ip: string | null, lieuId: number, champs: Partial<FichePro>) {
  return appelerOuExemple(
    () => appelerApiComptes<ResultatModificationFiche>(`/pro/lieux/${lieuId}`, { methode: "PATCH", jeton, ip, corps: { champs } }),
    () => {
      const noms = Object.keys(champs);
      return { ok: true, appliques: noms.filter((nom) => nom !== "nom" && nom !== "adresse"), envoyesEquipe: noms.filter((nom) => nom === "nom" || nom === "adresse") };
    },
  );
}

/** Les suggestions de modification de la fiche (clients et lieu), avec la décision de l'équipe. */
export function listerSuggestions(jeton: string, ip: string | null, lieuId: number) {
  return appelerOuExemple(
    () => appelerApiComptes<{ suggestions: SuggestionFiche[] }>(`/pro/lieux/${lieuId}/suggestions`, { jeton, ip }),
    ({ SUGGESTIONS_EXEMPLE }) => ({ ok: true, suggestions: lieuId === 9001 ? SUGGESTIONS_EXEMPLE : [] }),
  );
}

/** L'équipe du lieu : prénoms et statut, jamais les e-mails. */
export function listerEquipe(jeton: string, ip: string | null, lieuId: number) {
  return appelerOuExemple(
    () => appelerApiComptes<{ membres: MembreEquipe[] }>(`/pro/lieux/${lieuId}/equipe`, { jeton, ip }),
    ({ EQUIPE_EXEMPLE }) => ({ ok: true, membres: lieuId === 9001 ? EQUIPE_EXEMPLE : [] }),
  );
}

/** Invite un compte SOS Miam dans l'équipe (404 compte-inconnu : aucun compte avec cet e-mail). */
export function inviterMembre(jeton: string, ip: string | null, lieuId: number, email: string) {
  return appelerOuExemple(
    () => appelerApiComptes<object>(`/pro/lieux/${lieuId}/equipe`, { methode: "POST", jeton, ip, corps: { email } }),
    () => (email.endsWith("@exemple.fr") ? { ok: true } : { ok: false, erreur: "compte-inconnu" }),
  );
}

/** Retire un membre de l'équipe. */
export function retirerMembre(jeton: string, ip: string | null, lieuId: number, compteId: number) {
  return appelerOuExemple(
    () => appelerApiComptes<object>(`/pro/lieux/${lieuId}/equipe/${compteId}`, { methode: "DELETE", jeton, ip }),
    () => ({ ok: true }),
  );
}

/** La fiche publique d'un lieu publié (sans session) : « lieu-inconnu » ou « introuvable » s'il n'existe pas. */
export function lireFichePublique(lieuId: number, ip: string | null) {
  return appelerOuExemple(
    () => appelerApiComptes<{ lieu: FichePublique }>(`/lieux/publics/${lieuId}`, { ip }),
    ({ lireFichePubliqueExemple }) => {
      const lieu = lireFichePubliqueExemple(lieuId);
      return lieu ? { ok: true, lieu } : { ok: false, erreur: "lieu-inconnu" };
    },
  );
}
