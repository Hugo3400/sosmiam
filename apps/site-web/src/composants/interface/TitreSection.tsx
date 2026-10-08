import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  chapo?: ReactNode;
  aGauche?: boolean;
  /** Sur fond sombre : texte d'introduction en clair */
  clair?: boolean;
  /** Titre principal de la page (h1) au lieu d'un titre de section (h2) */
  principal?: boolean;
  id?: string;
};

/** Grand titre de section, avec un court texte d'introduction en dessous si besoin. */
export function TitreSection({ children, chapo, aGauche = false, clair = false, principal = false, id }: Props) {
  const alignement = aGauche ? "text-left" : "text-center";
  const Titre = principal ? "h1" : "h2";
  return (
    <>
      <Titre id={id} className={`text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-tight ${alignement}`}>{children}</Titre>
      {chapo && (
        <p className={`mt-3 mb-12 max-w-xl text-lg ${clair ? "text-creme/80" : "text-gris"} ${aGauche ? "" : "mx-auto text-center"}`}>{chapo}</p>
      )}
    </>
  );
}
