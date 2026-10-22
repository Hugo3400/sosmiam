export function Etincelle({ valeurs }: { valeurs: (number | null)[] }) {
  const connues = valeurs.filter((valeur): valeur is number => valeur !== null);
  if (connues.length < 2) return <div className="h-7" aria-hidden />;
  const maximum = Math.max(...connues) || 1;
  const chemin = connues.map((valeur, rang) => `${rang ? "L" : "M"}${((rang / (connues.length - 1)) * 120).toFixed(1)},${(26 - (valeur / maximum) * 24).toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 120 28" preserveAspectRatio="none" className="block h-7 w-full" aria-hidden>
      <path d={`${chemin} L120,28 L0,28 Z`} className="fill-graphique/15" />
      <path d={chemin} fill="none" className="stroke-graphique" strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
