// Politique de confidentialité, section Miam Safe (se sentir en sécurité dans un lieu ; docs/decisions.md, « Miam Safe »).
// Écrite au futur, comme « L'app, bientôt avec un compte » : à passer au présent le jour où Miam Safe marche pour de vrai.
// Relue contre le code le 9 octobre 2026 : apps/api/prisma/schema/miam-safe.prisma (tables), apps/api/src/services/miam-safe.ts
// (alertes effacées 30 jours après leur envoi), apps/api/src/services/notifications/prevenir-equipe-miam-safe.ts (ce que le
// lieu reçoit). Le partage de position avec un pote n'est pas encore construit : à revoir avant qu'il démarre.
import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionMiamSafe: SectionLegale = {
  id: "miam-safe",
  titre: "Miam Safe, quand tu ne te sens pas en sécurité dans un lieu",
  blocs: [
    "Miam Safe arrivera avec les comptes de l'app. **Rien de ce qui suit ne fonctionne encore** : cette partie sera relue avant son lancement. Les numéros d'urgence (17, 18, 15, 112 et le 114 par SMS) s'appellent directement depuis ton téléphone : on ne voit pas ces appels.",
    {
      liste: [
        "**Prévenir un pote** : seulement si tu le décides, le pote choisi dans ta bande recevra le nom du lieu et **ta position pendant 1 heure**, avec un bouton pour t'appeler. Tu pourras arrêter le partage à tout moment. Ta position passera par notre serveur pour lui parvenir, sans y être gardée une fois le partage fini.",
        "**L'alerte silencieuse au comptoir** (lieux qui ont signé la charte Miam Safe) : l'équipe du lieu recevra, sur ses téléphones, **ton prénom, l'endroit où tu es** (salle, terrasse, toilettes, ailleurs) **et le petit détail que tu choisis d'écrire** (« table 12, pull vert »). Jamais ton nom, ta photo ni ton e-mail. On gardera l'alerte (ces informations, l'heure, et qui a répondu « On arrive ») **30 jours**, pour vérifier qu'une alerte restée sans réponse a bien été suivie, puis elle sera effacée.",
        "**Raconter ce qui s'est passé** : la raison choisie et ton texte seront lus par notre équipe, à la main, **sous 48 heures**. Ils ne seront **jamais affichés sur la fiche du lieu**, et **ton identité ne sera jamais donnée au lieu**. On gardera ton compte avec le signalement pour pouvoir te dire ce qu'on a décidé, puis le tout **1 an** après la décision. N'écris que ce qui est utile : pas besoin de détails sur ta santé, tes origines ou ta vie privée.",
        "**« Tu t'es senti·e bien ici ? »** : ta réponse sera gardée tant que tu as ton compte (la dernière compte). Seul un total s'affichera sur la fiche (« Les Miamis s'y sentent bien », à partir de 90 % de oui sur au moins 20 réponses) ; un « non » ne s'affichera jamais, et personne ne verra qui a répondu quoi.",
        "**La charte d'un lieu** : on gardera qui l'a signée (le gérant) et quand, et, si notre équipe la retire après un signalement, pourquoi (note privée).",
        "**Base légale** : l'exécution des conditions d'utilisation de l'app (article 6.1.b du RGPD) pour l'alerte, le partage avec un pote et ta réponse ; notre intérêt légitime (article 6.1.f du RGPD) à traiter les signalements, qui protège tout le monde.",
        "**Supprimer ton compte** effacera tes alertes et tes réponses. Tes signalements resteront, sans lien avec toi, jusqu'à la fin de leur durée de garde.",
      ],
    },
  ],
};
