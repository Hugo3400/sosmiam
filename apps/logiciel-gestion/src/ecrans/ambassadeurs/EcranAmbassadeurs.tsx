import { useState } from "react";

import { Carte } from "~/composants/interface/Carte.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { ListeCandidats } from "./ListeCandidats.tsx";

/** Les ambassadeurs : leurs comptes (espace ambassadeur.sosmiam.fr) et les candidats venus de la newsletter. */
export function EcranAmbassadeurs() {
  const [vue, setVue] = useState<"comptes" | "candidats">("candidats");
  return (
    <>
      <EnTeteEcran
        titre="Ambassadeurs"
        sousTitre="Les passionnés qui font découvrir les pépites de leur ville. Chaque inscription à l'espace ambassadeur est validée ici."
        actions={<Onglets libelle="Partie" valeur={vue} onChange={setVue} options={[{ valeur: "comptes", libelle: "Comptes" }, { valeur: "candidats", libelle: "Candidats" }]} />}
      />
      {vue === "candidats" ? (
        <ListeCandidats />
      ) : (
        <Carte>
          <EtatVide emoji="🛟" titre="Les comptes arrivent avec l'espace ambassadeur">
            Dès que l'espace ambassadeur.sosmiam.fr sera ouvert : inscriptions à valider, paliers et points, badges, candidatures fondateur,
            missions, messages, classement et couverture des villes.
          </EtatVide>
        </Carte>
      )}
    </>
  );
}
