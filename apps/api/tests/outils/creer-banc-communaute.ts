import { randomUUID } from "node:crypto";

import { lireTablesCommunauteEnMemoire } from "../../src/services/communaute-en-memoire.ts";
import type { LieuSocialEnMemoire } from "../../src/services/tables-sociales-en-memoire.ts";
import { creerBancSocial, type PersonneDeTest } from "./creer-banc-social.ts";

export const HEURE = 3_600_000;
export const JOUR = 24 * HEURE;

export async function creerBancCommunaute() {
  const limites = new Set<number>();
  const banc = await creerBancSocial({ estLimite: async (id) => (limites.has(id) ? { jusqua: null, motif: "spam" } : null) });
  const communaute = lireTablesCommunauteEnMemoire(banc.tables);
  let dernierLieu = 900;

  function lieu(o: { statut?: string; ville?: string } = {}): number {
    dernierLieu += 1;
    const fiche: LieuSocialEnMemoire & { ville: string; emoji: string; type: string } = {
      statut: o.statut ?? "publie", nom: `Chez Capitaine Bouiboui n°${dernierLieu}`, ville: o.ville ?? "Nantes", emoji: "🍜", type: "resto",
    };
    banc.tables.lieux.set(dernierLieu, fiche);
    return dernierLieu;
  }

  const iso = (decalage: number) => new Date(banc.horloge.maintenant + decalage).toISOString();

  const nouvelleSortie = (lieuId: number, enPlus: Record<string, unknown> = {}) => ({
    titre: "Brunch des nouveaux", description: "On papote, on goûte.", quand: iso(3 * JOUR), lieuId, public: { type: "tous" },
    etiquettes: [{ nom: "Végétarien", officielle: true }, { nom: "fans de ramen", officielle: false }], places: 6, placeGardeePourNouveau: false, recurrente: false,
    ...enPlus,
  });

  async function organiser(p: PersonneDeTest, corps: Record<string, unknown>) {
    return p.demander("POST", "/app/communaute/sorties", { ...corps, idClient: randomUUID() });
  }

  function vieillir(p: PersonneDeTest, jours = 60) {
    const compte = banc.memoire.comptes.get(p.compteId);
    if (compte) compte.creeLe = banc.horloge.maintenant - jours * JOUR;
  }

  const clocheDe = (p: PersonneDeTest) => [...banc.tables.cloche.values()].filter((n) => n.compteId === p.compteId).map((n) => n.type);
  const membres = (conversationId: string) => banc.tables.membres.filter((m) => m.conversationId === Number(conversationId)).map((m) => m.compteId).sort((a, b) => a - b);

  return { banc, communaute, limites, lieu, iso, nouvelleSortie, organiser, vieillir, clocheDe, membres };
}
