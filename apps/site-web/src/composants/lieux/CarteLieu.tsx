import type { LieuExemple } from "~/contenus/lieux-exemples";

type Props = {
  lieu: LieuExemple;
  sauve: boolean;
  onRescousse: () => void;
};

/** Carte d'un lieu : visuel, nom, quartier, compteur et bouton « À la rescousse ! ». */
export function CarteLieu({ lieu, sauve, onRescousse }: Props) {
  const total = lieu.rescousses + (sauve ? 1 : 0);
  return (
    <article className="flex flex-col overflow-hidden rounded-carte bg-white shadow-douce transition-transform duration-200 hover:-translate-y-1.5">
      <div className="relative grid h-40 place-items-center text-6xl"
        style={{ background: `linear-gradient(135deg, ${lieu.couleurs[0]}, ${lieu.couleurs[1]})` }}>
        {lieu.alerte && (
          <span className="absolute top-3 left-3 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-rouge-texte">{lieu.alerte}</span>
        )}
        <span aria-hidden="true">{lieu.emoji}</span>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-5 pt-4 pb-5">
        <h3 className="text-xl font-extrabold">{lieu.nom}</h3>
        <p className="text-sm text-gris">📍 {lieu.quartier}, {lieu.ville} · {lieu.info}</p>
        <div className="mt-auto flex items-center justify-between pt-3.5">
          <span className="text-sm font-semibold">🛟 {total}</span>
          <button
            type="button"
            onClick={onRescousse}
            aria-pressed={sauve}
            className={`rounded-full border-2 border-encre px-3.5 py-2 text-sm font-semibold transition-transform hover:scale-105
              ${sauve ? "bg-encre text-jaune" : "bg-jaune text-encre"}`}
          >
            {sauve ? "Sauvé ✓" : "À la rescousse !"}
          </button>
        </div>
      </div>
    </article>
  );
}
