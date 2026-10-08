import { Plus, Search } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { CaseACocher } from "~/composants/interface/CaseACocher.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { STATUTS_LIEU } from "~/contenus/statuts-lieu.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerLieux, type StatutLieu } from "~/services/lieux.ts";
import { BarreSelectionLieux } from "./BarreSelectionLieux.tsx";
import { CarteLieu } from "./CarteLieu.tsx";
import { FormulaireLieu } from "./FormulaireLieu.tsx";

/** Les fiches des lieux : liste, recherche, sélection de plusieurs fiches, et la fiche complète à créer ou modifier. */
export function EcranLieux() {
  const [statut, setStatut] = useState<StatutLieu | "">("");
  const [saisie, setSaisie] = useState("");
  const [recherche, setRecherche] = useState("");
  const [ouvert, setOuvert] = useState<number | "nouveau" | null>(null);
  const [choisis, setChoisis] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const dernierCoche = useRef<number | null>(null);
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => listerLieux(recherche, statut), [recherche, statut]);
  const lieux = donnees ?? [];

  useEffect(() => {
    const minuteur = setTimeout(() => setRecherche(saisie), 300);
    return () => clearTimeout(minuteur);
  }, [saisie]);
  // La sélection ne garde que les lieux encore affichés (après un filtre ou une suppression)
  useEffect(() => {
    setChoisis((avant) => new Set([...avant].filter((id) => lieux.some((lieu) => lieu.id === id))));
  }, [donnees]);
  // Échap : tout désélectionner
  useEffect(() => {
    const touche = (evenement: KeyboardEvent) => evenement.key === "Escape" && !document.querySelector("dialog[open]") && setChoisis(new Set());
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, []);

  /** Coche ou décoche un lieu ; Maj + clic coche toute la plage depuis le dernier lieu coché. */
  function cocher(id: number, evenement: MouseEvent) {
    const index = lieux.findIndex((lieu) => lieu.id === id);
    const depuis = lieux.findIndex((lieu) => lieu.id === dernierCoche.current);
    setChoisis((avant) => {
      const suivant = new Set(avant);
      if (evenement.shiftKey && depuis >= 0) {
        for (const lieu of lieux.slice(Math.min(depuis, index), Math.max(depuis, index) + 1)) suivant.add(lieu.id);
      } else if (suivant.has(id)) suivant.delete(id);
      else suivant.add(id);
      return suivant;
    });
    dernierCoche.current = id;
  }

  if (ouvert !== null) {
    return <FormulaireLieu id={ouvert === "nouveau" ? null : ouvert} onFermer={() => { setOuvert(null); recharger(); }} />;
  }
  const tousChoisis = lieux.length > 0 && lieux.every((lieu) => choisis.has(lieu.id));
  return (
    <>
      <EnTeteEcran
        titre="Lieux"
        sousTitre="Les fiches des restos, pâtisseries, bars et sorties. Seuls les lieux « En ligne » seront montrés dans l'app."
        actions={<Bouton variante="principal" icone={Plus} onClick={() => setOuvert("nouveau")}>Nouveau lieu</Bouton>}
      />
      <div className="mb-5 flex flex-wrap items-end gap-4">
        <Champ libelle={<span className="inline-flex items-center gap-1"><Search className="size-3.5" aria-hidden /> Recherche</span>} valeur={saisie} onChange={setSaisie} placeholder="Nom, ville, quartier…" className="w-72" />
        <Onglets
          libelle="Statut"
          valeur={statut}
          onChange={setStatut}
          options={[{ valeur: "", libelle: "Tous" }, ...Object.entries(STATUTS_LIEU).map(([valeur, { libelle }]) => ({ valeur: valeur as StatutLieu, libelle }))]}
        />
        {lieux.length > 0 && (
          <div className="ml-auto pb-2">
            <CaseACocher
              libelle={tousChoisis ? "Tout désélectionner" : `Tout sélectionner (${lieux.length})`}
              coche={tousChoisis}
              onChange={(coche) => setChoisis(coche ? new Set(lieux.map((lieu) => lieu.id)) : new Set())}
            />
          </div>
        )}
      </div>
      {message && <p role="status" className="mb-4 rounded-xl bg-vert-clair px-4 py-2 text-sm font-semibold text-vert">{message}</p>}
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees && lieux.length === 0 && (
        <Carte>
          <EtatVide emoji="🏪" titre={recherche || statut ? "Aucun lieu ne correspond" : "Pas encore de lieu"} action={<Bouton variante="principal" icone={Plus} onClick={() => setOuvert("nouveau")}>Créer le premier</Bouton>}>
            Chaque fiche décrit un lieu indépendant : son histoire, son plat signature, ses horaires. Les publications du fil s'y rattachent.
          </EtatVide>
        </Carte>
      )}
      {lieux.length > 0 && (
        <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {lieux.map((lieu) => (
            <li key={lieu.id}>
              <CarteLieu
                lieu={lieu}
                choisi={choisis.has(lieu.id)}
                enSelection={choisis.size > 0}
                onCocher={(evenement) => cocher(lieu.id, evenement)}
                onOuvrir={() => setOuvert(lieu.id)}
              />
            </li>
          ))}
        </ul>
      )}
      {choisis.size > 0 && (
        <BarreSelectionLieux
          choisis={lieux.filter((lieu) => choisis.has(lieu.id))}
          onVider={() => setChoisis(new Set())}
          onFait={(texte) => {
            setMessage(texte);
            setChoisis(new Set());
            recharger();
          }}
        />
      )}
    </>
  );
}
