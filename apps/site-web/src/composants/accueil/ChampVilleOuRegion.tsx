import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { groupesLieux, type Lieu } from "~/contenus/villes";
import { filtrerLieux } from "~/fonctions/texte/filtrer-lieux";
import { trouverVilleProposee } from "~/fonctions/texte/trouver-ville-proposee";
import { utiliserLocalisation } from "~/hooks/utiliser-localisation";

type Props = {
  id: string;
  name: string;
  /** Classes du bloc (taille dans le formulaire) */
  className?: string;
  /** Classes du champ lui-même (bordure, arrondi…) */
  classeChamp: string;
  /** Valeur de départ : ce qui avait été tapé, quand le formulaire revient d'un envoi sans JavaScript */
  valeurInitiale?: string;
};

/**
 * Champ libre « Ta ville ou ta région », avec une liste de suggestions dessinée par le site (et non par le navigateur) :
 * les grandes villes de chaque région. Modèle « combobox » des recommandations ARIA : les flèches parcourent la liste,
 * Entrée choisit, Échap ferme ; on peut aussi garder ce qu'on a tapé. Un bouton 📍 remplit le champ avec la commune où
 * l'on se trouve. Sans JavaScript, c'est un simple champ texte.
 * Le champ n'est pas « contrôlé » par React : ce qui a été tapé avant la fin du chargement de la page n'est pas perdu.
 */
