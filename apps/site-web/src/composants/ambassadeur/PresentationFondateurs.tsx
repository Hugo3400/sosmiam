import { ListeCoches } from "~/composants/interface/ListeCoches";
import { Ecusson } from "~/composants/marque/Ecusson";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

// Seulement ce qui est décidé (onglet « Recrutement ambassadeurs » du document de Hugo, docs/decisions.md) : rien d'autre
const avantages = [
  { fort: "Une carte numérotée", suite: "de fondateur, de 1 à 10." },
  { fort: "Un autocollant « Déniché par »", suite: "à ton prénom, en vitrine." },
  { fort: "Des badges,", suite: "dont celui de fondateur." },
  { fort: "L'app en avant-première", suite: "en lien direct avec l'équipe." },
];

/** Ce que sont les 10 ambassadeurs fondateurs et ce qu'ils reçoivent, avant le formulaire de candidature. */
export function PresentationFondateurs() {
  return (
    <section aria-labelledby="fondateurs-titre" className="rounded-carte border-2 border-encre bg-jaune p-6 shadow-brut md:p-10">
      <div className="flex flex-wrap items-center gap-5">
        <Ecusson ruban="FONDATEUR" className="h-24 w-24 shrink-0 -rotate-6" />
        <div className="min-w-0 flex-1">
          <h2 id="fondateurs-titre" className="text-2xl font-extrabold">Les 10 fondateurs</h2>
          <p className="mt-1.5">
            {lierPonctuation("Ce sont les premiers ambassadeurs : ils dénichent les premières pépites et lancent SOS Miam avec nous, partout en France.")}
          </p>
        </div>
      </div>
      <h3 className="mt-7 mb-4 text-xl font-extrabold">Ce qu'ils reçoivent</h3>
      <ListeCoches elements={avantages.map(({ fort, suite }) => ({ fort: lierPonctuation(fort), suite }))} sombre />
      <p className="mt-6">
        {lierPonctuation("C'est un programme de passionnés : pas de rémunération, ni horaires ni objectifs. Pas retenu ? Tu restes ambassadeur et tu grimpes les niveaux, comme tout le monde.")}
      </p>
    </section>
  );
}
