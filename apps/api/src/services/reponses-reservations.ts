import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import { ecrireNotificationNouvelleTable } from "../fonctions/reservations/ecrire-notification-nouvelle-table.ts";
import { ecrireNotificationReservation } from "../fonctions/reservations/ecrire-notification-reservation.ts";
import type { MessagePush } from "./notifications/expedier-push.ts";
import type { LigneReservation, NouvelleTable, ReponseReservation } from "./reservations-regles.ts";
import type { DepotVisites, TablesVisites } from "./visites-regles.ts";

export type PrevenirCompte = (compteId: number, message: MessagePush) => Promise<void>;
export type PrevenirReponses = (reponses: readonly ReponseReservation[]) => void;
export type PrevenirNouvelleTable = (table: NouvelleTable) => void;

export function creerPrevenirReponses(prevenirCompte: PrevenirCompte, horloge: () => number): PrevenirReponses {
  return (reponses) => {
    const maintenant = new Date(horloge());
    const utiles = reponses.filter((r) => r.statut !== "expiree" || r.creneau > maintenant);
    if (utiles.length === 0) return;
    setImmediate(() => {
      for (const r of utiles) {
        prevenirCompte(r.compteId, ecrireNotificationReservation(r, maintenant)).catch((erreur: unknown) => {
          console.error("Réservations : client non prévenu :", resumerErreur(erreur));
        });
      }
    });
  };
}

export function creerPrevenirNouvellesTables(prevenirCompte: PrevenirCompte, horloge: () => number): PrevenirNouvelleTable {
  return ({ reservation: r, lieu, equipe }) => {
    const maintenant = new Date(horloge());
    const envois: [number, MessagePush][] = equipe.filter((id) => id !== r.compteId).map((id) => [id, ecrireNotificationNouvelleTable(r, lieu, maintenant)]);
    if (r.statut === "acceptee") {
      envois.push([r.compteId, ecrireNotificationReservation({ compteId: r.compteId, lieu, creneau: r.creneau, statut: "acceptee", motif: null }, maintenant)]);
    }
    if (envois.length === 0) return;
    setImmediate(() => {
      for (const [compteId, message] of envois) {
        prevenirCompte(compteId, message).catch((erreur: unknown) => {
          console.error("Réservations : nouvelle table non annoncée :", resumerErreur(erreur));
        });
      }
    });
  };
}

async function decrireExpirees(t: TablesVisites, expirees: readonly LigneReservation[]): Promise<ReponseReservation[]> {
  const lieux = await t.resumerLieux([...new Set(expirees.map((r) => r.lieuId))]);
  return expirees.flatMap((r) => {
    const lieu = lieux.get(r.lieuId);
    return lieu ? [{ compteId: r.compteId, lieu, creneau: r.creneau, statut: "expiree" as const, motif: null }] : [];
  });
}

export function suivreExpirations(depot: DepotVisites, prevenir: PrevenirReponses): DepotVisites {
  const suivre = (passer: DepotVisites["lire"], memeSiEchec: boolean) =>
    async <T>(fn: (t: TablesVisites) => Promise<T>): Promise<T> => {
      const reponses: ReponseReservation[] = [];
      let fini = false;
      try {
        const resultat = await passer((t) => fn({
          ...t,
          async expirerReservations(maintenant, portee) {
            const expirees = await t.expirerReservations(maintenant, portee);
            if (expirees.length > 0) reponses.push(...(await decrireExpirees(t, expirees)));
            return expirees;
          },
        }));
        fini = true;
        return resultat;
      } finally {
        if ((fini || memeSiEchec) && reponses.length > 0) prevenir(reponses);
      }
    };
  return { lire: suivre((fn) => depot.lire(fn), true), ecrire: suivre((fn) => depot.ecrire(fn), false) };
}

export function brancherReponsesReservations(
  d: { depot: DepotVisites; prevenirCompte?: PrevenirCompte }, horloge: () => number,
): { depot: DepotVisites; prevenir: PrevenirReponses } {
  if (!d.prevenirCompte) return { depot: d.depot, prevenir: () => {} };
  const prevenir = creerPrevenirReponses(d.prevenirCompte, horloge);
  return { depot: suivreExpirations(d.depot, prevenir), prevenir };
}
