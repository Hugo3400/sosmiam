import { useEffect, useState } from "react";

export function utiliserValeurTemporisee<T>(valeur: T, delaiMs: number): T {
  const [temporisee, setTemporisee] = useState(valeur);
  useEffect(() => {
    const minuterie = setTimeout(() => setTemporisee(valeur), delaiMs);
    return () => clearTimeout(minuterie);
  }, [valeur, delaiMs]);
  return temporisee;
}
