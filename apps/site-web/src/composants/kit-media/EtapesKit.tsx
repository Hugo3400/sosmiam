import { etapesKitMedia } from "~/contenus/kit-media";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** « Comment ça marche ? » : les trois étapes, de l'image au post. */
export function EtapesKit() {
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {etapesKitMedia.map((etape, i) => (
        <li key={etape} className="flex items-start gap-4 rounded-carte border-2 border-encre bg-white p-5">
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-jaune font-titre text-xl font-extrabold">
            {i + 1}
          </span>
          <p className="pt-1.5 font-semibold">{lierPonctuation(etape)}</p>
        </li>
      ))}
    </ol>
  );
}
