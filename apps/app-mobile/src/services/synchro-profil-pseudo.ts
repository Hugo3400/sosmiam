// L'explication d'un pseudo changé sur le serveur, pour la synchro du profil (services/synchro-profil.ts) : l'équipe
// (pseudo neutre de la modération, ancien pseudo mis de côté) ou un autre téléphone du compte (sans bruit).
import type { ServiceModerationApp } from "@sos-miam/commun/client-api/contrat-moderation-app";
import type { DecisionModerationApi } from "@sos-miam/commun/types/signalement";
import { estPseudoNeutre } from "~/fonctions/compte/est-pseudo-neutre";
import { expliquerPseudoServeur } from "~/fonctions/compte/expliquer-pseudo-serveur";
import { trouverDecisionProfil } from "~/fonctions/compte/trouver-decision-profil";
import { RESERVATION_MS, type Memoire } from "~/services/synchro-profil-memoire";

type OutilsExplication = {
  listerDecisions: ServiceModerationApp["listerDecisions"];
  lireGeneration: () => number;
  lireMemoire: () => Memoire;
  sousVerrou: <T>(etape: () => Promise<T>) => Promise<T>;
  /** Redessine l'annonce et garde l'état sur le téléphone */
  garder: () => void;
  /** Retire une annonce de pseudo qui ne colle plus au pseudo du téléphone */
  suivrePseudo: () => void;
};

/**
 * Le serveur montre un autre pseudo que celui d'avant : l'équipe (profil retenu : décision dans « mes décisions », ou
 * forme d'un pseudo neutre si la liste ne se lit pas) ou un autre téléphone du compte (sans bruit). À la première
 * synchro, la liste n'est lue que pour un pseudo neutre. Hors du couloir (Mes infos n'attend jamais cette lecture), et
 * l'annonce n'est posée que si rien n'a changé entre-temps (déconnexion, autre compte : elle est oubliée).
 */
export function creerExplicationPseudo(o: OutilsExplication) {
  return function expliquerPseudo(ancien: string | null, nouveau: string, premiere: boolean) {
    const gen = o.lireGeneration();
    const m = o.lireMemoire();
    const depuis = premiere || !m.etat.luLe ? Date.now() - RESERVATION_MS : m.etat.luLe;
    void (async () => {
      // Un tour de plus avant tout : l'appelant (recevoir) pose d'abord la fusion du profil reçu dans le verrou, et
      // l'annonce passe après elle, même quand aucune liste n'est à lire (sinon elle serait comparée à l'ancien pseudo)
      await null;
      let decision: DecisionModerationApi | null | "illisible" = null;
      if (!premiere || estPseudoNeutre(nouveau)) {
        const r = await o.listerDecisions().catch(() => null);
        decision = r?.ok ? trouverDecisionProfil(r.decisions, depuis) : "illisible";
      }
      const { annonce, misDeCote } = expliquerPseudoServeur(ancien, nouveau, decision, premiere, RESERVATION_MS);
      if (!annonce && !misDeCote) return;
      // Dans le verrou : après l'écriture du profil reçu (la fusion lancée juste après cette lecture)
      await o.sousVerrou(async () => {
        if (gen !== o.lireGeneration() || m !== o.lireMemoire()) return;
        if (misDeCote) m.etat.pseudoMisDeCote = misDeCote;
        if (annonce) m.etat.annonce = annonce;
        o.garder();
        // Le pseudo du téléphone a pu rester un autre (changé pendant la lecture) : une annonce qui ne colle pas s'en va
        o.suivrePseudo();
      });
    })();
  };
}
