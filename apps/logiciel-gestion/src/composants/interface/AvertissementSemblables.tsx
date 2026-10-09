import type { LieuControle } from "~/services/lieux.ts";

/** « Déjà en base ? » : les lieux qui ressemblent à la fiche qu'on va créer (même nom dans la ville, même adresse…). */
export function AvertissementSemblables({ semblables }: { semblables: LieuControle[] | null }) {
  if (!semblables?.length) return null;
  return (
    <div role="alert" className="mb-4 rounded-xl border-2 border-encre bg-jaune-clair px-4 py-3 text-sm">
      <p className="font-semibold">👯 Déjà dans SOS Miam ? {semblables.length > 1 ? "Ces fiches ressemblent" : "Cette fiche ressemble"} beaucoup :</p>
      <ul className="mt-1 grid gap-0.5">
        {semblables.map((lieu) => (
          <li key={lieu.id}>{lieu.emoji} <strong>{lieu.nom}</strong> · {lieu.ville}{lieu.adresse ? ` · ${lieu.adresse}` : ""} (fiche n° {lieu.id})</li>
        ))}
      </ul>
    </div>
  );
}
