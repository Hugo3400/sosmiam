import { Radio } from "lucide-react";
import { useEffect, useState } from "react";

import { Carte } from "~/composants/interface/Carte.tsx";
import { ListeClassement } from "~/composants/interface/ListeClassement.tsx";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { lireEnDirect, type EnDirect } from "~/services/statistiques.ts";

/** « En ce moment » : visites actives depuis 5 minutes et ce qu'elles regardent, mis à jour toutes les 30 secondes. */
export function CarteEnDirect() {
  const [direct, setDirect] = useState<EnDirect | null>(null);
  useEffect(() => {
    let actif = true;
    const lire = () => lireEnDirect().then((d) => actif && setDirect(d), () => {});
    void lire();
    const minuteur = setInterval(lire, 30_000);
    return () => {
      actif = false;
      clearInterval(minuteur);
    };
  }, []);

  return (
    <Carte titre={<span className="flex items-center gap-2"><Radio className={`size-4 ${direct?.visites ? "animate-pulse text-tomate" : ""}`} aria-hidden /> En ce moment</span>}>
      <p className="chiffres font-titre text-4xl font-extrabold">{direct ? formaterNombre(direct.visites) : "…"}</p>
      <p className="mb-3 text-sm text-gris">{direct?.visites === 1 ? "personne sur le site (5 dernières minutes)" : "personnes sur le site (5 dernières minutes)"}</p>
      {direct && direct.pages.length > 0 && <ListeClassement elements={direct.pages} maximum={5} />}
    </Carte>
  );
}
