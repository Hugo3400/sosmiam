import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { lienEcrireNous } from "~/contenus/carriere";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const textes = {
  introuvable: {
    titre: "Cette offre a pris le large",
    texte: "Elle est peut-être déjà pourvue, ou elle n'a jamais existé. Si tu étais en train de candidater, rien n'est parti : jette un œil aux autres offres.",
  },
  indisponible: {
    titre: "Les offres font une petite sieste",
    texte: "Notre serveur ne répond pas pour l'instant. Repasse dans un instant, ou écris-nous.",
  },
};

export function OffreAbsente({ cas }: { cas: keyof typeof textes }) {
  const { titre, texte } = textes[cas];
  return (
    <section className="bg-creme py-16 md:py-24">
      <div className="mx-auto flex w-[min(760px,100%-32px)] flex-col items-center rounded-carte border-2 border-encre bg-white px-6 py-10 text-center shadow-brut md:px-12">
        <Mascotte expression="surprise" className="h-28 w-28" />
        <h1 className="mt-4 text-[clamp(2rem,5vw,2.8rem)] font-extrabold tracking-tight">{lierPonctuation(titre)}</h1>
        <p className="mt-3 max-w-lg text-lg text-gris">{lierPonctuation(texte)}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Bouton vers="/carriere" variante="encre">Voir les offres</Bouton>
          <Bouton href={lienEcrireNous} variante="blanc">Écris-nous</Bouton>
        </div>
      </div>
    </section>
  );
}
