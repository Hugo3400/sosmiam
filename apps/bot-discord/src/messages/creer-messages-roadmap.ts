// Roadmap grand public, publiée avec /publier roadmap : cinq messages (présentation, puis une étape chacun).
// Aucun terme technique, aucune date promise ; les idées viennent de docs/idees.md et docs/decisions.md, jamais inventées.
import type { ContainerBuilder } from "discord.js";
import { LIENS } from "../contenus/liens.ts";
import { creerBloc } from "../fonctions/discord/creer-bloc.ts";
import { COULEURS } from "../interface/couleurs.ts";

/** À changer à chaque nouvelle version de la roadmap. */
const MISE_A_JOUR = "15 octobre 2026";

function lister(lignes: string[]): string {
  return lignes.map((ligne) => `• ${ligne}`).join("\n");
}

function creerPresentation(): ContainerBuilder {
  return creerBloc({
    couleur: COULEURS.jaune,
    vignette: LIENS.logo,
    parties: [
      "# 🗺️ La roadmap de SOS Miam\nSalut les Miamis ! Ici, tu vois où on en est : ce qui est déjà servi, ce qui mijote en cuisine et ce qui arrive bientôt sur ta table.",
      [
        "### Comment lire la carte",
        "✅ **C'est servi** · c'est fait : en ligne, ou prêt pour la sortie de l'app",
        "🔥 **Sur le feu** · on est dessus en ce moment",
        "🔜 **Au menu bientôt** · c'est la suite",
        "💡 **Dans le carnet de recettes** · des idées qui nous font saliver, rien de promis",
      ].join("\n"),
    ],
    pied: `Pas de date promise : on préfère te servir un plat bien cuit qu'un plat à l'heure. Mise à jour le ${MISE_A_JOUR}.`,
  });
}

function creerServi(): ContainerBuilder {
  return creerBloc({
    couleur: COULEURS.jaune,
    parties: [
      "# ✅ C'est servi",
      "### 🌐 Déjà en ligne\n" +
        lister([
          "**sosmiam.fr** : le site, la FAQ et la page santé et prévention, avec une navigation toute neuve et la page « Ce qu'on prépare » pour jeter un œil à ce qui arrive",
          "**Un seul compte pour tout** : l'app, l'espace ambassadeur et l'espace pro. Tu te connectes avec ton e-mail, Google ou Apple, et même avec un QR code, comme sur Discord",
          "**L'espace ambassadeur** : missions, kit média, propositions de lieux, des places de fondateurs dans chaque ville de France, et le titre d'ambassadeur certifié pour celles et ceux qui aident déjà les lieux du coin",
          "**L'espace pro, gratuit pour les lieux** : leur fiche, leur carte, leur équipe, et des affiches de vitrine et chevalets de table à imprimer",
          "**Ce serveur Discord**, et moi avec : `/faq`, `/proposer-lieu`, `/big-sos`",
        ]),
      "### 📱 Prêt dans l'app (elle arrive bientôt)\n" +
        lister([
          "**Le fil « Pour toi »** : les vidéos et photos des lieux, qui défilent sous ton pouce",
          "**Les SOS du soir** : un lieu qui a des tables vides lance l'alerte, et tu le vois en premier",
          "**Explorer** : la carte, les filtres (budget, ouvert maintenant, autour de moi…) et la roulette « Tu sais pas où aller ? »",
          "**Les fiches des lieux** : leur carte avec les plats végé, vegan ou sans gluten, et les infos pratiques (terrasse, animaux, accès en fauteuil, tickets resto…)",
          "**Tes 3 rescousses par semaine**, pour faire monter les lieux qui le méritent",
          "**Ta visite validée quand tu paies** : des points, un avis vérifié et un tampon sur ta carte de fidélité",
          "**Défis, badges et paliers**, de Curieux à Ambassadeur de quartier",
          "**Les événements des lieux** : concerts, quiz, dégustations… avec « Ça m'intéresse »",
          "**Ta bande de potes** : ajoute-les par lien, QR code ou pseudo, et suis les lieux et les gens que tu aimes",
          "**Les sorties entre potes** : proposer des lieux, voter et en discuter entre invités, plus les listes partagées et « envoyer un lieu à un pote »",
          "**Les commentaires** : répondre, aimer et mentionner un pote",
          "**Miam Safe** 🚨 : si tu ne te sens pas en sécurité dans un lieu, la phrase « Le Capitaine est là ? » au comptoir, une alerte discrète à l'équipe dans les lieux engagés, et les numéros d'urgence en un geste",
          "**Les modes pro et ambassadeur**, directement dans l'app",
          "**Des notifications qui ne te harcèlent pas** : une par jour et quatre par semaine au plus, sauf celles que tu demandes",
        ]),
    ],
  });
}

