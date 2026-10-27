import { useEffect, useState } from "react";

import { IconeFiche } from "~/composants/lieux/IconeFiche";
import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/fiche-lieu";
import { utiliserJavascriptActif } from "~/hooks/utiliser-javascript-actif";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = { titre: string; adresse: string; className: string; classeIcone?: string };

type Etat = "repos" | "copie" | "echec";

const DUREE_MESSAGE_MS = 3000;

export function BoutonPartager({ titre, adresse, className, classeIcone }: Props) {
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE).actions;
  const javascriptActif = utiliserJavascriptActif();
  const [etat, changerEtat] = useState<Etat>("repos");

  useEffect(() => {
    if (etat === "repos") return;
    const minuteur = window.setTimeout(() => changerEtat("repos"), DUREE_MESSAGE_MS);
    return () => window.clearTimeout(minuteur);
  }, [etat]);

  if (!javascriptActif) return null;

  async function partager() {
    if (typeof navigator.share === "function") {
      await navigator.share({ title: titre, url: adresse }).catch(() => undefined);
      return;
    }
    try {
      await navigator.clipboard.writeText(adresse);
      changerEtat("copie");
    } catch {
      changerEtat("echec");
    }
  }

  return (
    <>
      <button type="button" onClick={() => void partager()} className={className}>
        <IconeFiche nom="partager" className={classeIcone} />
        {etat === "copie" ? T.copie : T.partager}
      </button>
      <span role="status" className="sr-only">{etat === "copie" ? T.lienCopie : etat === "echec" ? T.copieImpossible : ""}</span>
    </>
  );
}
