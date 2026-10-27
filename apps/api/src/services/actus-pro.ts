import type { MotifModeration } from "../../../../packages/commun/src/contenus/motifs-moderation.ts";
import { REPONSE_LIEU_ACTUS_MAX } from "../../../../packages/commun/src/regles/actus.ts";
import type { ArticleCitantLieuActus, StatutReponseLieuActus } from "../../../../packages/commun/src/types/actus.ts";
import { contientMotInterdit } from "../../../../packages/commun/src/validation/contient-mot-interdit.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { ecrireAdresseImageActus } from "../fonctions/actus/ecrire-adresse-image-actus.ts";
import { echecActus, REPONSE_ACTUS_MIN, type EchecActus } from "./actus-regles.ts";

type BaseActusPro = Pick<typeof baseDeDonnees, "articleActus" | "reponseLieuActus">;

export type RoleDansLeLieu = (compteId: number, lieuId: number) => Promise<string | null>;

export type ActusPro = ReturnType<typeof creerActusPro>;

const ARTICLES_MAX = 100;

export function creerActusPro(roleDe: RoleDansLeLieu, base: BaseActusPro = baseDeDonnees, horloge: () => number = Date.now) {
  return {
    async lister(compteId: number, lieuId: number): Promise<{ ok: true; articles: ArticleCitantLieuActus[] } | EchecActus> {
      if (!(await roleDe(compteId, lieuId))) return echecActus("role-requis");
      const lignes = await base.articleActus.findMany({
        where: { statut: "publie", lieux: { some: { lieuId } } },
        orderBy: [{ publieLe: "desc" }, { id: "desc" }],
        take: ARTICLES_MAX,
        select: {
          id: true, titre: true, couverture: true, publieLe: true,
          auteur: { select: { prenom: true } },
          reponses: { where: { lieuId }, select: { texte: true, statut: true, refusMotif: true, reecrite: true } },
        },
      });
      return {
        ok: true,
        articles: lignes.map((l) => {
          const r = l.reponses[0];
          return {
            id: l.id,
            titre: l.titre,
            couverture: ecrireAdresseImageActus(l.couverture),
            auteur: l.auteur.prenom,
            publieLe: (l.publieLe ?? new Date(0)).toISOString(),
            reponse: r
              ? { texte: r.texte, statut: r.statut as StatutReponseLieuActus, motif: (r.refusMotif as MotifModeration | null) ?? null, peutReecrire: r.statut === "refuse" && !r.reecrite }
              : null,
          };
        }),
      };
    },

    async repondre(compteId: number, lieuId: number, articleId: number, brut: unknown): Promise<{ ok: true } | EchecActus> {
      const texte = typeof brut === "string" ? brut.replace(/\s+/g, " ").trim() : "";
      if (texte.length < REPONSE_ACTUS_MIN || texte.length > REPONSE_LIEU_ACTUS_MAX) return echecActus("message-refuse");
      if (contientMotInterdit(texte)) return echecActus("message-refuse");
      if ((await roleDe(compteId, lieuId)) !== "gerant") return echecActus("role-requis");
      const cite = await base.articleActus.count({ where: { id: articleId, statut: "publie", lieux: { some: { lieuId } } } });
      if (cite === 0) return echecActus("introuvable");
      const maintenant = new Date(horloge());
      const existante = await base.reponseLieuActus.findUnique({ where: { articleId_lieuId: { articleId, lieuId } }, select: { id: true, statut: true, reecrite: true } });
      if (!existante) {
        const cree = await base.reponseLieuActus.createMany({ data: [{ articleId, lieuId, ecritParId: compteId, texte, envoyeLe: maintenant }], skipDuplicates: true });
        return cree.count === 1 ? { ok: true } : echecActus("reponse-deja-donnee");
      }
      if (existante.statut !== "refuse" || existante.reecrite) return echecActus("reponse-deja-donnee");
      const fait = await base.reponseLieuActus.updateMany({
        where: { id: existante.id, statut: "refuse", reecrite: false },
        data: { texte, ecritParId: compteId, statut: "en-relecture", reecrite: true, refusMotif: null, envoyeLe: maintenant, decideLe: null },
      });
      return fait.count === 1 ? { ok: true } : echecActus("reponse-deja-donnee");
    },
  };
}
