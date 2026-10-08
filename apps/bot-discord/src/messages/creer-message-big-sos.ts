// Explication du BIG SOS (/big-sos). Gratuit mais limité : les limites ne sont pas décidées, n'en annoncer aucune (docs/decisions.md).
import type { ContainerBuilder } from "discord.js";
import { creerBloc } from "../fonctions/discord/creer-bloc.ts";
import { COULEURS } from "../interface/couleurs.ts";

export function creerMessageBigSos(): ContainerBuilder {
  return creerBloc({
    couleur: COULEURS.rougeSos,
    parties: [
      "# 🆘 Le BIG SOS\nL'alerte rouge de SOS Miam. Quand un lieu indépendant traverse une vraie galère (travaux devant la porte, grosse baisse de clients, coup dur…), il passe **à la une de l'app pendant 7 jours**, et toute la communauté se mobilise pour remplir la salle.",
      [
        "### Comment un lieu est choisi",
        "**1. La demande** · le lieu la fait depuis son espace pro, ou un ambassadeur le propose.",
        "**2. La vérification** · un ambassadeur du quartier passe sur place.",
        "**3. Le vote** · la communauté soutient les demandes qui la touchent.",
        "**4. La une** · l'équipe valide, et le lieu passe à la une pendant 7 jours.",
      ].join("\n"),
      [
        "### Sur sa page",
        "📖 L'histoire du lieu, racontée par son équipe",
        "🎬 Les vidéos des créateurs venus le filmer",
        "📈 Un objectif de mobilisation, avec une jauge en direct",
        "🎟️ Des bons solidaires : tu paies maintenant, tu profites plus tard",
      ].join("\n"),
      "### Comment aider\nLe plus utile : **y aller !** Chaque achat vérifié fait avancer la jauge. Tu peux aussi lui donner une rescousse, partager sa page autour de toi ou acheter un bon solidaire.",
    ],
    pied: "Chaque histoire est racontée avec bienveillance, pour donner envie de venir, jamais pour faire pitié.",
  });
}
