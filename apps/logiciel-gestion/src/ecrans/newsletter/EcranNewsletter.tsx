import { useState } from "react";

import { Onglets } from "~/composants/interface/Onglets.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { EditeurNewsletter } from "./EditeurNewsletter.tsx";
import { ListeInscrits } from "./ListeInscrits.tsx";
import { SuiviEnvois } from "./SuiviEnvois.tsx";

/** Newsletter : la liste des inscrits, la rédaction, et l'envoi (à qui on veut) avec son suivi. */
export function EcranNewsletter() {
  const [vue, setVue] = useState<"inscrits" | "redaction" | "envois">("inscrits");
  return (
    <>
      <EnTeteEcran
        titre="Newsletter"
        sousTitre="Les inscrits du formulaire « Préviens-moi », tes newsletters, et leur envoi depuis ta boîte bonjour@sosmiam.fr (aucun prestataire) : tu choisis à qui."
        actions={
          <Onglets
            libelle="Partie"
            valeur={vue}
            onChange={setVue}
            options={[{ valeur: "inscrits", libelle: "Inscrits" }, { valeur: "redaction", libelle: "Rédaction" }, { valeur: "envois", libelle: "Envois" }]}
          />
        }
      />
      {vue === "inscrits" && <ListeInscrits />}
      {vue === "redaction" && <EditeurNewsletter />}
      {vue === "envois" && <SuiviEnvois />}
    </>
  );
}
