import { Pencil, Target } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { fixerObjectif, type ObjectifMois } from "~/services/statistiques.ts";
import type { TableauDeBord } from "~/services/tableau-de-bord.ts";

const NOMS: Record<ObjectifMois["mesure"], string> = { visiteurs: "visiteurs", vues: "pages vues", inscriptions: "inscrits à la newsletter" };
const UN_JOUR = 86_400_000;

/** Objectif du mois : une jauge, où on en est, et où on finira à ce rythme. */
export function CarteObjectif({ objectif, onChange }: { objectif: TableauDeBord["objectif"]; onChange: () => void }) {
  const [edition, setEdition] = useState(false);
  const [mesure, setMesure] = useState<ObjectifMois["mesure"]>(objectif?.mesure ?? "visiteurs");
  const [valeur, setValeur] = useState(String(objectif?.valeur ?? 1000));
  const [enCours, setEnCours] = useState(false);

  async function enregistrer(nouveau: ObjectifMois | null) {
    setEnCours(true);
    await fixerObjectif(nouveau).catch(() => {});
    setEnCours(false);
    setEdition(false);
    onChange();
  }

  let contenu = <p className="text-sm text-gris">Pas d'objectif ce mois-ci. Un cap motive : 1 000 visiteurs ? 100 inscrits ?</p>;
  if (objectif?.mois) {
    const debut = new Date(`${objectif.mois.debut}T00:00:00`).getTime();
    const jours = Math.round((new Date(`${objectif.mois.fin}T00:00:00`).getTime() - debut) / UN_JOUR) + 1;
    const ecoules = Math.min(jours, Math.max(1, Math.ceil((Date.now() - debut) / UN_JOUR)));
    const part = Math.min(1, objectif.atteint / objectif.valeur);
    const projection = Math.round((objectif.atteint / ecoules) * jours);
    contenu = (
      <div className="grid gap-2">
        <p className="text-sm">
          <strong className="chiffres font-titre text-2xl">{formaterNombre(objectif.atteint)}</strong>
          <span className="text-gris"> / {formaterNombre(objectif.valeur)} {NOMS[objectif.mesure]}</span>
        </p>
        <div role="meter" aria-valuemin={0} aria-valuemax={objectif.valeur} aria-valuenow={objectif.atteint} aria-label="Objectif du mois" className="h-3 rounded-full bg-[#FDE8E4]">
          <div className="h-full rounded-full bg-graphique" style={{ width: `${Math.max(2, part * 100)}%` }} />
        </div>
        <p className="text-[13px] text-gris">
          {part >= 1 ? "Objectif atteint, bravo 🎉 " : `${Math.round(part * 100)} % · `}
          {jours - ecoules > 0 ? `il reste ${jours - ecoules} jour(s). ` : "dernier jour. "}
          À ce rythme : <strong className="text-encre">{formaterNombre(projection)}</strong> à la fin du mois.
        </p>
      </div>
    );
  }

  return (
    <Carte
      titre={<span className="flex items-center gap-2"><Target className="size-4" aria-hidden /> Objectif du mois</span>}
      actions={<Bouton petit variante="discret" icone={Pencil} onClick={() => setEdition(true)}>{objectif ? "Modifier" : "Fixer"}</Bouton>}
    >
      {contenu}
      <Modale
        titre="Objectif du mois"
        ouverte={edition}
        onFermer={() => setEdition(false)}
        actions={
          <>
            {objectif && <Bouton variante="discret" onClick={() => enregistrer(null)}>Retirer l'objectif</Bouton>}
            <Bouton variante="principal" chargement={enCours} desactive={!(Number(valeur) > 0)} onClick={() => enregistrer({ mesure, valeur: Math.round(Number(valeur)) })}>
              Enregistrer
            </Bouton>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Selecteur
            libelle="Ce qu'on compte"
            valeur={mesure}
            onChange={setMesure}
            options={[{ valeur: "visiteurs", libelle: "Visiteurs du site" }, { valeur: "vues", libelle: "Pages vues" }, { valeur: "inscriptions", libelle: "Inscrits à la newsletter" }]}
          />
          <Champ libelle="Objectif" inputMode="numeric" valeur={valeur} onChange={setValeur} />
        </div>
        <p className="mt-3 text-sm text-gris">L'objectif vaut pour chaque mois, jusqu'à ce que tu le changes.</p>
      </Modale>
    </Carte>
  );
}
