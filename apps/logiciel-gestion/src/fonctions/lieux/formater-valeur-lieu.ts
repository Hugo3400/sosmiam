import { VALEURS_INFOS_PRATIQUES } from "../../contenus/champs-lieu.ts";
import { TYPES_LIEU } from "../../contenus/statuts-lieu.ts";

const JOURS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

/**
 * Une valeur de fiche de lieu, lisible dans la comparaison « avant / maintenant / proposé » : « — » si vide, Oui/Non,
 * listes séparées par des virgules, créneaux « lun, mar · 12:00–14:00 », type et infos pratiques en clair (« Resto »,
 * « En terrasse seulement », « Tickets resto »).
 */
export function formaterValeurLieu(champ: string, valeur: unknown): string {
  if (valeur === null || valeur === undefined || valeur === "" || (Array.isArray(valeur) && valeur.length === 0)) return "—";
  if (typeof valeur === "boolean") return valeur ? "Oui" : "Non";
  if (champ === "type" && typeof valeur === "string") return TYPES_LIEU[valeur] ?? valeur;
  const enClair = VALEURS_INFOS_PRATIQUES[champ];
  if (enClair && typeof valeur === "string") return enClair[valeur] ?? valeur;
  if (enClair && Array.isArray(valeur)) return valeur.map((element) => enClair[String(element)] ?? String(element)).join(", ");
  if (champ === "ouverture" && Array.isArray(valeur)) {
    return valeur
      .map((creneau) => {
        const { jours, de, a } = (creneau ?? {}) as { jours?: number[]; de?: string; a?: string };
        const lundiDabord = [...(jours ?? [])].sort((x, y) => ((x + 6) % 7) - ((y + 6) % 7));
        return `${lundiDabord.map((jour) => JOURS[jour] ?? "?").join(", ")} · ${de ?? "?"}–${a ?? "?"}`;
      })
      .join(" ; ");
  }
  if (Array.isArray(valeur)) return valeur.map(String).join(", ");
  if (typeof valeur === "object") return JSON.stringify(valeur);
  return String(valeur);
}
