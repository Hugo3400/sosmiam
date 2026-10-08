// Présentation de SOS Miam : réponse de /sosmiam, et message fixe publié avec /publier presentation.
import type { ContainerBuilder } from "discord.js";
import { LIENS } from "../contenus/liens.ts";
import { creerBloc } from "../fonctions/discord/creer-bloc.ts";
import { COULEURS } from "../interface/couleurs.ts";

export function creerMessagePresentation(): ContainerBuilder {
  return creerBloc({
    couleur: COULEURS.jaune,
    parties: [
      "# SOS Miam 🛟\nFais découvrir les lieux indépendants qui ont besoin de monde : restos, pâtisseries, bars et sorties près de chez toi.",
      [
        "### Comment ça marche",
        "**1. Découvre** · Fais défiler les lieux près de chez toi, filtre par quartier, budget ou envie.",
        "**2. Vas-y** · Demande l'addition dans l'app ou scanne ton ticket : ton achat est vérifié, ton avis compte vraiment.",
        "**3. Viens à la rescousse** · Tu as 3 rescousses par semaine, rechargées le lundi. Donne-les aux lieux qui le méritent : ils montent dans le fil.",
      ].join("\n"),
      "### 🆘 Et quand ça va vraiment mal ?\nUn lieu qui traverse une vraie galère peut passer en **BIG SOS** : 7 jours à la une, et toute la communauté se mobilise pour remplir la salle. Tout savoir : `/big-sos`",
      "### 📍 Où et quand ?\nOn arrive **partout en France**, sur iPhone et Android. L'app est en préparation : pour être prévenu du lancement, écris à **bonjour@sosmiam.fr**.",
      "### 🤖 Ce que je sais faire\n`/faq` · tes questions, nos réponses\n`/proposer-lieu` · fais découvrir ta pépite\n`/big-sos` · l'alerte rouge, expliquée\n`/contact` · pour nous écrire",
    ],
    image: LIENS.imagePartage,
    liens: [{ libelle: "sosmiam.fr", url: LIENS.site, emoji: "🌐" }],
    pied: "Gratuit pour toi comme pour les lieux · Aucune commission · Pub toujours signalée",
  });
}
