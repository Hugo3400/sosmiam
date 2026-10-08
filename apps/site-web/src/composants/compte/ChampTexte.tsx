import { use, useEffect, useRef, useState, type ReactNode } from "react";

import { ContexteFormulaire } from "~/composants/compte/FormulaireCompte";

type Props = {
  nom: string;
  libelle: ReactNode;
  type?: "text" | "email" | "date" | "url" | "password";
  autoComplete?: string;
  /** Petit texte d'aide sous le libellé, lu avec le champ */
  aide?: ReactNode;
  facultatif?: boolean;
  /** Valeur de départ (la valeur enregistrée, dans « Mon compte ») ; après un refus sans JavaScript, ce qui avait été tapé */
  valeur?: string;
  /** Longueur maximale (pas pour un mot de passe : un mot de passe collé ne doit jamais être coupé en silence) */
  maximum?: number;
  /** Zone de texte sur plusieurs lignes, avec un compteur de caractères */
  lignes?: number;
  exemple?: string;
  inputMode?: "text" | "email" | "url";
  className?: string;
};

const classeChamp = `w-full rounded-2xl border-2 border-encre bg-white px-4 py-3 font-medium focus:outline-3 focus:outline-offset-2
  focus:outline-encre aria-invalid:border-rouge-texte`;

/**
 * Champ d'un formulaire de l'espace (dans un FormulaireCompte) : libellé visible, aide et erreur reliées par
 * aria-describedby. Un mot de passe a un bouton « Afficher », présent seulement une fois la page prête (inutile sans
 * JavaScript) et qui le masque de nouveau à l'envoi.
 */
export function ChampTexte({ nom, libelle, type = "text", autoComplete, aide, facultatif, valeur, maximum, lignes, exemple, inputMode, className = "" }: Props) {
  const { prefixe, erreurs, valeurs, focusAuChargement } = use(ContexteFormulaire);
  const id = `${prefixe}-${nom}`;
  const erreur = erreurs[nom];
  const motDePasse = type === "password";
  const depart = motDePasse ? undefined : (valeurs[nom] ?? valeur);
  const [longueur, setLongueur] = useState(depart?.length ?? 0);
  const [pret, setPret] = useState(false);
  const [visible, setVisible] = useState(false);
  const champ = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    setPret(true);
    const formulaire = champ.current?.form;
    if (!formulaire) return;
    const cacher = () => setVisible(false);
    // Formulaire vidé (form.reset) : le compteur suit, une fois les valeurs remises
    const recompter = () => requestAnimationFrame(() => setLongueur(champ.current?.value.length ?? 0));
    formulaire.addEventListener("submit", cacher);
    formulaire.addEventListener("reset", recompter);
    return () => {
      formulaire.removeEventListener("submit", cacher);
      formulaire.removeEventListener("reset", recompter);
    };
  }, []);

  const decrit = [aide ? `${id}-aide` : "", erreur ? `${id}-erreur` : "", lignes && maximum ? `${id}-compteur` : ""].filter(Boolean).join(" ") || undefined;
  const proprietes = {
    id,
    name: nom,
    autoComplete,
    placeholder: exemple,
    required: !facultatif,
    defaultValue: depart,
    autoFocus: focusAuChargement === nom,
    "aria-invalid": Boolean(erreur),
    "aria-describedby": decrit,
  };

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {libelle} {facultatif && <span className="font-normal text-gris">(facultatif)</span>}
      </label>
      {aide && <p id={`${id}-aide`} className="mb-2 text-sm text-gris">{aide}</p>}
      {lignes ? (
        <>
          <textarea ref={champ} {...proprietes} rows={lignes} maxLength={maximum} onChange={(evenement) => setLongueur(evenement.currentTarget.value.length)} className={classeChamp} />
          {maximum && <p id={`${id}-compteur`} className="mt-1 text-right text-xs text-gris">{longueur} / {maximum} caractères</p>}
        </>
      ) : (
        <div className="relative">
          <input
            ref={champ}
            {...proprietes}
            type={motDePasse && visible ? "text" : type}
            maxLength={motDePasse ? undefined : maximum}
            inputMode={inputMode}
            spellCheck={motDePasse || type === "email" ? false : undefined}
            autoCapitalize={motDePasse || type === "email" ? "off" : undefined}
            className={`${classeChamp} ${motDePasse && pret ? "pr-28" : ""}`}
          />
          {motDePasse && pret && (
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              aria-controls={id}
              aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full px-3 py-1.5 text-sm font-semibold underline decoration-jaune decoration-[3px]
                underline-offset-4 hover:decoration-encre focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre"
            >
              {visible ? "Masquer" : "Afficher"}
            </button>
          )}
        </div>
      )}
      {erreur && <p id={`${id}-erreur`} className="mt-1.5 text-sm font-semibold text-rouge-texte">{erreur}</p>}
    </div>
  );
}
