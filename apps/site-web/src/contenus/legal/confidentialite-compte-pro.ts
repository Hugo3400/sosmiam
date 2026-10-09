// Politique de confidentialité, section « Ton espace pro » (article 13 du RGPD), à reprendre dans confidentialite.ts comme
// sectionCompteAmbassadeur. Son id « compte-pro » ne doit pas changer : l'inscription sur pro.sosmiam.fr y renvoie
// (https://sosmiam.fr/confidentialite#compte-pro).
// Ce qui est vraiment gardé : RattachementLieu (apps/api/prisma/schema/rattachements.prisma : lieu, compte, rôle « gerant »
// ou « equipe », preuve, SIRET facultatif, statut, réponse de l'équipe, dates) et SuggestionLieu de source « pro » (nom et
// adresse proposés, « avant », message, auteur, décision, réponse ; effacée 1 an après la décision, ménage de nuit).
// Les autres changements de la fiche sont écrits directement sur le lieu (Lieu), sans auteur.
// Durée des rattachements (décision de Hugo du 9 octobre 2026, docs/decisions.md, « Espace pro ») : en attente ou validé,
// gardé tant qu'il dure ; refusé ou retiré, effacé 1 an après la décision ou le retrait (services/menage-comptes.ts).
// Le compte lui-même (e-mail, prénom, mot de passe, connexions, liens par mail, 2 ans sans connexion) suit la section
// « Ton compte ambassadeur », sans ville ni quartier : une inscription sur pro.sosmiam.fr ne crée pas de rôle d'ambassadeur.
import { HOTE_PRO } from "~/fonctions/hotes/choisir-redirection-hote";
import { hebergeur } from "~/contenus/legal/informations-legales";
import type { SectionLegale } from "~/contenus/legal/type-legal";

const lienEspacePro = `[${HOTE_PRO}](https://${HOTE_PRO})`;

