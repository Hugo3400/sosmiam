import { Link, NavLink } from "react-router";

import { BoutonDeconnexion } from "~/composants/compte/BoutonDeconnexion";
import { Bouton } from "~/composants/interface/Bouton";
import { Logo } from "~/composants/interface/Logo";

const classeLien = "font-medium whitespace-nowrap decoration-jaune decoration-[3px] underline-offset-4 hover:underline";
// La page où l'on est (aria-current="page", posé par NavLink) reste soulignée
const classeLienMenu = `${classeLien} aria-[current=page]:underline`;

type Props = {
  connecte: boolean;
  /** Le lieu des liens « Ma fiche », « Suggestions »… (celui de la page, sinon le premier lieu vérifié) ; null : aucun */
  lieuMenu: { id: number; gerant: boolean } | null;
};

/**
 * En-tête de l'espace pro : « SOS Miam · pro ». Connecté : Tableau, puis, dès qu'un lieu est à toi, Ma fiche, Ma carte,
 * Suggestions, Mon équipe (gérant seulement) et Affichette, puis Mon compte et « Se déconnecter » ; sinon « Se connecter » et « Créer mon compte ». Sur
 * téléphone, le menu passe sous le logo et revient à la ligne (jamais de défilement de côté).
 */
export function EnTetePro({ connecte, lieuMenu }: Props) {
  const lieu = lieuMenu === null ? null : `/lieu/${lieuMenu.id}`;
  return (
    <header className="border-b border-encre/5 bg-creme print:hidden">
      <div className="mx-auto flex w-[min(1120px,100%-32px)] flex-wrap items-center gap-x-4 gap-y-3 py-3.5 sm:min-h-[72px] sm:gap-x-6">
        <Link to={connecte ? "/tableau" : "/bienvenue"} aria-label="SOS Miam pro, l'espace des lieux" className="flex items-center gap-2 sm:gap-2.5">
          <Logo className="h-8 w-auto sm:h-10" />
          <span aria-hidden="true" className="font-titre text-lg font-extrabold text-gris">·</span>
          <span aria-hidden="true" className="rounded-full bg-encre px-2 py-0.5 text-[11px] font-bold tracking-wide text-jaune sm:px-2.5 sm:py-1 sm:text-xs">pro</span>
        </Link>
        <a href="https://sosmiam.fr" className={`ml-auto text-sm ${classeLien}`}>
          <span aria-hidden="true">←</span> sosmiam.fr
        </a>
        <nav aria-label="Espace pro" className="w-full lg:w-auto">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2.5 lg:justify-end">
            {connecte ? (
              <>
                <li><NavLink to="/tableau" className={classeLienMenu}>Tableau</NavLink></li>
                {lieu && (
                  <>
                    <li><NavLink to={lieu} end className={classeLienMenu}>Ma fiche</NavLink></li>
                    <li><NavLink to={`${lieu}/carte`} className={classeLienMenu}>Ma carte</NavLink></li>
                    <li><NavLink to={`${lieu}/suggestions`} className={classeLienMenu}>Suggestions</NavLink></li>
                    {lieuMenu?.gerant && <li><NavLink to={`${lieu}/equipe`} className={classeLienMenu}>Mon équipe</NavLink></li>}
                    <li><NavLink to={`${lieu}/affichette`} className={classeLienMenu}>Affichette</NavLink></li>
                    <li><NavLink to={`${lieu}/miam-safe`} className={classeLienMenu}>Miam Safe</NavLink></li>
                  </>
                )}
                <li><NavLink to="/mon-compte" className={classeLienMenu}>Mon compte</NavLink></li>
                <li className="ml-auto lg:ml-0"><BoutonDeconnexion discret /></li>
              </>
            ) : (
              <>
                <li><NavLink to="/connexion" className={classeLienMenu}>Se connecter</NavLink></li>
                <li className="ml-auto lg:ml-0"><Bouton vers="/inscription" petit className="whitespace-nowrap">Créer mon compte</Bouton></li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
