import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import type { LieuTrouve } from "~/types/pro";

type Props = {
  id: string;
  name: string;
  valeurInitiale?: string;
  /** Un lieu choisi dans la liste (avec JavaScript seulement) */
  onChoisir: (lieu: LieuTrouve) => void;
  decritPar?: string;
  invalide?: boolean;
  className?: string;
};

/** Attente après la dernière touche avant de chercher (une recherche par mot tapé, pas par lettre). */
const DELAI_RECHERCHE = 250;

/**
 * Champ « Ton lieu » de /rattacher, sur le modèle de « Ta ville » (composants/fondateurs/ChampCommune.tsx) : sans
 * JavaScript, un simple champ texte (le formulaire GET qui le contient fait la recherche côté serveur) ; une fois la page
 * prête, il propose les lieux au fil de la frappe (route /recherche-lieux), en « combobox » ARIA : flèches pour parcourir,
 * Entrée pour choisir, Échap pour fermer ; Entrée sans choix envoie le formulaire.
 */
export function ChampLieu({ id, name, valeurInitiale = "", onChoisir, decritPar, invalide = false, className = "" }: Props) {
  const [pret, setPret] = useState(false);
  const [lieux, setLieux] = useState<LieuTrouve[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(-1);
  const [annonce, setAnnonce] = useState("");
  const champ = useRef<HTMLInputElement>(null);
  const minuterie = useRef<number | undefined>(undefined);
  const demande = useRef<AbortController | null>(null);
  const idListe = `${id}-suggestions`;
  const visible = pret && ouvert && lieux.length > 0;

  useEffect(() => {
    setPret(true);
    return () => {
      window.clearTimeout(minuterie.current);
      demande.current?.abort();
    };
  }, []);

  function chercher(texte: string) {
    window.clearTimeout(minuterie.current);
    demande.current?.abort();
    if (texte.trim().length < 2) {
      setLieux([]);
      setAnnonce("");
      return;
    }
    minuterie.current = window.setTimeout(async () => {
      const controleur = new AbortController();
      demande.current = controleur;
      try {
        const reponse = await fetch(`/recherche-lieux?texte=${encodeURIComponent(texte.trim())}`, { signal: controleur.signal });
        const lu = (await reponse.json()) as { ok?: boolean; lieux?: LieuTrouve[] };
        const trouves = lu.ok && Array.isArray(lu.lieux) ? lu.lieux : [];
        setLieux(trouves);
        setActif(-1);
        setOuvert(true);
        setAnnonce(trouves.length === 0 ? "Aucun lieu trouvé." : `${trouves.length} lieu${trouves.length > 1 ? "x" : ""} proposé${trouves.length > 1 ? "s" : ""}.`);
      } catch {
        // Recherche remplacée par une plus récente, ou réseau coupé : le bouton du formulaire marche toujours
      }
    }, DELAI_RECHERCHE);
  }

  function choisir(lieu: LieuTrouve) {
    if (champ.current) champ.current.value = lieu.nom;
    setOuvert(false);
    setActif(-1);
    setAnnonce("");
    onChoisir(lieu);
  }

  function gererClavier(evenement: KeyboardEvent<HTMLInputElement>) {
    if ((evenement.key === "ArrowDown" || evenement.key === "ArrowUp") && lieux.length > 0) {
      evenement.preventDefault();
      setOuvert(true);
      const sens = evenement.key === "ArrowDown" ? 1 : -1;
      setActif((position) => (position === -1 ? (sens === 1 ? 0 : lieux.length - 1) : Math.min(lieux.length - 1, Math.max(0, position + sens))));
    } else if (evenement.key === "Enter" && visible && actif >= 0) {
      evenement.preventDefault();
      choisir(lieux[actif]);
    } else if (evenement.key === "Escape" && visible) {
      evenement.preventDefault();
      setOuvert(false);
      setActif(-1);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={champ}
        id={id}
        name={name}
        type="text"
        role={pret ? "combobox" : undefined}
        aria-autocomplete={pret ? "list" : undefined}
        aria-expanded={pret ? visible : undefined}
        aria-controls={pret ? idListe : undefined}
        aria-activedescendant={visible && actif >= 0 ? `${id}-option-${actif}` : undefined}
        aria-describedby={decritPar}
        aria-invalid={invalide || undefined}
        autoComplete="off"
        spellCheck={false}
        maxLength={80}
        placeholder="Chez Jo, Montpellier…"
        defaultValue={valeurInitiale}
        onChange={(evenement) => chercher(evenement.currentTarget.value)}
        onFocus={() => setOuvert(true)}
        onBlur={() => setOuvert(false)}
        onKeyDown={gererClavier}
        className="w-full min-w-0 rounded-2xl border-2 border-encre bg-white px-4 py-3 font-medium text-encre focus:outline-3 focus:outline-offset-2
          focus:outline-encre aria-invalid:border-rouge-texte"
      />
      {pret && (
        // mousedown bloqué : cliquer dans la liste ne retire pas le focus du champ (sinon elle se fermerait avant le clic)
        <ul
          id={idListe}
          role="listbox"
          aria-label="Lieux proposés"
          hidden={!visible}
          onMouseDown={(evenement) => evenement.preventDefault()}
          className="absolute top-full left-0 z-30 mt-2 max-h-[min(20rem,50vh)] w-full overflow-y-auto overscroll-contain rounded-2xl border-2 border-encre
            bg-white py-1.5 text-left text-encre shadow-brut"
        >
          {lieux.map((lieu, position) => (
            <li
              key={lieu.id}
              id={`${id}-option-${position}`}
              role="option"
              aria-selected={position === actif}
              onClick={() => choisir(lieu)}
              onMouseMove={() => setActif(position)}
              className={`cursor-pointer px-4 py-2 ${position === actif ? "bg-encre text-jaune forced-colors:outline-3 forced-colors:-outline-offset-3 forced-colors:outline-[Highlight]" : ""}`}
            >
              <span className="block font-semibold">{lieu.nom}</span>
              <span className={`block text-sm ${position === actif ? "text-jaune-clair" : "text-gris"}`}>{lieu.ville}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="sr-only" aria-live="polite">{annonce}</p>
    </div>
  );
}
