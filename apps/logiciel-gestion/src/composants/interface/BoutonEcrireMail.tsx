import { Mail } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { ModaleEcrireMail, type DestinataireEcrit } from "~/composants/interface/ModaleEcrireMail.tsx";
import type { CategorieReponse } from "~/services/reponses-types.ts";

type Props = { destinataire: DestinataireEcrit; categorie?: CategorieReponse; lieu?: string | null; objet?: string; libelle?: string; petit?: boolean };

/** « Écrire un mail » : le mail s'écrit et part depuis le logiciel (bonjour@sosmiam.fr), sans ouvrir la messagerie du PC. */
export function BoutonEcrireMail({ destinataire, categorie, lieu, objet, libelle = "Écrire un mail", petit = true }: Props) {
  const [ouverte, setOuverte] = useState(false);
  const [bilan, setBilan] = useState<string | null>(null);
  return (
    <>
      <Bouton petit={petit} icone={Mail} onClick={() => (setBilan(null), setOuverte(true))}>{libelle}</Bouton>
      {bilan && <span role="status" className="self-center text-[13px] font-semibold text-vert">{bilan}</span>}
      <ModaleEcrireMail ouverte={ouverte} onFermer={() => setOuverte(false)} destinataire={destinataire} categorie={categorie} lieu={lieu} objet={objet} onEnvoye={setBilan} />
    </>
  );
}
