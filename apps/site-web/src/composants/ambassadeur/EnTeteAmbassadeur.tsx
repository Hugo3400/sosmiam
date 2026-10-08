import { Link } from "react-router";

import { BoutonDeconnexion } from "~/composants/compte/BoutonDeconnexion";
import { Bouton } from "~/composants/interface/Bouton";
import { Logo } from "~/composants/interface/Logo";

const classeLien = "font-medium whitespace-nowrap decoration-jaune decoration-[3px] underline-offset-4 hover:underline";

/**
 * En-tête de l'espace ambassadeur : le logo mène au programme ; connecté, « Mon espace » et « Se déconnecter » ; sinon
 * « Se connecter » et « Devenir ambassadeur ». Sur téléphone, les liens passent sur une deuxième ligne.
 */
export function EnTeteAmbassadeur({ connecte }: { connecte: boolean }) {
  return (
    <header className="border-b border-encre/5 bg-creme">
      <div className="mx-auto flex w-[min(1120px,100%-32px)] flex-wrap items-center gap-x-6 gap-y-3 py-3.5 sm:min-h-[72px]">
        <Link to="/programme" aria-label="SOS Miam Ambassadeurs, le programme" className="flex items-center gap-2.5">
          <Logo className="h-9 w-auto sm:h-10" />
          <span aria-hidden="true" className="rounded-full bg-encre px-2.5 py-1 text-xs font-bold tracking-wide text-jaune">Ambassadeurs</span>
        </Link>
        <a href="https://sosmiam.fr" className={`ml-auto text-sm ${classeLien}`}>
          <span aria-hidden="true">←</span> sosmiam.fr
        </a>
        <nav aria-label="Espace ambassadeur" className="w-full sm:w-auto">
          <ul className="flex items-center justify-between gap-5 sm:justify-end">
            {connecte ? (
              <>
                <li><Link to="/espace" className={classeLien}>Mon espace</Link></li>
                <li><BoutonDeconnexion discret /></li>
              </>
            ) : (
              <>
                <li><Link to="/connexion" className={classeLien}>Se connecter</Link></li>
                <li><Bouton vers="/inscription" petit className="whitespace-nowrap">Devenir ambassadeur</Bouton></li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
