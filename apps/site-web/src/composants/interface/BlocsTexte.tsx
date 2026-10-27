import { TableauTexte } from "~/composants/interface/TableauTexte";
import { TexteRiche } from "~/composants/interface/TexteRiche";
import type { BlocTexte } from "~/contenus/type-bloc-texte";

/** Affiche des blocs de texte : paragraphes, listes et tableaux, avec **gras** et [liens](/adresse). */
export function BlocsTexte({ blocs }: { blocs: readonly BlocTexte[] }) {
  return blocs.map((bloc, i) => {
    if (typeof bloc === "string") return <p key={i}><TexteRiche texte={bloc} /></p>;
    if ("tableau" in bloc) return <TableauTexte key={i} tableau={bloc.tableau} />;
    const Liste = bloc.numerotee ? "ol" : "ul";
    return (
      <Liste key={i} className={`grid gap-2 pl-[22px] ${bloc.numerotee ? "list-decimal" : "list-disc"}`}>
        {bloc.liste.map((element) => <li key={element}><TexteRiche texte={element} /></li>)}
      </Liste>
    );
  });
}
