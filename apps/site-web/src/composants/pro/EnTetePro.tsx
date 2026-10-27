import { Link, NavLink } from "react-router";

import { BoutonDeconnexion } from "~/composants/compte/BoutonDeconnexion";
import { Bouton } from "~/composants/interface/Bouton";
import { Logo } from "~/composants/interface/Logo";
import { MARQUE_PRO, NOM_MIAM_SAFE, TEXTES_CADRE_PRO_PAR_LANGUE } from "~/contenus/cadre-pro";
import { ecrireAdresseSitePrincipal } from "~/fonctions/hotes/ecrire-adresse-site-principal";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

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
  const T = utiliserTextes(TEXTES_CADRE_PRO_PAR_LANGUE);
  const L = T.liens;
  const langue = utiliserLangue();
  const lien = utiliserLienLangue();
  return (
    <header className="border-b border-encre/5 bg-creme print:hidden">
      <div className="mx-auto flex w-[min(1120px,100%-32px)] flex-wrap items-center gap-x-4 gap-y-3 py-3.5 sm:min-h-[72px] sm:gap-x-6">
        <Link to={connecte ? "/tableau" : lien("/bienvenue")} aria-label={T.logo} className="flex items-center gap-2 sm:gap-2.5">
          <Logo className="h-8 w-auto sm:h-10" />
          <span aria-hidden="true" className="font-titre text-lg font-extrabold text-gris">·</span>
          <span aria-hidden="true" className="rounded-full bg-encre px-2 py-0.5 text-[11px] font-bold tracking-wide text-jaune sm:px-2.5 sm:py-1 sm:text-xs">{MARQUE_PRO}</span>
        </Link>
        <a href={ecrireAdresseSitePrincipal("/", langue)} className={`ml-auto text-sm ${classeLien}`}>
          <span aria-hidden="true">←</span> sosmiam.fr
        </a>
        <nav aria-label={T.navigation} className="w-full lg:w-auto">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2.5 lg:justify-end">
            {connecte ? (
              <>
                <li><NavLink to="/tableau" className={classeLienMenu}>{L.tableau}</NavLink></li>
                {lieu && (
                  <>
                    <li><NavLink to={lieu} end className={classeLienMenu}>{L.fiche}</NavLink></li>
                    <li><NavLink to={`${lieu}/carte`} className={classeLienMenu}>{L.carte}</NavLink></li>
                    <li><NavLink to={`${lieu}/suggestions`} className={classeLienMenu}>{L.suggestions}</NavLink></li>
                    {lieuMenu?.gerant && <li><NavLink to={`${lieu}/equipe`} className={classeLienMenu}>{L.equipe}</NavLink></li>}
                    <li><NavLink to={`${lieu}/affichette`} className={classeLienMenu}>{L.affichette}</NavLink></li>
                    <li><NavLink to={`${lieu}/miam-safe`} className={classeLienMenu}>{NOM_MIAM_SAFE}</NavLink></li>
                    <li><NavLink to={`${lieu}/kit`} className={classeLienMenu}>{L.kit}</NavLink></li>
                  </>
                )}
                <li><NavLink to="/mon-compte" className={classeLienMenu}>{L.monCompte}</NavLink></li>
                <li className="ml-auto lg:ml-0"><BoutonDeconnexion discret /></li>
              </>
            ) : (
              <>
                <li><NavLink to="/connexion" className={classeLienMenu}>{L.connexion}</NavLink></li>
                <li className="ml-auto lg:ml-0"><Bouton vers="/inscription" petit className="whitespace-nowrap">{L.creerCompte}</Bouton></li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
