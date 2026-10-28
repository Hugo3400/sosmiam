import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_REGLAGES_COMPTE_ANGLAIS } from "~/contenus/anglais/textes-reglages-compte";

export const TEXTES_REGLAGES_COMPTE = {
  titre: "Mon compte",
  sousTitreSansEmail: "Ton compte SOS Miam",
  confirmationRefusee: "🛑 Confirmation refusée",
  motDePasseChange: "C'est fait : ton nouveau mot de passe est en place, et tes autres appareils sont déconnectés.",
  unInstant: "Un instant…",
  changer: {
    titre: "Changer mon mot de passe",
    sousTitre: "Tes autres appareils seront déconnectés, celui-ci reste connecté.",
    bouton: "Changer mon mot de passe",
    actuel: "Mot de passe actuel",
    nouveau: "Nouveau mot de passe",
    aide: (min: number) => `${min} caractères au moins. Une petite phrase, c'est parfait.`,
    finalementNon: "Finalement non",
  },
  supprimer: {
    titre: "Supprimer mon compte",
    sousTitre: "Tout part, pour de bon : ton profil, tes points, tes visites, tes cartes de fidélité, tes avis et tes messages.",
    intro: "On sera tristes de te voir partir. Pour confirmer que c'est bien toi, une dernière vérification :",
    tonMotDePasse: "Ton mot de passe",
    unInstant: "Un instant…",
    bouton: "Supprimer mon compte",
    confirmerApple: "Confirmer avec Apple",
    confirmerGoogle: "Confirmer avec Google",
    lienEnvoye: "Lien envoyé !",
    ajouterMotDePasse: "Ajouter un mot de passe",
    clesRatees: (lectureRatee: string) => `${lectureRatee} : sans elles, pas moyen de confirmer.`,
    clesEnCours: "On charge tes clés…",
    reessayer: "Réessayer",
    jeReste: "Je reste",
  },
  email: {
    titre: "Ton e-mail",
    confirme: "E-mail confirmé",
    lienEnvoye: "Lien envoyé !",
    aConfirmer: "Confirme ton e-mail",
    lienEnvoyeDetail: "Regarde ta boîte (et les indésirables), puis reviens ici",
    aConfirmerDetail: "Il faut un e-mail confirmé pour valider tes visites. Touche pour recevoir le lien.",
  },
  connexion: {
    titre: "Connexion",
    appareil: "Connecter un appareil",
    appareilDetail: "Ton ordinateur ou un nouveau téléphone, en scannant son QR code",
    deconnecter: "Me déconnecter",
    deconnecterDetail: "Ton compte t'attend : reconnecte-toi quand tu veux",
    partout: "Me déconnecter partout",
    partoutDetail: "Sur tous tes appareils, celui-ci compris",
  },
  zoneSensible: "Zone sensible",
  supprimerDetail: "Tout part, pour de bon",
  feuille: {
    titrePartout: "Te déconnecter partout ?",
    titre: "Te déconnecter ?",
    detailPartout: "Tous tes appareils devront se reconnecter, celui-ci compris. Pratique si tu as perdu un téléphone.",
    detail: "Ce téléphone oublie ton compte et ce qu'il gardait. Tout est sur le serveur : reconnecte-toi quand tu veux.",
    jeReste: "Je reste",
  },
} as const;

export const TEXTES_REGLAGES_COMPTE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_REGLAGES_COMPTE>> = { fr: TEXTES_REGLAGES_COMPTE, en: TEXTES_REGLAGES_COMPTE_ANGLAIS };
