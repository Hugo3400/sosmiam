export function calculerDebutPreuvePhoto(deposeLe: Date | null | undefined): Date {
  if (!deposeLe) return new Date(0);
  return new Date(Math.floor(deposeLe.getTime() / 1000) * 1000);
}
