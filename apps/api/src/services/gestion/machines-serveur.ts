import { hostname } from "node:os";

import { releveMachine, type PeriodeCourbes } from "./releve-machine.ts";
import { systemeMachine } from "./systeme-machine.ts";

export const ID_MACHINE_PRINCIPALE = "vps";
const ROLES_MACHINE_PRINCIPALE = ["API", "Site", "Base", "Photos", "Bots", "Mail"];

export async function lireMachines() {
  return {
    machines: [
      {
        id: ID_MACHINE_PRINCIPALE,
        nom: "VPS principal",
        hote: hostname(),
        roles: ROLES_MACHINE_PRINCIPALE,
        maintenant: releveMachine.lireMaintenant(),
        problemes: releveMachine.lireProblemes(),
      },
    ],
  };
}

export async function lireCourbesMachine(id: string, periode: PeriodeCourbes) {
  if (id !== ID_MACHINE_PRINCIPALE) return null;
  return releveMachine.lireCourbes(periode);
}

export async function lireSystemeMachine(id: string) {
  if (id !== ID_MACHINE_PRINCIPALE) return null;
  const [services, sante, gourmands] = await Promise.all([
    systemeMachine.lireServices().catch(() => releveMachine.lireServicesConnus()),
    systemeMachine.lireSante(),
    systemeMachine.lireGourmands().catch(() => null),
  ]);
  return { services, sante, gourmands };
}
