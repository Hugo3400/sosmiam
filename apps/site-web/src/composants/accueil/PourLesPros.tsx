import { Badge } from "~/composants/interface/Badge";
import { Bouton } from "~/composants/interface/Bouton";
import { ListeCoches } from "~/composants/interface/ListeCoches";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { CarteToutGratuit } from "~/composants/pro/CarteToutGratuit";
import { TEXTES_PROS_PAR_LANGUE } from "~/contenus/pros";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Section pour les lieux : ce que SOS Miam leur apporte, gratuitement. */
export function PourLesPros() {
  const T = utiliserTextes(TEXTES_PROS_PAR_LANGUE);
  const lien = utiliserLienLangue();
  return (
    <Section id="pros">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <Badge variante="alerte" className="mb-5">{T.badge}</Badge>
          <TitreSection aGauche>
            {T.titre.haut}
            <br />
            {T.titre.bas}
          </TitreSection>
          <div className="mt-8 mb-9">
            <ListeCoches elements={[...T.avantages]} />
          </div>
          <Bouton vers={lien("/inscrire-mon-lieu")}>{T.bouton}</Bouton>
        </div>

        <CarteToutGratuit />
      </div>
    </Section>
  );
}
