import "../global.css";

import { BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

import { FournisseurActivite } from "~/composants/fil/FournisseurActivite";
import { FournisseurCommunaute } from "~/composants/potes/FournisseurCommunaute";
import { PileRacine } from "~/composants/navigation/PileRacine";
import { FournisseurProfil } from "~/composants/profil/FournisseurProfil";

// L'écran de démarrage reste visible jusqu'à ce que tout soit prêt (voir PileRacine)
SplashScreen.preventAutoHideAsync();

/** Racine de l'app : polices de la marque, profil et activité (rescousses, lieux gardés), puis la pile d'écrans. */
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
      {/* En cas d'échec des polices, on démarre quand même avec celles du système */}
      <FournisseurActivite>
        <FournisseurCommunaute>
          <PileRacine policesChargees={policesChargees || erreurPolices !== null} />
        </FournisseurCommunaute>
      </FournisseurActivite>
    </FournisseurProfil>
  );
}
