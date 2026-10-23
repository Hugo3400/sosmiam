// Politique de confidentialité, section « Ta messagerie » (id « messagerie »), reprise par confidentialite.ts dans le
// chapitre « Ta bande et tes messages ». Ouverte avec les comptes de l'app (v1).
// Relu contre le code le 14 octobre 2026 (session Site), en lecture seule :
// - apps/api/prisma/schema/messagerie.prisma et sorties.prisma (ce qui est gardé, chiffré ou en clair) ;
// - apps/api/src/services/chiffrement-social.ts (AES-256-GCM, sous-clés tirées de la clé des données par HKDF : textes et
//   titres de groupes, médias, codes d'invitation, instantanés de la modération) ;
// - apps/api/src/services/messagerie-medias.ts et stockage-medias-chat.ts (médias chiffrés sur le disque, plus servis après
//   90 jours) ; packages/commun/src/regles/chat.ts (durées et limites) ;
// - apps/api/src/services/notifications/* et effets-sociaux* (ce que reçoivent Apple et Google).
// Ménage de nuit de la partie sociale (lot L7) : EN LIGNE depuis le 15 octobre 2026 (API redémarrée vers 13 h), relu le
// même jour en lecture seule : apps/api/src/taches/taches-de-nuit.ts (nettoyerSocial, chaque nuit vers 3 h 30, avant la
// sauvegarde), services/menage-social.ts et menage-social-etapes.ts, fonctions/social/calculer-seuils-menage-social.ts :
// médias effacés du serveur la nuit qui suit leurs 90 jours (sauf le fichier qu'un signalement garde : 183 jours après la
// décision, voir confidentialite-signalements-sociaux.ts), conversations 1 an sans message (sortie : le plus tard de sa date
// et du dernier message ; une conversation dont un message signalé attend la décision attend avec lui), conversations sans
// plus aucun membre, messages retirés par la modération vidés 1 an après, fichiers que plus rien ne cite après 24 h.
// Interrupteur « Notifications de ma bande » (pushSocial, Réglages › Confidentialité de l'app) : coupe aussi les messages
// (services/messagerie-messages.ts).
import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionMessagerie: SectionLegale = {
  id: "messagerie",
  titre: "Ta messagerie : messages, photos, notes vocales, groupes et sorties",
  blocs: [
    "Dans l'onglet Communauté, tu peux écrire à un pote de ta bande, en groupe ou dans la discussion d'une sortie (entre potes, ou des Miamis : voir [Les sorties des Miamis](#sorties-miamis)), et y envoyer du texte, des réactions, des lieux, des photos et des notes vocales. Voici ce que notre serveur en garde, ce qui est chiffré et ce qui reste en clair.",
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
          ["Les lieux d'un sondage « On mange où ? »", "**Chiffrés**", "Comme un lieu partagé : ils disent où ton groupe va manger."],
          ["Un GIF envoyé", "**Chiffré**", "On garde seulement son identifiant et son adresse chez GIPHY, comme un message."],
          ["La clé d'aperçu de ton téléphone", "**Chiffrée**", "Elle sert seulement à chiffrer l'aperçu de tes messages pour ce téléphone."],
          ["Qui est dans quelle conversation, et quand on écrit", "En clair", "Pour te livrer les messages, trier tes conversations et vérifier, à chaque lecture, que tu en fais bien partie."],
          ["Les réactions, l'emoji d'un groupe, le type, la date, la taille et la durée d'un message", "En clair", "Pour afficher la conversation, compter ce qui n'est pas lu et limiter les envois (taille des photos, durée des notes vocales)."],
          ["Jusqu'où tu as lu, et l'heure de lecture", "En clair", "Pour compter ce qui n'est pas lu et afficher « Vu ». L'heure n'est gardée que si elle peut être montrée (voir plus bas)."],
          ["Les votes d'un sondage", "En clair", "Pour compter les voix. Les membres voient le total par lieu et le nombre de votants ; chacun ne voit que son propre vote."],
          ["Les sorties : titre, emoji, date, lieux proposés et votes", "En clair", "Pour compter les votes, retenir un lieu à l'heure dite et l'annoncer dans la cloche."],
          ["Les listes, les commentaires, les profils, la bande, les suivis et les blocages", "En clair", "Ils sont faits pour être vus (un commentaire est public), ou sont relus à chaque geste pour savoir qui peut voir quoi."],
        ],
      },
    },
    {
      liste: [
        "**Ce que « chiffré » veut dire ici** : notre serveur chiffre ces données avant de les ranger (AES-256-GCM, avec des clés tirées de la clé des données, gardée hors de la base), et les déchiffre pour te les montrer. Ce n'est donc **pas** un chiffrement « de bout en bout » : c'est une protection si notre base ou nos sauvegardes tombaient entre de mauvaises mains. **L'équipe ne lit un message que s'il est signalé**, et seulement la copie chiffrée gardée avec le signalement (voir « Signaler et modérer dans la partie sociale »).",
        "**Les photos et les notes vocales** : ton téléphone réduit la photo et retire ses métadonnées avant l'envoi, puis notre serveur les retire encore (position, appareil, orientation, profil de couleur) avant de la chiffrer. Pour une note vocale (1 minute au plus), il efface les étiquettes ajoutées au fichier, dont une éventuelle position ; seules restent les informations techniques de l'enregistrement, comme sa date. Une photo fait 5 Mo au plus, une note vocale 2 Mo. Elles ne s'ouvrent plus pour personne **90 jours** après l'envoi (« Ce média a expiré »), et elles ne sont pas copiées dans nos sauvegardes.",
        "**En chemin** : tout passe en HTTPS, par **Cloudflare** (voir « Cloudflare, qui protège le site »), qui déchiffre au passage le trafic pour le protéger, puis le chiffre à nouveau jusqu'à notre serveur : il voit donc passer les échanges, messages compris, comme tout ce qui va vers notre serveur.",
        "**Les notifications** : pour chaque message d'un pote, ton téléphone sonne ; c'est pareil quand quelqu'un rejoint ta bande par ton lien, accepte ta demande, t'invite dans un groupe ou à une sortie, ou quand le lieu d'une sortie est retenu. Ces notifications ne comptent pas dans la limite par jour. Pour te les livrer, **Apple** (iPhone) ou **Google** (Android) reçoivent en clair le prénom de la personne, selon le cas le titre du groupe ou de la sortie et le nom du lieu retenu, et la sorte de message (« T'a envoyé une photo »…). **L'aperçu d'un message**, lui (son texte, 180 caractères au plus, le petit mot d'un lieu envoyé ou la légende d'une photo, avec le prénom et le nom du groupe), voyage **chiffré pour ton seul téléphone** : avec un compte connecté, chaque téléphone tire sa propre clé, la range dans son trousseau sécurisé (le Trousseau sur iPhone, le Keystore sur Android) et nous l'envoie quand il s'inscrit aux notifications ; on la garde chiffrée, et notre serveur s'en sert pour chiffrer chaque aperçu (AES-256-GCM). Apple et Google transportent la notification sans pouvoir la lire : seul ton téléphone la déchiffre pour l'afficher. Un téléphone avec une version de l'app plus ancienne que la 1.0.2 n'a pas de clé : il ne reçoit aucun aperçu. Jamais d'aperçu pour une note vocale, un GIF, un sondage ou la photo elle-même. Dans Profil › ⚙️ Paramètres › Ton compte et tes alertes › « Messages », tu choisis « Le message en entier » (par défaut) ou « Juste qui t'écrit » : alors aucun texte ne part, même chiffré. Le téléphone efface sa clé quand tu te déconnectes, et notre serveur l'oublie aussitôt, ou au plus tard la nuit suivante ; elle part aussi la nuit qui suit une session fermée ailleurs (« Me déconnecter partout », mot de passe changé, session expirée), et avec le téléphone lui-même (notifications coupées, téléphone qui ne les reçoit plus, 90 jours sans signe de vie, compte supprimé). « Répondre », depuis la notification, envoie ta réponse de ton téléphone à notre serveur, comme un message normal. Tu peux couper les messages d'une conversation, ou toutes les notifications sociales d'un coup, messages compris, avec « Notifications de ma bande » (Profil › ⚙️ Paramètres › Confidentialité et sécurité › « Confidentialité » ; la cloche de l'app se remplit quand même) ; un téléphone déconnecté de ton compte ne reçoit plus rien.",
        "**Les groupes et les sorties** : on y entre en acceptant une invitation. Un nouveau membre d'un groupe ne voit pas les messages écrits avant son arrivée ; dans une sortie, celui qui répond « Je viens » lit la discussion depuis le début, pour savoir ce qui s'est déjà dit.",
        "**« Vu »** (depuis la version 1.0.2 de l'app) : quand tu ouvres une discussion, on retient jusqu'où tu as lu (pour le compteur des messages non lus) et, si elle peut être montrée, l'heure de ta lecture ; tes potes voient alors « Vu · il y a 2 min » sous leur message. C'est donnant-donnant : avec « Montrer que j'ai lu » coupé (Profil › ⚙️ Paramètres › Ton compte et tes alertes › « Messages », allumé par défaut), personne ne voit quand tu lis, tu ne vois plus le « Vu » des autres, et l'heure n'est plus enregistrée (l'ancienne est effacée à ta lecture suivante). L'heure n'est gardée que si toi et au moins un autre membre l'avez allumé. « Vu » n'est jamais montré entre deux personnes dont l'une a bloqué l'autre. Une version plus ancienne de l'app ne garde jamais l'heure de lecture et ne montre aucun « Vu » ; un « Vu » n'est montré que pour une lecture dont l'heure a été gardée. Il est effacé avec ta place dans la conversation : quand tu la quittes, quand elle est effacée, ou quand tu supprimes ton compte ; « Effacer la discussion pour moi » efface aussi l'heure de ta lecture.",
        "**Les sondages « On mange où ? »** (dans les groupes) : les lieux proposés sont chiffrés comme les messages. Les membres voient le nombre de voix pour chaque lieu et le nombre de votants, jamais qui a voté pour quoi : chacun ne voit que son propre vote. Un sondage, ses lieux et ses votes suivent la règle des messages (effacés avec le message ou avec la conversation), et les votes d'un compte supprimé partent avec lui.",
        "**Les GIF** : ils viennent de **GIPHY**. Dans la discussion, on garde seulement l'identifiant du GIF et son adresse, chiffrés comme un message ; ce que voit GIPHY est expliqué dans « L'app SOS Miam : sur ton téléphone ».",
        "**Combien de temps** : chaque nuit, un ménage automatique passe sur notre serveur. Les photos et les notes vocales ne s'ouvrent plus **90 jours** après l'envoi, et leur fichier est effacé la nuit qui suit (sauf celui d'un message signalé, gardé un temps pour la modération : voir « Signaler et modérer dans la partie sociale »). Une conversation sans message depuis **1 an** est effacée, et une sortie, avec sa discussion, **1 an après sa date ou son dernier message** (le plus tard des deux) ; si un message signalé y attend la décision de l'équipe, la conversation attend avec lui. Une conversation où il ne reste plus personne est effacée la nuit suivante, et un fichier que plus rien ne cite, au bout de **24 heures**. Supprimer un de tes messages pour tout le monde (« Message supprimé ») efface tout de suite son texte et son fichier, sauf la copie gardée avec un signalement ; annuler une sortie, ou le départ du dernier membre d'un groupe, efface toute la discussion.",
        "**Si tu supprimes ton compte** : tes messages restent chez les autres, signés « Compte supprimé », jusqu'à l'effacement de la conversation ; tes photos et notes vocales suivent la règle des 90 jours.",
        "**Pourquoi et sur quelle base** : te permettre d'écrire à tes potes et d'organiser des sorties, c'est-à-dire l'exécution des [conditions d'utilisation](/cgu#messagerie) de l'app (article 6.1.b du RGPD).",
      ],
    },
  ],
};
