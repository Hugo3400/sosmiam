import { useEffect, useRef, useState } from "react";
import { Form, Link, useLocation, useNavigation } from "react-router";

import { LONGUEUR_MAX_EXPLICATION_SIGNALEMENT } from "../../../../../packages/commun/src/regles/signalement.ts";
import { Bouton } from "~/composants/interface/Bouton";
import { ChoixQuelleImage } from "~/composants/lieux/ChoixQuelleImage";
import { ChoixRaisonImage } from "~/composants/lieux/ChoixRaisonImage";
import { TEXTES_SIGNALER_IMAGE } from "~/contenus/signaler-image";
import type { ReponseSignalerImage } from "~/fonctions/lieux/lire-formulaire-signaler-image";
import type { ImageSignalable } from "~/fonctions/lieux/lister-images-signalables";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserJavascriptActif } from "~/hooks/utiliser-javascript-actif";

type Props = {
  lieu: { id: number; nom: string; banniere: string | null; logo: string | null };
  images: readonly ImageSignalable[];
  reponse?: ReponseSignalerImage;
};

const ID_FORMULAIRE = "signaler-image";
const ID_EXPLICATION = "signaler-explication";
const CLASSE_CHAMP = "w-full rounded-2xl border-2 border-encre bg-white px-4 py-3 font-medium focus:outline-3 focus:outline-offset-2 focus:outline-encre aria-invalid:border-rouge-texte";

function trouverChamp(formulaire: HTMLFormElement | null, nom: string): HTMLElement | null {
  const champ = formulaire?.elements.namedItem(nom);
  if (champ instanceof RadioNodeList) {
    const radios = Array.from(champ).filter((element): element is HTMLInputElement => element instanceof HTMLInputElement);
    return radios.find((radio) => radio.checked) ?? radios[0] ?? null;
  }
  return champ instanceof HTMLElement && !(champ instanceof HTMLInputElement && champ.type === "hidden") ? champ : null;
}

export function FormulaireSignalerImage({ lieu, images, reponse }: Props) {
  const T = TEXTES_SIGNALER_IMAGE;
  const navigation = useNavigation();
  const { pathname } = useLocation();
  const javascriptActif = utiliserJavascriptActif();
  const formulaire = useRef<HTMLFormElement>(null);
  const zoneMessage = useRef<HTMLParagraphElement>(null);
  const refus = reponse && !reponse.ok ? reponse : undefined;
  const valeurs = refus?.valeurs;
  const erreurs = refus?.erreurs ?? {};
  const [longueur, setLongueur] = useState(valeurs?.explication.length ?? 0);
  const [numeroReponse, setNumeroReponse] = useState(0);

  useEffect(() => {
    if (!refus) return;
    setNumeroReponse((numero) => numero + 1);
    const champ = refus.champ ? trouverChamp(formulaire.current, refus.champ) : null;
    (champ ?? zoneMessage.current)?.focus();
  }, [refus]);

  const erreurExplication = erreurs.explication;
  const decritExplication = [`${ID_EXPLICATION}-aide`, `${ID_EXPLICATION}-compteur`, erreurExplication ? `${ID_EXPLICATION}-erreur` : ""].filter(Boolean).join(" ");

  return (
    <Form
      ref={formulaire}
      id={ID_FORMULAIRE}
      method="post"
      action={javascriptActif ? undefined : `${pathname}#${ID_FORMULAIRE}`}
      noValidate
      className="relative flex flex-col gap-7 rounded-carte border-2 border-encre bg-white p-5 shadow-brut md:p-8"
    >
      <p ref={zoneMessage} tabIndex={-1} role="status" aria-live="polite" className={refus ? "rounded-xl border-2 border-rouge-texte bg-rose-alerte px-4 py-3 font-semibold text-rouge-texte focus:outline-3 focus:outline-offset-2 focus:outline-encre" : "sr-only"}>
        <span key={numeroReponse}>{refus ? refus.message : ""}</span>
      </p>

      <ChoixQuelleImage sources={{ banniere: lieu.banniere, logo: lieu.logo }} images={images} choisie={valeurs?.quelle} erreur={erreurs.quelle} />
      <ChoixRaisonImage choisie={valeurs?.raison} precision={valeurs?.precision} erreur={erreurs.raison} />

      <div>
        <label htmlFor={ID_EXPLICATION} className="mb-1.5 block font-titre text-xl font-extrabold">
          {T.explication.libelle}
          <span className="font-sans text-sm font-normal text-gris">{lierPonctuation(T.explication.facultatif)}</span>
        </label>
        <p id={`${ID_EXPLICATION}-aide`} className="mb-2 text-sm text-gris">{lierPonctuation(T.explication.aide)}</p>
        <textarea
          id={ID_EXPLICATION}
          name="explication"
          rows={5}
          maxLength={LONGUEUR_MAX_EXPLICATION_SIGNALEMENT}
          defaultValue={valeurs?.explication}
          onChange={(evenement) => setLongueur(evenement.currentTarget.value.length)}
          aria-invalid={Boolean(erreurExplication)}
          aria-describedby={decritExplication}
          className={CLASSE_CHAMP}
        />
        <p id={`${ID_EXPLICATION}-compteur`} className="mt-1 text-right text-xs text-gris">{T.explication.compteur(longueur, LONGUEUR_MAX_EXPLICATION_SIGNALEMENT)}</p>
        {erreurExplication && <p id={`${ID_EXPLICATION}-erreur`} className="mt-1.5 text-sm font-semibold text-rouge-texte">{erreurExplication}</p>}
      </div>

      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden opacity-0">
        <label htmlFor="signaler-image-site-web">{T.piege}</label>
        <input id="signaler-image-site-web" type="text" name="site_web" tabIndex={-1} autoComplete="off" />
      </div>

      <p className="rounded-xl border-2 border-dashed border-encre bg-creme px-4 py-3 text-sm">{lierPonctuation(T.donnees)}{" "}
        <Link to="/confidentialite#signaler-image" className="font-semibold underline underline-offset-4">
          {T.donneesLien}
        </Link>
      </p>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <Bouton type="submit" className="w-full sm:w-auto sm:min-w-64">{navigation.state === "submitting" ? T.envoi : T.envoyer}</Bouton>
        <Link to={`/lieux/${lieu.id}`} className="font-semibold underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre">
          {T.annuler}
        </Link>
      </div>
    </Form>
  );
}
