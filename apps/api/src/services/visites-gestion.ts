// Ce que l'équipe SOS Miam fait sur une visite depuis le logiciel de gestion (route /api-gestion de la session du logiciel) :
// donner raison au client qui contestait un refus ou un retrait. Mêmes règles que le reste (machine à états de packages/commun,
// effets appliqués dans la transaction), points posés après coup, client prévenu sur son téléphone.
import type { MessagePush } from "./notifications/expedier-push.ts";
import type { ChiffrementDonnees } from "./chiffrement-donnees.ts";
import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import { deciderVisite } from "../fonctions/visites/decider-visite.ts";
import { estMajeurVisiteur } from "../fonctions/visites/est-majeur-visiteur.ts";
import type { PointsVisite } from "../fonctions/visites/appliquer-effets-visite.ts";
import type { DepotVisites } from "./visites-regles.ts";

export type DependancesVisitesGestion = {
  depot: DepotVisites;
  chiffrement: ChiffrementDonnees | null;
  /** ajouterPoints de services/comptes.ts */
  ajouterPoints: (compteId: number, points: number, raison: "visite" | "visite-sos", detail?: string) => Promise<unknown>;
  /** prevenirCompte de services/notifications/prevenir-compte.ts (facultatif dans les tests) */
  prevenirCompte?: (compteId: number, message: MessagePush) => Promise<void>;
};

export type ResultatDonnerRaison =
  | { ok: true; visiteId: number; compteId: number; lieuId: number }
  | { ok: false; erreur: "introuvable" | "pas-contestee" | "transition-interdite" };

export function creerVisitesGestion(d: DependancesVisitesGestion) {
  return {
    /**
     * « Donner raison au client » : une visite contestée, refusée ou retirée, passe en validée avec les effets d'une validation
     * (points, tampon de fidélité selon l'âge, avis ouvert dans 1 h). Décidée par l'équipe SOS Miam : decideParId vide, jamais
     * annulable par le lieu ; « contestee » reste vrai (le logiciel la montre « raison donnée »). Le client est prévenu ; le lieu,
     * lui, ne reçoit rien (et jamais le mot du client).
     */
    async donnerRaisonAuClient(visiteId: number, maintenant: Date): Promise<ResultatDonnerRaison> {
      const r = await d.depot.ecrire(async (t) => {
        const avant = await t.lireVisite(visiteId);
        if (!avant) return { ok: false, erreur: "introuvable" } as const;
        await t.verrouillerCompte(avant.compteId);
        const v = await t.lireVisite(visiteId);
        if (!v) return { ok: false, erreur: "introuvable" } as const;
        if (!v.contestee) return { ok: false, erreur: "pas-contestee" } as const;
        const compte = (await t.lireComptes([v.compteId])).get(v.compteId);
        const majeur = estMajeurVisiteur(compte?.dateNaissanceChiffree ?? null, d.chiffrement, maintenant);
        const decision = await deciderVisite(t, v, { type: "donner-raison", reglement: v.reglement ?? undefined }, maintenant, majeur, null);
        if (!decision.ok) return { ok: false, erreur: "transition-interdite" } as const;
        const lieu = (await t.resumerLieux([v.lieuId])).get(v.lieuId);
        return { ok: true, visiteId, compteId: v.compteId, lieuId: v.lieuId, points: decision.points, nomLieu: lieu?.nom ?? "ce lieu" } as const;
      });
      if (!r.ok) return r;
      await poser(d.ajouterPoints, r.compteId, r.points);
      const gagnes = r.points.reduce((total, p) => total + p.valeur, 0);
      await d.prevenirCompte?.(r.compteId, {
        titre: "Bonne nouvelle 🎉",
        texte: `On a revu ta visite chez ${r.nomLieu} : elle est validée${gagnes > 0 ? ` (+${gagnes} points)` : ""}. Merci de ta patience !`,
        lien: `/visite/${r.visiteId}`,
      }).catch((erreur: unknown) => console.error("Visites : client non prévenu :", resumerErreur(erreur)));
      return { ok: true, visiteId: r.visiteId, compteId: r.compteId, lieuId: r.lieuId };
    },
  };
}

/** Les points d'une décision ; un raté est noté au journal, la visite reste écrite */
async function poser(ajouterPoints: DependancesVisitesGestion["ajouterPoints"], compteId: number, points: PointsVisite[]) {
  for (const p of points) {
    await ajouterPoints(compteId, p.valeur, p.raison, p.detail).catch((erreur: unknown) => console.error("Visites : points non posés :", resumerErreur(erreur)));
  }
}
