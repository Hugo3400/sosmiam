import { monde } from "./monde.mjs";

export function lirePositionTelephone() {
  monde.appelsLecture += 1;
  const suivante = monde.lectures.shift() ?? { position: { latitude: 43.2965, longitude: 5.3698 }, approximative: false };
  if (suivante.attente) return new Promise((fin) => setTimeout(() => fin(suivante.lecture), suivante.attente));
  return Promise.resolve(suivante);
}
