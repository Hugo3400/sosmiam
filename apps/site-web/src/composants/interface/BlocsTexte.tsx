import { TexteRiche } from "~/composants/interface/TexteRiche";
import type { BlocTexte } from "~/contenus/type-bloc-texte";

/** Affiche des blocs de texte : paragraphes et listes, avec **gras** et [liens](/adresse). */
export function BlocsTexte({ blocs }: { blocs: BlocTexte[] }) {
  return blocs.map((bloc, i) => {
    if (typeof bloc === "string") return <p key={i}><TexteRiche texte={bloc} /></p>;
    const Liste = bloc.numerotee ? "ol" : "ul";
    return (
      <Liste key={i} className={`grid gap-2 pl-[22px] ${bloc.numerotee ? "list-decimal" : "list-disc"}`}>
        {bloc.liste.map((element) => <li key={element}><TexteRiche texte={element} /></li>)}
      </Liste>
    );
  });
}
