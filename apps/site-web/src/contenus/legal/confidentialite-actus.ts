import { COMMENTAIRE_ACTUS_MAX, PHOTOS_ACTUS_MAX, REPONSE_LIEU_ACTUS_MAX } from "../../../../../packages/commun/src/regles/actus.ts";
import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionActus: SectionLegale = {
  id: "actus",
  titre: "Les Actus des Miamis",
  blocs: [
    "Les Actus des Miamis sont des articles sur des lieux, écrits pour l'instant par les ambassadeurs, relus par la Brigade (l'équipe de SOS Miam), puis publiés dans l'app et sur [sosmiam.fr/actus](/actus). Leurs règles sont dans les [conditions d'utilisation](/cgu#actus).",
    {
      liste: [
        `**Ce qu'on garde d'un article** : son texte (titre, accroche, paragraphes, citation), ses photos (${PHOTOS_ACTUS_MAX} au plus, réenregistrées sans leurs métadonnées, comme la position ou l'appareil), les lieux qu'il cite, sa rubrique et, pour un bon plan, sa date de fin, ses dates, ton compte comme auteur, et les décisions de la Brigade (publié, à retoucher avec son message, refusé ou retiré avec son motif, et ta contestation si tu en fais une).`,
        "**Ce qui est public** : un article publié, avec ton prénom, ton avatar et, si tu l'es, la pastille d'ambassadeur. Sur sosmiam.fr, il peut être trouvé par les moteurs de recherche. Ceux qui te suivent le voient aussi dans leur fil Abonnements.",
        `**Les J'aime et les commentaires** : un J'aime garde ton compte et l'article. Un commentaire garde son texte (${COMMENTAIRE_ACTUS_MAX} caractères au plus), ton compte, l'article, sa date et le commentaire auquel il répond ; il s'affiche avec ton prénom et ton avatar. Si tu le supprimes, il est effacé tout de suite, ou seulement vidé de son texte (« Commentaire supprimé ») s'il a des réponses.`,
        `**La réponse d'un lieu** : son texte (${REPONSE_LIEU_ACTUS_MAX} caractères au plus), le lieu, sa date, le compte du gérant qui l'a écrite et la décision de la Brigade. Elle s'affiche au nom du lieu, jamais à celui du gérant.`,
        "**Les signalements** d'un article, d'une réponse ou d'un commentaire suivent les mêmes règles que les autres signalements (voir « [Signaler et modérer dans la partie sociale](#signalements-sociaux) »). Depuis le site, on peut signaler un article ou une réponse sans compte, comme une image (voir « [Signaler une image d'un lieu](#signaler-image) »).",
        "**Pourquoi et sur quelle base** : publier les articles que tu écris, les montrer aux lecteurs et faire vivre les J'aime et les commentaires, c'est l'exécution des [conditions d'utilisation](/cgu#actus) (article 6.1.b du RGPD). Relire, modérer, motiver nos décisions et te laisser les contester, c'est l'obligation que nous impose le règlement européen sur les services numériques (article 6.1.c du RGPD). Garder un moment un article que tu as supprimé, pour pouvoir répondre à un signalement ou à une réclamation, c'est notre intérêt légitime (article 6.1.f du RGPD).",
        "**Combien de temps** : un article publié reste tant que ton compte existe. Refusé ou retiré, il est effacé 6 mois après la décision, ta contestation comprise. Si tu le supprimes toi-même (depuis « Mes articles » dans l'app), il disparaît aussitôt de l'app et du site, mais on le garde encore 6 mois, avec ses photos, ses commentaires, ses J'aime et les réponses des lieux, pour la modération et pour répondre à un signalement ou à une réclamation ; il est ensuite effacé, photos comprises. Une photo envoyée mais jamais utilisée dans un article est effacée au bout de 25 heures. Un commentaire retiré par la modération reste invisible pendant 6 mois (le temps de le contester), puis il est effacé ; il part aussi avec son article.",
        "**Si tu supprimes ton compte** : tes articles, tes J'aime et tes commentaires partent avec lui, réponses des lieux comprises. Une réponse de lieu part aussi avec l'article ou avec le lieu ; si le compte du gérant qui l'a écrite est supprimé, elle reste, au nom du lieu.",
      ],
    },
  ],
};
