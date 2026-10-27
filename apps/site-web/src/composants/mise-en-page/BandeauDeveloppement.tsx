import { utiliserEnTete } from "~/hooks/utiliser-en-tete";

export function BandeauDeveloppement() {
  const { textes, lienPreviensMoi } = utiliserEnTete();
  return (
    <p className="bg-encre px-4 py-2.5 text-center text-sm text-creme">
      {textes.bandeauDeveloppement}{" "}
      <a href={lienPreviensMoi.adresse} className="font-semibold whitespace-nowrap text-jaune underline decoration-2 underline-offset-4">
        {textes.previensMoi}
      </a>
    </p>
  );
}
