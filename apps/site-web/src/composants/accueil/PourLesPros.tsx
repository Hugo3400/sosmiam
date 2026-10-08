import { Badge } from "~/composants/interface/Badge";
import { Bouton } from "~/composants/interface/Bouton";
import { ListeCoches } from "~/composants/interface/ListeCoches";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { CarteToutGratuit } from "~/composants/pro/CarteToutGratuit";
import { avantagesPro } from "~/contenus/pros";

/** Section pour les lieux : ce que SOS Miam leur apporte, gratuitement. */
export function PourLesPros() {
  return (
    <Section id="pros">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <Badge variante="alerte" className="mb-5">🍽️ Pour les pros</Badge>
          <TitreSection aGauche>
            Ta salle est trop calme ?
            <br />
            Lance un SOS.
          </TitreSection>
          <div className="mt-8 mb-9">
            <ListeCoches elements={avantagesPro} />
          </div>
          <Bouton vers="/inscrire-mon-lieu">Inscrire mon lieu</Bouton>
          <p className="mt-4 text-sm text-gris">À Montpellier et dans l'Hérault, on peut même passer créer ta fiche avec toi.</p>
        </div>

        <CarteToutGratuit />
      </div>
    </Section>
  );
}