function creerSurLeFeu(): ContainerBuilder {
  return creerBloc({
    couleur: COULEURS.tomate,
    parties: [
      "# 🔥 Sur le feu",
      lister([
        "**La sortie de l'app sur iPhone et Android** : on fait les dernières vérifs et on prépare les premières versions d'essai sur de vrais téléphones",
        "**La messagerie entre potes** : messages privés, groupes, photos et notes vocales. Tout est prêt ; on finit le ménage automatique (les vieilles photos et les conversations endormies s'effacent toutes seules) avant d'ouvrir les portes",
        "**Les finitions entre potes** : signaler ce qui dérape en un geste, tes réglages, et les notifications qui vont avec",
        "**Les avatars des Miamis** : 16 petites bouilles dessinées rien que pour ton profil",
        "**Des milliers de fiches de lieux** en préparation, partout en France, pour que l'app ne sonne pas creux le jour J",
      ]),
    ],
  });
}

function creerAuMenuBientot(): ContainerBuilder {
  return creerBloc({
    couleur: COULEURS.jaune,
    parties: [
      "# 🔜 Au menu bientôt",
      lister([
        "**L'app sur l'App Store et Google Play**, gratuite, pour les 18 ans et plus",
        "**« Prévenir un pote »** dans Miam Safe : en un geste, un pote de ta bande sait où tu es pendant 1 heure, et tu arrêtes quand tu veux",
        "**Le BIG SOS dans l'app** : 7 jours à la une pour un lieu en vraie galère, et le vote de la Brigade pour décider qui on soutient",
        "**L'ouverture de la messagerie** à tous les Miamis",
      ]),
      "### 🫶 L'Espace communauté\nL'onglet Potes devient **Communauté**. On le peaufine encore, donc rien n'est figé, mais voilà l'idée :\n" +
        lister([
          "**Des sorties ouvertes à tous les Miamis**, ou réservées à un public (entre filles, entre garçons, entre personnes d'autres genres, par tranche d'âge…), avec des étiquettes : vegan, LGBT+ friendly, petit budget, sans alcool…",
          "**« Qui est là ? »** : les Miamis de ta ville qui ont choisi de se montrer (juste leur pseudo et leur avatar), et des coucous pour faire connaissance",
          "**Une boîte à idées** : les Miamis votent, la Brigade répond, et l'idée du mois est annoncée dans 📝・patch-notes",
          "**Des étiquettes sur les lieux**, pour trouver ton bonheur encore plus vite",
        ]),
    ],
    liens: [{ libelle: "Jette un œil à l'aperçu", url: LIENS.apercuCommunaute, emoji: "👀" }],
    pied: "Pour être prévenu de la sortie : bonjour@sosmiam.fr, ou garde un œil sur 📣・annonces.",
  });
}

function creerCarnetDeRecettes(): ContainerBuilder {
  return creerBloc({
    couleur: COULEURS.jauneClair,
    parties: [
      "# 💡 Dans le carnet de recettes\nDes idées qui nous font saliver. Rien n'est promis, mais on y pense fort :\n" +
        lister([
          "**Des surprises cachées** dans l'app, sur le site et même ici… Chut, on n'en dit pas plus 🤫",
          "**Le QR code directement sur ton ticket de caisse**, pour valider ta visite encore plus vite",
          "**Une vraie carte de fondateur**, envoyée par la poste",
          "**Des avis plat par plat**, pour savoir quoi commander avant même de t'asseoir",
        ]),
      "### Et toi, t'as une idée ?\nBalance-la dans 💬・général : les meilleures finiront peut-être dans ce carnet. Et pour un lieu à faire découvrir, c'est `/proposer-lieu` !",
    ],
  });
}

export function creerMessagesRoadmap(): ContainerBuilder[] {
  return [creerPresentation(), creerServi(), creerSurLeFeu(), creerAuMenuBientot(), creerCarnetDeRecettes()];
}
