// Politique de confidentialité, section « Ton compte ambassadeur » (article 13 du RGPD), reprise par confidentialite.ts.
// Ce qui est vraiment gardé : modèles Compte, Ambassadeur, SessionCompte, BadgeCompte, JournalPoints, CandidatureFondateur,
// MissionAmbassadeur, MessageAmbassadeur, LectureMessage et DemandeLieu.compteId (apps/api/prisma/schema.prisma).
// La date de naissance n'est jamais gardée. Durées et limites d'essais : docs/decisions.md, « Espace ambassadeur ».
// « Déniché par » : le prénom est recopié sur la fiche du lieu accepté (Lieu.decouvertPar) ; il y reste si le compte est
// supprimé, d'où la promesse de le retirer sur simple demande.
import { adresseEspaceAmbassadeur } from "~/contenus/ambassadeurs";
import { hebergeur } from "~/contenus/legal/informations-legales";
import type { SectionLegale } from "~/contenus/legal/type-legal";

const lienEspace = `[${adresseEspaceAmbassadeur.replace("https://", "")}](${adresseEspaceAmbassadeur})`;

export const sectionCompteAmbassadeur: SectionLegale = {
  id: "compte-ambassadeur",
  titre: "Ton compte ambassadeur",
  blocs: [
    `Sur ${lienEspace}, tu peux créer un compte pour rejoindre le programme Ambassadeurs, **dès 18 ans**. L'équipe de SOS Miam (aujourd'hui, l'éditeur) regarde chaque inscription à la main ; une fois la tienne validée, ton espace s'ouvre : kit média, lieux à proposer, candidature pour devenir fondateur, missions et messages de l'équipe.`,
    {
      liste: [
        "**Ce qu'on garde sur ton compte** : ton adresse e-mail ; ton prénom ou ton surnom ; ta ville et, si tu le donnes, ton quartier ; l'**empreinte** de ton mot de passe (un code calculé à partir de lui, qui ne permet pas de le retrouver : ton mot de passe lui-même n'est jamais enregistré) ; la date de création du compte et la version des conditions d'utilisation que tu as acceptées ; ton statut (en attente, validé, refusé ou suspendu) et la date de cette décision ; la date de ta dernière visite dans ton espace.",
        "**Ce que tu fais dans ton espace** : tes points, ton niveau et tes badges, avec l'historique de tes points (combien, quand et pourquoi) ; ta candidature pour devenir fondateur, si tu en envoies une (tes pépites, tes envies, tes réseaux si tu les donnes, pourquoi toi, si tu es partant pour faire connaissance, comment tu as connu SOS Miam, et notre réponse) ; les lieux que tu nous proposes ; les missions et les messages que l'équipe t'envoie, tes comptes rendus, et quels messages tu as lus.",
        "**Une note de l'équipe** : l'éditeur peut écrire une courte note privée sur ton compte (par exemple, pourquoi il l'a validé). Elle n'apparaît pas dans ton espace, mais tu peux la demander, comme tout le reste.",
        "**Tes connexions** : quand tu te connectes, ton navigateur reçoit une clé de connexion tirée au hasard, gardée dans un cookie (voir la page [Cookies](/cookies)). Notre serveur n'en garde que l'empreinte, avec l'heure de la connexion et celle de ta dernière activité : ni ton adresse IP, ni ton navigateur.",
        "**Ta date de naissance n'est pas gardée** : à l'inscription, elle sert seulement à vérifier que tu as 18 ans, puis elle est oubliée. Elle n'est ni enregistrée, ni écrite dans un journal. Si tu as moins de 18 ans, on ne garde rien du tout.",
        "**Pourquoi** : créer et faire vivre ton compte, vérifier les inscriptions, compter tes points, étudier ta candidature et les lieux que tu proposes, t'envoyer des missions et des messages, et protéger ton compte.",
        "**Base légale** : pour ton compte, ta candidature et les lieux que tu proposes, l'exécution des [conditions d'utilisation](/cgu#ambassadeurs) que tu acceptes en créant ton compte (article 6.1.b du RGPD). Pour la note de l'équipe et la sécurité (les limites d'essais, juste en dessous), l'intérêt légitime (article 6.1.f du RGPD) ; les intérêts poursuivis : bien suivre le programme, et empêcher quiconque de deviner ton mot de passe.",
        "**Les limites d'essais** : contre les robots, ton adresse IP sert à limiter le nombre de tentatives (par exemple 20 connexions toutes les 10 minutes, ou 10 inscriptions par heure). Elle reste seulement en mémoire, le temps de cette limite, et n'est jamais enregistrée. Après 5 mots de passe faux de suite pour une même adresse e-mail, il faut aussi attendre un peu avant chaque nouvel essai, de plus en plus longtemps (15 minutes au plus) : l'adresse tapée et le nombre d'échecs restent en mémoire, jamais sur le disque, et sont oubliés dès que la connexion réussit, ou au bout d'un jour.",
        "**« Déniché par »** : si un lieu que tu as proposé rejoint SOS Miam, ton prénom (ou ton surnom) peut s'afficher sur sa fiche, visible par tout le monde. Il y reste même si tu supprimes ton compte, sauf si tu nous demandes de le retirer : un mail suffit.",
        `**Où et qui** : dans notre base de données, sur notre serveur loué à ${hebergeur.nom} et situé en France. Seul l'éditeur y a accès, depuis son logiciel de gestion. Personne d'autre ne reçoit ces données : ni partenaire, ni lieu, ni prestataire d'e-mails. Comme pour toute visite, ce que tu envoies passe par Cloudflare (voir « Cloudflare, qui protège le site »).`,
        "**Combien de temps** : tant que tu te sers de ton compte. **Sans aucune visite dans ton espace pendant 1 an**, il est effacé ; quand l'envoi de mails sera en place, on te préviendra par mail avant. **Si ton inscription est refusée**, ton compte est effacé **30 jours** après le refus. **Une candidature de fondateur refusée** est effacée **3 mois** après notre réponse. Une connexion se ferme après **30 jours** sans visite, et au plus tard **90 jours** après avoir été ouverte. Un lien pour choisir un nouveau mot de passe marche **24 heures**, une seule fois.",
        "**Si tu supprimes ton compte** : tout ce qui le concerne est effacé tout de suite (compte, points, badges, candidature, missions, messages, connexions). Seuls les lieux que tu as proposés restent dans nos demandes, sans plus aucun lien avec toi. Dans tous les cas, une donnée effacée disparaît aussi de nos sauvegardes chiffrées au plus tard 30 jours après.",
        "**Obligatoire ?** Ton e-mail, un mot de passe, ton prénom ou ton surnom, ta ville et ta date de naissance sont nécessaires pour créer le compte ; le quartier est facultatif. Dans la candidature de fondateur, tes réseaux et la façon dont tu as connu SOS Miam sont facultatifs.",
        "**Tes droits, en direct** : ton prénom, ta ville et ton quartier se changent dans « Mon compte », dans ton espace ; ton adresse e-mail, en nous écrivant. Tu peux aussi y **supprimer ton compte** (ton mot de passe t'est demandé), ou nous le demander par mail, depuis l'adresse de ton compte. Pour recevoir une copie de tes données, note de l'équipe comprise, écris-nous.",
      ],
    },
  ],
};
