import { LoaderCircle } from "lucide-react";

/** Rond qui tourne, avec un petit mot. */
export function Chargement({ texte = "On rassemble tout ça…" }: { texte?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-12 text-gris">
      <LoaderCircle className="size-5 animate-spin" aria-hidden />
      <span>{texte}</span>
    </div>
  );
}
