import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ECRAN_AJOUTER_POTE_ANGLAIS } from "~/contenus/anglais/textes-ecran-ajouter-pote";

export const TEXTES_ECRAN_AJOUTER_POTE = {
  titre: "Ajouter un pote",
  sousTitre: "Plus on est de fous, plus on sauve de lieux.",
  tonQr: "Ton QR code",
  tonQrTexte: "Ton pote le scanne dans l'app (Potes, « Ajouter un pote »), et hop : vous êtes dans la même bande.",
  scanner: "Scanner un QR code",
  scannerTexte: "Ton pote te montre le sien (dans Potes, « Ajouter un pote ») : vise, c'est fait.",
  lienLibelle: "Ou colle le lien de ton pote",
  unInstant: "Un instant…",
  ajouterLien: "Ajouter avec ce lien",
  ajouterLienIndice: "Retrouve ton pote grâce à son lien et l'ajoute à ta bande",
  chercher: "Chercher un pseudo",
  chercherTexte: "Tu connais son @ ? Tape-le, on te dit si on le trouve.",
  rejoindreTitre: (pseudo: string) => `Rejoindre la bande de @${pseudo} ?`,
  demanderTitre: (pseudo: string) => `Demander @${pseudo} en pote ?`,
  rejoindreDetail:
    "Ce lien vient de l'extérieur de l'app. Dans une bande, vous voyez chacun la ville, les points et les lieux gardés de l'autre : rejoins seulement quelqu'un que tu connais.",
  demanderDetail: "Ce lien vient de l'extérieur de l'app. Une demande partira : cette personne pourra l'accepter ou non.",
  rejoindre: "Rejoindre sa bande",
  envoyerDemande: "Envoyer la demande",
  nonMerci: "Non merci",
  nonMerciIndice: "Rien ne part, tu restes sur cet écran",
} as const;

export const TEXTES_ECRAN_AJOUTER_POTE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECRAN_AJOUTER_POTE>> = { fr: TEXTES_ECRAN_AJOUTER_POTE, en: TEXTES_ECRAN_AJOUTER_POTE_ANGLAIS };