export function ChampVilleOuRegion({ id, name, className = "", classeChamp, valeurInitiale = "" }: Props) {
  const [saisie, setSaisie] = useState(valeurInitiale);
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState<string | null>(null);
  const champ = useRef<HTMLInputElement>(null);
  const liste = useRef<HTMLDivElement>(null);
  // L'option active vient-elle du clavier ? (seul le clavier fait défiler la page, pas le survol à la souris)
  const auClavier = useRef(false);
  const idListe = `${id}-suggestions`;
  const idLocalisation = `${id}-localisation`;
  const creerIdOption = (lieu: string) => `${id}-${lieu}`;

  const groupes = useMemo(() => filtrerLieux(saisie, groupesLieux), [saisie]);
  const options = useMemo(() => groupes.flatMap((groupe) => groupe.lieux), [groupes]);
  const visible = ouvert && options.length > 0;

  const { possible, localisation, localiser, oublier } = utiliserLocalisation(({ commune, departement, region }) => {
    const precise = departement && departement !== commune ? `${commune} (${departement})` : commune;
    remplir(trouverVilleProposee(commune, region)?.valeur ?? precise);
  });

  useEffect(() => {
    // Reprend ce qui a pu être tapé avant que la page soit prête
    if (champ.current) setSaisie(champ.current.value);
    // Après une inscription réussie, le formulaire est vidé (form.reset()) : on oublie aussi la saisie
    const formulaire = champ.current?.form;
    if (!formulaire) return;
    const vider = () => {
      setSaisie("");
      fermer();
      oublier();
    };
    formulaire.addEventListener("reset", vider);
    return () => formulaire.removeEventListener("reset", vider);
  }, []);

  // L'option surlignée au clavier reste visible : la liste défile d'abord (en montrant le titre du groupe pour
  // la première option d'un groupe), puis la page, seulement si l'option sort de l'écran (sous l'en-tête collant)
  useEffect(() => {
    const option = actif ? document.getElementById(creerIdOption(actif)) : null;
    const boite = liste.current;
    if (!option || !boite) return;
    const titre = option.previousElementSibling?.getAttribute("role") === "presentation" ? (option.previousElementSibling as HTMLElement) : null;
    const haut = titre ? titre.offsetTop : option.offsetTop;
    if (haut < boite.scrollTop) boite.scrollTop = haut;
    else if (option.offsetTop + option.offsetHeight > boite.scrollTop + boite.clientHeight) {
      boite.scrollTop = option.offsetTop + option.offsetHeight - boite.clientHeight;
    }
    if (!auClavier.current) return;
    const cadre = option.getBoundingClientRect();
    const HAUTEUR_EN_TETE = 88;
    if (cadre.bottom > window.innerHeight) window.scrollBy({ top: cadre.bottom - window.innerHeight + 16 });
    else if (cadre.top < HAUTEUR_EN_TETE) window.scrollBy({ top: cadre.top - HAUTEUR_EN_TETE });
  }, [actif]);

  // Chaque nouvelle recherche, ou réouverture, repart du haut de la liste (sauf si une option est surlignée au clavier)
  useEffect(() => {
    if (visible && !actif && liste.current) liste.current.scrollTop = 0;
  }, [saisie, visible]);

  function fermer() {
    setOuvert(false);
    setActif(null);
  }

  /** Après un choix à la souris ou au doigt, le clic qui suit de près (double-clic, double appui) est ignoré :
   *  sinon il traverserait la liste refermée et cocherait ou enverrait ce qui est dessous. */
  function avalerClicSuivant() {
    const zone = liste.current?.getBoundingClientRect();
    if (!zone) return;
    const avaler = (evenement: MouseEvent) => {
      const dansLaListe = evenement.clientX >= zone.left && evenement.clientX <= zone.right
        && evenement.clientY >= zone.top && evenement.clientY <= zone.bottom;
      if (!dansLaListe) return;
      evenement.preventDefault();
      evenement.stopPropagation();
    };
    // mousedown aussi : pas de texte sélectionné dessous, et le champ garde le focus
    for (const type of ["mousedown", "click"] as const) document.addEventListener(type, avaler, { capture: true });
    window.setTimeout(() => {
      for (const type of ["mousedown", "click"] as const) document.removeEventListener(type, avaler, { capture: true });
    }, 400);
  }

  function remplir(valeur: string) {
    if (champ.current) champ.current.value = valeur;
    setSaisie(valeur);
    fermer();
  }

  function deplacer(sens: 1 | -1) {
    if (options.length === 0) return;
    auClavier.current = true;
    const position = options.findIndex((option) => option.id === actif);
    const suivante = position === -1 ? (sens === 1 ? 0 : options.length - 1) : Math.min(options.length - 1, Math.max(0, position + sens));
    setActif(options[suivante].id);
  }

  function gererClavier(evenement: KeyboardEvent<HTMLInputElement>) {
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

  function choisir(lieu: Lieu) {
    remplir(lieu.valeur);
    oublier();
  }

  return (
    <div className={className}>
      <div className="relative">
        <input
          ref={champ}
          id={id}
          name={name}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={visible}
          aria-controls={idListe}
          aria-activedescendant={visible && actif ? creerIdOption(actif) : undefined}
          aria-describedby={localisation.message ? idLocalisation : undefined}
          autoComplete="off"
          autoCapitalize="words"
          spellCheck={false}
          placeholder="Ta ville ou ta région"
          maxLength={80}
          defaultValue={valeurInitiale}
          onChange={(evenement) => {
            setSaisie(evenement.currentTarget.value);
            setOuvert(true);
            setActif(null);
            if (localisation.etat !== "attente") oublier();
          }}
          onFocus={() => setOuvert(true)}
          onClick={() => setOuvert(true)}
          onBlur={fermer}
          onKeyDown={gererClavier}
          className={`w-full ${classeChamp} ${possible ? "pr-14" : ""}`}
        />

        {possible && (
          <button
            type="button"
            onClick={localiser}
            aria-disabled={localisation.etat === "recherche"}
            aria-label="Me localiser pour remplir ce champ"
            className="absolute top-1/2 right-2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-lg transition-colors
              hover:bg-jaune-clair focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre aria-disabled:cursor-wait aria-disabled:opacity-60"
          >
            <span aria-hidden="true">{localisation.etat === "recherche" ? "⏳" : "📍"}</span>
          </button>
        )}

        {/* mousedown bloqué : cliquer dans la liste (ou sur sa barre de défilement) ne retire pas le focus du champ */}
        <div
          ref={liste}
          id={idListe}
          role="listbox"
          aria-label="Villes et régions proposées"
          hidden={!visible}
          onMouseDown={(evenement) => evenement.preventDefault()}
          className="absolute top-full left-0 z-30 mt-2 max-h-[min(20rem,50vh)] w-full overflow-y-auto overscroll-contain rounded-2xl border-2 border-encre
            bg-white py-1.5 text-left shadow-brut [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:my-4 [&::-webkit-scrollbar-track]:bg-transparent"
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
              {groupe.lieux.map((lieu) => {
                const estActif = actif === lieu.id;
                return (
                  <div
                    key={lieu.id}
                    id={creerIdOption(lieu.id)}
                    role="option"
                    aria-selected={estActif}
                    onClick={() => {
                      avalerClicSuivant();
                      choisir(lieu);
                    }}
                    onMouseMove={() => {
                      auClavier.current = false;
                      if (!estActif) setActif(lieu.id);
                    }}
                    className={`cursor-pointer px-4 py-2 ${estActif
                      ? "bg-encre text-jaune forced-colors:outline-3 forced-colors:-outline-offset-3 forced-colors:outline-[Highlight]"
                      : "text-encre"}`}
                  >
                    <span className="block font-semibold">{lieu.nom}</span>
                    {lieu.type !== "ville" && (
                      <span className={`block text-sm ${estActif ? "text-jaune-clair" : "text-gris"}`}>
                        {lieu.type === "region" ? "toute la région" : "tout le département"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Résultat du bouton 📍, annoncé aux lecteurs d'écran */}
      <p id={idLocalisation} aria-live="polite"
        className={`mt-1.5 px-2 text-left text-sm ${localisation.etat === "erreur" ? "font-semibold text-rouge-texte" : ""}`}>
        {localisation.message}
      </p>

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
