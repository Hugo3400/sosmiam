import { useBottomTabBarHeight } from "expo-router/tabs";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { BoueesSemaine } from "~/composants/profil/BoueesSemaine";
import { CartePalier } from "~/composants/profil/CartePalier";
import { ChiffresProfil } from "~/composants/profil/ChiffresProfil";
import { CollectionsProfil } from "~/composants/profil/CollectionsProfil";
import { EnTeteProfil } from "~/composants/profil/EnTeteProfil";
import { GrilleBadges } from "~/composants/profil/GrilleBadges";
import { ListeDefis } from "~/composants/profil/ListeDefis";
import { badges } from "~/contenus/badges";
import type { MesuresActivite } from "~/contenus/type-mesure-activite";
import { calculerPointsLocaux } from "~/fonctions/ambassadeur/calculer-points-locaux";
import { listerBadgesObtenus } from "~/fonctions/ambassadeur/lister-badges-obtenus";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import couleurs from "~/theme/couleurs";

/** Onglet « Profil » : toi, ton palier Ambassadeur, tes bouées de la semaine, tes défis, tes badges et tes adresses. Tout est compté sur ce téléphone. */
export default function Profil() {
  const { profil, avatar } = utiliserProfil();
  const activite = utiliserActivite();
  // La barre d'onglets est posée par-dessus l'écran : la fin de la page passe au-dessus
  const hauteurBarreOnglets = useBottomTabBarHeight();
  if (!profil) return null;

  const age = calculerAge(profil.dateNaissance);
  const mesures: MesuresActivite = { rescousses: activite.rescoussesDonnees, "premiers-sauvetages": activite.premiersSauvetages.length };
  const obtenus = listerBadgesObtenus(mesures);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 px-5 pt-4" contentContainerStyle={{ paddingBottom: hauteurBarreOnglets + 24 }}>
        <EnTeteProfil profil={profil} avatar={avatar} age={age} />
        <CartePalier points={calculerPointsLocaux(mesures)} />
        <BoueesSemaine restantes={activite.restantes} />
        <ChiffresProfil
          lieuxSauves={activite.lieuxSauves.length}
          lieuxDeniches={activite.premiersSauvetages.length}
          badgesObtenus={obtenus.length}
          badgesTotal={badges.length}
        />
        <ListeDefis mesures={mesures} />
        <GrilleBadges obtenus={obtenus} />
        <CollectionsProfil gardes={activite.gardes} jaimes={activite.jaimes} age={age} />
      </ScrollView>
    </SafeAreaView>
  );
}
