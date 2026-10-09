import { Form, useNavigation } from "react-router";

/** Nom du formulaire (champ caché « formulaire ») : l'action de /tableau y répond. */
export const FORMULAIRE_RATTACHEMENT = "rattachement";

export type GesteRattachement = "accepter" | "retirer";

type Props = {
  rattachementId: number;
  geste: GesteRattachement;
  /** Texte visible du bouton */
  texte: string;
  /** Fin du texte lue seulement par les lecteurs d'écran (le nom du lieu) */
  precision: string;
  /** Bouton jaune (Accepter) ou lien discret (Refuser, Annuler, Quitter) */
  principal?: boolean;
};

/**
 * Un geste sur une demande ou une invitation du tableau : accepter une invitation, ou la refuser, annuler sa demande,
 * quitter un lieu (« retirer »). Formulaire POST : marche sans JavaScript.
 */
export function BoutonRattachement({ rattachementId, geste, texte, precision, principal = false }: Props) {
  const navigation = useNavigation();
  const enCours = navigation.state !== "idle" && navigation.formData?.get("id") === String(rattachementId) && navigation.formData?.get("geste") === geste;
  const classe = principal
    ? `inline-flex items-center justify-center rounded-full border-2 border-encre bg-jaune px-[18px] py-2 text-[.9rem] font-semibold shadow-brut
      transition-[translate,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-grand focus-visible:outline-3
      focus-visible:outline-offset-3 focus-visible:outline-encre`
    : `text-sm font-semibold underline decoration-rouge-texte/40 decoration-2 underline-offset-4 hover:decoration-rouge-texte focus-visible:outline-3
      focus-visible:outline-offset-2 focus-visible:outline-encre`;
  return (
    <Form method="post">
      <input type="hidden" name="formulaire" value={FORMULAIRE_RATTACHEMENT} />
      <input type="hidden" name="id" value={rattachementId} />
      <button type="submit" name="geste" value={geste} className={classe}>
        {enCours ? "Envoi…" : <>{texte}<span className="sr-only">{` : ${precision}`}</span></>}
      </button>
    </Form>
  );
}
