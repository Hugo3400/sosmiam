import { useLocation } from "react-router";

import { ecrireDateLangue } from "../../../../../packages/commun/src/fonctions/langue/ecrire-date-langue.ts";
import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { PanneauChoixCookies } from "~/composants/cookies/PanneauChoixCookies";
import { TEXTES_CONSENTEMENT_PAR_LANGUE } from "~/contenus/cookies-consentement";
import { calculerFinConsentement } from "~/fonctions/consentement/calculer-fin-consentement";
import { ecrireRetourConsentement } from "~/fonctions/consentement/ecrire-retour-consentement";
import { utiliserConsentement } from "~/hooks/utiliser-consentement";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const jourParis = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });

function enLettres(date: number, langue: Langue): string {
  const [annee, mois, jour] = jourParis.format(date).split("-").map(Number);
  return ecrireDateLangue({ annee, mois, jour }, langue);
}

/**
 * Le formulaire de /cookies#mes-choix, sous le texte de « Gérer mes cookies » : les mêmes choix que le panneau, dans un
 * formulaire POST qui marche aussi sans JavaScript, et l'état du choix actuel. Rien tant qu'aucune catégorie n'est active
 * (le texte de la page le dit : rien à accepter ni à refuser).
 */
export function ReglagesCookies() {
  const { aChoisir, choix, actionFormulaire, envoyerFormulaire, apercu } = utiliserConsentement();
  const location = useLocation();
  const T = utiliserTextes(TEXTES_CONSENTEMENT_PAR_LANGUE);
  const langue = utiliserLangue();
  if (aChoisir.length === 0) return null;
  const etat = choix ? T.choixValable(enLettres(choix.date, langue), enLettres(calculerFinConsentement(choix.date), langue)) : T.sansChoix;
  return (
    <form
      key={choix?.date ?? 0}
      method="post"
      action={actionFormulaire}
      onSubmit={envoyerFormulaire}
      className="rounded-carte border-2 border-encre bg-white p-5 text-encre shadow-brut sm:p-6"
    >
      <input type="hidden" name="retour" value={ecrireRetourConsentement(location.pathname, location.search, "#mes-choix")} />
      {apercu && <p className="mb-3 rounded-xl bg-rose-alerte px-3 py-2 text-sm font-semibold text-rouge-texte">{T.apercuReglages}</p>}
      <p role="status" className="mb-4 font-semibold">{etat}</p>
      <PanneauChoixCookies prefixe="page" Titre="h4" />
    </form>
  );
}
