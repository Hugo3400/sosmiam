import { Text } from "react-native";

import { EcranEtape } from "~/composants/inscription/EcranEtape";
import { utiliserBrouillonInscription } from "~/hooks/utiliser-brouillon-inscription";
import { utiliserProfil } from "~/hooks/utiliser-profil";

/** PROVISOIRE : fin de l'inscription, enregistre le profil (la garde de la racine bascule alors vers les onglets). */
export default function CEstPret() {
  const { brouillon } = utiliserBrouillonInscription();
  const { enregistrer } = utiliserProfil();
  return (
    <EcranEtape
      titre="C'est prêt !"
      etape={{ numero: 4, total: 4 }}
      boutonPrincipal={{
        libelle: "Découvrir SOS Miam",
        onPress: () =>
          enregistrer({
            prenom: brouillon.prenom || "Toi",
            nom: brouillon.nom || undefined,
            dateNaissance: brouillon.dateNaissance ?? "2000-01-01",
            ville: brouillon.ville ?? "Montpellier",
            envies: brouillon.envies,
            creeLe: new Date().toISOString(),
          }),
      }}
    >
      <Text className="font-texte text-base text-gris">Tes 3 rescousses t'attendent.</Text>
    </EcranEtape>
  );
}
