// Les totaux du compteur de visites (services/mesure.ts), gardés dans PostgreSQL.
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import type { StockageStats } from "./mesure.ts";

export const stockageStats: StockageStats = {
  async lirePeriode(source, type, cle) {
    return baseDeDonnees.statPeriode.findUnique({
      where: { source_type_cle: { source, type, cle } },
      select: { vues: true, visites: true, visiteurs: true, esquisse: true, secret: true },
    }) as Promise<Awaited<ReturnType<StockageStats["lirePeriode"]>>>;
  },

  async ecrirePeriode(source, type, cle, { vues, visites, visiteurs, esquisse, secret }) {
    const donnees = { vues, visites, visiteurs, esquisse: new Uint8Array(esquisse), secret: new Uint8Array(secret) };
    await baseDeDonnees.statPeriode.upsert({
      where: { source_type_cle: { source, type, cle } },
      create: { source, type, cle, ...donnees },
      update: donnees,
    });
  },

  async ajouterDetails(lignes) {
    await baseDeDonnees.$transaction(
      lignes.map(({ source, jour, dimension, valeur, nombre }) =>
        baseDeDonnees.statDetail.upsert({
          where: { source_jour_dimension_valeur: { source, jour, dimension, valeur } },
          create: { source, jour, dimension, valeur, nombre },
          update: { nombre: { increment: nombre } },
        }),
      ),
    );
  },

  async fermerPeriodesPassees(source, enCours) {
    for (const [type, cle] of Object.entries(enCours)) {
      await baseDeDonnees.statPeriode.updateMany({
        where: { source, type, cle: { not: cle }, OR: [{ secret: { not: null } }, { esquisse: { not: null } }] },
        data: { secret: null, esquisse: null },
      });
    }
  },
};
