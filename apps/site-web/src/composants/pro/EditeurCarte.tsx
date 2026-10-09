import { useState } from "react";
import { Form, useActionData, useNavigation } from "react-router";

import { LIMITES_CARTE } from "../../../../../packages/commun/src/regles/carte-du-lieu.ts";
import { ContexteFormulaire, type EtatFormulaire } from "~/composants/compte/FormulaireCompte";
import { Bouton } from "~/composants/interface/Bouton";
import { BoutonGesteCarte } from "~/composants/pro/BoutonGesteCarte";
import { SectionEditeurCarte } from "~/composants/pro/SectionEditeurCarte";
import { ecrireValeursBrouillon } from "~/fonctions/carte/ecrire-valeurs-brouillon";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { BrouillonCarte, FocusCarte } from "~/types/carte";

/** Réponse de l'action de « Ma carte » (routes/pro/ma-carte.tsx) : le brouillon à réafficher, avec ou sans erreurs. */
export type ReponseCarte = {
  ok: boolean;
  formulaire: "carte";
  /** Ce qui vient de se passer (geste, enregistrement, panne) */
  message?: string;
  /** Le message de chaque champ à corriger, par nom de champ, dans l'ordre du formulaire */
  erreurs?: Record<string, string>;
  brouillon: BrouillonCarte;
  focus: FocusCarte;
  /** Change à chaque réponse : les champs sont redessinés avec le brouillon renvoyé */
  version: string;
};

/**
 * L'éditeur de « Ma carte » (gérant) : sections et plats sont des champs de formulaire indexés, et chaque bouton (ajouter,
 * supprimer, monter, descendre) est un bouton d'envoi : l'action de la page change le brouillon et le renvoie, sans
 * enregistrer. Une seule logique, avec ou sans JavaScript (avec, la page ne se recharge pas). « Enregistrer ma carte »
 * l'envoie à l'API. Comme les autres formulaires de l'espace : résumé role="status", focus sur le premier champ en faute
 * (ou sur le champ ou le bouton qui suit le geste), aria-invalid.
 */
export function EditeurCarte({ depart }: { depart: BrouillonCarte }) {
  const donnees = useActionData<ReponseCarte>();
  const reponse = donnees?.formulaire === "carte" ? donnees : undefined;
  // Réponse déjà là au premier affichage : envoi sans JavaScript (page rechargée), le message passe en haut
  const [reponseInitiale] = useState(reponse);
  const sansJs = reponse !== undefined && reponse === reponseInitiale;
  const navigation = useNavigation();
  const enregistrement = navigation.state !== "idle" && navigation.formData?.get("geste") === "enregistrer";

  const brouillon = reponse?.brouillon ?? depart;
  const erreurs = reponse && !reponse.ok ? (reponse.erreurs ?? {}) : {};
  const nombreErreurs = Object.keys(erreurs).length;
  const focus = reponse?.focus ?? null;
  const etat: EtatFormulaire = {
    prefixe: "carte",
    erreurs,
    valeurs: ecrireValeursBrouillon(brouillon),
    focusAuChargement: focus && "champ" in focus ? focus.champ : null,
  };
  const boutonFocus = focus && "bouton" in focus ? focus.bouton : null;
  const plats = brouillon.sections.reduce((somme, section) => somme + section.elements.length, 0);
  const resume = nombreErreurs === 1 ? "Un champ est à corriger." : `${nombreErreurs} champs sont à corriger.`;
  const message = enregistrement ? "" : [reponse?.message, nombreErreurs > 0 ? resume : ""].filter(Boolean).join(" ");

  const zoneMessage = (
    <p role="status" aria-live="polite" className={`font-semibold ${reponse?.ok ? "text-encre" : "text-rouge-texte"} ${sansJs ? "" : "min-h-6"}`}>
      <span key={reponse?.version}>{message && reponse?.ok ? <><span aria-hidden="true">✓ </span>{lierPonctuation(message)}</> : lierPonctuation(message)}</span>
    </p>
  );

  return (
    <Form method="post" noValidate preventScrollReset className="grid gap-6">
      <ContexteFormulaire value={etat}>
        {sansJs && zoneMessage}
        {/* Bouton par défaut : Entrée dans un champ enregistre (et ne déclenche jamais « Supprimer ») */}
        <button type="submit" name="geste" value="enregistrer" tabIndex={-1} aria-hidden="true" className="sr-only">Enregistrer ma carte</button>
        <p className="text-sm font-semibold text-gris">
          {`${brouillon.sections.length} / ${LIMITES_CARTE.sections} sections · ${plats} / ${LIMITES_CARTE.elements} plats`}
        </p>
        <div key={reponse?.version ?? "depart"} className="grid gap-6">
          {brouillon.sections.map((section, i) => (
            <SectionEditeurCarte
              key={i}
              section={section}
              position={i}
              nombre={brouillon.sections.length}
              placeSurLaCarte={plats < LIMITES_CARTE.elements}
              focus={boutonFocus}
            />
          ))}
          {brouillon.sections.length === 0 && (
            <p className="rounded-2xl border-2 border-dashed border-encre bg-white px-5 py-4 font-semibold">
              {lierPonctuation("Ta carte est vide. Commence par une section (« Les plats », « À boire »…), puis ajoute tes plats.")}
            </p>
          )}
          <div>
            {brouillon.sections.length < LIMITES_CARTE.sections ? (
              <BoutonGesteCarte geste="ajouter-section" focus={boutonFocus} emoji="+" ajout>Ajouter une section</BoutonGesteCarte>
            ) : (
              <p className="text-sm font-semibold text-gris">{lierPonctuation(`Ta carte a déjà ${LIMITES_CARTE.sections} sections : c'est le maximum.`)}</p>
            )}
          </div>
        </div>
        {!sansJs && zoneMessage}
        <div>
          <Bouton type="submit" name="geste" value="enregistrer" className="w-full sm:w-auto sm:min-w-52">
            {enregistrement ? "Enregistrement…" : "Enregistrer ma carte"}
          </Bouton>
        </div>
      </ContexteFormulaire>
    </Form>
  );
}
