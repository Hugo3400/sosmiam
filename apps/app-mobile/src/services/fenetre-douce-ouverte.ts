export type FenetreDouce = "annonce-app" | "nouvelle-version" | "nouveautes";

let ouverte: FenetreDouce | null = null;
const ecouteurs = new Set<() => void>();

function prevenir() {
  for (const ecouteur of [...ecouteurs]) {
    try {
      ecouteur();
    } catch {}
  }
}

export function estFenetreDouceLibre(nom: FenetreDouce): boolean {
  return ouverte === null || ouverte === nom;
}

export function prendreFenetreDouce(nom: FenetreDouce): boolean {
  if (!estFenetreDouceLibre(nom)) return false;
  if (ouverte === nom) return true;
  ouverte = nom;
  prevenir();
  return true;
}

export function rendreFenetreDouce(nom: FenetreDouce): void {
  if (ouverte !== nom) return;
  ouverte = null;
  prevenir();
}

export function lireFenetreDouce(): FenetreDouce | null {
  return ouverte;
}

export function ecouterFenetreDouce(ecouteur: () => void): () => void {
  ecouteurs.add(ecouteur);
  return () => {
    ecouteurs.delete(ecouteur);
  };
}