export const sectionComptePro: SectionLegale = {
  id: "compte-pro",
  titre: "Ton espace pro",
  blocs: [
    `Sur ${lienEspacePro}, tu peux gérer la fiche d'un lieu qui est à toi (ou dans lequel tu travailles), **dès 18 ans**, avec ton compte SOS Miam : le même que pour l'espace ambassadeur et, demain, pour l'app. Une inscription faite sur l'espace pro ne te demande pas ta ville et ne fait pas de toi un ambassadeur.`,
    {
      liste: [
        "**Ton compte** : ton adresse e-mail, ton prénom ou ton surnom, l'empreinte de ton mot de passe, tes connexions et les liens qu'on t'envoie par mail suivent exactement les règles de [Ton compte ambassadeur](#compte-ambassadeur), sans ville ni quartier. Ta date de naissance sert seulement à vérifier que tu as 18 ans, puis elle est oubliée.",
        "**Ta demande pour gérer un lieu** (le « rattachement ») : le lieu, ton rôle (gérant, ou membre de l'équipe), ce que tu nous écris pour montrer que le lieu est bien à toi (la « preuve »), le numéro SIRET si tu le donnes (il est facultatif), la date de ta demande, et notre décision (en attente, validée, refusée ou retirée), avec sa date et la réponse qu'on t'envoie.",
        "**Ton équipe** : quand un gérant t'invite, on garde l'invitation (le lieu, ton compte, le rôle « équipe », son statut : en attente ou acceptée, et ses dates). Pour inviter quelqu'un, le gérant tape l'adresse e-mail de son compte SOS Miam : on ne crée jamais de compte à la place de quelqu'un.",
        "**Les modifications de ta fiche** : les horaires, le texte, le contact et les infos pratiques que tu changes sont appliqués tout de suite à la **fiche publique du lieu**, visible par tout le monde, **sans ton nom**. Le **nom et l'adresse** du lieu, eux, ne changent pas tout de suite : ils partent à l'équipe sous forme de **proposition** (ce que tu proposes, ce qu'il y avait avant, ton « pourquoi » si tu en écris un, ton compte comme auteur, notre décision et notre réponse). Chaque proposition est effacée **1 an après la décision** ; si tu supprimes ton compte avant, elle reste sans lien vers toi jusqu'à cette date.",
        "**Pourquoi** : vérifier que tu représentes bien le lieu avant de te laisser modifier sa fiche (et protéger les lieux contre quelqu'un qui se ferait passer pour eux), afficher « Vérifié ✓ » sur la fiche d'un lieu qui a au moins un gérant ou un membre d'équipe validé, te laisser tenir ta fiche à jour, faire travailler ton équipe avec toi, et t'écrire par mail quand l'équipe a décidé.",
        "**Base légale** : l'exécution des [conditions d'utilisation de l'espace pro](/cgu#pro) que tu acceptes en créant ton compte (article 6.1.b du RGPD), pour ta demande, ton équipe et ta fiche. Pour garder une demande refusée ou un rattachement retiré pendant un an, l'intérêt légitime (article 6.1.f du RGPD) : pouvoir répondre si la même demande revient, ou si quelqu'un conteste qui tient le lieu.",
        "**Qui voit quoi** : l'équipe de SOS Miam (aujourd'hui, l'éditeur) voit tout, depuis son logiciel de gestion. Les **gérants** d'un lieu voient les membres de son équipe : prénom, rôle, statut, dates, et l'**adresse e-mail** des membres invités ; les membres de l'équipe, eux, ne voient pas cette liste, et personne d'autre que l'équipe de SOS Miam ne voit l'e-mail d'un gérant. Tout le monde voit la fiche publique du lieu et son « Vérifié ✓ », mais jamais ton nom, ta preuve ni ton SIRET. Les propositions que tu envoies pour un lieu sont visibles par les gérants et les membres de ce lieu, sans le nom de leur auteur.",
        `**Où** : dans notre base de données, sur notre serveur loué à ${hebergeur.nom} et situé en France, comme le reste de ton compte. Personne d'autre ne reçoit ces données : ni partenaire, ni autre lieu.`,
        "**Combien de temps** : une demande en attente, et un rattachement validé, sont gardés **tant que tu es rattaché au lieu**. Une demande **refusée**, ou un rattachement **retiré** (tu quittes le lieu, tu refuses une invitation, un gérant te retire de l'équipe, ou l'équipe de SOS Miam le retire) est effacé, avec sa preuve, son SIRET et notre réponse, **1 an après la décision ou le retrait**. Les propositions de nom et d'adresse sont effacées 1 an après la décision. Ton compte, lui, est effacé après **2 ans sans connexion** (on te prévient par mail un mois avant).",
        "**Si tu supprimes ton compte** : tes rattachements et tes invitations sont effacés tout de suite ; si tu étais le seul à tenir un lieu, il n'est plus « Vérifié ✓ ». Ce que tu as écrit sur la fiche du lieu y reste, sans ton nom : c'est la fiche du lieu. Une donnée effacée disparaît aussi de nos sauvegardes chiffrées au plus tard 30 jours après.",
        "**Obligatoire ?** Pour demander à gérer un lieu, la preuve est nécessaire ; le numéro SIRET est facultatif. Pour une proposition de nom ou d'adresse, le « pourquoi » est facultatif.",
        "**Tes droits, en direct** : tu peux quitter un lieu, refuser une invitation ou annuler ta demande depuis ton tableau, et changer ton prénom ou ton mot de passe, ou **supprimer ton compte**, dans « Mon compte » de l'espace pro (ton mot de passe t'est demandé). Pour recevoir une copie de tes données, corriger ou faire effacer quelque chose, ou t'opposer à ce qu'on garde une demande refusée, écris-nous : voir [Comment exercer tes droits](#exercer-tes-droits).",
      ],
    },
  ],
};
