import { useState } from "react";

import { Onglets } from "~/composants/interface/Onglets.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { EditeurNewsletter } from "./EditeurNewsletter.tsx";
import { ListeInscrits } from "./ListeInscrits.tsx";

/** Newsletter : la liste des inscrits, et les newsletters en préparation. */
export function EcranNewsletter() {
  const [vue, setVue] = useState<"inscrits" | "redaction">("inscrits");
  return (
    <>
      <EnTeteEcran
        titre="Newsletter"
        sousTitre="Les inscrits du formulaire « Préviens-moi », et tes newsletters en préparation. L'envoi arrivera avec un prestataire d'e-mails (Brevo)."
        actions={<Onglets libelle="Partie" valeur={vue} onChange={setVue} options={[{ valeur: "inscrits", libelle: "Inscrits" }, { valeur: "redaction", libelle: "Rédaction" }]} />}
      />
      {vue === "inscrits" ? <ListeInscrits /> : <EditeurNewsletter />}
    </>
  );
}
