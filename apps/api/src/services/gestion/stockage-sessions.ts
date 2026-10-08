// Sessions du logiciel de gestion gardées dans la base (empreinte seulement), pour survivre aux redémarrages de l'API.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import type { StockageSessions } from "../../middlewares/proteger-gestion.ts";

export const stockageSessions: StockageSessions = {
  async lire(empreinte) {
    const session = await baseDeDonnees.sessionGestion.findUnique({ where: { empreinte } });
    return session ? { posteId: session.posteId, creeLe: session.creeLe.getTime(), activite: session.activite.getTime() } : null;
  },
  async creer(empreinte, { posteId, creeLe, activite }) {
    await baseDeDonnees.sessionGestion.create({ data: { empreinte, posteId, creeLe: new Date(creeLe), activite: new Date(activite) } });
  },
  async toucher(empreinte, activite) {
    await baseDeDonnees.sessionGestion.updateMany({ where: { empreinte }, data: { activite: new Date(activite) } });
  },
  async supprimer(empreinte) {
    await baseDeDonnees.sessionGestion.deleteMany({ where: { empreinte } });
  },
  async faireLeMenage(posteId, { creeLe, activite }) {
    await baseDeDonnees.sessionGestion.deleteMany({
      where: { OR: [{ posteId }, { creeLe: { lt: new Date(creeLe) } }, { activite: { lt: new Date(activite) } }] },
    });
  },
};
