import type { Route } from "./+types/images-lieu-pro";
import { transmettreImageLieu } from "~/services/images-lieu-pro.server";
import { lireJetonSession } from "~/services/session-compte.server";

const dependances = { lireJeton: lireJetonSession };

export function action({ request, params }: Route.ActionArgs) {
  return transmettreImageLieu(request, params.id, params.quelle, dependances);
}

export function loader({ request, params }: Route.LoaderArgs) {
  return transmettreImageLieu(request, params.id, params.quelle, dependances);
}
