let ouverteLe: number | null = null;

export function noterNotificationOuverte(): void {
  ouverteLe = Date.now();
}

export function lireNotificationOuverteLe(): number | null {
  return ouverteLe;
}
