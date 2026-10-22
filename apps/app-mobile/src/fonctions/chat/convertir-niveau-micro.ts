const PLANCHER_DB = -60;

export function convertirNiveauMicro(metering: number | null | undefined): number | null {
  if (metering === null || metering === undefined || !Number.isFinite(metering)) return null;
  return Math.min(1, Math.max(0, (metering - PLANCHER_DB) / -PLANCHER_DB));
}
