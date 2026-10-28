import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_SCAN_ANGLAIS } from "~/contenus/anglais/textes-scan";

export const TEXTES_SCAN = {
  titre: "Scan",
  promesse: "Ta visite compte quand tu paies : c'est ce qui rend les avis vrais.",
  indisponibleTitre: "Ça arrive avec les comptes",
  indisponibleTexte: "Le scan du comptoir et l'addition dans l'app ouvrent avec les vrais comptes. On peaufine les derniers boulons, promis.",
  chargement: "On rassemble tes visites…",
  scannerTitre: "Scanner le QR du comptoir",
  scannerTexte: "Tu viens de payer ? Scanne le QR que te montre l'équipe.",
  scannerIndice: "Ouvre l'appareil photo",
  additionTitre: "Demander l'addition",
  additionTexte: "Pas de QR en vue ? Demande-la ici : l'équipe la valide d'un geste.",
  cartesTitre: "Mes cartes de fidélité",
  cartesLu: (nombre: number) => `Mes cartes de fidélité, ${nombre}`,
  cartesVide: "Ta première visite validée pose ton premier tampon. Les cartes se remplissent plus vite qu'un verre en terrasse.",
  visitesTitre: "Mes visites",
  visitesLu: (validees: number) => `Mes visites, ${validees} validée${validees > 1 ? "s" : ""}`,
  visitesResume: (validees: number, points: number) =>
    `${validees} visite${validees > 1 ? "s" : ""} validée${validees > 1 ? "s" : ""} · ${points} point${points > 1 ? "s" : ""} gagné${points > 1 ? "s" : ""}`,
  visitesVide: "Pas encore de visite : ton prochain resto indépendant n'attend que toi (et ton scan).",
  toutVoir: "Tout voir",
  toutVoirLu: (libelle: string) => `Tout voir : ${libelle}`,
  commentTitre: "Comment ça marche ?",
  etapes: [
    { titre: "Tu te régales, tu paies", texte: "Ta visite compte quand tu paies : c'est ce qui rend les avis vrais." },
    {
      titre: "Tu valides en un geste",
      texte: "Scanne le QR que te montre l'équipe, ou demande l'addition dans l'app. Une réservation faite ici et honorée compte aussi.",
    },
    { titre: "Tu en profites", texte: "+15 points (+25 pendant un SOS), un tampon sur ta carte de fidélité, et ton avis s'ouvre une heure après : pas devant le patron." },
  ],
  etapeLue: (numero: string, titre: string, texte: string) => `Étape ${numero} : ${titre}. ${texte}`,
  faqLu: "Toutes les réponses dans la FAQ du site",
  faq: "Toutes les réponses dans la FAQ →",
  invitationTexte: "Ici, tes visites comptent pour de vrai : des points, des tampons et des avis vérifiés.",
  invitationTitre: "Crée ton compte pour que tes visites comptent",
  invitationDetail: "Une minute top chrono, et tes prochains restos te rapportent des points, des tampons et le droit de donner ton avis.",
  invitationBouton: "Je crée mon compte",
  invitationIndice: "Ouvre l'inscription : une minute",
  statuts: {
    demandee: "En attente",
    validee: "Validée",
    refusee: "Pas validée",
    annulee: "Annulée",
    expiree: "Endormie",
    retiree: "Retirée",
  },
  gain: (points: number, tampon: boolean) => `+${points} points${tampon ? " · 1 tampon" : ""}`,
  apercuLu: (nom: string, jour: string) => `${nom}, le ${jour}`,
  apercuIndice: "Ouvre le détail de la visite",
};

export const TEXTES_SCAN_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_SCAN>> = { fr: TEXTES_SCAN, en: TEXTES_SCAN_ANGLAIS };
