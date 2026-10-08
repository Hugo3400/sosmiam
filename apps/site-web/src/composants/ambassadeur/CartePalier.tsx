import { BadgePalier, type NiveauPalier } from "~/composants/marque/BadgePalier";
import { paliersAmbassadeurs } from "~/contenus/ambassadeurs";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { PalierCompte } from "~/types/compte";

// Les paliers dans l'ordre (leur position donne le niveau du badge) et les points pour y arriver (docs/decisions.md) ;
// « Ambassadeur de ville » : jamais aux points, l'équipe le choisit parmi les fondateurs de la ville.
const paliers: { cle: PalierCompte; seuil: number | null }[] = [
  { cle: "curieux", seuil: 0 },
  { cle: "denicheur", seuil: 100 },
  { cle: "ambassadeur-quartier", seuil: 300 },
  { cle: "ambassadeur-ville", seuil: null },
];

const badgesConnus: Record<string, { emoji: string; nom: string }> = {
  "premier-sauveteur": { emoji: "🚀", nom: "Premier sauveteur" },
  "deniche-par-toi": { emoji: "🔎", nom: "Déniché par toi" },
  fondateur: { emoji: "🎖️", nom: "Fondateur" },
};

type Props = { palier: PalierCompte; points: number; badges: string[] };

/** Le palier de l'ambassadeur (badge du kit de marque), ses points, ce qu'il manque pour le suivant, et ses badges. */
export function CartePalier({ palier, points, badges }: Props) {
  const index = Math.max(0, paliers.findIndex((p) => p.cle === palier));
  const suivant = paliers[index + 1];
  const nomSuivant = paliersAmbassadeurs[index + 1]?.titre;
  const reste = suivant?.seuil != null ? suivant.seuil - points : null;

  let progression = "";
  if (points === 0) progression = "Les points arrivent avec l'app : pour l'instant, tout le monde démarre Curieux.";
  else if (reste !== null && reste > 0) progression = `Encore ${reste} point${reste > 1 ? "s" : ""} pour passer ${nomSuivant}.`;
  else if (suivant && suivant.seuil === null) {
    progression = `Le palier suivant, ${nomSuivant}, n'est pas une question de points : l'équipe le choisit parmi les fondateurs de ta ville.`;
  }

  return (
    <section aria-labelledby="titre-palier" className="self-start rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-8">
      <div className="flex flex-wrap items-center gap-5">
        <BadgePalier niveau={(index + 1) as NiveauPalier} className="h-24 w-24 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gris">Ton palier</p>
          <h2 id="titre-palier" className="text-3xl font-extrabold">{paliersAmbassadeurs[index]?.titre ?? "Curieux"}</h2>
          <p className="mt-1 text-lg"><strong className="font-titre text-2xl font-extrabold">{points}</strong> point{points > 1 ? "s" : ""}</p>
        </div>
      </div>
      {progression && <p className="mt-5 text-gris">{lierPonctuation(progression)}</p>}

      <h3 className="mt-6 text-lg font-extrabold">Tes badges</h3>
      {badges.length > 0 ? (
        <ul className="mt-2.5 flex flex-wrap gap-2">
          {badges.map((code) => {
            const badge = badgesConnus[code] ?? { emoji: "🏅", nom: code.charAt(0).toUpperCase() + code.slice(1).replaceAll("-", " ") };
            return (
              <li key={code} className="rounded-full border-2 border-encre bg-jaune-clair px-3.5 py-1.5 text-sm font-semibold">
                <span aria-hidden="true">{badge.emoji} </span>{badge.nom}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-1.5 text-gris">
          {lierPonctuation("Pas encore de badge. Par exemple, quand un lieu que tu as proposé rejoint SOS Miam, tu gagnes « Déniché par toi ».")}
        </p>
      )}
    </section>
  );
}
