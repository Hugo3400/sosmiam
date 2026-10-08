import { Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { modifierBigSos, type FicheBigSos, type LienBigSos } from "~/services/big-sos.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { ouvrirLien } from "~/services/systeme.ts";
import { JaugeObjectif } from "./JaugeObjectif.tsx";

/** L'objectif de mobilisation (libre, mis à jour à la main tant que l'app ne compte pas toute seule) et les liens. */
export function ObjectifEtLiensBigSos({ bigSos, onChange }: { bigSos: FicheBigSos; onChange: () => void }) {
  const [titre, setTitre] = useState(bigSos.objectifTitre ?? "");
  const [cible, setCible] = useState(bigSos.objectifCible ? String(bigSos.objectifCible) : "");
  const [atteint, setAtteint] = useState(String(bigSos.objectifAtteint));
  const [liens, setLiens] = useState<LienBigSos[]>(bigSos.liens);
  const [nouveau, setNouveau] = useState<LienBigSos>({ titre: "", adresse: "https://" });
  const [etat, setEtat] = useState<{ enCours: boolean; texte: string | null }>({ enCours: false, texte: null });

  async function enregistrer(listeLiens = liens) {
    setEtat({ enCours: true, texte: null });
    try {
      await modifierBigSos(bigSos.id, {
        objectifTitre: titre.trim() || null,
        objectifCible: cible ? Number(cible) : null,
        objectifAtteint: Number(atteint) || 0,
        liens: listeLiens,
      });
      setEtat({ enCours: false, texte: "Enregistré ✅" });
      onChange();
    } catch (probleme) {
      const erreur = probleme instanceof ErreurApi ? probleme : null;
      setEtat({ enCours: false, texte: erreur?.champ === "liens" ? "Un lien ne va pas : un titre, et une adresse en https://." : expliquerErreur(erreur) });
    }
  }
  function ajouterLien() {
    const liste = [...liens, { titre: nouveau.titre.trim(), adresse: nouveau.adresse.trim() }];
    setLiens(liste);
    setNouveau({ titre: "", adresse: "https://" });
    void enregistrer(liste);
  }
  function retirerLien(index: number) {
    const liste = liens.filter((_, i) => i !== index);
    setLiens(liste);
    void enregistrer(liste);
  }

  return (
    <section className="grid gap-4">
      <div className="grid gap-3">
        <h3 className="font-extrabold">Objectif de mobilisation</h3>
        <JaugeObjectif titre={titre || null} cible={Number(cible) || null} atteint={Number(atteint) || 0} />
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem_8rem]">
          <Champ libelle="Ce qu'on compte" valeur={titre} onChange={setTitre} maxLength={100} placeholder="Visites pendant la semaine" className="w-full min-w-0" />
          <Champ libelle="Objectif" type="number" min={1} valeur={cible} onChange={setCible} className="w-full min-w-0" />
          <Champ libelle="Atteint" type="number" min={0} valeur={atteint} onChange={setAtteint} className="w-full min-w-0" />
        </div>
        <div className="flex items-center gap-3">
          <Bouton petit icone={Save} chargement={etat.enCours} onClick={() => enregistrer()}>Enregistrer l'objectif</Bouton>
          {etat.texte && <p role="status" className="text-sm font-semibold">{etat.texte}</p>}
        </div>
        <p className="text-[13px] text-gris">Pour l'instant, c'est toi qui fais avancer la jauge. Avec l'app, les visites validées et les rescousses pourront la remplir toutes seules.</p>
      </div>
      <div className="grid gap-3">
        <h3 className="font-extrabold">Vidéos et liens</h3>
        {liens.length === 0 ? <p className="text-sm text-gris">Les vidéos des créateurs et les liens utiles (réservation, cagnotte du lieu…) apparaîtront sur la page.</p> : (
          <ul className="grid gap-1 text-sm">
            {liens.map((lien, i) => (
              <li key={`${lien.adresse}-${i}`} className="flex items-center gap-2">
                <button type="button" className="min-w-0 flex-1 truncate text-left font-semibold hover:underline" onClick={() => ouvrirLien(lien.adresse)}>{lien.titre}</button>
                <span className="min-w-0 flex-1 truncate text-gris">{lien.adresse}</span>
                <Bouton petit variante="discret" icone={Trash2} titre={`Retirer ${lien.titre}`} onClick={() => retirerLien(i)} />
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] md:items-end">
          <Champ libelle="Titre" valeur={nouveau.titre} onChange={(t) => setNouveau({ ...nouveau, titre: t })} maxLength={80} placeholder="La vidéo de @miam.lyon" className="w-full min-w-0" />
          <Champ libelle="Adresse" valeur={nouveau.adresse} onChange={(a) => setNouveau({ ...nouveau, adresse: a })} className="w-full min-w-0" />
          <Bouton icone={Plus} desactive={!nouveau.titre.trim() || !/^https:\/\/\S+\.\S+/.test(nouveau.adresse.trim()) || liens.length >= 10} onClick={ajouterLien}>Ajouter</Bouton>
        </div>
      </div>
    </section>
  );
}
