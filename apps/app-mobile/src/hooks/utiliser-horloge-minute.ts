import { useCallback, useEffect, useState } from "react";

const MINUTE_MS = 60_000;

export function utiliserHorlogeMinute(): { maintenantMs: number; recaler: () => void } {
  const [maintenantMs, setMaintenantMs] = useState(() => Date.now());
  const recaler = useCallback(() => setMaintenantMs(Date.now()), []);
  useEffect(() => {
    const minuterie = setInterval(recaler, MINUTE_MS);
    return () => clearInterval(minuterie);
  }, [recaler]);
  return { maintenantMs, recaler };
}
