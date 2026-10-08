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
  story: "h-[1920px] px-[90px] pt-[230px] pb-[300px]",
  post: "h-[1350px] px-[80px] py-[76px]",
};

type Props = {
  format: FormatVisuel;
  fond: Fond;
  /** Décor dessiné derrière le contenu (cercles…) */
  decor?: ReactNode;
  children: ReactNode;
};

/** Le cadre d'un visuel à poster, à sa taille exacte : fond, marges sûres, contenu en colonne centrée. */
export function CadreVisuel({ format, fond, decor, children }: Props) {
  return (
    <div className={`relative w-[1080px] overflow-hidden ${formats[format]} ${fonds[fond]}`}>
      {decor && <div aria-hidden="true" className="absolute inset-0">{decor}</div>}
      <div className="relative flex h-full flex-col items-center justify-between text-center">{children}</div>
    </div>
  );
}
