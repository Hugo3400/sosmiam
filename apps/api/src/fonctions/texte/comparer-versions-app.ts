export function comparerVersionsApp(a: string, b: string): -1 | 0 | 1 {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const ecart = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (ecart !== 0) return ecart < 0 ? -1 : 1;
  }
  return 0;
}
