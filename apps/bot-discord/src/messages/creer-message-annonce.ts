// Annonce écrite dans le logiciel de gestion, publiée par le bot dans le salon d'annonces.
import { escapeMarkdown, type ContainerBuilder } from "discord.js";
import { creerBloc } from "../fonctions/discord/creer-bloc.ts";
import { COULEURS } from "../interface/couleurs.ts";

export type Annonce = { id: number; titre: string; texte: string };

export function creerMessageAnnonce({ titre, texte }: Annonce): ContainerBuilder {
  return creerBloc({ couleur: COULEURS.jaune, parties: [`## 📣 ${escapeMarkdown(titre)}`, texte], pied: "L'équipe SOS Miam 🛟" });
}
