import { decrirePlacesZone } from "~/fonctions/fondateurs/decrire-places-zone";
import type { ZoneFondateurs } from "~/types/compte";

type Props = {
  commune: { nom: string; nomDepartement: string; codePostal?: string | null };
  zone: ZoneFondateurs;
  /** Sur fond sombre */
  clair?: boolean;
  className?: string;
};

/**
 * Les places de fondateur de la zone d'une commune : « Lyon : 7 places libres sur 10 », ou, pour une commune de moins de
 * 50 000 habitants, celles de son département. Une pastille par place (pleine : prise), seulement pour les yeux.
 */
export function PlacesZone({ commune, zone, clair = false, className = "" }: Props) {
  const pastilles = Array.from({ length: Math.min(zone.places, 10) }, (_, position) => position < zone.prises);
  return (
    <div className={`rounded-carte border-2 p-5 ${clair ? "border-creme/40 bg-creme/5" : "border-encre bg-white shadow-brut"} ${className}`}>
      <p className={`text-sm font-semibold ${clair ? "text-creme/80" : "text-gris"}`}>
        {`${commune.nom} (${commune.codePostal ? `${commune.codePostal}, ` : ""}${commune.nomDepartement})`}
      </p>
      <p className="mt-1 font-titre text-xl font-extrabold">{decrirePlacesZone(zone)}</p>
      <p aria-hidden="true" className="mt-3 flex flex-wrap gap-1.5">
        {pastilles.map((prise, position) => (
          <span
            key={position}
            className={`h-4 w-4 rounded-full border-2 ${clair ? "border-creme" : "border-encre"} ${prise ? (clair ? "bg-creme" : "bg-encre") : "bg-jaune"}`}
          />
        ))}
      </p>
    </div>
  );
}
