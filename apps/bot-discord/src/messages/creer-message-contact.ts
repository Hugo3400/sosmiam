// Comment joindre l'équipe (/contact). Tant que le site n'est pas ouvert, tout passe par l'e-mail, comme sur la page « Bientôt ».
import type { ContainerBuilder } from "discord.js";
import { LIENS } from "../contenus/liens.ts";
import { creerBloc } from "../fonctions/discord/creer-bloc.ts";
import { COULEURS } from "../interface/couleurs.ts";

export function creerMessageContact(): ContainerBuilder {
  return creerBloc({
    couleur: COULEURS.jaune,
    vignette: LIENS.logo,
    parties: [
      `# 💌 Nous écrire\nUne question, une idée, un petit mot doux ? Tout arrive au même endroit : **${LIENS.email}**`,
      [
        "### Selon ce que tu veux",
        "📬 **Être prévenu du lancement** · objet « Inscription à la newsletter », avec ta ville",
        "🍽️ **Inscrire ton lieu** · son nom, sa ville et son type (resto, pâtisserie, bar, sortie…)",
        "🎖️ **Devenir ambassadeur fondateur** · ton quartier et tes pépites du coin",
        "💡 **Proposer un lieu que tu adores** · pas besoin d'e-mail, tape `/proposer-lieu`",
      ].join("\n"),
    ],
    liens: [{ libelle: "sosmiam.fr", url: LIENS.site, emoji: "🌐" }],
    pied: "On lit tout, et on répond à tout le monde. Promis, même aux messages qui commencent par « petite question ».",
  });
}
