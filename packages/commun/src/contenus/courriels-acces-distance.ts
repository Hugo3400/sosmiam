export const COURRIELS_ACCES_DISTANCE = {
  nouveauPoste: {
    objet: (nom: string) => `🔐 Nouveau PC autorisé : ${nom}`,
    titre: "Un nouveau PC peut ouvrir le logiciel",
    paragraphes: ({ nom, le, jusquA, pays }: { nom: string; le: string; jusquA: string | null; pays: string | null }) => [
      `« ${nom} » vient d'être autorisé à distance, le ${le}${pays ? ` (connexion depuis : ${pays})` : ""}, avec ton mot de passe de gestion et ton code à 6 chiffres.`,
      jusquA ? `Il est autorisé jusqu'au ${jusquA}, puis il sera coupé tout seul.` : "Il est autorisé sans date de fin.",
      "C'est toi ? Rien à faire, bon courage pour la suite 💪",
      "Ce n'est pas toi ? Ouvre le logiciel sur ton PC, menu Sécurité → PC autorisés, et coupe-le. Puis, sur le serveur, change ton mot de passe de gestion (npm run gestion:autoriser -- --distance) et ton code à 6 chiffres (npm run gestion:autoriser -- --nouveau-code).",
    ],
  },
  bloque: {
    objet: "⚠️ Ajout de PC à distance bloqué",
    titre: "Trop d'essais ratés",
    paragraphes: ({ jusquA }: { jusquA: string }) => [
      `10 essais ratés en moins d'une heure pour autoriser un PC à distance : l'ajout de PC est bloqué jusqu'à ${jusquA}. Tes PC déjà autorisés marchent normalement.`,
      "Si ce n'est pas toi, quelqu'un tente sa chance. Ton code à 6 chiffres le bloque, mais change ton mot de passe de gestion par sécurité (npm run gestion:autoriser -- --distance).",
    ],
  },
  pied: "Tu reçois ce mail parce que l'accès à distance au logiciel de gestion de SOS Miam est ouvert.",
} as const;
