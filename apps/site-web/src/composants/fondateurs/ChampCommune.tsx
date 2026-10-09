import { useEffect, useRef, useState, type KeyboardEvent } from "react";

/** Une commune proposée par la route /communes du site. */
export type CommuneProposee = { code: string; nom: string; nomDepartement: string; codePostal: string | null };

type Props = {
  id: string;
  name: string;
  /** Ce qui est écrit au départ : la recherche d'avant, ou le nom de la commune choisie */
  valeurInitiale?: string;
  /** Une commune choisie dans la liste (avec JavaScript seulement) */
  onChoisir: (commune: CommuneProposee) => void;
  /** Texte relié au champ (aide, erreur) */
  decritPar?: string;
  invalide?: boolean;
  autoFocus?: boolean;
  className?: string;
};

/** Attente après la dernière touche avant de chercher (une recherche par mot tapé, pas par lettre). */
const DELAI_RECHERCHE = 220;

/**
 * Champ « Ta ville » : sans JavaScript, un simple champ texte (le formulaire GET qui le contient fait la recherche côté
 * serveur et propose une liste de choix). Une fois la page prête, il propose les communes au fil de la frappe (route
 * /communes du site), sur le modèle « combobox » des recommandations ARIA : flèches pour parcourir, Entrée pour choisir,
 * Échap pour fermer ; Entrée sans choix envoie le formulaire comme d'habitude.
 */
export function ChampCommune({ id, name, valeurInitiale = "", onChoisir, decritPar, invalide = false, autoFocus = false, className = "" }: Props) {
  const [pret, setPret] = useState(false);
  const [communes, setCommunes] = useState<CommuneProposee[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(-1);
  const [annonce, setAnnonce] = useState("");
  const champ = useRef<HTMLInputElement>(null);
  const minuterie = useRef<number | undefined>(undefined);
  const demande = useRef<AbortController | null>(null);
  const idListe = `${id}-suggestions`;
  const visible = pret && ouvert && communes.length > 0;

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
      setCommunes([]);
      setAnnonce("");
      return;
    }
    minuterie.current = window.setTimeout(async () => {
      const controleur = new AbortController();
      demande.current = controleur;
      try {
        const reponse = await fetch(`/communes?recherche=${encodeURIComponent(texte.trim())}`, { signal: controleur.signal });
        const lu = (await reponse.json()) as { ok?: boolean; communes?: CommuneProposee[] };
        const trouvees = lu.ok && Array.isArray(lu.communes) ? lu.communes : [];
        setCommunes(trouvees);
        setActif(-1);
        setOuvert(true);
        setAnnonce(trouvees.length === 0
          ? "Aucune commune trouvée."
          : `${trouvees.length} commune${trouvees.length > 1 ? "s" : ""} proposée${trouvees.length > 1 ? "s" : ""}.`);
      } catch {
        // Recherche remplacée par une plus récente, ou réseau coupé : le bouton du formulaire marche toujours
      }
    }, DELAI_RECHERCHE);
  }

  function choisir(commune: CommuneProposee) {
    if (champ.current) champ.current.value = commune.nom;
    setOuvert(false);
    setActif(-1);
    setAnnonce("");
    onChoisir(commune);
  }

  function gererClavier(evenement: KeyboardEvent<HTMLInputElement>) {
    if ((evenement.key === "ArrowDown" || evenement.key === "ArrowUp") && communes.length > 0) {
      evenement.preventDefault();
      setOuvert(true);
      const sens = evenement.key === "ArrowDown" ? 1 : -1;
      setActif((position) => (position === -1 ? (sens === 1 ? 0 : communes.length - 1) : Math.min(communes.length - 1, Math.max(0, position + sens))));
    } else if (evenement.key === "Enter" && visible && actif >= 0) {
      evenement.preventDefault();
      choisir(communes[actif]);
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
        autoCapitalize="words"
        spellCheck={false}
        autoFocus={autoFocus}
        maxLength={80}
        placeholder="Lyon, Bron, 69003…"
        defaultValue={valeurInitiale}
        onChange={(evenement) => chercher(evenement.currentTarget.value)}
        onFocus={() => setOuvert(true)}
        onBlur={() => setOuvert(false)}
        onKeyDown={gererClavier}
        className="w-full min-w-0 rounded-2xl border-2 border-encre bg-white px-4 py-3 font-medium text-encre focus:outline-3 focus:outline-offset-2
          focus:outline-jaune aria-invalid:border-rouge-texte"
      />
      {pret && (
        // mousedown bloqué : cliquer dans la liste ne retire pas le focus du champ (sinon elle se fermerait avant le clic)
        <ul
          id={idListe}
          role="listbox"
          aria-label="Communes proposées"
          hidden={!visible}
          onMouseDown={(evenement) => evenement.preventDefault()}
          className="absolute top-full left-0 z-30 mt-2 max-h-[min(20rem,50vh)] w-full overflow-y-auto overscroll-contain rounded-2xl border-2 border-encre
            bg-white py-1.5 text-left text-encre shadow-brut"
        >
          {communes.map((commune, position) => (
            <li
              key={commune.code}
              id={`${id}-option-${position}`}
              role="option"
              aria-selected={position === actif}
              onClick={() => choisir(commune)}
              onMouseMove={() => setActif(position)}
              className={`cursor-pointer px-4 py-2 ${position === actif ? "bg-encre text-jaune forced-colors:outline-3 forced-colors:-outline-offset-3 forced-colors:outline-[Highlight]" : ""}`}
            >
              <span className="block font-semibold">{commune.nom}</span>
              <span className={`block text-sm ${position === actif ? "text-jaune-clair" : "text-gris"}`}>
                {commune.codePostal ? `${commune.codePostal} · ${commune.nomDepartement}` : commune.nomDepartement}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="sr-only" aria-live="polite">{annonce}</p>
    </div>
  );
}
