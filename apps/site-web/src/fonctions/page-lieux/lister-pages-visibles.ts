export type ElementPagination = number | "ellipse";

export function listerPagesVisibles(page: number, pages: number): ElementPagination[] {
  if (pages <= 1) return [1];
  const visibles = new Set([1, pages, page - 1, page, page + 1]);
  if (page <= 3) for (const numero of [2, 3]) visibles.add(numero);
  if (page >= pages - 2) for (const numero of [pages - 2, pages - 1]) visibles.add(numero);
  const tries = [...visibles].filter((numero) => numero >= 1 && numero <= pages).sort((a, b) => a - b);
  return tries.flatMap((numero, rang): ElementPagination[] => {
    const precedent = tries[rang - 1];
    if (precedent === undefined || numero - precedent === 1) return [numero];
    if (numero - precedent === 2) return [numero - 1, numero];
    return ["ellipse", numero];
  });
}
