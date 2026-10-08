import { useState } from "react";

import { TitreSection } from "~/composants/interface/TitreSection";
import { CarteLieu } from "~/composants/lieux/CarteLieu";
import { PictoCategorie } from "~/composants/marque/PictoCategorie";
import { Section } from "~/composants/mise-en-page/Section";
import { lieuxExemples, typesLieux, type TypeLieu } from "~/contenus/lieux-exemples";

const RESCOUSSES_PAR_SEMAINE = 3;

/** Démo des lieux à aider, filtrables par type, avec 3 rescousses à donner. */
export function IlsOntBesoinDeToi() {
  const [filtre, setFiltre] = useState<TypeLieu | "tous">("tous");
  const [sauves, setSauves] = useState<number[]>([]);
  // Le compteur change à chaque action : le même message est réannoncé par les lecteurs d'écran
  const [annonce, setAnnonce] = useState({ texte: "", n: 0 });
  const annoncer = (texte: string) => setAnnonce((a) => ({ texte, n: a.n + 1 }));

  const lieux = lieuxExemples.filter((lieu) => filtre === "tous" || lieu.type === filtre);

  function basculerRescousse(id: number) {
    if (sauves.includes(id)) {
      setSauves(sauves.filter((s) => s !== id));
      annoncer("Rescousse annulée.");
      return;
    }
    if (sauves.length >= RESCOUSSES_PAR_SEMAINE) {
      annoncer("Plus de rescousse cette semaine, reviens lundi ! 🛟");
      return;
    }
    const restantes = RESCOUSSES_PAR_SEMAINE - sauves.length - 1;
    setSauves([...sauves, id]);
    annoncer(restantes > 0 ? `Merci ! Il te reste ${restantes} rescousse${restantes > 1 ? "s" : ""} cette semaine.` : "Dernière rescousse donnée, merci héros ! 🦸");
  }

  return (
    <Section id="adresses" fond="creme">
      <TitreSection chapo="Des lieux nouveaux ou trop calmes, choisis par la communauté.">Ils ont besoin de toi</TitreSection>

      <div className="mb-9 flex flex-wrap justify-center gap-2.5" role="group" aria-label="Filtrer les lieux">
        {typesLieux.map((type) => (
          <button
            key={type.valeur}
            type="button"
            aria-pressed={filtre === type.valeur}
            onClick={() => setFiltre(type.valeur)}
            className={`flex items-center gap-2 rounded-full border-2 border-encre py-2.5 text-[.95rem] font-semibold transition-colors
              ${type.valeur === "tous" ? "px-5" : "pr-5 pl-2.5"}
              ${filtre === type.valeur ? "bg-encre text-jaune" : "bg-white hover:bg-jaune-clair"}`}
          >
            {type.valeur !== "tous" && <PictoCategorie type={type.valeur} className="h-7 w-7 shrink-0" />}
            {type.libelle}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6">
        {lieux.map((lieu) => (
          <CarteLieu key={lieu.id} lieu={lieu} sauve={sauves.includes(lieu.id)} onRescousse={() => basculerRescousse(lieu.id)} />
        ))}
      </div>

      <p className="mt-6 min-h-6 text-center font-semibold" role="status" aria-live="polite"><span key={annonce.n}>{annonce.texte}</span></p>
      <p className="mt-2 text-center text-sm text-gris">Ces lieux sont des exemples pour te montrer le principe : les vrais arrivent avec le lancement.</p>
    </Section>
  );
}
