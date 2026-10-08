import type { ReactNode } from "react";

export type FormatVisuel = "story" | "post";

type Fond = "jaune" | "creme" | "encre";

const fonds: Record<Fond, string> = {
  jaune: "bg-jaune text-encre",
  creme: "bg-creme text-encre",
  encre: "bg-encre text-creme",
};

// Story (1080 × 1920) : le haut et le bas de l'écran sont couverts par Instagram et TikTok (pseudo, boutons,
// légende), donc rien d'important n'y va. Post (1080 × 1350, le format 4:5 des fils) : des marges égales.
const formats: Record<FormatVisuel, string> = {
  story: "h-[1920px] px-[90px] pt-[250px] pb-[270px]",
  post: "h-[1350px] px-[80px] py-[76px]",
};

/** Le cadre d'un visuel à poster, à sa taille exacte : fond, marges sûres, contenu en colonne centrée et réparti. */
export function CadreVisuel({ format, fond, children }: { format: FormatVisuel; fond: Fond; children: ReactNode }) {
  return (
    <div className={`flex w-[1080px] flex-col items-center justify-between overflow-hidden text-center ${formats[format]} ${fonds[fond]}`}>
      {children}
    </div>
  );
}
