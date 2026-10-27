import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionSignalerImage: SectionLegale = {
  id: "signaler-image",
  titre: "Signaler une image d'un lieu",
  blocs: [
    "Sur la fiche d'un lieu « Vérifié ✓ », sur le site comme dans l'app, « Signaler une image » prévient notre équipe qu'une bannière ou un logo pose problème. **Depuis le site, pas besoin de compte** : on ne te demande ni ton nom ni ton e-mail, et le lieu ne saura jamais qui l'a signalée. Les règles de la modération sont dans les [conditions d'utilisation](/cgu#moderation).",
    {
      liste: [
        "**Ce qu'on garde** : l'image visée (la bannière ou le logo de tel lieu), ta raison, ta précision et ton explication si tu en écris une, la date, et d'où vient le signalement (le site ou l'app). Avec, une **copie chiffrée de l'image** telle qu'elle était, qui sert de preuve, et le compte du gérant qui l'a envoyée, pour le prévenir si on la retire. Depuis l'app, avec un compte, le signalement est aussi lié à ton compte : c'est ce qui nous permet de te dire ce qu'on a décidé, et de ne compter qu'un signalement par personne.",
        "**Ton adresse IP** : elle sert seulement à limiter le nombre d'envois (10 toutes les 10 minutes) et n'est jamais enregistrée avec ton signalement.",
        "**Qui la voit** : seulement l'équipe de modération, dans notre logiciel de gestion. Si l'image est retirée, le gérant reçoit la règle en cause et l'explication de l'équipe, jamais le nom de qui l'a signalée, ni son explication.",
        "**Pourquoi et sur quelle base** : traiter les signalements et motiver nos décisions, comme nous y oblige le règlement européen sur les services numériques (obligation légale, article 6.1.c du RGPD) ; garder la preuve et repérer les signalements abusifs (intérêt légitime, article 6.1.f du RGPD).",
        "**Combien de temps** : jusqu'à la décision, puis **1 an** après elle (ou après le réexamen, s'il y en a un), avant d'être effacé automatiquement. La copie chiffrée de l'image, elle, part plus tôt : **6 mois** après la décision. Une image retirée par la modération disparaît tout de suite de la fiche, puis de notre serveur dans les 2 jours.",
        "**Obligatoire ?** L'image visée et la raison. L'explication est facultative, sauf pour « Autre chose » (10 caractères au moins).",
      ],
    },
  ],
};
