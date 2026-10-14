// Politique de confidentialité, section « Te connecter avec Apple ou Google sur le site » (article 13 du RGPD). Son id
// « connexion-apple-google » ne doit pas changer : « Finir ton inscription » y renvoie. Ce qui est vraiment fait :
// apps/site-web/src/services/connexion-externe.server.ts (site) et apps/api/src/controleurs/comptes-externes.ts (API).
import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionConnexionAppleGoogle: SectionLegale = {
  id: "connexion-apple-google",
  titre: "Te connecter avec Apple ou Google sur le site",
  blocs: [
    "Sur sosmiam.fr (« Mon compte »), dans l'espace ambassadeur et dans l'espace pro, tu peux te connecter avec « Continuer avec Apple » ou « Continuer avec Google ». Tu passes alors par la page d'Apple ou de Google, qui nous renvoie une attestation signée : **l'identifiant de ton compte Apple ou Google**, **ton adresse e-mail** (avec Apple, celle que tu choisis, adresse masquée comprise) et, si tu les partages, **ton prénom** (et ton nom). Notre serveur vérifie lui-même cette attestation ; on ne reçoit jamais ton mot de passe Apple ou Google, et ni Apple ni Google n'ajoutent de script ou de cookie dans nos pages.",
    "On garde l'identifiant Apple ou Google avec ton compte SOS Miam, pour te reconnaître la fois suivante. Si un compte a déjà la même adresse e-mail, il est relié à ton compte Apple ou Google (c'est toujours un seul compte). S'il n'y a pas encore de compte, on te demande ton prénom, ta date de naissance (dès 18 ans, gardée chiffrée), ta ville et ton accord avec les conditions d'utilisation, comme pour un compte créé dans l'app : tant que tu n'as pas fini, l'attestation reste seulement dans un cookie chiffré de 10 minutes, puis elle est oubliée. Ton compte suit ensuite les règles de [Ton compte ambassadeur](#compte-ambassadeur), sans mot de passe : pour le supprimer, tu confirmes en te reconnectant avec Apple ou Google.",
    "**Base légale** : l'exécution des [conditions d'utilisation](/cgu) que tu acceptes en créant ton compte (article 6.1.b du RGPD). Apple et Google traitent ta connexion chez eux selon leurs propres règles de confidentialité.",
  ],
};
