import { useLocation } from "react-router";

import { PanneauChoixCookies } from "~/composants/cookies/PanneauChoixCookies";
import { calculerFinConsentement } from "~/fonctions/consentement/calculer-fin-consentement";
import { ecrireRetourConsentement } from "~/fonctions/consentement/ecrire-retour-consentement";
import { formaterJourEnLettres } from "~/fonctions/dates/formater-jour-en-lettres";
import { utiliserConsentement } from "~/hooks/utiliser-consentement";

const jourParis = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });

/** « 14 octobre 2026 » (jour de Paris) */
function enLettres(date: number): string {
  return formaterJourEnLettres(jourParis.format(date)) ?? "";
}

/**
 * Le formulaire de /cookies#mes-choix, sous le texte de « Gérer mes cookies » : les mêmes choix que le panneau, dans un
 * formulaire POST qui marche aussi sans JavaScript, et l'état du choix actuel. Rien tant qu'aucune catégorie n'est active
 * (le texte de la page le dit : rien à accepter ni à refuser).
 */
export function ReglagesCookies() {
  const { aChoisir, choix, actionFormulaire, envoyerFormulaire, apercu } = utiliserConsentement();
  const location = useLocation();
  if (aChoisir.length === 0) return null;
  const etat = choix
    ? `Ton choix du ${enLettres(choix.date)} vaut jusqu'au ${enLettres(calculerFinConsentement(choix.date))} : ensuite, on te reposera la question.`
    : "Tu n'as encore rien choisi : tant que tu ne dis rien, c'est non.";
  return (
    <form
      key={choix?.date ?? 0}
      method="post"
      action={actionFormulaire}
      onSubmit={envoyerFormulaire}
      className="rounded-carte border-2 border-encre bg-white p-5 text-encre shadow-brut sm:p-6"
    >
      <input type="hidden" name="retour" value={ecrireRetourConsentement(location.pathname, location.search, "#mes-choix")} />
      {apercu && <p className="mb-3 rounded-xl bg-rose-alerte px-3 py-2 text-sm font-semibold text-rouge-texte">Aperçu : le partenaire est imaginaire.</p>}
      <p role="status" className="mb-4 font-semibold">{etat}</p>
      <PanneauChoixCookies prefixe="page" Titre="h4" />
    </form>
  );
}
