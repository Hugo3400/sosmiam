type Props = {
  /** Le pseudo (« @lea.croque ») ou un nom : on en garde la première lettre */
  nom: string;
  /** Couleur de fond, une des teintes pâles des maquettes */
  fond?: string;
  /** Diamètre en pixels */
  taille?: number;
  className?: string;
};

/** Pastille ronde d'un Miami dans un écran dessiné : la première lettre de son pseudo. */
export function AvatarMiami({ nom, fond = "#FFF1A8", taille = 32, className = "" }: Props) {
  const initiale = nom.replace(/^@/, "").charAt(0).toUpperCase();
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full border-2 border-white font-bold text-encre ${className}`}
      style={{ width: taille, height: taille, background: fond, fontSize: Math.round(taille * 0.42) }}
    >
      {initiale}
    </span>
  );
}
