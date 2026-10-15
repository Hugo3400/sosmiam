import { Carte } from "~/composants/interface/Carte.tsx";
import { listerManquesVille } from "~/fonctions/villes/lister-manques-ville.ts";
import type { LancementVille } from "~/services/villes.ts";

/** Le résumé en haut de « Lancer une ville » : ce qui manque encore, ou « rien ne manque » (la décision reste à Hugo). */
export function ResteAFaireVille({ point }: { point: LancementVille }) {
  const manques = listerManquesVille(point);
  if (manques.length === 0) {
    return (
      <Carte>
        <p className="text-sm"><strong className="text-vert">✓ Rien ne manque.</strong> À toi de juger si {point.ville} est prête à être annoncée.</p>
      </Carte>
    );
  }
  return (
    <Carte titre={`Il reste ${manques.length} chose${manques.length > 1 ? "s" : ""} à voir`}>
      <ul className="grid gap-1.5 text-sm">
        {manques.map((manque) => (
          <li key={manque} className="flex items-baseline gap-2">
            <span aria-hidden className="text-tomate">•</span>
            <span>{manque}</span>
          </li>
        ))}
      </ul>
    </Carte>
  );
}
