import type { CibleSignalementSecurite, GraviteSignalementSecurite, StatutSignalementSecurite } from "../../../../packages/commun/src/types/securite.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import type { SignalementSecurite } from "../base-de-donnees/client-genere/client.ts";
import type { DepotSecurite, SignalementAvecTableau, SignalementEnBase } from "./securite-regles.ts";

type BaseSecurite = Pick<typeof baseDeDonnees, "$transaction" | "$queryRaw" | "signalementSecurite" | "entreeTableauHonneurSecurite" | "compte" | "badgeCompte">;

const AVEC_TABLEAU = { entreeTableau: { select: { id: true } } } as const;
const ESPACE_VERROU_SIGNALEMENTS = 0x53_42_00_01;

const versSignalement = (ligne: SignalementSecurite): SignalementEnBase => ({
  id: ligne.id,
  nomChiffre: ligne.nomChiffre,
  emailChiffre: ligne.emailChiffre,
  emailEmpreinte: ligne.emailEmpreinte,
  cible: ligne.cible as CibleSignalementSecurite,
  titreChiffre: ligne.titreChiffre,
  descriptionChiffree: ligne.descriptionChiffree,
  lienChiffre: ligne.lienChiffre,
  images: [...(ligne.images ?? [])],
  nomTableauChiffre: ligne.nomTableauChiffre,
  statut: ligne.statut as StatutSignalementSecurite,
  gravite: ligne.gravite as GraviteSignalementSecurite | null,
  creeLe: ligne.creeLe,
  clotureLe: ligne.clotureLe,
  badgeDonneLe: ligne.badgeDonneLe,
});

const versAvecTableau = ({ entreeTableau, ...ligne }: SignalementSecurite & { entreeTableau: { id: number } | null }): SignalementAvecTableau => ({
  ...versSignalement(ligne), auTableauHonneur: entreeTableau !== null,
});

const estAbsente = (erreur: unknown) => (erreur as { code?: unknown } | null)?.code === "P2025";

const lireCleVerrouEmail = (empreinte: string) => Number.parseInt(empreinte.slice(0, 8).padEnd(8, "0"), 16) | 0;

const lireDepotsEmail = async (b: Pick<BaseSecurite, "signalementSecurite">, empreinte: string, depuis: Date) => (await b.signalementSecurite.findMany({
  where: { emailEmpreinte: empreinte, creeLe: { gt: depuis } },
  select: { creeLe: true },
  take: 50,
})).map((l) => l.creeLe);

export function creerDepotSecurite(base: BaseSecurite = baseDeDonnees): DepotSecurite {
  const lister = async (where: { statut?: StatutSignalementSecurite | { not: StatutSignalementSecurite } }, nombre: number) => (nombre <= 0 ? [] : (await base.signalementSecurite.findMany({
    where,
    orderBy: [{ creeLe: "desc" }, { id: "desc" }],
    take: nombre,
    include: AVEC_TABLEAU,
  })).map(versAvecTableau));

  return {
    listerDepotsEmail: (empreinte, depuis) => lireDepotsEmail(base, empreinte, depuis),

    ajouterSignalement: (signalement, { depuis, maximum }) => base.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${ESPACE_VERROU_SIGNALEMENTS}::int4, ${lireCleVerrouEmail(signalement.emailEmpreinte)}::int4)`;
      const depots = await lireDepotsEmail(tx, signalement.emailEmpreinte, depuis);
      if (depots.length >= maximum) return { ok: false as const, depots };
      await tx.signalementSecurite.create({ data: signalement });
      return { ok: true as const };
    }),

    listerSignalements: async ({ statut }, nombre) => {
      if (statut !== undefined) return lister({ statut }, nombre);
      const nouveaux = await lister({ statut: "nouveau" }, nombre);
      return [...nouveaux, ...(await lister({ statut: { not: "nouveau" } }, nombre - nouveaux.length))];
    },

    listerSignalementsApres: async (apres, nombre) => (await base.signalementSecurite.findMany({
      where: apres === null ? {} : { id: { gt: apres } },
      orderBy: { id: "asc" },
      take: nombre,
    })).map(versSignalement),

    lireSignalement: async (id) => {
      const ligne = await base.signalementSecurite.findUnique({ where: { id }, include: AVEC_TABLEAU });
      return ligne ? versAvecTableau(ligne) : null;
    },

    modifierSignalement: async (id, changements) => (await base.signalementSecurite.updateMany({ where: { id }, data: changements })).count > 0,

    remplacerChiffres: async (id, imagesAvant, chiffres) => (await base.signalementSecurite.updateMany({
      where: { id, images: { equals: [...imagesAvant] } },
      data: chiffres,
    })).count > 0,

    supprimerSignalement: async (id) => {
      try {
        const supprime = await base.signalementSecurite.delete({ where: { id }, select: { images: true } });
        return { images: [...(supprime.images ?? [])] };
      } catch (erreur) {
        if (estAbsente(erreur)) return null;
        throw erreur;
      }
    },

    effacerSignalementsClosAvant: async (limite) => {
      const lignes = await base.$queryRaw<{ images: string[] | null }[]>`DELETE FROM signalements_securite WHERE cloture_le < ${limite} RETURNING images`;
      return { nombre: lignes.length, images: lignes.flatMap((l) => l.images ?? []) };
    },

    listerImagesCitees: async (fichiers) => {
      if (fichiers.length === 0) return new Set();
      const demandes = new Set(fichiers);
      const lignes = await base.signalementSecurite.findMany({ where: { images: { hasSome: [...demandes] } }, select: { images: true } });
      return new Set(lignes.flatMap((l) => (l.images ?? []).filter((f) => demandes.has(f))));
    },

    listerEmailsConfirmes: async (emails) => {
      if (emails.length === 0) return new Set();
      const lignes = await base.compte.findMany({ where: { email: { in: [...emails] }, emailVerifieLe: { not: null } }, select: { email: true } });
      return new Set(lignes.map((l) => l.email));
    },

    donnerBadge: (signalementId, email, badge, quand) => base.$transaction(async (tx) => {
      const signalement = await tx.signalementSecurite.findUnique({ where: { id: signalementId }, select: { id: true } });
      if (!signalement) return { ok: false as const, erreur: "signalement-inconnu" as const };
      const compte = await tx.compte.findUnique({ where: { email }, select: { id: true, emailVerifieLe: true } });
      if (!compte || compte.emailVerifieLe === null) return { ok: false as const, erreur: "compte-introuvable" as const };
      const { count } = await tx.badgeCompte.createMany({ data: [{ compteId: compte.id, badge }], skipDuplicates: true });
      await tx.signalementSecurite.updateMany({ where: { id: signalementId, badgeDonneLe: null }, data: { badgeDonneLe: quand } });
      return { ok: true as const, nouveau: count === 1 };
    }),

    listerTableauHonneur: (nombre) => base.entreeTableauHonneurSecurite.findMany({ orderBy: [{ mois: "desc" }, { id: "desc" }], take: nombre }),

    ajouterAuTableau: async ({ nom, mois, signalementId }, quand) => {
      await base.entreeTableauHonneurSecurite.createMany({ data: [{ nom, mois, signalementId, creeLe: quand }], skipDuplicates: true });
    },

    retirerDuTableauParSignalement: async (signalementId) => (await base.entreeTableauHonneurSecurite.deleteMany({ where: { signalementId } })).count > 0,

    retirerEntreeTableau: async (id) => (await base.entreeTableauHonneurSecurite.deleteMany({ where: { id } })).count > 0,
  };
}
