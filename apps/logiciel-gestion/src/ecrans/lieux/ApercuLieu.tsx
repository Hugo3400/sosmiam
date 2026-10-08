import type { SaisieLieu } from "~/services/lieux.ts";

/** Aperçu de la carte du lieu, comme dans l'app : dégradé, emoji, nom, ce que c'est et le plat signature. */
export function ApercuLieu({ lieu }: { lieu: SaisieLieu }) {
  return (
    <div className="overflow-hidden rounded-[22px] border-2 border-encre bg-white shadow-brut">
      <div className="grid h-36 place-items-center text-6xl" style={{ background: `linear-gradient(135deg, ${lieu.couleurs[0]}, ${lieu.couleurs[1]})` }} aria-hidden>
        {lieu.emoji || "🍽️"}
      </div>
      <div className="grid gap-1 p-4">
        <p className="font-titre text-xl font-extrabold">{lieu.nom || "Nom du lieu"}</p>
        <p className="text-sm text-gris">{[lieu.info, lieu.quartier, lieu.prix].filter(Boolean).join(" · ") || "Trattoria · Quartier · €€"}</p>
        {lieu.plat && <p className="text-sm">🍽️ <strong>{lieu.plat}</strong></p>}
        {lieu.horaires && <p className="text-[13px] text-gris">{lieu.horaires}</p>}
        {lieu.tags.length > 0 && (
          <p className="mt-1 flex flex-wrap gap-1">
            {lieu.tags.map((tag) => <span key={tag} className="rounded-full bg-creme px-2 py-0.5 text-xs font-semibold">{tag}</span>)}
          </p>
        )}
      </div>
    </div>
  );
}
