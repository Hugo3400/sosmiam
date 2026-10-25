export function creerLienTelephone(telephone: string): string {
  return `tel:${telephone.replace(/[^\d+]/g, "")}`;
}
