type Props = {
  actuel: number;
  objectif: number;
  /** Ce qu'on compte : « visites », « bons solidaires »… */
  unite: string;
  /** Durée de l'objectif, par exemple « 7 jours » */
  duree?: string;
  className?: string;
};

/** Jauge de mobilisation d'un BIG SOS : où en est le quartier par rapport à l'objectif. */
export function JaugeMobilisation({ actuel, objectif, unite, duree, className = "" }: Props) {
  const pourcentage = Math.min(100, Math.round((actuel / objectif) * 100));
  // Insécables : « 7 jours » et « 68 % » ne se coupent jamais en fin de ligne
  const libelle = `Objectif : ${objectif}\u00a0${unite}${duree ? ` en ${duree.replace(/ /g, "\u00a0")}` : ""}`;
  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold">{libelle}</span>
        <span className="shrink-0 font-titre text-lg font-extrabold whitespace-nowrap">{`${pourcentage}\u00a0%`}</span>
      </div>
      <div
        role="progressbar"
        aria-label={libelle}
        aria-valuemin={0}
        aria-valuemax={objectif}
        aria-valuenow={actuel}
        aria-valuetext={`${actuel} ${unite} sur ${objectif}`}
        className="h-5 overflow-hidden rounded-full border-2 border-encre bg-white"
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-tomate),var(--color-jaune))]"
          style={{ width: `${pourcentage}%` }}
        />
      </div>
      <p className="mt-1.5 text-sm text-gris">{actuel} {unite} sur {objectif}</p>
    </div>
  );
}
