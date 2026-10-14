import { Download, FileText } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { formaterOctets } from "~/fonctions/texte/formater-octets.ts";
import { lireFichierPresse, type FichierPresse } from "~/services/presse.ts";

type Props = { fichier: FichierPresse; onEnregistrer: (id: string, nom: string) => void; onAgrandir: (adresse: string) => void };

/** Un visuel ou un document : son aperçu (chargé à l'affichage), son format, sa taille, et « Enregistrer ». */
export function CarteFichierPresse({ fichier, onEnregistrer, onAgrandir }: Props) {
  const [apercu, setApercu] = useState<string | null>(null);
  useEffect(() => {
    if (!fichier.apercu) return;
    let adresse: string | null = null;
    let annule = false;
    lireFichierPresse(fichier.apercu).then((blob) => {
      if (annule) return;
      adresse = URL.createObjectURL(blob);
      setApercu(adresse);
    }, () => {});
    return () => {
      annule = true;
      if (adresse) URL.revokeObjectURL(adresse);
    };
  }, [fichier.apercu]);

  return (
    <li className="flex flex-col gap-2 rounded-carte border border-ligne bg-white p-3">
      <button
        type="button"
        onClick={() => apercu && onAgrandir(apercu)}
        className="grid aspect-[4/5] place-items-center overflow-hidden rounded-xl bg-creme"
        aria-label={`Agrandir ${fichier.nom}`}
      >
        {apercu ? <img src={apercu} alt="" className="size-full object-contain" /> : <FileText className="size-10 text-gris" aria-hidden />}
      </button>
      <p className="truncate text-sm font-semibold" title={fichier.nom}>{fichier.nom}</p>
      {fichier.description && <p className="line-clamp-2 text-[13px] text-gris" title={fichier.description}>{fichier.description}</p>}
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge ton="contour">{fichier.format}</Badge>
        {fichier.dimensions && <Badge>{fichier.dimensions}</Badge>}
        <span className="text-xs text-gris">{formaterOctets(fichier.octets)}</span>
      </div>
      <div className="mt-auto grid pt-1"><Bouton petit icone={Download} onClick={() => onEnregistrer(fichier.id, fichier.nom)}>Enregistrer</Bouton></div>
    </li>
  );
}
