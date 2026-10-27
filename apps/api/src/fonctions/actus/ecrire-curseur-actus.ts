export function ecrireCurseurActus(publieLe: Date, id: number): string {
  return `${publieLe.getTime()}.${id}`;
}
