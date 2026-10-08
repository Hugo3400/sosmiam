import { useEffect, useRef, useState } from "react";
import { Form, Link, useActionData, useNavigation } from "react-router";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { PictoCategorie } from "~/composants/marque/PictoCategorie";
import { champsContact, champsLieu, typesDemandeLieu, type ChampDemandeLieu } from "~/contenus/demande-lieu";

/**
 * Réponse de l'action de /inscrire-mon-lieu. « erreurs » : message de chaque champ à corriger ; « champ » : le premier,
 * qui reçoit le focus ; « valeurs » : ce qui avait été tapé (pour remplir de nouveau le formulaire sans JavaScript).
 */
export type ReponseDemandeLieu = { ok: boolean; message: string; champ?: string; erreurs?: Record<string, string>; valeurs?: Record<string, string> };

const champ = "w-full rounded-2xl border-2 border-encre bg-white px-4 py-3 font-medium focus:outline-3 focus:outline-offset-2 focus:outline-encre aria-invalid:border-rouge-texte";
const libelle = "mb-1.5 block text-sm font-semibold";
const erreur = "mt-1.5 text-sm font-semibold text-rouge-texte";
const typesHtml = { texte: "text", email: "email", tel: "tel", url: "url" } as const;

/** Formulaire « J'inscris mon lieu » : la demande part dans le logiciel de gestion, où elle est acceptée ou refusée. */
export function FormulaireDemandeLieu() {
  const reponse = useActionData<ReponseDemandeLieu>();
  const navigation = useNavigation();
  const envoi = navigation.state === "submitting";
  const formulaire = useRef<HTMLFormElement>(null);
  const titreMerci = useRef<HTMLHeadingElement>(null);
  const valeurs = reponse && !reponse.ok ? reponse.valeurs : undefined;
  const [longueurDescription, setLongueurDescription] = useState(valeurs?.description?.length ?? 0);
  // Vrai de l'envoi jusqu'à la réponse : le résumé est retiré puis remis, donc relu. Posé dans onSubmit, dont le rendu
  // s'affiche tout de suite : l'état de navigation passe par une transition, que React saute si la réponse arrive très vite.
  const [enAttente, setEnAttente] = useState(false);
  // Numéro de réponse : le résumé est recréé à chaque réponse, donc relu même s'il est identique au précédent
  const [numeroReponse, setNumeroReponse] = useState(0);

  useEffect(() => {
    if (!reponse) return;
    setEnAttente(false);
    setNumeroReponse((numero) => numero + 1);
    if (reponse.ok) {
      titreMerci.current?.focus();
      return;
    }
    const cible = reponse.champ ? formulaire.current?.elements.namedItem(reponse.champ) : null;
    if (cible instanceof HTMLElement) cible.focus();
  }, [reponse]);

  if (reponse?.ok) {
    return (
      <div className="rounded-carte border-2 border-encre bg-jaune px-6 py-10 text-center shadow-brut-grand md:px-12">
        <Mascotte expression="clin" className="mx-auto mb-5 h-24 w-24" />
        <h2 ref={titreMerci} tabIndex={-1} className="text-3xl font-extrabold">Merci, c'est envoyé !</h2>
        <p className="mx-auto mt-3 max-w-lg text-lg">{reponse.message}</p>
        <Bouton vers="/" variante="encre" className="mt-7">Retour à l'accueil</Bouton>
      </div>
    );
  }

  function afficherChamp(c: ChampDemandeLieu) {
    const messageErreur = reponse && !reponse.ok ? reponse.erreurs?.[c.nom] : undefined;
    const enErreur = Boolean(messageErreur);
    const decrit = [c.aide ? `lieu-${c.nom}-aide` : "", enErreur ? `lieu-${c.nom}-erreur` : "", c.nom === "description" ? "lieu-description-compteur" : ""]
      .filter(Boolean).join(" ") || undefined;
    const proprietes = {
      id: `lieu-${c.nom}`,
      name: c.nom,
      maxLength: c.maximum,
      required: c.obligatoire,
      autoComplete: c.autoComplete,
      placeholder: c.exemple,
      defaultValue: valeurs?.[c.nom],
      "aria-invalid": enErreur,
      "aria-describedby": decrit,
      className: champ,
    };
    return (
      <div key={c.nom} className={c.type === "zone" ? "sm:col-span-2" : ""}>
        <label htmlFor={`lieu-${c.nom}`} className={libelle}>
          {c.libelle}{!c.obligatoire && <span className="font-normal text-gris">{" (facultatif)"}</span>}
        </label>
        {c.aide && <p id={`lieu-${c.nom}-aide`} className="mb-2 text-sm text-gris">{c.aide}</p>}
        {c.type === "zone" ? (
          <>
            <textarea {...proprietes} rows={5} onChange={(evenement) => setLongueurDescription(evenement.currentTarget.value.length)} />
            <p id="lieu-description-compteur" className="mt-1 text-right text-xs text-gris">{longueurDescription} / {c.maximum} caractères</p>
          </>
        ) : (
          <input {...proprietes} type={typesHtml[c.type]} />
        )}
        {enErreur && <p id={`lieu-${c.nom}-erreur`} className={erreur}>{messageErreur}</p>}
      </div>
    );
  }

  // Résumé (« 2 champs sont à corriger. ») ou erreur générale (trop d'envois, panne)
  const messageGeneral = reponse && !reponse.ok && !enAttente ? reponse.message : "";

  return (
    <Form ref={formulaire} method="post" noValidate onSubmit={() => setEnAttente(true)} className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
      <fieldset>
        <legend className="mb-5 font-titre text-2xl font-extrabold">Ton lieu</legend>
        <div className="mb-6">
          <p id="lieu-type-titre" className={libelle}>C'est plutôt… <span className="font-normal text-gris">(facultatif)</span></p>
          <div role="radiogroup" aria-labelledby="lieu-type-titre" className="flex flex-wrap gap-2.5">
            {typesDemandeLieu.map((type) => (
              <label key={type.valeur} className="group cursor-pointer">
                <input type="radio" name="type" value={type.valeur} defaultChecked={valeurs?.type === type.valeur} className="peer sr-only" />
                <span className="flex items-center gap-2 rounded-full border-2 border-encre bg-white py-1.5 pr-4 pl-1.5 font-semibold transition-colors hover:bg-jaune-clair
                  peer-checked:bg-encre peer-checked:text-jaune peer-checked:hover:bg-encre
                  peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-encre">
                  {type.valeur === "autre"
                    ? <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full border-2 border-encre bg-jaune text-base">✨</span>
                    : <PictoCategorie type={type.valeur} className="h-8 w-8" />}
                  {type.libelle}
                  {/* Coche visible même en mode de contraste élevé, cachée aux lecteurs d'écran (la radio dit déjà « cochée ») */}
                  <span aria-hidden="true" className="hidden group-has-checked:inline">✓</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">{champsLieu.map(afficherChamp)}</div>
      </fieldset>

      <fieldset className="mt-10">
        <legend className="mb-1 font-titre text-2xl font-extrabold">Toi</legend>
        <p className="mb-5 text-sm text-gris">Pour te répondre. Ces coordonnées ne sont jamais publiées.</p>
        <div className="grid gap-5 sm:grid-cols-2">{champsContact.map(afficherChamp)}</div>
      </fieldset>

      {/* Champ piège : invisible pour les humains et les lecteurs d'écran, les robots le remplissent */}
      <input type="text" name="piege" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />

      <p id="lieu-message" role="status" aria-live="polite" className="mt-6 min-h-6 font-semibold text-rouge-texte"><span key={numeroReponse}>{messageGeneral}</span></p>
      <div className="mt-2 flex flex-wrap items-center gap-4">
        <Bouton type="submit" className="w-full sm:w-auto sm:min-w-56">{envoi ? "Envoi…" : "Envoyer ma demande"}</Bouton>
        <p className="text-sm text-gris">
          Ce qu'on fait de ces informations{"\u00a0"}:{" "}
          <Link to="/confidentialite#demande-lieu" className="font-semibold text-encre underline underline-offset-2">confidentialité</Link>.
        </p>
      </div>
    </Form>
  );
}
