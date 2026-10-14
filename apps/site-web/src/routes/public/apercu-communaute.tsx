import type { ReactNode } from "react";
import { Link } from "react-router";

import { BlocApercu } from "~/composants/apercus/BlocApercu";
import { EcranBoiteAIdees } from "~/composants/apercus/EcranBoiteAIdees";
import { EcranCommunaute } from "~/composants/apercus/EcranCommunaute";
import { EcranExplorer } from "~/composants/apercus/EcranExplorer";
import { EcranQuiEstLa } from "~/composants/apercus/EcranQuiEstLa";
import { EcranSortie } from "~/composants/apercus/EcranSortie";
import { EcranSorties } from "~/composants/apercus/EcranSorties";
import { EnPreparation } from "~/composants/apercus/EnPreparation";
import { InvitationDiscord } from "~/composants/apercus/InvitationDiscord";
import { SommaireApercu } from "~/composants/apercus/SommaireApercu";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Mascotte } from "~/composants/marque/Mascotte";
import { Section } from "~/composants/mise-en-page/Section";
import { BAS_COMMUNAUTE, BLOCS_COMMUNAUTE, HAUT_COMMUNAUTE, type IdBlocCommunaute } from "~/contenus/apercu-communaute";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Aperçu, pas une page à trouver dans les moteurs : « noindex » en balise et en en-tête (et Disallow dans robots.txt) */
const ENTETES = { "X-Robots-Tag": "noindex" };

/** L'écran dessiné de chaque bloc */
const ECRANS: Record<IdBlocCommunaute, ReactNode> = {
  communaute: <EcranCommunaute />,
  sorties: <EcranSorties />,
  places: <EcranSortie />,
  "qui-est-la": <EcranQuiEstLa />,
  idees: <EcranBoiteAIdees />,
  etiquettes: <EcranExplorer />,
};

export function headers() {
  return ENTETES;
}

export function meta() {
  return [...creerMeta({ titre: HAUT_COMMUNAUTE.titreMeta, description: HAUT_COMMUNAUTE.descriptionMeta }), { name: "robots", content: "noindex" }];
}

const classeLienRetour = "font-semibold underline decoration-jaune decoration-[3px] underline-offset-4 hover:decoration-encre";

/**
 * /preview/communaute (sosmiam.fr) : l'aperçu de l'Espace communauté de l'app, annoncé dans le salon « roadmap » du
 * Discord. Six blocs, chacun avec son écran dessiné. En préparation : aucune date, aucune promesse (tests/apercus.test.ts).
 * Hors du menu, du pied de page et du plan du site.
 */
export default function PageApercuCommunaute() {
  return (
    <>
      <Section fond="creme">
        <Link to="/preview" className={`mb-8 inline-block text-[.95rem] ${classeLienRetour}`}>
          ← {lierPonctuation(HAUT_COMMUNAUTE.retour)}
        </Link>
        <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <EnPreparation className="mb-6" />
            <TitreSection principal aGauche chapo={lierPonctuation(HAUT_COMMUNAUTE.chapo)}>
              {lierPonctuation(HAUT_COMMUNAUTE.titre)}
            </TitreSection>
          </div>
          <Mascotte expression="clin" className="hidden h-44 w-44 md:block lg:h-56 lg:w-56" />
        </div>
        <p className="-mt-8 text-[.95rem] font-semibold text-gris">{lierPonctuation(HAUT_COMMUNAUTE.exemples)}</p>
        <SommaireApercu titre={HAUT_COMMUNAUTE.sommaire} blocs={BLOCS_COMMUNAUTE} />
      </Section>

      {BLOCS_COMMUNAUTE.map((bloc, rang) => (
        <BlocApercu key={bloc.id} bloc={bloc} numero={rang + 1} ecran={ECRANS[bloc.id]} />
      ))}

      <InvitationDiscord
        titre={BAS_COMMUNAUTE.titre}
        texte={BAS_COMMUNAUTE.texte}
        bouton={BAS_COMMUNAUTE.bouton}
        rappel={BAS_COMMUNAUTE.rappel}
        autreLien={<Link to="/preview" className={classeLienRetour}>{lierPonctuation(HAUT_COMMUNAUTE.retour)}</Link>}
      />
    </>
  );
}
