import { ARTICLES_ACTUS_PAR_SEMAINE, COMMENTAIRE_ACTUS_MAX, PHOTOS_ACTUS_MAX, POINTS_ARTICLE_ACTUS, REPONSE_LIEU_ACTUS_MAX, TEXTE_ACTUS_MAX, TEXTE_ACTUS_MIN, TITRE_ACTUS_MAX, TITRE_ACTUS_MIN } from "../../../../../packages/commun/src/regles/actus.ts";
import { site } from "~/contenus/legal/informations-legales";
import type { SectionLegale } from "~/contenus/legal/type-legal";

const lienContact = `[${site.emailContact}](mailto:${site.emailContact})`;

export const sectionActusCgu: SectionLegale = {
  id: "actus",
  titre: "Les Actus des Miamis",
  blocs: [
    "Dans l'app (onglet « Actus » de « Pour toi ») et sur [sosmiam.fr/actus](/actus), les **Actus des Miamis** présentent des lieux publiés sur SOS Miam : le portrait d'un lieu, le top du quartier (3 à 5 lieux), le bon plan du moment (avec une date de fin) et le récit de sortie (2 à 5 lieux). Pour l'instant, seuls les **ambassadeurs** en écrivent ; l'écriture s'ouvrira plus tard aux autres Miamis, toujours dès 18 ans.",
    {
      liste: [
        "**La Brigade relit chaque article** avant qu'il paraisse (la Brigade, ici, c'est l'équipe de SOS Miam) : elle le publie, te demande de le retoucher (avec un message) ou le refuse (avec un motif, que tu peux contester). Un article publié reste signalable, et il est retiré s'il ne respecte pas ces règles.",
        `**Ce que tu écris** : un titre (${TITRE_ACTUS_MIN} à ${TITRE_ACTUS_MAX} caractères), une accroche, un texte (${TEXTE_ACTUS_MIN} à ${TEXTE_ACTUS_MAX} caractères) et jusqu'à ${PHOTOS_ACTUS_MAX} photos, avec **${ARTICLES_ACTUS_PAR_SEMAINE} articles envoyés par semaine au plus**. Tu parles des lieux et de ce que tu y as vécu, jamais d'un employé nommé sans son accord. Les [règles de la communauté](#regles-communaute) s'appliquent.`,
        "**Tes photos** : prises par toi, ou utilisées avec l'accord de leur auteur, et sans le visage reconnaissable de quelqu'un qui n'a pas dit oui.",
        "**La confiance** : un lieu ne te paie jamais pour un article, et il ne peut ni le commander, ni écrire sur lui-même. Si un lieu t'a offert quelque chose (un repas, une boisson, une invitation), ton article doit le dire avec la mention « **Collaboration commerciale** ».",
        "**L'alcool** : jamais d'incitation à boire. Sous un article qui en parle, le message sanitaire s'ajoute tout seul, et un tel article n'est jamais montré à quelqu'un qui n'a pas de compte.",
        `**Le lieu** : un lieu vérifié est prévenu quand un article le cite. Il peut y laisser une réponse publique (${REPONSE_LIEU_ACTUS_MAX} caractères au plus), relue par la Brigade avant de paraître, et signaler l'article.`,
        `**Les lecteurs** : avec un compte, on peut aimer un article, le commenter (${COMMENTAIRE_ACTUS_MAX} caractères au plus, avec les mêmes règles que les [commentaires](#commentaires)) et l'envoyer à un pote ; sans compte, on le lit seulement. Un article publié arrive aussi dans le fil Abonnements de ceux qui te suivent.`,
        `**Ce que ça te rapporte** : ${POINTS_ARTICLE_ACTUS} points par article publié, et des badges (au 1er, au 5e et au 20e article publié). Jamais d'argent.`,
        `**Tes droits sur ton article** : tu restes l'auteur de ton texte et de tes photos. En l'envoyant, tu nous autorises à l'afficher gratuitement dans l'app et sur sosmiam.fr, tant qu'il est publié. Pour faire retirer un de tes articles, écris-nous à ${lienContact} ; et si tu supprimes ton compte, tes articles partent avec lui.`,
      ],
    },
  ],
};
