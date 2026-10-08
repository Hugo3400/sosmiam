import { createContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Form, useActionData } from "react-router";

import { Bouton } from "~/composants/interface/Bouton";

/**
 * Réponse des actions des formulaires de l'espace ambassadeur. « erreurs » : le message de chaque champ à corriger, dans
 * l'ordre du formulaire (le premier reçoit le focus) ; « valeurs » : ce qui avait été tapé, jamais un mot de passe (pour
 * remplir de nouveau le formulaire sans JavaScript) ; « formulaire » : celui qui a répondu (une page peut en avoir plusieurs).
 */
export type ReponseFormulaire = {
  ok: boolean;
  formulaire: string;
  /** Message général : réussite, trop d'essais, panne… (les erreurs d'un champ s'affichent sous ce champ) */
  message?: string;
  erreurs?: Record<string, string>;
  valeurs?: Record<string, string>;
};

/** Ce que les champs lisent du formulaire qui les contient (ChampTexte, CaseACocher, ChoixMultiples). */
export type EtatFormulaire = {
  /** Début des id des champs, unique sur la page */
  prefixe: string;
  erreurs: Record<string, string>;
  valeurs: Record<string, string>;
  /** Champ qui prend le focus au chargement : le premier en faute, après un envoi sans JavaScript */
  focusAuChargement: string | null;
};

export const ContexteFormulaire = createContext<EtatFormulaire>({ prefixe: "champ", erreurs: {}, valeurs: {}, focusAuChargement: null });

type Props = {
  /** Nom du formulaire (champ caché « formulaire ») : il trie les réponses et commence les id des champs */
  nom: string;
  /** Texte du bouton d'envoi (une partie peut être réservée aux lecteurs d'écran : « C'est fait ! : <mission> ») */
  bouton: ReactNode;
  /** Texte du bouton pendant l'envoi */
  boutonEnvoi?: string;
  /** Bouton rouge, pour une action définitive (supprimer le compte) */
  danger?: boolean;
  /** Ajoute le champ piège à robots (formulaires ouverts à tous) */
  piege?: boolean;
  /** Une réponse « ok » vide les champs (mot de passe changé…) */
  viderApresReussite?: boolean;
  /**
   * Réponse à montrer quand l'action n'a rien répondu pour ce formulaire : une réussite annoncée après une redirection
   * (mot de passe changé, voir routes/compte/mon-compte.tsx). Même objet d'un affichage à l'autre (useMemo).
   */
  reponseParDefaut?: ReponseFormulaire;
  children: ReactNode;
  /** À côté du bouton : liens utiles (« Mot de passe oublié ? »…) */
  apres?: ReactNode;
  className?: string;
};

const classeDanger = `inline-flex items-center justify-center rounded-full border-2 border-encre bg-rouge-texte px-[26px] py-3.5 font-semibold
  text-white shadow-brut transition-[translate,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-grand
  active:translate-x-0.5 active:translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre`;

/**
 * Formulaire de l'espace ambassadeur, accessible et utilisable sans JavaScript (même modèle que FormulaireDemandeLieu) :
 * résumé lu par les lecteurs d'écran (role="status"), focus sur le premier champ en faute, bouton « Envoi… ».
 */
export function FormulaireCompte({ nom, bouton, boutonEnvoi = "Envoi…", danger, piege, viderApresReussite, reponseParDefaut, children, apres, className = "" }: Props) {
  const donnees = useActionData<ReponseFormulaire>();
  // Un autre formulaire de la page vient de répondre : la réussite d'avant (redirection) n'est plus à montrer
  const reponse = donnees?.formulaire === nom ? donnees : donnees ? undefined : reponseParDefaut;
  // Réponse déjà là au premier affichage : envoi sans JavaScript (la page a été rechargée). Le message passe en haut du
  // formulaire et le premier champ en faute prend le focus au chargement (autofocus), sans attendre notre code.
  const [reponseInitiale] = useState(reponse);
  const sansJs = reponse !== undefined && reponse === reponseInitiale;
  // Vrai de l'envoi jusqu'à la réponse : le résumé est retiré puis remis, donc relu. Posé dans onSubmit, dont le rendu
  // s'affiche tout de suite : l'état de navigation passe par une transition, que React saute si la réponse arrive très vite.
  const [enAttente, setEnAttente] = useState(false);
  // Numéro de réponse : le résumé est recréé à chaque réponse, donc relu même s'il est identique au précédent
  const [numeroReponse, setNumeroReponse] = useState(0);
  const formulaire = useRef<HTMLFormElement>(null);

  const erreurs = reponse && !reponse.ok ? (reponse.erreurs ?? {}) : {};
  const champsEnFaute = Object.keys(erreurs);

  useEffect(() => {
    if (!reponse) return;
    setEnAttente(false);
    setNumeroReponse((numero) => numero + 1);
    if (reponse.ok) {
      if (viderApresReussite) formulaire.current?.reset();
      return;
    }
    const cible = champsEnFaute[0] ? formulaire.current?.elements.namedItem(champsEnFaute[0]) : null;
    const element = cible instanceof RadioNodeList ? cible[0] : cible;
    if (element instanceof HTMLElement) element.focus();
  }, [reponse]);

  const resume = champsEnFaute.length === 1 ? "Un champ est à corriger." : `${champsEnFaute.length} champs sont à corriger.`;
  const message = !reponse || enAttente ? "" : (reponse.message ?? (champsEnFaute.length > 0 ? resume : ""));
  const zoneMessage = (
    <p
      id={`${nom}-message`}
      role="status"
      aria-live="polite"
      className={`font-semibold ${reponse?.ok ? "text-encre" : "text-rouge-texte"} ${sansJs ? "mb-6" : "mt-6 min-h-6"}`}
    >
      <span key={numeroReponse}>{message && reponse?.ok ? <><span aria-hidden="true">✓ </span>{message}</> : message}</span>
    </p>
  );

  const etat: EtatFormulaire = {
    prefixe: nom,
    erreurs,
    valeurs: reponse && !reponse.ok ? (reponse.valeurs ?? {}) : {},
    focusAuChargement: sansJs ? (champsEnFaute[0] ?? null) : null,
  };

  return (
    <Form ref={formulaire} method="post" noValidate onSubmit={() => setEnAttente(true)} className={className}>
      <ContexteFormulaire value={etat}>
        {sansJs && zoneMessage}
        <input type="hidden" name="formulaire" value={nom} />
        {children}
        {/* Champ piège : invisible pour les humains et les lecteurs d'écran, les robots le remplissent */}
        {piege && <input type="text" name="piege" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />}
        {!sansJs && zoneMessage}
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-3">
          {danger
            ? <button type="submit" className={classeDanger}>{enAttente ? boutonEnvoi : bouton}</button>
            : <Bouton type="submit" className="w-full sm:w-auto sm:min-w-52">{enAttente ? boutonEnvoi : bouton}</Bouton>}
          {apres}
        </div>
      </ContexteFormulaire>
    </Form>
  );
}
