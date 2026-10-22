export function Jauge({ part, libelle }: { part: number; libelle: string }) {
  const borne = Math.max(0, Math.min(1, part));
  const couleur = borne >= 0.9 ? "bg-tomate" : borne >= 0.7 ? "bg-jaune" : "bg-vert";
  return (
    <div role="meter" aria-label={libelle} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(borne * 100)} className="h-1.5 overflow-hidden rounded-full bg-ligne">
      <div className={`h-full rounded-full ${couleur}`} style={{ width: `${Math.max(2, Math.round(borne * 100))}%` }} />
    </div>
  );
}
