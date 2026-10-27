import type { Alertes } from "~/services/alertes.ts";

export const NOUVEAUTES_ALERTES: { lire: (a: Alertes) => number; titre: string; texte: string }[] = [
  { lire: (a) => a.moderation.urgents, titre: "🚨 Publication masquée pour tous", texte: "Un signalement grave attend ta décision dans la modération." },
  { lire: (a) => a.miamSafe?.sansReponse ?? 0, titre: "🛟 Alerte Miam Safe sans réponse", texte: "Quelqu'un a alerté un comptoir et personne n'a répondu. Appelle le lieu : Miam Safe → Alertes sans réponse." },
  { lire: (a) => a.miamSafe?.aTraiter ?? 0, titre: "🛡 Signalement Miam Safe", texte: "Quelqu'un ne s'est pas senti en sécurité dans un lieu. À lire sous 48 heures : ouvre Miam Safe." },
  { lire: (a) => a.securite?.nouveaux ?? 0, titre: "🐛 Faille signalée", texte: "Quelqu'un a signalé une faille de sécurité : ouvre Chasse aux bugs." },
  { lire: (a) => a.moderation.aTraiter - a.moderation.urgents, titre: "🛡️ Nouveau signalement", texte: "Un contenu a été signalé : ouvre la Modération." },
  { lire: (a) => a.moderation.contestes, titre: "⚖️ Décision contestée", texte: "Une décision de modération est à réexaminer (onglet « Contestés »)." },
  { lire: (a) => a.limitations?.contestees ?? 0, titre: "⚖️ Limitation contestée", texte: "Un compte conteste sa limitation : Comptes → Limitations." },
  { lire: (a) => a.actus ?? 0, titre: "📰 Actus à relire", texte: "Un article des Miamis ou la réponse d'un lieu attend ta relecture." },
  { lire: (a) => a.actusSupprimes ?? 0, titre: "🗑️ Article supprimé par son auteur", texte: "Un Miami a supprimé un de ses articles : Actus à relire → Supprimés par l'auteur." },
  { lire: (a) => (a.avis ? a.avis.aRelire + a.avis.reponses : 0), titre: "⭐ Avis à relire", texte: "Un avis ou la réponse d'un lieu attend ta relecture." },
  { lire: (a) => a.communaute?.ideesARelire ?? 0, titre: "💡 Idée à relire", texte: "Une idée ou une sortie des Miamis attend ta relecture : ouvre Idées et sorties." },
  { lire: (a) => a.demandes.aTraiter, titre: "📬 Nouvelle demande de lieu", texte: "Un lieu veut rejoindre SOS Miam, ou une pépite a été proposée." },
  { lire: (a) => a.ambassadeurs.enAttente, titre: "🙋 Nouvel ambassadeur", texte: "Une inscription à l'espace ambassadeur attend ta validation." },
  { lire: (a) => a.ambassadeurs.candidatures, titre: "🏅 Nouvelle candidature fondateur", texte: "Une candidature fondateur vient d'arriver." },
  { lire: (a) => a.ambassadeurs.certifications ?? 0, titre: "✅ Nouvelle candidature « certifié »", texte: "Quelqu'un veut devenir ambassadeur certifié : Ambassadeurs → Certifiés." },
  { lire: (a) => a.demandes.rattachements ?? 0, titre: "🏪 Demande de compte pro", texte: "Quelqu'un dit gérer un lieu : Demandes de lieux → Comptes pro." },
  { lire: (a) => a.carriere?.nouvelles ?? 0, titre: "💼 Nouvelle candidature", texte: "Quelqu'un veut rejoindre la Brigade : ouvre Carrière." },
  { lire: (a) => a.boite?.nonLus ?? 0, titre: "📨 Nouveau mail", texte: "Un mail est arrivé sur bonjour@sosmiam.fr : ouvre la Boîte mail." },
  { lire: (a) => a.lieux?.suggestions ?? 0, titre: "✏️ Modification de fiche proposée", texte: "Un client ou un lieu propose de modifier une fiche : ouvre Lieux pour voir l'avant et l'après." },
  { lire: (a) => a.surveillance?.contestations ?? 0, titre: "⚖️ Refus de visite contesté", texte: "Un Miami conteste le refus d'un lieu : Comptes → Contestations." },
  { lire: (a) => a.surveillance?.comptes ?? 0, titre: "🕵️ Compte à regarder", texte: "Un compte dépasse les seuils de la surveillance des visites (rien n'est bloqué) : Comptes → À surveiller." },
  { lire: (a) => a.surveillance?.lieux ?? 0, titre: "🧐 Un lieu refuse beaucoup de visites", texte: "Sa part de refus dépasse le seuil : Comptes → À surveiller." },
  { lire: (a) => a.missionsFaites, titre: "🎯 Mission faite", texte: "Un ambassadeur a envoyé son compte rendu : va le lire dans Ambassadeurs → Missions." },
  { lire: (a) => a.bigSos.aTraiter, titre: "🛟 BIG SOS à étudier", texte: "Un BIG SOS attend ton attention." },
  { lire: (a) => a.bigSos.aCloturer, titre: "📝 Bilan de BIG SOS à écrire", texte: "Un BIG SOS est fini : écris son bilan dans BIG SOS." },
];

export const TEXTES_ALERTES_WINDOWS = {
  bigSosDemain: { titre: "🛟 BIG SOS demain", texte: (lieu: string) => `${lieu} passe à la une dans moins de 24 heures. Tout est prêt (objectif, vidéos) ?` },
  enAttente: {
    titre: "👋 SOS Miam Gestion veille",
    texte: (nombre: number) => `${nombre} chose${nombre > 1 ? "s" : ""} t'attend${nombre > 1 ? "ent" : ""} dans le logiciel. Clique sur l'icône près de l'horloge pour l'ouvrir.`,
  },
};
