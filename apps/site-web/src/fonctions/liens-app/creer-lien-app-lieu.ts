import { SCHEMA_APP } from "../../contenus/liens-app.ts";

export function creerLienAppLieu(lieuId: number): string {
  return `${SCHEMA_APP}://lieux/${lieuId}`;
}
