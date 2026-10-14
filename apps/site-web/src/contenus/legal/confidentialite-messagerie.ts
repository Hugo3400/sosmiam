// Politique de confidentialité, section « Ta messagerie » (id « messagerie »), reprise par confidentialite.ts dans le
// chapitre « Ta bande et tes messages ». Ouverte avec les comptes de l'app (v1).
// Relu contre le code le 14 octobre 2026 (session Site), en lecture seule :
// - apps/api/prisma/schema/messagerie.prisma et sorties.prisma (ce qui est gardé, chiffré ou en clair) ;
// - apps/api/src/services/chiffrement-social.ts (AES-256-GCM, sous-clés tirées de la clé des données par HKDF : textes et
//   titres de groupes, médias, codes d'invitation, instantanés de la modération) ;
// - apps/api/src/services/messagerie-medias.ts et stockage-medias-chat.ts (médias chiffrés sur le disque, plus servis après
//   90 jours) ; packages/commun/src/regles/chat.ts (durées et limites) ;
// - apps/api/src/services/notifications/* et effets-sociaux* (ce que reçoivent Apple et Google).
// Ménage de nuit de la partie sociale (lot L7) : PAS ENCORE BRANCHÉ dans apps/api/src/taches/taches-de-nuit.ts au 14 octobre
// 2026. Ce qui en dépend est écrit au futur (« bientôt ») ; à passer au présent quand il tourne.
import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionMessagerie: SectionLegale = {
  id: "messagerie",
  titre: "Ta messagerie : messages, photos, notes vocales, groupes et sorties",
  blocs: [
    "Dans l'onglet Potes, tu peux écrire à un pote de ta bande, en groupe ou dans la discussion d'une sortie, et y envoyer du texte, des réactions, des lieux, des photos et des notes vocales. Voici ce que notre serveur en garde, ce qui est chiffré et ce qui reste en clair.",
    {
      tableau: {
        legende: "Ce que notre serveur garde de la messagerie : ce qui est chiffré, ce qui reste en clair, et pourquoi.",
        colonnes: ["Quoi", "Chiffré ?", "Pourquoi"],
        lignes: [
          ["Le texte de tes messages", "**Chiffré**", "C'est le cœur de ta conversation : seuls ses membres le lisent dans l'app."],
          ["Un lieu partagé, et ton petit mot", "**Chiffré**", "Même un lieu envoyé à un pote ne reste pas en clair."],
          ["Tes photos et tes notes vocales", "**Chiffrées**", "Les fichiers sont chiffrés sur le disque du serveur, et ne s'ouvrent que dans la conversation."],
          ["Le titre d'un groupe", "**Chiffré**", "Il peut en dire long sur toi et tes potes."],
          ["Ton code d'invitation", "**Chiffré**", "C'est la clé de ta bande : celui qui l'a peut y entrer."],
          ["Qui est dans quelle conversation, et quand on écrit", "En clair", "Pour te livrer les messages, trier tes conversations et vérifier, à chaque lecture, que tu en fais bien partie."],
          ["Les réactions, l'emoji d'un groupe, le type, la date, la taille et la durée d'un message", "En clair", "Pour afficher la conversation, compter ce qui n'est pas lu et limiter les envois (taille des photos, durée des notes vocales)."],
          ["Les sorties : titre, emoji, date, lieux proposés et votes", "En clair", "Pour compter les votes, retenir un lieu à l'heure dite et l'annoncer dans la cloche."],
          ["Les listes, les commentaires, les profils, la bande, les suivis et les blocages", "En clair", "Ils sont faits pour être vus (un commentaire est public), ou sont relus à chaque geste pour savoir qui peut voir quoi."],
        ],
      },
    },
    {
      liste: [
        "**Ce que « chiffré » veut dire ici** : notre serveur chiffre ces données avant de les ranger (AES-256-GCM, avec des clés tirées de la clé des données, gardée hors de la base), et les déchiffre pour te les montrer. Ce n'est donc **pas** un chiffrement « de bout en bout » : c'est une protection si notre base ou nos sauvegardes tombaient entre de mauvaises mains. **L'équipe ne lit un message que s'il est signalé**, et seulement la copie chiffrée gardée avec le signalement (voir « Signaler et modérer dans la partie sociale »).",
        "**Les photos et les notes vocales** : ton téléphone réduit la photo et retire ses métadonnées avant l'envoi, puis notre serveur les retire encore (position, appareil, orientation, profil de couleur) avant de la chiffrer. Pour une note vocale (1 minute au plus), il efface les étiquettes ajoutées au fichier, dont une éventuelle position ; seules restent les informations techniques de l'enregistrement, comme sa date. Une photo fait 5 Mo au plus, une note vocale 2 Mo. Elles ne s'ouvrent plus pour personne **90 jours** après l'envoi (« Ce média a expiré »), et elles ne sont pas copiées dans nos sauvegardes.",
        "**En chemin** : tout passe en HTTPS, par **Cloudflare** (voir « Cloudflare, qui protège le site »), qui déchiffre au passage le trafic pour le protéger, puis le chiffre à nouveau jusqu'à notre serveur ; il voit donc passer les échanges, sans les garder pour notre compte.",
        "**Les notifications** : pour chaque message d'un pote, ton téléphone sonne, sans le contenu du message (seulement « Nouveau message », « T'a envoyé une photo »…) ; c'est pareil quand quelqu'un rejoint ta bande par ton lien, accepte ta demande, t'invite dans un groupe ou à une sortie, ou quand le lieu d'une sortie est retenu. Ces notifications ne comptent pas dans la limite par jour. Pour te les livrer, **Apple** (iPhone) ou **Google** (Android) reçoivent leur titre et leur texte : le prénom de la personne et, selon le cas, le titre du groupe ou de la sortie et le nom du lieu retenu, **jamais le texte d'un message**. Tu peux couper les messages d'une conversation, ou toutes les notifications sociales dans les réglages (la cloche de l'app se remplit quand même) ; un téléphone déconnecté de ton compte ne reçoit plus rien.",
        "**Les groupes et les sorties** : on y entre en acceptant une invitation. Un nouveau membre d'un groupe ne voit pas les messages écrits avant son arrivée ; dans une sortie, celui qui répond « Je viens » lit la discussion depuis le début, pour savoir ce qui s'est déjà dit. Personne ne voit quand tu as lu un message.",
        "**Combien de temps** : les photos et les notes vocales ne s'ouvrent plus 90 jours après l'envoi ; une conversation est effacée après **1 an sans message** ; une sortie, avec sa discussion, **1 an après sa date ou son dernier message** (le plus tard des deux). Le ménage automatique qui efface ces données du serveur à la fin de leur durée arrive **bientôt** : d'ici là, ce qui a expiré reste chiffré sur le serveur, sans que personne puisse l'ouvrir dans l'app. Supprimer un message pour tout le monde (« Message supprimé ») efface son contenu tout de suite ; une annulation de sortie ou le départ du dernier membre efface toute la discussion.",
        "**Si tu supprimes ton compte** : tes messages restent chez les autres, signés « Compte supprimé », jusqu'à l'effacement de la conversation ; tes photos et notes vocales suivent la règle des 90 jours.",
        "**Pourquoi et sur quelle base** : te permettre d'écrire à tes potes et d'organiser des sorties, c'est-à-dire l'exécution des [conditions d'utilisation](/cgu#messagerie) de l'app (article 6.1.b du RGPD).",
      ],
    },
  ],
};
