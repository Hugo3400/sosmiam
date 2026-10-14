import type { EffetSocial } from "../../services/effets-sociaux-regles.ts";
import { ecrirePushSortie } from "./ecrire-push-sortie.ts";

/**
 * Ce qui arrive à une sortie, avec ses destinataires déjà choisis par le service (jamais l'acteur lui-même, jamais une
 * personne avec qui il a un blocage ; la cloche le revérifie). pushAutorises : ceux dont le téléphone peut sonner
 * (pushSocial, et pour une invitation, pas déjà sonné pour cette sortie dans les 24 h). Lieu retenu avec acteurId null :
 * la fin automatique du vote (tâche de la minute), pas l'équipe SOS Miam ; tous les participants sont prévenus,
 * organisateur compris.
 */
export type EvenementSortie =
  | { quoi: "invitation"; sortieId: number; titre: string; acteur: { id: number; prenom: string }; destinataires: readonly number[]; pushAutorises: ReadonlySet<number> }
  | { quoi: "lieu-choisi"; sortieId: number; titre: string; lieu: { id: number; nom: string }; acteurId: number | null; destinataires: readonly number[]; pushAutorises: ReadonlySet<number> }
  | { quoi: "annulee"; sortieId: number; titre: string; acteurId: number; destinataires: readonly number[] };

/**
 * Les effets d'un événement de sortie (spécification sociale C.5), hors anti-spam (réponse de Hugo du 14/10/2026) :
 * - invitation : « invitation-sortie » dans la cloche (detail : le titre) et sur le téléphone ;
 * - lieu retenu : « sortie-lieu-choisi » dans la cloche (detail : le nom du lieu, « C'est voté ! Rendez-vous chez … ») et
 *   sur le téléphone ;
 * - annulation : « sortie-annulee » dans la cloche seulement (detail : le titre, encore lisible une fois la sortie effacée).
 */
export function construireEffetsSortie(e: EvenementSortie): EffetSocial[] {
  const cible = { type: "sortie" as const, id: String(e.sortieId) };
  const effets: EffetSocial[] = [];
  for (const compteId of new Set(e.destinataires)) {
    if (e.quoi === "invitation") {
      if (compteId === e.acteur.id) continue;
      effets.push({ quoi: "cloche", notification: { compteId, type: "invitation-sortie", acteurId: e.acteur.id, cible, detail: e.titre } });
      if (e.pushAutorises.has(compteId)) {
        effets.push({ quoi: "push", compteId, sorte: "invitation-sortie", message: ecrirePushSortie({ quoi: "invitation", prenom: e.acteur.prenom, titre: e.titre, sortieId: e.sortieId }) });
      }
    } else if (e.quoi === "lieu-choisi") {
      if (compteId === e.acteurId) continue;
      effets.push({ quoi: "cloche", notification: { compteId, type: "sortie-lieu-choisi", acteurId: e.acteurId, cible, detail: e.lieu.nom } });
      if (e.pushAutorises.has(compteId)) {
        effets.push({ quoi: "push", compteId, sorte: "sortie-lieu-choisi", message: ecrirePushSortie({ quoi: "lieu-choisi", titre: e.titre, lieu: e.lieu.nom, sortieId: e.sortieId }) });
      }
    } else if (compteId !== e.acteurId) {
      effets.push({ quoi: "cloche", notification: { compteId, type: "sortie-annulee", acteurId: e.acteurId, cible, detail: e.titre } });
    }
  }
  return effets;
}
