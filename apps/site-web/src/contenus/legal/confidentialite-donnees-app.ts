// Politique de confidentialité, section « Tes données de l'app, d'un coup d'œil » (id « donnees-app »), reprise par
// confidentialite.ts : un tableau qui reprend, donnée par donnée, ce que déclare la fiche Google Play (« Sécurité des
// données », 14 octobre 2026 : 13 types, tous collectés, jamais partagés) et la fiche App Store. Chaque ligne renvoie aux
// sections détaillées. Suppression du compte : https://sosmiam.fr/mon-compte (et dans l'app).
// Correspondance avec Google Play : nom, e-mail, ID utilisateur, autres infos (date de naissance) ; position approximative
// (ville), position exacte (éphémère) ; messages, photos, audio (notes vocales) ; interactions avec l'appli, autre contenu
// généré par l'utilisateur, autres actions (visites, fidélité) ; ID de l'appareil (jeton des notifications).
// Relu contre le code le 14 octobre 2026 (session Site) : apps/api/prisma/schema/*.prisma, packages/commun/src/regles/*.
import type { SectionLegale } from "~/contenus/legal/type-legal";

const contrat = "base : contrat";

export const sectionDonneesApp: SectionLegale = {
  id: "donnees-app",
  titre: "Tes données de l'app, d'un coup d'œil",
  blocs: [
    "Le tableau ci-dessous reprend, une par une, les données que ton compte de l'app confie à notre serveur, rangées comme dans la fiche « Sécurité des données » de Google Play. Le détail est dans les sections juste au-dessus et juste en dessous. Pour la base légale, « contrat » veut dire l'exécution des [conditions d'utilisation](/cgu) de l'app (article 6.1.b du RGPD), « intérêt légitime » l'article 6.1.f et « obligation légale » l'article 6.1.c. **Aucune n'est vendue**, aucune ne sert à de la publicité, et aucune n'est transmise à une autre entreprise pour ses propres besoins : nos prestataires techniques (Cloudflare, et Apple ou Google pour livrer les notifications) les traitent pour faire marcher le service (voir [Qui voit tes données, et où elles sont](#destinataires)).",
    {
      tableau: {
        legende: "Les données de ton compte de l'app : ce qu'on garde (chiffré ou en clair), pourquoi et sur quelle base légale, qui la voit, et combien de temps.",
        colonnes: ["Donnée", "Ce qu'on garde", "Pourquoi, et sur quelle base", "Qui la voit", "Combien de temps"],
        lignes: [
          ["Ton nom", "Ton prénom (en clair) et, si tu le donnes, ton nom (**chiffré**).", `Te reconnaître et signer ce que tu publies ; ${contrat}.`, "Les autres voient ton prénom ; tes avis sont signés « Léa M. ». Ton nom, seulement l'équipe.", "Tant que tu gardes ton compte."],
          ["Ton e-mail", "Ton adresse (en clair : il faut pouvoir t'écrire).", `Te connecter, confirmer ton adresse, te redonner un mot de passe, te prévenir avant l'effacement d'un compte inactif ; ${contrat}.`, "L'équipe seulement, jamais les autres Miamis ni les lieux.", "Tant que tu gardes ton compte."],
          ["Tes identifiants", "Le numéro de ton compte, ton @pseudo, ton identifiant public (10 caractères) et, si tu t'en sers, l'identifiant que te donnent Apple ou Google.", `Te reconnaître d'un appareil à l'autre ; ${contrat}.`, "Ton pseudo et ton identifiant public se voient ; le reste, l'équipe seulement.", "Tant que tu gardes ton compte ; un pseudo libéré reste réservé 30 jours."],
          ["Ta date de naissance", "**Chiffrée.**", "Vérifier que tu es majeur (18 ans en France) ; base : contrat.", "Personne : ni les autres, ni les lieux. L'équipe seulement si besoin.", "Tant que tu gardes ton compte."],
          ["Ta position approximative", "Le nom de ta ville, jamais une position (en clair).", "Te montrer les lieux et le fil de ta ville, et t'envoyer les notifications de ta ville ; base : contrat.", "Ta bande voit ta ville.", "Tant que tu gardes ton compte ; avec ton téléphone des notifications, 90 jours sans signe de vie au plus."],
          ["Ta position exacte", "Pour valider une visite : une seule lecture, **jamais gardée** (seulement le résultat). Pour « Prévenir un pote » : ta dernière position, **chiffrée**.", "Vérifier que tu es dans le lieu ; prévenir un pote quand tu ne te sens pas en sécurité ; base : contrat.", "Visite : personne. « Prévenir un pote » : seulement le pote choisi.", "Visite : rien n'est gardé. « Prévenir un pote » : effacée dès l'arrêt, et au plus tard la nuit qui suit la fin de l'heure."],
          ["Tes messages", "Le texte, les lieux partagés et leur petit mot (**chiffrés**) ; qui écrit à qui et quand (en clair).", "Écrire à tes potes ; base : contrat.", "Les membres de la conversation. L'équipe, seulement un message signalé.", "Jusqu'à l'effacement de la conversation, après 1 an sans message (ménage automatique bientôt en place)."],
          ["Tes photos", "Les photos envoyées dans la messagerie, réduites et sans métadonnées (**chiffrées**). Ta photo de profil reste sur ton téléphone.", "Les partager avec tes potes ; base : contrat.", "Les membres de la conversation.", "Elles ne s'ouvrent plus 90 jours après l'envoi (ménage automatique du serveur bientôt en place)."],
          ["Tes notes vocales", "Les notes vocales de la messagerie, 1 minute au plus (**chiffrées**).", "Les partager avec tes potes ; base : contrat.", "Les membres de la conversation.", "Elles ne s'ouvrent plus 90 jours après l'envoi (ménage automatique du serveur bientôt en place)."],
          ["Tes interactions avec l'app", "Tes J'aime, les lieux que tu gardes, ce que tu masques, les lieux, créateurs et personnes que tu suis, tes réactions, ce que tu as déjà lu (en clair).", "Faire marcher ton fil, tes abonnements et la cloche ; base : contrat.", "Toi. Les lieux voient des totaux, jamais qui. Ta bande voit qui tu suis et qui te suit ; les autres, seulement combien.", "Tant que tu gardes ton compte (ce que tu retires de ta vue : 13 mois au plus)."],
          ["Ce que tu écris ou crées", "Tes avis, commentaires, listes, sorties, petits mots de réservation, signalements et contestations (en clair, sauf la copie gardée avec un signalement, **chiffrée**).", "Les publier ou les partager (base : contrat) ; traiter les signalements (base : obligation légale d'hébergeur et intérêt légitime).", "Avis et commentaires : tout le monde ; listes et sorties : qui tu choisis ; signalements : l'équipe.", "Tant que tu gardes ton compte ; signalements : 1 an après la décision (ménage automatique bientôt en place)."],
          ["Tes visites et ta fidélité", "Tes visites, tes points, ton palier, tes badges, tes défis, tes tampons, tes récompenses, tes rescousses, tes réservations et tes « Ça m'intéresse » (en clair).", "Faire marcher les visites, la fidélité, les points et les réservations ; base : contrat.", "Toi ; chaque lieu voit seulement ce qui s'est passé chez lui.", "Tant que tu gardes ton compte ; « Ça m'intéresse » : 30 jours après l'événement."],
          ["L'identifiant de ton téléphone", "Le jeton de notifications d'Apple ou de Google, la plateforme (iPhone ou Android) et ta ville (en clair).", "T'envoyer les notifications que tu as acceptées ; base : contrat.", "L'équipe ; Apple ou Google, pour livrer chaque notification.", "Jusqu'à ce que tu coupes les notifications, ou 90 jours sans signe de vie de l'app."],
        ],
      },
    },
    "**Tout effacer** : tu peux supprimer ton compte dans l'app (réglages, « Mon compte ») ou sur [sosmiam.fr/mon-compte](/mon-compte) ; il est alors effacé de notre serveur tout de suite, et de nos sauvegardes au plus tard 30 jours après. Pas de suivi des plantages, pas d'outil de mesure d'audience, pas de publicité dans l'app.",
  ],
};
