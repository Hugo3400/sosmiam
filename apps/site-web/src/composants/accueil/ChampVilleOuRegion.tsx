import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { groupesLieux, type Lieu } from "~/contenus/villes";
import { filtrerLieux } from "~/fonctions/texte/filtrer-lieux";

type Props = {
  id: string;
  name: string;
  /** Classes du bloc (taille dans le formulaire) */
  className?: string;
  /** Classes du champ lui-même (bordure, arrondi…) */
  classeChamp: string;
};

/**
 * Champ libre « Ta ville ou ta région », avec une liste de suggestions dessinée par le site (et non par le navigateur) :
 * les grandes villes de chaque région. Modèle « combobox » des recommandations ARIA : les flèches parcourent la liste,
 * Entrée choisit, Échap ferme. On peut aussi garder ce qu'on a tapé. Sans JavaScript, c'est un simple champ texte.
 */
export function ChampVilleOuRegion({ id, name, className = "", classeChamp }: Props) {
  const [saisie, setSaisie] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState<string | null>(null);
  const champ = useRef<HTMLInputElement>(null);
  const idListe = `${id}-suggestions`;
  const idOption = (lieu: string) => `${id}-${lieu}`;

  const groupes = useMemo(() => filtrerLieux(saisie, groupesLieux), [saisie]);
  const options = useMemo(() => groupes.flatMap((groupe) => groupe.lieux), [groupes]);
  const visible = ouvert && options.length > 0;

  // Après une inscription réussie, le formulaire est vidé (form.reset()) : le champ aussi
  useEffect(() => {
    const formulaire = champ.current?.form;
    if (!formulaire) return;
    const vider = () => {
      setSaisie("");
      setOuvert(false);
      setActif(null);
    };
    formulaire.addEventListener("reset", vider);
    return () => formulaire.removeEventListener("reset", vider);
  }, []);

  // L'option surlignée au clavier reste visible dans la liste
  useEffect(() => {
    if (actif) document.getElementById(idOption(actif))?.scrollIntoView({ block: "nearest" });
  }, [actif]);

  function fermer() {
    setOuvert(false);
    setActif(null);
  }

  function choisir(lieu: Lieu) {
    setSaisie(lieu.valeur);
    fermer();
  }

  function deplacer(sens: 1 | -1) {
    if (options.length === 0) return;
    const position = options.findIndex((option) => option.id === actif);
    const suivante = position === -1 ? (sens === 1 ? 0 : options.length - 1) : Math.min(options.length - 1, Math.max(0, position + sens));
    setActif(options[suivante].id);
  }

  function auClavier(evenement: KeyboardEvent<HTMLInputElement>) {
    if (evenement.key === "ArrowDown" || evenement.key === "ArrowUp") {
      evenement.preventDefault();
      setOuvert(true);
      // Alt + flèche bas ouvre la liste sans rien surligner
      if (!(evenement.altKey && evenement.key === "ArrowDown")) deplacer(evenement.key === "ArrowDown" ? 1 : -1);
    } else if (evenement.key === "Enter") {
      const lieu = visible ? options.find((option) => option.id === actif) : undefined;
      // Une suggestion surlignée : on la choisit (sinon, Entrée envoie le formulaire comme d'habitude)
      if (lieu) {
        evenement.preventDefault();
        choisir(lieu);
      }
    } else if (evenement.key === "Escape" && visible) {
      evenement.preventDefault();
      fermer();
    } else if (evenement.key === "Tab") {
      fermer();
    }
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={champ}
        id={id}
        name={name}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={visible}
        aria-controls={idListe}
        aria-activedescendant={visible && actif ? idOption(actif) : undefined}
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        placeholder="Ta ville ou ta région"
        maxLength={80}
        value={saisie}
        onChange={(evenement) => {
          setSaisie(evenement.target.value);
          setOuvert(true);
          setActif(null);
        }}
        onFocus={() => setOuvert(true)}
        onClick={() => setOuvert(true)}
        onBlur={fermer}
        onKeyDown={auClavier}
        className={`w-full ${classeChamp}`}
      />

      {/* mousedown bloqué : cliquer dans la liste (ou sur sa barre de défilement) ne retire pas le focus du champ */}
      <div
        id={idListe}
        role="listbox"
        aria-label="Villes et régions proposées"
        hidden={!visible}
        onMouseDown={(evenement) => evenement.preventDefault()}
        className="absolute top-full left-0 z-30 mt-2 max-h-[min(20rem,50vh)] w-full overflow-y-auto sm:min-w-[18rem] overscroll-contain rounded-2xl border-2 border-encre bg-white py-1.5 text-left shadow-brut"
      >
        {visible && groupes.map((groupe, position) => (
          <div key={groupe.region} role="group" aria-labelledby={`${idListe}-groupe-${position}`}>
            <div role="presentation" id={`${idListe}-groupe-${position}`}
              className="flex items-center gap-2 px-4 pt-2.5 pb-1 text-xs font-bold tracking-wide text-gris uppercase">
              {groupe.region}
              {groupe.lancement && (
                <span className="rounded-full bg-jaune px-2 py-0.5 text-[.7rem] tracking-normal text-encre normal-case">On commence ici</span>
              )}
            </div>
            {groupe.lieux.map((lieu) => (
              <div
                key={lieu.id}
                id={idOption(lieu.id)}
                role="option"
                aria-selected={actif === lieu.id}
                onClick={() => choisir(lieu)}
                onMouseMove={() => actif !== lieu.id && setActif(lieu.id)}
                className={`flex cursor-pointer items-baseline justify-between gap-3 px-4 py-2 ${actif === lieu.id ? "bg-jaune-clair" : ""}`}
              >
                <span className="font-semibold text-encre">{lieu.nom}</span>
                {lieu.type !== "ville" && (
                  <span className="shrink-0 text-sm text-gris">{lieu.type === "region" ? "toute la région" : "tout le département"}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Pour les lecteurs d'écran : combien de suggestions correspondent à la frappe */}
      <p className="sr-only" aria-live="polite">
        {ouvert && saisie.trim() !== ""
          ? options.length > 0
            ? `${options.length} suggestion${options.length > 1 ? "s" : ""}`
            : "Aucune suggestion : tu peux garder ce que tu as tapé."
          : ""}
      </p>
    </div>
  );
}
