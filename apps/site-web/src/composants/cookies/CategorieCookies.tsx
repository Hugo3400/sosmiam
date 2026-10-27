import { Interrupteur } from "~/composants/interface/Interrupteur";
import { TEXTES_CONSENTEMENT_PAR_LANGUE, type CategorieConsentement } from "~/contenus/cookies-consentement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  categorie: CategorieConsentement;
  /** Préfixe des id (« bandeau » ou « page ») : le panneau et le formulaire de /cookies peuvent être sur la même page */
  prefixe: string;
  /** Interrupteur sur « Oui » au départ (le choix actuel) ; décoché sans choix */
  coche: boolean;
};

/** Une catégorie du panneau « Choisir » : nom, explication, interrupteur (ou « Toujours actifs »), et qui pose quoi. */
export function CategorieCookies({ categorie, prefixe, coche }: Props) {
  const T = utiliserTextes(TEXTES_CONSENTEMENT_PAR_LANGUE);
  const id = `${prefixe}-cookies-${categorie.id}`;
  const necessaires = categorie.id === "necessaires";
  const traceurs = categorie.partenaires.reduce((total, partenaire) => total + partenaire.traceurs.length, 0);
  return (
    <div className="rounded-2xl border-2 border-encre/15 bg-creme p-4">
      <div className="flex items-center justify-between gap-3">
        <p id={`${id}-nom`} className="font-titre text-lg leading-tight font-extrabold">{categorie.nom}</p>
        {necessaires ? (
          <p className="shrink-0 rounded-full bg-jaune-clair px-3 py-1 text-sm font-semibold">{T.toujoursActifs}</p>
        ) : (
          <Interrupteur id={id} nom="accepter" valeur={categorie.id} coche={coche} libelleId={`${id}-nom`} descriptionId={`${id}-explication`} oui={T.oui} non={T.non} />
        )}
      </div>
      <p id={`${id}-explication`} className="mt-1.5 text-sm text-gris">{lierPonctuation(categorie.explication)}</p>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-semibold underline decoration-jaune decoration-2 underline-offset-4">
          {T.voirPartenaires(categorie.partenaires.length, traceurs)}
        </summary>
        <ul className="mt-2 grid gap-3">
          {categorie.partenaires.map((partenaire) => (
            <li key={partenaire.nom}>
              <p>
                <strong>{partenaire.nom}</strong>{T.deuxPoints}{lierPonctuation(partenaire.role)}
                {partenaire.politique && (
                  <> <a href={partenaire.politique} className="underline underline-offset-2">{T.politique}</a></>
                )}
              </p>
              {partenaire.traceurs.length === 0 ? (
                <p className="text-gris">{T.aucunTraceur}</p>
              ) : (
                <ul className="mt-1 grid gap-1 text-gris">
                  {partenaire.traceurs.map((traceur) => (
                    <li key={traceur.nom}>
                      <code className="font-semibold break-all text-encre">{traceur.nom}</code>{T.deuxPoints}{lierPonctuation(traceur.finalite)} ({traceur.duree})
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
