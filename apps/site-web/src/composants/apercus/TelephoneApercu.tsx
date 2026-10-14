import type { ReactNode } from "react";

type Props = {
  /** Ce que montre l'écran, lu par les lecteurs d'écran à la place du dessin */
  alt: string;
  children: ReactNode;
  /** Penche un peu le téléphone sur grand écran, d'un côté ou de l'autre */
  penche?: "gauche" | "droite";
};

/**
 * Un téléphone dessiné en JSX (aucune image) : cadre encre, écran crème, ombre « brut » jaune. Le dessin est une image
 * pour les lecteurs d'écran (role="img" et son texte alternatif) ; son contenu leur est caché.
 */
export function TelephoneApercu({ alt, children, penche }: Props) {
  const rotation = penche === "gauche" ? "lg:-rotate-2" : penche === "droite" ? "lg:rotate-2" : "";
  return (
    <figure className="w-full max-w-[310px] justify-self-center">
      <div role="img" aria-label={alt} className={`rounded-[44px] border-2 border-encre bg-encre p-2.5 shadow-brut-jaune ${rotation}`}>
        <div aria-hidden="true" className="relative flex h-[600px] flex-col overflow-hidden rounded-[34px] bg-creme text-[13px] leading-snug text-encre">
          <div className="flex h-8 shrink-0 items-center justify-center">
            <span className="h-[18px] w-[86px] rounded-full bg-encre" />
          </div>
          {children}
        </div>
      </div>
    </figure>
  );
}
