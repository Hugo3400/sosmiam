import { JaugeMobilisation } from "~/composants/big-sos/JaugeMobilisation";
import { Badge } from "~/composants/interface/Badge";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { contenuPageBigSos, etapesBigSos } from "~/contenus/etapes";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Le BIG SOS expliqué sur l'accueil : le parcours d'une demande et ce qu'on trouve sur la page du lieu. */
export function BigSosEnBref() {
  return (
    <Section id="big-sos" fond="encre">
      <div className="grid items-start gap-12 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <Badge variante="alerte" className="mb-5">🆘 BIG SOS</Badge>
          <TitreSection
            aGauche
            clair
            chapo={lierPonctuation("Travaux devant la porte, grosse baisse de clients, coup dur : quand un lieu indépendant traverse une vraie galère, il passe à la une de l'app pendant 7\u00a0jours. Le but : remplir la salle, ensemble.")}
          >
            Un coup dur ? Tout le quartier à la rescousse.
          </TitreSection>

          <ol className="grid gap-5">
            {etapesBigSos.map((etape, i) => (
              <li key={etape.titre} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-jaune font-titre text-lg font-extrabold text-encre">{i + 1}</span>
                <div>
                  <h3 className="text-xl font-extrabold">{etape.titre}</h3>
                  <p className="text-creme/75">{lierPonctuation(etape.texte)}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-creme/75 sm:pl-14">
            <strong className="text-creme">Et après ?</strong> On fait le bilan ensemble, et le lieu garde sa page, ses vidéos et ses nouveaux habitués.
          </p>
        </div>

        <div className="rounded-carte border-2 border-encre bg-creme p-6 text-encre shadow-brut-jaune md:p-8">
          <p className="font-titre text-sm font-extrabold tracking-wide text-rouge-texte uppercase">Sur sa page, pendant 7 jours</p>
          <ul className="mt-4 grid gap-3.5">
            {contenuPageBigSos.map((element) => (
              <li key={element.texte} className="flex items-start gap-3">
                <span aria-hidden="true" className="text-2xl leading-none">{element.emoji}</span>
                <span>{element.texte}</span>
              </li>
            ))}
          </ul>
          <JaugeMobilisation className="mt-7" actuel={204} objectif={300} unite="visites" duree="7 jours" />
          <p className="mt-1 text-xs text-gris">Exemple d'objectif, pour te montrer la jauge.</p>
        </div>
      </div>

      <p className="mt-12 rounded-carte border-2 border-dashed border-creme/30 px-5 py-4 text-center text-creme/85">
        💬 Le lieu raconte son histoire lui-même et valide tout ce qui est dit : pour donner envie de venir, jamais pour faire pitié.
      </p>
    </Section>
  );
}
