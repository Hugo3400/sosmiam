// Sessions des comptes (espace ambassadeur) gardées dans la base : l'empreinte SHA-256 du jeton seulement, jamais le
// jeton. Chaque lecture relit aussi le titulaire (prénom, statut, dernière visite) : une décision de l'équipe compte tout de suite.
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import type { StockageSessionsComptes } from "../middlewares/proteger-comptes.ts";
import type { StatutAmbassadeur } from "./comptes.ts";

export const stockageSessionsComptes: StockageSessionsComptes = {
  async lire(empreinte) {
    const session = await baseDeDonnees.sessionCompte.findUnique({
      where: { empreinte },
      select: {
        compteId: true, creeLe: true, activite: true,
        compte: { select: { prenom: true, derniereConnexion: true, ambassadeur: { select: { statut: true } } } },
      },
    });
    if (!session) return null;
    return {
      compteId: session.compteId,
      creeLe: session.creeLe.getTime(),
      activite: session.activite.getTime(),
      prenom: session.compte.prenom,
      statutAmbassadeur: (session.compte.ambassadeur?.statut ?? null) as StatutAmbassadeur | null,
      derniereConnexion: session.compte.derniereConnexion.getTime(),
    };
  },
  async creer(empreinte, { compteId, creeLe, activite }) {
    // Une connexion est aussi une visite : elle repousse l'effacement du compte (1 an sans visite)
    await baseDeDonnees.$transaction([
      baseDeDonnees.sessionCompte.create({ data: { empreinte, compteId, creeLe: new Date(creeLe), activite: new Date(activite) } }),
      baseDeDonnees.compte.update({ where: { id: compteId }, data: { derniereConnexion: new Date(creeLe) } }),
    ]);
  },
  async toucher(empreinte, activite) {
    await baseDeDonnees.sessionCompte.updateMany({ where: { empreinte }, data: { activite: new Date(activite) } });
  },
  async noterVisite(compteId, moment) {
    await baseDeDonnees.compte.updateMany({ where: { id: compteId }, data: { derniereConnexion: new Date(moment) } });
  },
  async supprimer(empreinte) {
    await baseDeDonnees.sessionCompte.deleteMany({ where: { empreinte } });
  },
  async supprimerDuCompte(compteId, saufEmpreinte) {
    await baseDeDonnees.sessionCompte.deleteMany({ where: { compteId, ...(saufEmpreinte ? { NOT: { empreinte: saufEmpreinte } } : {}) } });
  },
};
