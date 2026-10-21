import { limiterRequetes } from "./limiter-requetes.ts";

export const LIMITE_ENVOIS_MEDIAS_IP = { fenetre: 10 * 60_000, maximum: 120 };

export function limiterEnvoisMedias() {
  return limiterRequetes(LIMITE_ENVOIS_MEDIAS_IP);
}
