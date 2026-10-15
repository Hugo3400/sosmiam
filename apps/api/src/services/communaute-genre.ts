import { calculerProchainChangementGenre } from "../../../../packages/commun/src/fonctions/genre/calculer-prochain-changement-genre.ts";
import type { ChoixGenre, GenreProfil } from "../../../../packages/commun/src/types/genre.ts";
import { lireChoixGenre } from "./communaute-profils.ts";
import { refus, type ContexteCommunaute, type ProfilCommunauteLu, type ServicesGenre } from "./communaute-regles.ts";

const presenter = (choix: ChoixGenre | null, profil: Pick<ProfilCommunauteLu, "genreChoisiLe"> | null): GenreProfil => ({
  choix, modifieLe: profil?.genreChoisiLe?.toISOString() ?? null,
});

export function creerGenre(c: ContexteCommunaute): ServicesGenre {
  return {
    async lire(moi) {
      if (!c.genre) return refus("chiffrement-indisponible");
      const profil = await c.depot.lire((t) => t.lireProfil(moi));
      return { ok: true, genre: presenter(lireChoixGenre(c.genre, profil?.genreChiffre, moi), profil), effets: [] };
    },

    async choisir(moi, choix, maintenant) {
      const genre = c.genre;
      if (!genre) return refus("chiffrement-indisponible");
      return c.depot.ecrire(async (t) => {
        await t.verrouillerComptes([moi]);
        const profil = await t.lireProfil(moi);
        const actuel = lireChoixGenre(genre, profil?.genreChiffre, moi);
        if (actuel === choix) return { ok: true as const, genre: presenter(actuel, profil), effets: [] };
        if (choix === "ne-pas-dire") {
          await t.ecrireProfil(moi, { genreChiffre: genre.chiffrer(choix, moi) }, maintenant);
          return { ok: true as const, genre: presenter(choix, profil), effets: [] };
        }
        const prochain = calculerProchainChangementGenre(profil?.genreChoisiLe?.toISOString() ?? null);
        if (prochain && Date.parse(prochain) > maintenant.getTime()) return refus("genre-trop-tot", new Date(prochain));
        await t.ecrireProfil(moi, { genreChiffre: genre.chiffrer(choix, moi), genreChoisiLe: maintenant }, maintenant);
        return { ok: true as const, genre: presenter(choix, { genreChoisiLe: maintenant }), effets: [] };
      });
    },

    async effacer(moi, maintenant) {
      if (!c.genre) return refus("chiffrement-indisponible");
      return c.depot.ecrire(async (t) => {
        await t.verrouillerComptes([moi]);
        const profil = await t.lireProfil(moi);
        if (profil?.genreChiffre) await t.ecrireProfil(moi, { genreChiffre: null }, maintenant);
        return { ok: true as const, genre: presenter(null, profil), effets: [] };
      });
    },
  };
}
