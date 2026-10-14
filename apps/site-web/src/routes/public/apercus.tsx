import { CarteApercu } from "~/composants/apercus/CarteApercu";
import { EnPreparation } from "~/composants/apercus/EnPreparation";
import { InvitationDiscord } from "~/composants/apercus/InvitationDiscord";
import { Badge } from "~/composants/interface/Badge";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { APERCUS, PAGE_APERCUS } from "~/contenus/apercus";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Aperçus, pas des pages à trouver dans les moteurs : « noindex » en balise et en en-tête (et Disallow dans robots.txt) */
const ENTETES = { "X-Robots-Tag": "noindex" };

export function headers() {
  return ENTETES;
}

export function meta() {
  return [...creerMeta({ titre: PAGE_APERCUS.titreMeta, description: PAGE_APERCUS.descriptionMeta }), { name: "robots", content: "noindex" }];
}

/**
 * /preview (sosmiam.fr) : l'accueil des aperçus de ce qu'on prépare pour l'app, une carte par aperçu (contenus/apercus.ts).
 * Le Discord renvoie ici ; hors du menu, du pied de page et du plan du site. Aucune date, aucune promesse.
 */
export default function PageApercus() {
  return (
    <>
      <Section fond="creme">
        <div className="flex flex-col items-center text-center">
          <Badge className="mb-4">{lierPonctuation(PAGE_APERCUS.badge)}</Badge>
          <EnPreparation className="mb-8" />
          <TitreSection principal chapo={lierPonctuation(PAGE_APERCUS.chapo)}>{lierPonctuation(PAGE_APERCUS.titre)}</TitreSection>
        </div>
        <ul className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
          {APERCUS.map((apercu) => (
            <li key={apercu.adresse} className={APERCUS.length === 1 ? "sm:col-span-2 sm:mx-auto sm:w-full sm:max-w-md" : ""}>
              <CarteApercu apercu={apercu} lien={PAGE_APERCUS.lienCarte} />
            </li>
          ))}
        </ul>
      </Section>
      <InvitationDiscord titre={PAGE_APERCUS.avisTitre} texte={PAGE_APERCUS.avisTexte} bouton={PAGE_APERCUS.avisBouton} />
    </>
  );
}
