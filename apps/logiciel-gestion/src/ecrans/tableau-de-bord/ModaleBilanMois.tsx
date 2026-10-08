import { Download, Printer } from "lucide-react";
import { useRef, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { creerHtmlBilan } from "~/fonctions/bilan/creer-html-bilan.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireBilanMois } from "~/services/statistiques.ts";
import { enregistrerFichier } from "~/services/systeme.ts";

/** Le mois à proposer : le mois dernier pendant les 5 premiers jours (le bilan d'un mois fini), sinon le mois en cours */
function moisParDefaut(maintenant = new Date()) {
  const date = maintenant.getDate() <= 5 ? new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1) : maintenant;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Le bilan d'un mois, à imprimer ou à enregistrer en PDF (« Microsoft Print to PDF »), ou en page HTML. */
export function ModaleBilanMois({ onFermer }: { onFermer: () => void }) {
  const [mois, setMois] = useState(moisParDefaut);
  const cadre = useRef<HTMLIFrameElement>(null);
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => lireBilanMois(mois), [mois]);
  const html = donnees ? creerHtmlBilan(donnees) : "";

  return (
    <Modale
      large
      titre="Bilan du mois"
      ouverte
      onFermer={onFermer}
      actions={
        <>
          <Bouton icone={Download} desactive={!donnees} onClick={() => enregistrerFichier(`bilan-sos-miam-${mois}.html`, html, "text/html")}>Enregistrer (page web)</Bouton>
          <Bouton variante="principal" icone={Printer} desactive={!donnees} onClick={() => cadre.current?.contentWindow?.print()}>Imprimer ou PDF</Bouton>
        </>
      }
    >
      <div className="grid gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <Champ libelle="Mois" type="month" valeur={mois} onChange={(valeur) => valeur && setMois(valeur)} className="w-48" />
          <p className="pb-2 text-[13px] text-gris">Pour un PDF : « Imprimer ou PDF », puis l'imprimante « Microsoft Print to PDF ».</p>
        </div>
        <MessageErreur erreur={erreur} reessayer={recharger} />
        {!donnees && chargement && <Chargement />}
        {donnees && <iframe ref={cadre} title="Aperçu du bilan" srcDoc={html} className="h-[60vh] w-full rounded-xl border border-ligne bg-white" />}
      </div>
    </Modale>
  );
}
