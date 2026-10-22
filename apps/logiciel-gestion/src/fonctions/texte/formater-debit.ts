import { formaterOctets } from "./formater-octets.ts";

export function formaterDebit(octetsParSeconde: number): string {
  return `${formaterOctets(Math.max(0, octetsParSeconde))}/s`;
}
