import type { CommentaireIdee, IdeeMiamis } from "@sos-miam/commun/types/idees";
import { MIAMIS_EXEMPLES as M } from "~/contenus/miamis/personnes-miamis-exemples";

const ilYa = (maintenant: Date, heures: number) => new Date(maintenant.getTime() - heures * 3_600_000).toISOString();
const moisDe = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export function creerIdeesExemples(maintenant: Date): IdeeMiamis[] {
  return [
    {
      id: "idee-budget",
      titre: "Un filtre « J'ai 10 € pour manger »",
      detail: "En fin de mois, j'aimerais voir d'un coup d'œil où bien manger autour de moi sans exploser mon budget. Genre un bouton magique « petit budget ».",
      auteur: M.lea,
      date: ilYa(maintenant, 72),
      statut: "a-l-etude",
      votes: 215,
      aVote: true,
      votants: [M.lea, M.sam, M.nina, M.yanis],
      commentaires: 0,
      reponseBrigade: {
        texte: "On adore l'idée. On regarde comment l'afficher sans transformer l'app en comparateur de prix. On vous raconte la suite ici, promis.",
        date: ilYa(maintenant, 20),
      },
      ideeDuMois: null,
    },
    {
      id: "idee-minuit",
      titre: "Voir les lieux encore ouverts après minuit",
      detail: "Pour les fringales de fin de soirée : savoir qui sert encore à manger tard la nuit.",
      auteur: M.malo,
      date: ilYa(maintenant, 50),
      statut: "proposee",
      votes: 167,
      aVote: false,
      votants: [M.malo, M.theo, M.jo],
      commentaires: 0,
      reponseBrigade: null,
      ideeDuMois: null,
    },
    {
      id: "idee-nouveaux",
      titre: "Des sorties pour les nouveaux dans la ville",
      detail: "Quand on débarque, on ne connaît personne. Des sorties pensées pour les nouveaux arrivants, ce serait top.",
      auteur: M.zoe,
      date: ilYa(maintenant, 400),
      statut: "prevue",
      votes: 142,
      aVote: false,
      votants: [M.zoe, M.rose, M.lea],
      commentaires: 0,
      reponseBrigade: {
        texte: "Validé ! La Brigade la construit en ce moment : les sorties des Miamis auront un public « Nouveaux dans l'app » et une place gardée pour un nouveau.",
        date: ilYa(maintenant, 30),
      },
      ideeDuMois: moisDe(maintenant),
    },
    {
      id: "idee-frites",
      titre: "Le classement des meilleures frites de la ville",
      detail: "Croustillantes, moelleuses, maison : que les Miamis votent pour leurs frites préférées.",
      auteur: M.sam,
      date: ilYa(maintenant, 30),
      statut: "proposee",
      votes: 89,
      aVote: false,
      votants: [M.sam, M.yanis],
      commentaires: 0,
      reponseBrigade: null,
      ideeDuMois: null,
    },
    {
      id: "idee-midi",
      titre: "Trouver un Miami pour partager un repas le midi",
      detail: "Manger seul entre deux cours ou deux réunions, c'est triste. Un coup de main pour trouver quelqu'un le midi.",
      auteur: M.nina,
      date: ilYa(maintenant, 60),
      statut: "proposee",
      votes: 64,
      aVote: false,
      votants: [M.nina, M.alex],
      commentaires: 0,
      reponseBrigade: null,
      ideeDuMois: null,
    },
    {
      id: "idee-qr",
      titre: "Se connecter sur un nouveau téléphone avec un QR code",
      detail: "Changer de téléphone sans retaper son mot de passe.",
      auteur: M.yanis,
      date: ilYa(maintenant, 900),
      statut: "faite",
      votes: 58,
      aVote: false,
      votants: [M.yanis, M.lou],
      commentaires: 0,
      reponseBrigade: { texte: "C'est fait ! Réglages › Connecter un appareil. Merci Yanis pour l'idée.", date: ilYa(maintenant, 48) },
      ideeDuMois: null,
    },
  ];
}

export function creerCommentairesIdeesExemples(maintenant: Date): CommentaireIdee[] {
  const commentaire = (id: string, ideeId: string, auteur: CommentaireIdee["auteur"], texte: string, heures: number, jaime: number, reponseA: string | null = null): CommentaireIdee => ({
    id,
    ideeId,
    auteur,
    texte,
    date: ilYa(maintenant, heures),
    jaime,
    aime: false,
    reponseA,
  });
  return [
    commentaire("ci-1", "idee-budget", M.sam, "Oui ! Et qu'on puisse le garder activé, pas le recocher à chaque fois.", 48, 34),
    { ...commentaire("ci-2", "idee-budget", M.nina, "Pareil, surtout le midi entre deux cours. Un repère « menu du jour » aiderait déjà beaucoup.", 47, 21), aime: true, jaime: 22 },
    commentaire("ci-3", "idee-budget", M.lea, "Merci la Brigade ! Je vote aussi pour le repère « menu du jour » de Nina.", 24, 9, "ci-2"),
    commentaire("ci-4", "idee-budget", M.malo, "Les lieux en SOS pourraient remonter en premier dans ce filtre, ça les aiderait.", 5, 7),
    commentaire("ci-5", "idee-minuit", M.theo, "Les soirs de match, ce serait un sauvetage.", 30, 12),
    commentaire("ci-6", "idee-minuit", M.jo, "Avec l'heure de fermeture de la cuisine, pas juste du bar !", 26, 8),
    commentaire("ci-7", "idee-nouveaux", M.rose, "Arrivée il y a deux semaines : j'attends ça avec impatience.", 100, 15),
    commentaire("ci-8", "idee-frites", M.yanis, "Je me porte volontaire pour le jury.", 20, 19),
  ];
}
