import "../global.css";

import { BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

import { FournisseurActivite } from "~/composants/fil/FournisseurActivite";
import { FournisseurInvite } from "~/composants/invite/FournisseurInvite";
import { FournisseurModes } from "~/composants/modes/FournisseurModes";
import { FournisseurNotifications } from "~/composants/notifications/FournisseurNotifications";
import { FournisseurCommunaute } from "~/composants/potes/FournisseurCommunaute";
import { FournisseurConversations } from "~/composants/potes/FournisseurConversations";
import { PileRacine } from "~/composants/navigation/PileRacine";
import { FournisseurProfil } from "~/composants/profil/FournisseurProfil";
import { FournisseurServices } from "~/composants/services/FournisseurServices";
import { FournisseurSuivisPersonnes } from "~/composants/suivi/FournisseurSuivisPersonnes";
import { FournisseurVisites } from "~/composants/visites/FournisseurVisites";

// L'écran de démarrage reste visible jusqu'à ce que tout soit prêt (voir PileRacine)
SplashScreen.preventAutoHideAsync();

/**
 * Racine de l'app : polices de la marque, profil (ou visite sans compte), activité (rescousses, lieux gardés), modes (perso, pro,
 * ambassadeur), services et visites (addition, fidélité, réservations, avis), communauté, notifications et suivis entre personnes,
 * puis la pile d'écrans.
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
    <FournisseurProfil>
      {/* Visite sans compte : la feuille « Crée ton compte » des gestes réservés aux inscrits */}
      <FournisseurInvite>
        {/* En cas d'échec des polices, on démarre quand même avec celles du système */}
        <FournisseurActivite>
          {/* Modes (perso, pro, ambassadeur), puis les services des visites, qui relisent tes rôles, puis tes visites */}
          <FournisseurModes>
            <FournisseurServices>
              <FournisseurVisites>
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
              </FournisseurVisites>
            </FournisseurServices>
          </FournisseurModes>
        </FournisseurActivite>
      </FournisseurInvite>
    </FournisseurProfil>
  );
}
