// La décision de l'équipe sur un avis ou sur la réponse d'un lieu (relecture, docs/decisions.md, « Modération des avis et
// limitation d'un compte ») : le service de la session App (avis-gestion.ts) change le statut, les points et les défis ; ici,
// pour « masquer », la décision écrite (une ligne Signalement retenue : règle enfreinte et pourquoi, contestable 6 mois depuis
// l'app) dans la MÊME transaction, puis la cloche « contenu-retire » de l'auteur. « Publier » n'écrit rien d'autre.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { construireDecisionAvis } from "../../fonctions/avis/construire-decision-avis.ts";
import type { AvisGestion, OptionsDecisionAvis } from "../avis-gestion.ts";
import type { CIBLES_AVIS, ModerationSociale } from "./cibles-moderation.ts";
import type { MotifModeration } from "./motifs-moderation.ts";

export type CibleAvis = (typeof CIBLES_AVIS)[number];
export type DecisionAvisEquipe = { action: "publier" } | { action: "masquer"; motif: MotifModeration; motivation: string };

export async function deciderAvis(
  avis: AvisGestion, cible: CibleAvis, avisId: number, decision: DecisionAvisEquipe, social?: ModerationSociale, maintenant = new Date(),
) {
  let signalementId: number | null = null;
  const options: OptionsDecisionAvis = decision.action === "masquer"
    ? {
      dansLaTransaction: async (tx, r) => {
        const ligne = await (tx ?? baseDeDonnees).signalement.create({
          data: construireDecisionAvis({ cible, avisId: r.avisId, lieuId: r.lieuId, compteId: r.compteId, motif: decision.motif, motivation: decision.motivation, maintenant }),
          select: { id: true },
        });
        signalementId = ligne.id;
      },
    }
    : {};
  const choix = { action: decision.action } as const;
  const resultat = cible === "avis"
    ? await avis.trancherAvis(avisId, choix, maintenant, options)
    : await avis.trancherReponseAvis(avisId, choix, maintenant, options);
  if (resultat.ok && decision.action === "masquer" && signalementId !== null && resultat.compteId && social) {
    await social.cloche
      .noter([{ compteId: resultat.compteId, type: "contenu-retire", acteurId: null, cible: { type: "signalement", id: String(signalementId) }, detail: decision.motif }], maintenant)
      .catch((erreur: unknown) => console.error("Avis : cloche non écrite :", (erreur as Error).message));
  }
  return resultat;
}
