// Proposition de lieu envoyée avec /proposer-lieu, postée dans le salon des propositions.
import { escapeMarkdown, type ContainerBuilder, type User } from "discord.js";
import type { TypeLieu } from "../contenus/types-lieux.ts";
import { creerBloc } from "../fonctions/discord/creer-bloc.ts";
import { COULEURS } from "../interface/couleurs.ts";

export type Proposition = {
  nom: string;
  ville: string;
  type: TypeLieu;
  pourquoi: string;
  lien: string;
};

export function creerMessageProposition(proposition: Proposition, auteur: User): ContainerBuilder {
  const { nom, ville, type, pourquoi, lien } = proposition;
  const parties = [`## 💡 ${escapeMarkdown(nom)}\n📍 ${escapeMarkdown(ville)} · ${type.emoji} ${type.libelle}`, `>>> ${pourquoi}`];
  if (lien) parties.push(`🔗 ${lien}`);
  return creerBloc({
    couleur: COULEURS.tomate,
    parties,
    pied: `Proposé par ${auteur} · Toi aussi tu valides ? Réagis avec 😋`,
  });
}
