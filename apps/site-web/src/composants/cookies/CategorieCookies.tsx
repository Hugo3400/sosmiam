import { Interrupteur } from "~/composants/interface/Interrupteur";
import { textesConsentement, type CategorieConsentement } from "~/contenus/cookies-consentement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  categorie: CategorieConsentement;
  /** Préfixe des id (« bandeau » ou « page ») : le panneau et le formulaire de /cookies peuvent être sur la même page */
  prefixe: string;
  /** Interrupteur sur « Oui » au départ (le choix actuel) ; décoché sans choix */
  coche: boolean;
};

/** Une catégorie du panneau « Choisir » : nom, explication, interrupteur (ou « Toujours actifs »), et qui pose quoi. */
export function CategorieCookies({ categorie, prefixe, coche }: Props) {
  const id = `${prefixe}-cookies-${categorie.id}`;
  const necessaires = categorie.id === "necessaires";
  const traceurs = categorie.partenaires.reduce((total, partenaire) => total + partenaire.traceurs.length, 0);
  return (
    <div className="rounded-2xl border-2 border-encre/15 bg-creme p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p id={`${id}-nom`} className="font-titre text-lg font-extrabold">{categorie.nom}</p>
          <p id={`${id}-explication`} className="mt-1 text-sm text-gris">{lierPonctuation(categorie.explication)}</p>
        </div>
        {necessaires ? (
          <p className="shrink-0 rounded-full bg-jaune-clair px-3 py-1 text-sm font-semibold">{textesConsentement.toujoursActifs}</p>
        ) : (
          <Interrupteur id={id} nom="accepter" valeur={categorie.id} coche={coche} libelleId={`${id}-nom`} descriptionId={`${id}-explication`} />
        )}
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-semibold underline decoration-jaune decoration-2 underline-offset-4">
          {textesConsentement.voirPartenaires} ({categorie.partenaires.length} {categorie.partenaires.length > 1 ? "partenaires" : "partenaire"},{" "}
          {traceurs} {traceurs > 1 ? "traceurs" : "traceur"})
        </summary>
        <ul className="mt-2 grid gap-3">
          {categorie.partenaires.map((partenaire) => (
            <li key={partenaire.nom}>
              <p>
                <strong>{partenaire.nom}</strong> : {lierPonctuation(partenaire.role)}
                {partenaire.politique && (
                  <> <a href={partenaire.politique} className="underline underline-offset-2">Sa politique de confidentialité</a></>
                )}
              </p>
              {partenaire.traceurs.length === 0 ? (
                <p className="text-gris">Aucun cookie, aucun traceur.</p>
              ) : (
                <ul className="mt-1 grid gap-1 text-gris">
                  {partenaire.traceurs.map((traceur) => (
                    <li key={traceur.nom}>
                      <code className="font-semibold break-all text-encre">{traceur.nom}</code> : {lierPonctuation(traceur.finalite)} ({traceur.duree})
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
