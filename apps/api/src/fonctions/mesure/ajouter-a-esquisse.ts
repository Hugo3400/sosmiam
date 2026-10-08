/**
 * Ajoute une empreinte (au moins 8 octets, déjà brouillés par un secret) à une esquisse HyperLogLog.
 * L'esquisse ne garde, pour chacun de ses registres, que le plus long début de zéros vu : on ne peut pas
 * en retrouver les empreintes. Sa taille (une puissance de 2) fixe la précision : 4 096 registres ≈ 1,6 %.
 * Renvoie vrai si l'esquisse a changé.
 */
export function ajouterAEsquisse(esquisse: Uint8Array, empreinte: Uint8Array): boolean {
  const bitsIndex = Math.log2(esquisse.length);
  if (!Number.isInteger(bitsIndex) || bitsIndex < 4 || bitsIndex > 16) throw new Error("taille d'esquisse invalide");
  if (empreinte.length < 8) throw new Error("empreinte trop courte");
  let valeur = 0n;
  for (let i = 0; i < 8; i++) valeur = (valeur << 8n) | BigInt(empreinte[i] ?? 0);
  const bitsReste = 64 - bitsIndex;
  const index = Number(valeur >> BigInt(bitsReste));
  const reste = valeur & ((1n << BigInt(bitsReste)) - 1n);
  // Rang du premier 1 dans le reste (1 si le premier bit est à 1), bitsReste + 1 si le reste est nul
  let rang = 1;
  for (let bit = bitsReste - 1; bit >= 0 && ((reste >> BigInt(bit)) & 1n) === 0n; bit--) rang++;
  if (rang <= (esquisse[index] ?? 0)) return false;
  esquisse[index] = rang;
  return true;
}
