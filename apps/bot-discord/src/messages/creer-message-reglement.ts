// Règlement du serveur, publié avec /publier reglement. Ton SOS Miam : drôle, bienveillant, jamais sermonneur.
import type { ContainerBuilder } from "discord.js";
import { LIENS } from "../contenus/liens.ts";
import { creerBloc } from "../fonctions/discord/creer-bloc.ts";
import { COULEURS } from "../interface/couleurs.ts";

const REGLES = [
  "**Bienveillance d'abord.** On peut ne pas aimer un plat, jamais attaquer une personne. Les serveurs, les cuistots et les autres membres sont des humains comme toi.",
  "**Respect des lieux en difficulté.** Un lieu qui galère mérite un coup de main, pas des moqueries ni des rumeurs (« il paraît qu'ils vont fermer… »).",
  "**Des critiques utiles.** Un avis négatif, oui, s'il est honnête et précis. Les règlements de comptes, non.",
  "**Pas de pub déguisée.** Tu bosses pour un lieu, ou il t'a offert ton repas ? Dis-le quand tu en parles.",
  "**Pas de spam.** Pas de liens douteux, d'arnaques ni de messages en boucle. Les autopromos, seulement là où c'est prévu.",
  "**Vie privée.** Pas de photo de quelqu'un sans son accord, pas d'informations personnelles (adresse, téléphone…) sur qui que ce soit.",
  "**Rien de choquant.** Contenus haineux, violents, sexuels ou illégaux : dehors, direct.",
];

export function creerMessageReglement(): ContainerBuilder {
  return creerBloc({
    couleur: COULEURS.jaune,
    vignette: LIENS.logo,
    parties: [
      "# 📜 Le règlement\nIci, on parle de bonnes adresses et on se serre les coudes pour les lieux indépendants. Pour que ça reste un endroit où on a envie de traîner, quelques règles simples :",
      REGLES.map((regle, i) => `**${i + 1}.** ${regle}`).join("\n"),
      "### Et si ça déborde ?\nLes modos peuvent retirer un message ou un membre qui ne respecte pas ces règles. Les [conditions de Discord](https://discord.com/terms) s'appliquent aussi. Un souci ? Écris à un modo, ou à **bonjour@sosmiam.fr**.",
    ],
    pied: "En restant ici, tu acceptes ces règles. Merci, et bon appétit 🛟",
  });
}
