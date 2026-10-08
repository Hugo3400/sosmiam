import { reglesKitMedia } from "~/contenus/kit-media";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const colonnes = [
  { titre: "Tu peux", regles: reglesKitMedia.peux, signe: "✓", fond: "bg-jaune-clair", pastille: "bg-jaune text-encre" },
  { titre: "Tu ne peux pas", regles: reglesKitMedia.peuxPas, signe: "✕", fond: "bg-rose-alerte", pastille: "bg-encre text-white" },
];

/** Les règles du kit de marque : ce que tu peux faire, et ce que tu ne peux pas faire. */
export function ReglesKit() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {colonnes.map((colonne) => (
        <div key={colonne.titre} className={`rounded-carte border-2 border-encre p-6 ${colonne.fond}`}>
          <h3 className="mb-4 text-xl font-extrabold">{colonne.titre}</h3>
          <ul className="grid gap-3">
            {colonne.regles.map((regle) => (
              <li key={regle} className="relative pl-9">
                <span aria-hidden="true" className={`absolute top-0.5 left-0 grid size-6 place-items-center rounded-full text-sm font-extrabold ${colonne.pastille}`}>
                  {colonne.signe}
                </span>
                {lierPonctuation(regle)}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
