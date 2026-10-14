// Politique de confidentialité, section « Ta bande, tes abonnés et ton profil » (id « potes »), reprise par
// confidentialite.ts dans le chapitre « Ta bande et tes messages ». Ouverte avec les comptes de l'app (v1).
// Relu contre le code le 14 octobre 2026 (session Site), en lecture seule : apps/api/prisma/schema (social.prisma,
// listes.prisma, commentaires.prisma, cloche.prisma, pseudos-reserves.prisma), apps/api/src/services/social.ts (lireProfil :
// ce que voit un inconnu, un abonné ou la bande), packages/commun/src/regles (potes.ts, suivis.ts, listes.ts, cloche.ts).
// Ménage de nuit de la partie sociale (lot L7) : PAS ENCORE BRANCHÉ au 14 octobre 2026 (seuls les pseudos réservés le
// sont) : les durées qui en dépendent sont écrites au futur (« bientôt »).
import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionPotes: SectionLegale = {
  id: "potes",
  titre: "Ta bande, tes abonnés et ton profil",
  blocs: [
    "La partie sociale de l'app (l'onglet Potes) ne démarre que si tu le décides : ton profil social est créé la première fois que tu ouvres Potes ou fais un geste social, avec ton pseudo. Tant qu'il n'existe pas, personne ne peut te trouver.",
    {
      liste: [
        "**Ton profil social** : un **identifiant public** de 10 caractères tiré au hasard (il sert aux liens vers ton profil et ne change jamais, même si tu changes de pseudo), ton **code d'invitation** (créé par notre serveur, gardé **chiffré**, sans date de fin : tu peux le changer quand tu veux, et il change tout seul après 10 arrivées dans ta bande qui se suivent de près, à moins de 24 heures d'intervalle) et tes réglages : « Qu'on me trouve par mon pseudo », « Me proposer à d'autres », « Montrer mon activité à ma bande » et les notifications sociales (gardés sur notre serveur ; leurs interrupteurs arrivent **bientôt** dans l'app).",
        "**Ce que les autres voient de toi** : ton prénom, ton @pseudo et ton emoji d'avatar se voient partout où tu participes (recherche, commentaires publics, lisibles même sans compte…). Sur ton profil, n'importe quel compte voit aussi tes nombres d'abonnés et d'abonnements. Si ton compte est public, ou pour tes abonnés, s'ajoutent tes badges et tes listes ouvertes à tous. Ta **bande** voit en plus tes listes réservées à la bande, ta ville, tes points, ton palier, la liste de tes abonnés et de tes abonnements et, si tu montres ton activité, tes points et tes rescousses du mois (dans « Quoi de neuf » et le classement du mois), les lieux que tu as sauvés et ceux que tu gardes. Ta photo de profil, elle, reste sur ton téléphone.",
        "**Ta bande** : la liste de tes potes (200 au plus), dans les deux sens, et les demandes envoyées depuis un pseudo, en attente ou refusées (un refus ne prévient personne). Une demande ne compte plus au bout de **30 jours**.",
        "**Tes abonnements** : qui tu suis et qui te suit, et les demandes pour un compte privé (un refus ne prévient personne). Une demande ou un refus ne compte plus au bout de **30 jours**.",
        "**Tes listes** : leur titre, leur emoji, leur description, leurs lieux, qui peut les voir (tout le monde ou ta bande), tes co-auteurs (invités parmi ta bande) et qui les suit. Elles partent avec ton compte.",
        "**Tes commentaires** : leur texte, les personnes que tu cites avec « @ » (elles sont prévenues seulement si elles te suivent ou t'ont dans leur bande), tes J'aime, et si tu les as modifiés ou supprimés. Ils sont **publics**, comme les publications. Une réponse du lieu garde le nom du membre de son équipe qui l'a écrite, sans jamais le montrer. Un commentaire supprimé est effacé tout de suite, sauf s'il a des réponses ou un signalement en cours : il reste alors « Commentaire supprimé », sans son texte. Tes commentaires partent avec ton compte ; les réponses des autres restent.",
        "**La cloche** (les notifications dans l'app) : le type de notification, qui a agi et sur quoi, avec parfois un petit détail (le titre d'une sortie, le lieu retenu), jamais un message ni le titre d'un groupe. Et ce que tu as retiré de ta vue (une sortie passée, une suggestion…), pour ne plus te le montrer.",
        "**Tes blocages** : qui tu as bloqué, et quand. Bloquer coupe le lien dans les deux sens (voir les [conditions d'utilisation](/cgu#bloquer)) ; la personne bloquée n'en est pas prévenue.",
        "**Les pseudos libérés** : quand tu changes de pseudo ou supprimes ton compte, ton ancien pseudo est réservé **30 jours** (personne d'autre ne peut le prendre, pour qu'on ne se fasse pas passer pour toi), puis la réservation est effacée par notre ménage de nuit.",
        "**Pourquoi et sur quelle base** : faire marcher ta bande, tes abonnements, tes listes, les commentaires et la cloche, ce qui relève de l'exécution des [conditions d'utilisation](/cgu#potes) de l'app (article 6.1.b du RGPD). « Tu pourrais suivre » te suggère notamment des potes de tes potes : ton profil n'y est proposé que si tu as laissé « Me proposer à d'autres » allumé, et jamais si ton compte est privé.",
        "**Combien de temps** : tant que tu gardes ton compte, sauf les durées plus courtes dites plus haut. **Bientôt**, un ménage automatique effacera aussi les demandes et les refus au bout de **30 jours**, les notifications de la cloche au bout de **90 jours** (200 au plus ; **6 mois** pour celles de la modération) et ce que tu as retiré de ta vue au bout de **13 mois**. D'ici là, une demande de plus de 30 jours ne compte déjà plus.",
      ],
    },
  ],
};
