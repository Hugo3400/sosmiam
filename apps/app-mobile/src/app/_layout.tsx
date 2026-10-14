import "../global.css";

import { BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

import { FournisseurSession } from "~/composants/compte/FournisseurSession";
import { FournisseurLieux } from "~/composants/contenu/FournisseurLieux";
import { FournisseurActivite } from "~/composants/fil/FournisseurActivite";
import { FournisseurPublications } from "~/composants/fil/FournisseurPublications";
import { FournisseurInvite } from "~/composants/invite/FournisseurInvite";
import { FournisseurModes } from "~/composants/modes/FournisseurModes";
import { FournisseurNotifications } from "~/composants/notifications/FournisseurNotifications";
import { FournisseurCommunaute } from "~/composants/potes/FournisseurCommunaute";
import { FournisseurConversations } from "~/composants/potes/FournisseurConversations";
import { PileRacine } from "~/composants/navigation/PileRacine";
import { FournisseurProfil } from "~/composants/profil/FournisseurProfil";
import { FournisseurServices } from "~/composants/services/FournisseurServices";
import { FournisseurPoulsSocial } from "~/composants/social/FournisseurPoulsSocial";
import { FournisseurSuivisPersonnes } from "~/composants/suivi/FournisseurSuivisPersonnes";
import { FournisseurVisites } from "~/composants/visites/FournisseurVisites";

// L'écran de démarrage reste visible jusqu'à ce que tout soit prêt (voir PileRacine)
SplashScreen.preventAutoHideAsync();

/**
 * Racine de l'app : polices de la marque, profil (ou visite sans compte), activité (rescousses, lieux gardés), modes (perso, pro,
 * ambassadeur), services et visites (addition, fidélité, réservations, avis), pouls social, communauté, notifications et suivis
 * entre personnes, puis la pile d'écrans.
 */
export default function RacineApp() {
  const [policesChargees, erreurPolices] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  return (
    // La session du compte (jeton du coffre-fort, compte relu sur le serveur) : au-dessus de tout ce qui s'en sert
    <FournisseurSession>
    <FournisseurProfil>
      {/* L'activité (rescousses, lieux gardés, J'aime, suivis) : celle de la démo sur le téléphone, sinon celle du compte sur
          l'API. Au-dessus du fil, qui ne compte pas ton J'aime deux fois (le compteur de l'API le compte déjà) */}
      <FournisseurActivite>
      {/* Les lieux (exemples en démo, sinon le serveur) : sous le profil, pour les distances depuis ta ville */}
      <FournisseurLieux>
      {/* Le fil (exemples en démo, sinon le serveur) : vignettes, profils et notifications s'en servent aussi */}
      <FournisseurPublications>
      {/* Visite sans compte : la feuille « Crée ton compte » des gestes réservés aux inscrits */}
      <FournisseurInvite>
        {/* En cas d'échec des polices, on démarre quand même avec celles du système */}
        {/* Modes (perso, pro, ambassadeur), puis les services des visites, qui relisent tes rôles, puis tes visites */}
        <FournisseurModes>
          <FournisseurServices>
            <FournisseurVisites>
              {/* Le pouls de la partie sociale (compte connecté, app ouverte) : dit aux potes, messages et cloche quoi relire */}
              <FournisseurPoulsSocial>
              <FournisseurCommunaute>
                {/* Notifications de l'app (cloche), puis abonnés et abonnements entre personnes, qui en ajoutent */}
                <FournisseurNotifications>
                  <FournisseurSuivisPersonnes>
                    <FournisseurConversations>
                      <PileRacine policesChargees={policesChargees || erreurPolices !== null} />
                    </FournisseurConversations>
                  </FournisseurSuivisPersonnes>
                </FournisseurNotifications>
              </FournisseurCommunaute>
              </FournisseurPoulsSocial>
            </FournisseurVisites>
          </FournisseurServices>
        </FournisseurModes>
      </FournisseurInvite>
      </FournisseurPublications>
      </FournisseurLieux>
      </FournisseurActivite>
    </FournisseurProfil>
    </FournisseurSession>
  );
}
