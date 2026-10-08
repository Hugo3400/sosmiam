import { Link, NavLink } from "react-router";

import { BoutonDeconnexion } from "~/composants/compte/BoutonDeconnexion";
import { Bouton } from "~/composants/interface/Bouton";
import { Logo } from "~/composants/interface/Logo";

const classeLien = "font-medium whitespace-nowrap decoration-jaune decoration-[3px] underline-offset-4 hover:underline";
// La page où l'on est (aria-current="page", posé par NavLink) reste soulignée
const classeLienMenu = `${classeLien} aria-[current=page]:underline`;

/**
 * En-tête de l'espace ambassadeur : le logo mène au programme ; connecté, « Mon espace » et « Se déconnecter » ; sinon
 * « Se connecter » et « Devenir ambassadeur ». Sur téléphone, les liens passent sur une deuxième ligne (le bouton sur
 * une troisième sur les tout petits écrans, ou avec le texte agrandi : jamais de défilement de côté).
 */
export function EnTeteAmbassadeur({ connecte }: { connecte: boolean }) {
  return (
    <header className="border-b border-encre/5 bg-creme">
      <div className="mx-auto flex w-[min(1120px,100%-32px)] flex-wrap items-center gap-x-4 gap-y-3 py-3.5 sm:min-h-[72px] sm:gap-x-6">
        <Link to="/programme" aria-label="SOS Miam Ambassadeurs, le programme" className="flex items-center gap-2 sm:gap-2.5">
          <Logo className="h-8 w-auto sm:h-10" />
          <span aria-hidden="true" className="rounded-full bg-encre px-2 py-0.5 text-[11px] font-bold tracking-wide text-jaune sm:px-2.5 sm:py-1 sm:text-xs">Ambassadeurs</span>
        </Link>
        <a href="https://sosmiam.fr" className={`ml-auto text-sm ${classeLien}`}>
          <span aria-hidden="true">←</span> sosmiam.fr
        </a>
        <nav aria-label="Espace ambassadeur" className="w-full sm:w-auto">
          <ul className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 sm:justify-end">
            {connecte ? (
              <>
                <li><NavLink to="/espace" end className={classeLienMenu}>Mon espace</NavLink></li>
                <li><BoutonDeconnexion discret /></li>
              </>
            ) : (
              <>
                <li><NavLink to="/connexion" className={classeLienMenu}>Se connecter</NavLink></li>
                <li><Bouton vers="/inscription" petit className="whitespace-nowrap">Devenir ambassadeur</Bouton></li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
